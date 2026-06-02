import { useState, useEffect, useCallback } from 'react';
import type { Post, MonthlyMetrics, DateRange } from '../types';
import { ALL_POSTS, MONTHLY_METRICS } from '../data/mockData';

interface AccountInfo {
  id?: string;
  name?: string;
  username?: string;
  followers_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  biography?: string;
}

export interface InstagramDataState {
  posts: Post[];
  monthlyMetrics: MonthlyMetrics[];
  account: AccountInfo | null;
  loading: boolean;
  error: string | null;
  usingMockData: boolean;
}

function parseMediaType(type: string): Post['type'] {
  if (type === 'CAROUSEL_ALBUM') return 'carousel';
  if (type === 'VIDEO') return 'video';
  if (type === 'REEL') return 'reel';
  return 'image';
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, ms = 12000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai',
  '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

export function useInstagramData(dateRange: DateRange) {
  const [state, setState] = useState<InstagramDataState>({
    posts: [], monthlyMetrics: [], account: null,
    loading: true, error: null, usingMockData: false,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    // 1. Check if API is configured
    try {
      const res = await fetchWithTimeout('/api/status', undefined, 4000);
      const json = await res.json() as { configured?: boolean };
      if (!json.configured) {
        setState({ posts: ALL_POSTS, monthlyMetrics: filterMock(dateRange), account: null, loading: false, error: null, usingMockData: true });
        return;
      }
    } catch {
      setState({ posts: ALL_POSTS, monthlyMetrics: filterMock(dateRange), account: null, loading: false, error: null, usingMockData: true });
      return;
    }

    // 2. Fetch account
    try {
      const accountRes = await fetchWithTimeout('/api/account', undefined, 8000);
      if (accountRes.ok) {
        const account = await accountRes.json() as AccountInfo;
        setState((s) => ({ ...s, account }));
      }
    } catch { /* non-fatal */ }

    // 3. Fetch posts for the selected period
    try {
      const postsRes = await fetchWithTimeout(
        `/api/posts?since=${dateRange.start}&until=${dateRange.end}`, undefined, 20000,
      );
      if (!postsRes.ok) throw new Error('posts error');
      const postsData = await postsRes.json() as {
        data: Array<{
          id: string; caption?: string; media_type: string;
          media_url?: string; thumbnail_url?: string;
          timestamp: string; permalink: string;
          like_count: number; comments_count: number;
        }>;
      };

      // 4. Fetch insights for these posts (fast for 1 month = ~20-30 posts)
      let insightsData: Record<string, Record<string, number>> = {};
      try {
        const insRes = await fetchWithTimeout('/api/post-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postsData.data.map((p) => ({ id: p.id, type: p.media_type }))),
        }, 20000);
        if (insRes.ok) insightsData = await insRes.json() as typeof insightsData;
      } catch { /* use basic data */ }

      const posts: Post[] = postsData.data.map((item) => {
        const type = parseMediaType(item.media_type);
        const m = insightsData[item.id] || {};
        const likes = item.like_count || 0;
        const comments = item.comments_count || 0;
        const saves = m.saved || 0;
        const shares = m.shares || 0;
        const reach = m.reach || 0;
        const impressions = m.impressions || 0;
        const plays = m.plays || m.video_views;
        const eng = likes + comments + saves + shares;
        return {
          id: item.id, date: item.timestamp.slice(0, 10), type,
          caption: item.caption || '',
          thumbnail: (type === 'video' || type === 'reel')
            ? (item.thumbnail_url || item.media_url || '')
            : (item.media_url || ''),
          likes, comments, saves, shares, reach, impressions, plays,
          engagementRate: reach > 0 ? parseFloat(((eng / reach) * 100).toFixed(1)) : 0,
        };
      });

      // 5. Fetch monthly metrics
      let monthlyMetrics: MonthlyMetrics[] = buildBasicMetrics(posts);
      try {
        const mRes = await fetchWithTimeout(
          `/api/monthly-insights?since=${dateRange.start}&until=${dateRange.end}`, undefined, 12000,
        );
        if (mRes.ok) {
          const mData = await mRes.json() as {
            insights: { data: Array<{ name: string; values: Array<{ end_time: string; value: number }> }> };
            followers: { data: Array<{ name: string; values: Array<{ end_time: string; value: number }> }> };
          };
          monthlyMetrics = mergeMonthlyMetrics(posts, mData);
        }
      } catch { /* use basic */ }

      setState((s) => ({ ...s, posts, monthlyMetrics, loading: false, usingMockData: false }));
    } catch (err) {
      setState({ posts: ALL_POSTS, monthlyMetrics: filterMock(dateRange), account: null, loading: false, error: String(err), usingMockData: true });
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => { load(); }, [load]);

  return state;
}

function filterMock(dateRange: DateRange): MonthlyMetrics[] {
  return MONTHLY_METRICS.filter(
    (m) => m.month >= dateRange.start.slice(0, 7) && m.month <= dateRange.end.slice(0, 7),
  );
}

function buildBasicMetrics(posts: Post[]): MonthlyMetrics[] {
  const map: Record<string, Post[]> = {};
  posts.forEach((p) => { const m = p.date.slice(0, 7); if (!map[m]) map[m] = []; map[m].push(p); });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, mPosts]) => {
    const [year, m] = month.split('-');
    const eng = mPosts.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0);
    return {
      month, label: `${MONTH_LABELS[m]}/${year.slice(2)}`,
      followers: 0, followersGained: 0, posts: mPosts.length,
      reach: mPosts.reduce((s, p) => s + p.reach, 0),
      impressions: mPosts.reduce((s, p) => s + p.impressions, 0),
      engagement: eng, engagementRate: 0, profileVisits: 0, websiteClicks: 0,
    };
  });
}

function mergeMonthlyMetrics(
  posts: Post[],
  mData: {
    insights: { data: Array<{ name: string; values: Array<{ end_time: string; value: number }> }> };
    followers: { data: Array<{ name: string; values: Array<{ end_time: string; value: number }> }> };
  },
): MonthlyMetrics[] {
  const insMap: Record<string, Record<string, number>> = {};
  for (const metric of (mData.insights?.data || [])) {
    for (const val of metric.values) {
      const mo = val.end_time.slice(0, 7);
      if (!insMap[mo]) insMap[mo] = {};
      insMap[mo][metric.name] = val.value;
    }
  }
  const followersByMonth: Record<string, number[]> = {};
  for (const val of (mData.followers?.data?.[0]?.values || [])) {
    const mo = val.end_time.slice(0, 7);
    if (!followersByMonth[mo]) followersByMonth[mo] = [];
    followersByMonth[mo].push(val.value);
  }
  const map: Record<string, Post[]> = {};
  posts.forEach((p) => { const m = p.date.slice(0, 7); if (!map[m]) map[m] = []; map[m].push(p); });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, mPosts]) => {
    const [year, m] = month.split('-');
    const ins = insMap[month] || {};
    const eng = mPosts.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0);
    const reach = ins.reach || mPosts.reduce((s, p) => s + p.reach, 0);
    const followers = followersByMonth[month]?.length ? Math.max(...followersByMonth[month]) : 0;
    return {
      month, label: `${MONTH_LABELS[m]}/${year.slice(2)}`,
      followers, followersGained: 0, posts: mPosts.length,
      reach, impressions: ins.impressions || 0,
      engagement: eng,
      engagementRate: reach > 0 ? parseFloat(((eng / reach) * 100).toFixed(1)) : 0,
      profileVisits: ins.profile_views || 0, websiteClicks: ins.website_clicks || 0,
    };
  });
}
