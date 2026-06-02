import { useState, useEffect, useRef } from 'react';
import type { Post, MonthlyMetrics, DateRange, DemographicsData } from '../types';
import { ALL_POSTS, MONTHLY_METRICS } from '../data/mockData';

interface AccountInfo {
  id?: string;
  name?: string;
  username?: string;
  followers_count?: number;
  media_count?: number;
  profile_picture_url?: string;
}

export interface InstagramDataState {
  posts: Post[];
  monthlyMetrics: MonthlyMetrics[];
  account: AccountInfo | null;
  demographics: DemographicsData | null;
  syncing: boolean;
  error: string | null;
  usingMockData: boolean;
}

const TOKEN = import.meta.env.VITE_INSTAGRAM_TOKEN as string | undefined;
const USER_ID = import.meta.env.VITE_INSTAGRAM_USER_ID as string | undefined;
const API = 'https://graph.facebook.com/v19.0';

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

function toUnix(dateStr: string) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

function mockForRange(dateRange: DateRange) {
  const posts = ALL_POSTS.filter((p) => p.date >= dateRange.start && p.date <= dateRange.end);
  const metrics = MONTHLY_METRICS.filter(
    (m) => m.month >= dateRange.start.slice(0, 7) && m.month <= dateRange.end.slice(0, 7),
  );
  return { posts, monthlyMetrics: metrics };
}

function buildMetrics(
  posts: Post[],
  accountInsights: Record<string, number[]>,
  followersByDay: Array<{ end_time: string; value: number }>,
): MonthlyMetrics[] {
  const map: Record<string, Post[]> = {};
  posts.forEach((p) => { const m = p.date.slice(0, 7); if (!map[m]) map[m] = []; map[m].push(p); });

  const followerByMonth: Record<string, number[]> = {};
  followersByDay.forEach(({ end_time, value }) => {
    const mo = end_time.slice(0, 7);
    if (!followerByMonth[mo]) followerByMonth[mo] = [];
    followerByMonth[mo].push(value);
  });

  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, mp]) => {
    const [year, m] = month.split('-');
    const reach = (accountInsights.reach || []).reduce((s, v) => s + v, 0);
    const impressions = (accountInsights.impressions || []).reduce((s, v) => s + v, 0);
    const profileVisits = (accountInsights.profile_views || []).reduce((s, v) => s + v, 0);
    const websiteClicks = (accountInsights.website_clicks || []).reduce((s, v) => s + v, 0);
    const eng = mp.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0);
    const postReach = mp.reduce((s, p) => s + p.reach, 0);
    const finalReach = reach || postReach;
    const followers = followerByMonth[month]?.length
      ? followerByMonth[month][followerByMonth[month].length - 1]
      : 0;
    return {
      month, label: `${MONTH_LABELS[m]}/${year.slice(2)}`,
      followers, followersGained: 0, posts: mp.length,
      reach: finalReach,
      impressions: impressions || mp.reduce((s, p) => s + p.impressions, 0),
      engagement: eng,
      engagementRate: finalReach > 0 ? parseFloat(((eng / finalReach) * 100).toFixed(1)) : 0,
      profileVisits, websiteClicks,
    };
  });
}

async function tFetch(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

export function useInstagramData(dateRange: DateRange) {
  const mock = mockForRange(dateRange);
  const [state, setState] = useState<InstagramDataState>({
    ...mock, account: null, demographics: null,
    syncing: !!TOKEN && !!USER_ID, error: null, usingMockData: true,
  });

  const rangeKey = `${dateRange.start}|${dateRange.end}`;
  const prevKey = useRef('');

  useEffect(() => {
    if (prevKey.current === rangeKey) return;
    prevKey.current = rangeKey;

    const m = mockForRange(dateRange);
    setState({ ...m, account: null, demographics: null, syncing: !!TOKEN && !!USER_ID, error: null, usingMockData: true });

    if (!TOKEN || !USER_ID) return;

    const safetyTimer = setTimeout(() => setState((s) => ({ ...s, syncing: false })), 20000);

    (async () => {
      try {
        // 1. Account + posts in parallel
        const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count';
        const [accRes, postsRes] = await Promise.all([
          tFetch(`${API}/${USER_ID}?fields=id,name,username,profile_picture_url,followers_count,media_count&access_token=${TOKEN}`),
          tFetch(`${API}/${USER_ID}/media?fields=${mediaFields}&limit=100&access_token=${TOKEN}`),
        ]);

        const account: AccountInfo | null = accRes.ok ? await accRes.json() as AccountInfo : null;
        if (account) setState((s) => ({ ...s, account }));

        if (!postsRes.ok) throw new Error('posts error');
        const postsData = await postsRes.json() as {
          data: Array<{
            id: string; caption?: string; media_type: string;
            media_url?: string; thumbnail_url?: string;
            timestamp: string; like_count: number; comments_count: number;
          }>;
          paging?: { next?: string };
        };

        // Filter to date range
        let items = postsData.data.filter(
          (p) => p.timestamp.slice(0, 10) >= dateRange.start && p.timestamp.slice(0, 10) <= dateRange.end,
        );

        // Fetch page 2 if needed
        const last = postsData.data[postsData.data.length - 1];
        if (postsData.paging?.next && last?.timestamp.slice(0, 10) >= dateRange.start) {
          try {
            const p2 = await tFetch(postsData.paging.next, 8000);
            if (p2.ok) {
              const p2d = await p2.json() as typeof postsData;
              items = [...items, ...p2d.data.filter(
                (p) => p.timestamp.slice(0, 10) >= dateRange.start && p.timestamp.slice(0, 10) <= dateRange.end,
              )];
            }
          } catch { /* ignore */ }
        }

        const basicPosts: Post[] = items.map((item) => {
          const type = parseType(item.media_type);
          return {
            id: item.id, date: item.timestamp.slice(0, 10), type,
            caption: item.caption || '',
            thumbnail: (type === 'video' || type === 'reel')
              ? (item.thumbnail_url || item.media_url || '')
              : (item.media_url || ''),
            likes: item.like_count || 0, comments: item.comments_count || 0,
            saves: 0, shares: 0, reach: 0, impressions: 0, plays: undefined, engagementRate: 0,
          };
        });

        // Show posts immediately (without insights yet)
        setState((s) => ({ ...s, posts: basicPosts, usingMockData: false }));

        // 2. Post insights in parallel (one call per post, fast for 28 days)
        const insightResults: Record<string, Record<string, number>> = {};
        await Promise.all(basicPosts.map(async (post) => {
          const isVideo = post.type === 'video' || post.type === 'reel';
          const metrics = isVideo
            ? 'reach,impressions,saved,shares,plays'
            : 'reach,impressions,saved,shares';
          try {
            const res = await tFetch(
              `${API}/${post.id}/insights?metric=${metrics}&access_token=${TOKEN}`, 6000,
            );
            if (res.ok) {
              const data = await res.json() as { data: Array<{ name: string; values: Array<{ value: number }> }> };
              insightResults[post.id] = {};
              for (const m of data.data) {
                insightResults[post.id][m.name] = m.values?.[0]?.value ?? 0;
              }
            }
          } catch { /* ignore per-post errors */ }
        }));

        const enrichedPosts: Post[] = basicPosts.map((post) => {
          const ins = insightResults[post.id] || {};
          const saves = ins.saved || 0;
          const shares = ins.shares || 0;
          const reach = ins.reach || 0;
          const impressions = ins.impressions || 0;
          const plays = ins.plays;
          const eng = post.likes + post.comments + saves + shares;
          return { ...post, saves, shares, reach, impressions, plays,
            engagementRate: reach > 0 ? parseFloat(((eng / reach) * 100).toFixed(1)) : 0 };
        });

        setState((s) => ({ ...s, posts: enrichedPosts }));

        // 3. Account insights + follower count in parallel
        const since = toUnix(dateRange.start);
        const until = toUnix(dateRange.end) + 86400;
        const [accInsRes, followerRes] = await Promise.all([
          tFetch(`${API}/${USER_ID}/insights?metric=profile_views,website_clicks&period=day&since=${since}&until=${until}&access_token=${TOKEN}`, 8000),
          tFetch(`${API}/${USER_ID}/insights?metric=follower_count&period=day&since=${since}&until=${until}&access_token=${TOKEN}`, 8000),
        ]);

        const accountInsights: Record<string, number[]> = {};
        if (accInsRes.ok) {
          const d = await accInsRes.json() as { data: Array<{ name: string; values: Array<{ value: number }> }> };
          for (const m of d.data || []) {
            accountInsights[m.name] = (m.values || []).map((v) => v.value);
          }
        }

        const followersByDay: Array<{ end_time: string; value: number }> = [];
        if (followerRes.ok) {
          const d = await followerRes.json() as { data: Array<{ values: Array<{ value: number; end_time: string }> }> };
          followersByDay.push(...(d.data?.[0]?.values || []));
        }

        const metrics = buildMetrics(enrichedPosts, accountInsights, followersByDay);
        setState((s) => ({ ...s, monthlyMetrics: metrics }));

        // 4. Demographics (best-effort)
        try {
          const [ageRes, cityRes] = await Promise.all([
            tFetch(`${API}/${USER_ID}/insights?metric=follower_demographics&breakdown=age,gender&period=lifetime&timeframe=this_month&access_token=${TOKEN}`, 8000),
            tFetch(`${API}/${USER_ID}/insights?metric=follower_demographics&breakdown=city&period=lifetime&timeframe=this_month&access_token=${TOKEN}`, 8000),
          ]);

          let demographics: DemographicsData | null = null;

          if (ageRes.ok) {
            const ageData = await ageRes.json() as {
              data: Array<{
                total_value: {
                  breakdowns: Array<{
                    dimension_keys: string[];
                    results: Array<{ dimension_values: string[]; value: number }>;
                  }>;
                };
              }>;
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
                if (g === 'M') totalM += r.value;
                else if (g === 'F') totalF += r.value;
                else totalU += r.value;
              }

              const ageOrder = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
              const ageGender = Object.entries(ageMap)
                .sort(([a], [b]) => ageOrder.indexOf(a) - ageOrder.indexOf(b))
                .map(([age, counts]) => ({ age, ...counts, total: counts.M + counts.F + counts.U }));

              demographics = {
                ageGender, genderTotal: { M: totalM, F: totalF, U: totalU },
                topCities: [], topCountries: [],
              };
            }
          }

          if (cityRes.ok) {
            const cityData = await cityRes.json() as {
              data: Array<{
                total_value: {
                  breakdowns: Array<{
                    results: Array<{ dimension_values: string[]; value: number }>;
                  }>;
                };
              }>;
            };

            const cityBreakdown = cityData.data?.[0]?.total_value?.breakdowns?.[0];
            if (cityBreakdown) {
              const cities = cityBreakdown.results
                .map((r) => ({ name: r.dimension_values[0], value: r.value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 8);

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
