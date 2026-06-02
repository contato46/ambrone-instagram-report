import { useState, useEffect, useRef } from 'react';
import type { Post, MonthlyMetrics, DateRange, DemographicsData } from '../types';
import { ALL_POSTS, MONTHLY_METRICS } from '../data/mockData';

interface AccountInfo {
  id?: string; name?: string; username?: string;
  followers_count?: number; media_count?: number; profile_picture_url?: string;
}

export interface InstagramDataState {
  posts: Post[];
  monthlyMetrics: MonthlyMetrics[];
  account: AccountInfo | null;
  demographics: DemographicsData | null;
  followerTimeline: Array<{ date: string; value: number }>;
  syncing: boolean;
  error: string | null;
  usingMockData: boolean;
}

const TOKEN = import.meta.env.VITE_INSTAGRAM_TOKEN as string | undefined;
const USER_ID = import.meta.env.VITE_INSTAGRAM_USER_ID as string | undefined;
const API = 'https://graph.facebook.com/v22.0';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai',
  '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function parseType(t: string): Post['type'] {
  if (t === 'CAROUSEL_ALBUM') return 'carousel';
  if (t === 'VIDEO') return 'video';
  if (t === 'REEL') return 'reel';
  return 'image';
}

function toUnix(dateStr: string) { return Math.floor(new Date(dateStr).getTime() / 1000); }

function mockForRange(dateRange: DateRange) {
  const posts = ALL_POSTS.filter((p) => p.date >= dateRange.start && p.date <= dateRange.end);
  const metrics = MONTHLY_METRICS.filter(
    (m) => m.month >= dateRange.start.slice(0, 7) && m.month <= dateRange.end.slice(0, 7),
  );
  return { posts, monthlyMetrics: metrics };
}

async function tFetch(url: string, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

// Fetch account-level reach in 29-day chunks → returns daily values
async function fetchReachChunked(since: number, until: number): Promise<Array<{ end_time: string; value: number }>> {
  const results: Array<{ end_time: string; value: number }> = [];
  const CHUNK = 29 * 86400;
  let s = since;
  while (s < until) {
    const u = Math.min(s + CHUNK, until);
    try {
      const res = await tFetch(`${API}/${USER_ID}/insights?metric=reach&period=day&since=${s}&until=${u}&access_token=${TOKEN}`);
      if (res.ok) {
        const d = await res.json() as { data: Array<{ values: Array<{ value: number; end_time: string }> }> };
        results.push(...(d.data?.[0]?.values || []));
      }
    } catch { /* ignore */ }
    s = u + 1;
  }
  return results;
}

// Fetch profile_views in 29-day chunks (needs metric_type=total_value, returns one total per call)
async function fetchProfileViewsChunked(since: number, until: number): Promise<number> {
  let total = 0;
  const CHUNK = 29 * 86400;
  let s = since;
  while (s < until) {
    const u = Math.min(s + CHUNK, until);
    try {
      const res = await tFetch(`${API}/${USER_ID}/insights?metric=profile_views&period=day&metric_type=total_value&since=${s}&until=${u}&access_token=${TOKEN}`);
      if (res.ok) {
        const d = await res.json() as { data: Array<{ total_value?: { value: number } }> };
        total += d.data?.[0]?.total_value?.value ?? 0;
      }
    } catch { /* ignore */ }
    s = u + 1;
  }
  return total;
}

function buildMetrics(
  posts: Post[],
  reachByMonth: Record<string, number>,
  profileViewsTotal: number,
  followerTimeline: Array<{ date: string; value: number }>,
): MonthlyMetrics[] {
  const map: Record<string, Post[]> = {};
  posts.forEach((p) => { const m = p.date.slice(0, 7); if (!map[m]) map[m] = []; map[m].push(p); });

  const followerByMonth: Record<string, number> = {};
  followerTimeline.forEach(({ date, value }) => {
    const mo = date.slice(0, 7);
    followerByMonth[mo] = value; // last value wins (chronological order)
  });

  const months = Object.keys(map).sort();
  return months.map((month, idx) => {
    const mp = map[month];
    const [year, m] = month.split('-');
    const eng = mp.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0);
    const postReach = mp.reduce((s, p) => s + p.reach, 0);
    const accountReach = reachByMonth[month] || 0;
    const finalReach = accountReach || postReach;
    const followers = followerByMonth[month] ?? 0;
    // Distribute profile views proportionally across months
    const profileVisits = months.length > 0 ? Math.round(profileViewsTotal / months.length) : 0;
    // Give last month the remainder
    const isLast = idx === months.length - 1;
    const adjustedProfileVisits = isLast
      ? profileViewsTotal - Math.round(profileViewsTotal / months.length) * (months.length - 1)
      : profileVisits;

    return {
      month, label: `${MONTH_LABELS[m]}/${year.slice(2)}`,
      followers, followersGained: 0, posts: mp.length,
      reach: finalReach, impressions: 0, engagement: eng,
      engagementRate: finalReach > 0 ? parseFloat(((eng / finalReach) * 100).toFixed(1)) : 0,
      profileVisits: adjustedProfileVisits, websiteClicks: 0,
    };
  });
}

export function useInstagramData(dateRange: DateRange) {
  const mock = mockForRange(dateRange);
  const [state, setState] = useState<InstagramDataState>({
    ...mock, account: null, demographics: null, followerTimeline: [],
    syncing: !!TOKEN && !!USER_ID, error: null, usingMockData: true,
  });

  const rangeKey = `${dateRange.start}|${dateRange.end}`;
  const prevKey = useRef('');

  useEffect(() => {
    if (prevKey.current === rangeKey) return;
    prevKey.current = rangeKey;

    const m = mockForRange(dateRange);
    setState({ ...m, account: null, demographics: null, followerTimeline: [], syncing: !!TOKEN && !!USER_ID, error: null, usingMockData: true });

    if (!TOKEN || !USER_ID) return;

    const safetyTimer = setTimeout(() => setState((s) => ({ ...s, syncing: false })), 60000);

    (async () => {
      try {
        // 1. Account info + first page of posts
        const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count';
        const [accRes, postsRes] = await Promise.all([
          tFetch(`${API}/${USER_ID}?fields=id,name,username,profile_picture_url,followers_count,media_count&access_token=${TOKEN}`),
          tFetch(`${API}/${USER_ID}/media?fields=${mediaFields}&limit=100&access_token=${TOKEN}`),
        ]);

        const account: AccountInfo | null = accRes.ok ? await accRes.json() as AccountInfo : null;
        if (account) setState((s) => ({ ...s, account }));

        if (!postsRes.ok) throw new Error('posts error');
        type MediaItem = { id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; timestamp: string; like_count: number; comments_count: number };
        type MediaPage = { data: MediaItem[]; paging?: { next?: string } };

        const page1 = await postsRes.json() as MediaPage;
        let allItems = page1.data;

        // Paginate until we've gone past dateRange.start (collect up to 300 posts)
        let nextUrl = page1.paging?.next;
        let pages = 0;
        while (nextUrl && pages < 3) {
          const last = allItems[allItems.length - 1];
          if (last && last.timestamp.slice(0, 10) < dateRange.start) break;
          try {
            const pr = await tFetch(nextUrl, 12000);
            if (!pr.ok) break;
            const pd = await pr.json() as MediaPage;
            allItems = [...allItems, ...pd.data];
            nextUrl = pd.paging?.next;
            pages++;
          } catch { break; }
        }

        // Filter to date range
        const items = allItems.filter(
          (p) => p.timestamp.slice(0, 10) >= dateRange.start && p.timestamp.slice(0, 10) <= dateRange.end,
        );

        const basicPosts: Post[] = items.map((item) => {
          const type = parseType(item.media_type);
          return {
            id: item.id, date: item.timestamp.slice(0, 10), type,
            caption: item.caption || '',
            thumbnail: (type === 'video' || type === 'reel')
              ? (item.thumbnail_url || item.media_url || '') : (item.media_url || ''),
            likes: item.like_count || 0, comments: item.comments_count || 0,
            saves: 0, shares: 0, reach: 0, impressions: 0, plays: undefined, engagementRate: 0,
          };
        });

        setState((s) => ({ ...s, posts: basicPosts, usingMockData: false }));

        // 2. Post insights in parallel (reach, saved, shares per post)
        const insightResults: Record<string, Record<string, number>> = {};
        const BATCH = 15; // concurrent limit
        for (let i = 0; i < basicPosts.length; i += BATCH) {
          await Promise.all(basicPosts.slice(i, i + BATCH).map(async (post) => {
            const isVideo = post.type === 'video' || post.type === 'reel';
            const metrics = isVideo ? 'reach,saved,shares,plays' : 'reach,saved,shares';
            try {
              const res = await tFetch(`${API}/${post.id}/insights?metric=${metrics}&access_token=${TOKEN}`, 6000);
              if (res.ok) {
                const data = await res.json() as { data: Array<{ name: string; values: Array<{ value: number }> }> };
                insightResults[post.id] = {};
                for (const m of data.data) insightResults[post.id][m.name] = m.values?.[0]?.value ?? 0;
              }
            } catch { /* ignore */ }
          }));
        }

        const enrichedPosts: Post[] = basicPosts.map((post) => {
          const ins = insightResults[post.id] || {};
          const saves = ins.saved || 0;
          const shares = ins.shares || 0;
          const reach = ins.reach || 0;
          const plays = ins.plays;
          const eng = post.likes + post.comments + saves + shares;
          return { ...post, saves, shares, reach, plays,
            engagementRate: reach > 0 ? parseFloat(((eng / reach) * 100).toFixed(1)) : 0 };
        });

        setState((s) => ({ ...s, posts: enrichedPosts }));

        // 3. Account-level reach (chunked) + profile_views (chunked) + follower_count (last 30 days)
        const since = toUnix(dateRange.start);
        const nowUnix = Math.floor(Date.now() / 1000);
        const yesterday = nowUnix - 86400;
        const until = Math.min(toUnix(dateRange.end) + 86400, yesterday);

        const followerSince = Math.max(since, yesterday - 29 * 86400);

        const [reachData, profileViews, followerRes] = await Promise.all([
          fetchReachChunked(since, until),
          fetchProfileViewsChunked(since, until),
          tFetch(`${API}/${USER_ID}/insights?metric=follower_count&period=day&since=${followerSince}&until=${yesterday}&access_token=${TOKEN}`),
        ]);

        // Build reach by month
        const reachByMonth: Record<string, number> = {};
        for (const v of reachData) {
          const mo = v.end_time.slice(0, 7);
          reachByMonth[mo] = (reachByMonth[mo] || 0) + v.value;
        }

        // Follower timeline
        const followerTimeline: Array<{ date: string; value: number }> = [];
        if (followerRes.ok) {
          const fd = await followerRes.json() as { data: Array<{ values: Array<{ value: number; end_time: string }> }> };
          followerTimeline.push(...(fd.data?.[0]?.values || []).map((v) => ({ date: v.end_time.slice(0, 10), value: v.value })));
        }

        const metrics = buildMetrics(enrichedPosts, reachByMonth, profileViews, followerTimeline);
        setState((s) => ({ ...s, monthlyMetrics: metrics, followerTimeline }));

        // 4. Demographics (best-effort)
        try {
          const [ageRes, cityRes] = await Promise.all([
            tFetch(`${API}/${USER_ID}/insights?metric=follower_demographics&breakdown=age,gender&period=lifetime&timeframe=this_month&access_token=${TOKEN}`, 8000),
            tFetch(`${API}/${USER_ID}/insights?metric=follower_demographics&breakdown=city&period=lifetime&timeframe=this_month&access_token=${TOKEN}`, 8000),
          ]);

          let demographics: DemographicsData | null = null;

          if (ageRes.ok) {
            const ageData = await ageRes.json() as {
              data: Array<{ total_value: { breakdowns: Array<{ results: Array<{ dimension_values: string[]; value: number }> }> } }>;
            };
            const breakdown = ageData.data?.[0]?.total_value?.breakdowns?.[0];
            if (breakdown) {
              const ageMap: Record<string, { M: number; F: number; U: number }> = {};
              let totalM = 0, totalF = 0, totalU = 0;
              for (const r of breakdown.results) {
                const [age, gender] = r.dimension_values;
                if (!ageMap[age]) ageMap[age] = { M: 0, F: 0, U: 0 };
                const g = gender === 'M' ? 'M' : gender === 'F' ? 'F' : 'U';
                ageMap[age][g] += r.value;
                if (g === 'M') totalM += r.value; else if (g === 'F') totalF += r.value; else totalU += r.value;
              }
              const ageOrder = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
              const ageGender = Object.entries(ageMap)
                .sort(([a], [b]) => ageOrder.indexOf(a) - ageOrder.indexOf(b))
                .map(([age, c]) => ({ age, ...c, total: c.M + c.F + c.U }));
              demographics = { ageGender, genderTotal: { M: totalM, F: totalF, U: totalU }, topCities: [], topCountries: [] };
            }
          }

          if (cityRes.ok) {
            const cityData = await cityRes.json() as {
              data: Array<{ total_value: { breakdowns: Array<{ results: Array<{ dimension_values: string[]; value: number }> }> } }>;
            };
            const cb = cityData.data?.[0]?.total_value?.breakdowns?.[0];
            if (cb) {
              const cities = cb.results.map((r) => ({ name: r.dimension_values[0], value: r.value }))
                .sort((a, b) => b.value - a.value).slice(0, 8);
              if (demographics) demographics.topCities = cities;
              else demographics = { ageGender: [], genderTotal: { M: 0, F: 0, U: 0 }, topCities: cities, topCountries: [] };
            }
          }

          if (demographics) setState((s) => ({ ...s, demographics }));
        } catch { /* demographics optional */ }

        clearTimeout(safetyTimer);
        setState((s) => ({ ...s, syncing: false }));
      } catch (err) {
        clearTimeout(safetyTimer);
        setState((s) => ({ ...s, syncing: false, error: String(err) }));
      }
    })();

    return () => clearTimeout(safetyTimer);
  }, [rangeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
