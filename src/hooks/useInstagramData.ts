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
  syncing: boolean;
  syncMessage: string;
  error: string | null;
  usingMockData: boolean;
}

function parseMediaType(type: string): Post['type'] {
  if (type === 'CAROUSEL_ALBUM') return 'carousel';
  if (type === 'VIDEO') return 'video';
  if (type === 'REEL') return 'reel';
  return 'image';
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export function useInstagramData(dateRange: DateRange) {
  const [state, setState] = useState<InstagramDataState>({
    posts: ALL_POSTS,
    monthlyMetrics: MONTHLY_METRICS,
    account: null,
    loading: false,
    syncing: false,
    syncMessage: '',
    error: null,
    usingMockData: true,
  });

  const load = useCallback(async () => {
    // 1. Check if API is configured (fast call, max 4s)
    try {
      const statusRes = await fetchWithTimeout('/api/status', undefined, 4000);
      if (!statusRes.ok) return; // not configured, keep mock data
      const status = await statusRes.json() as { configured: boolean };
      if (!status.configured) return; // keep mock data silently
    } catch {
      return; // keep mock data
    }

    // 2. API is configured — show mock data immediately, sync in background
    setState((s) => ({ ...s, syncing: true, syncMessage: 'Conectando ao Instagram...' }));

    try {
      // 3. Fetch account info quickly
      setState((s) => ({ ...s, syncMessage: 'Buscando conta...' }));
      const accountRes = await fetchWithTimeout('/api/account', undefined, 8000);
      if (!accountRes.ok) throw new Error('account error');
      const account = await accountRes.json() as AccountInfo;
      setState((s) => ({ ...s, account, syncMessage: 'Buscando publicações...' }));

      // 4. Fetch posts (basic data — no insights yet, fast)
      const postsRes = await fetchWithTimeout(
        `/api/posts?since=${dateRange.start}&until=${dateRange.end}`,
        undefined,
        25000,
      );
      if (!postsRes.ok) throw new Error('posts error');

      const postsData = await postsRes.json() as {
        data: Array<{
          id: string; caption?: string; media_type: string; media_url?: string;
          thumbnail_url?: string; timestamp: string; permalink: string;
          like_count: number; comments_count: number;
        }>;
      };

      // 5. Show posts immediately using available data (likes + comments from media endpoint)
      const basicPosts: Post[] = postsData.data.map((item) => {
        const type = parseMediaType(item.media_type);
        const likes = item.like_count || 0;
        const comments = item.comments_count || 0;
        return {
          id: item.id,
          date: item.timestamp.slice(0, 10),
          type,
          caption: item.caption || '',
          thumbnail: (type === 'video' || type === 'reel')
            ? (item.thumbnail_url || item.media_url || '')
            : (item.media_url || ''),
          likes,
          comments,
          saves: 0,
          shares: 0,
          reach: 0,
          impressions: 0,
          plays: undefined,
          engagementRate: 0,
        };
      });

      // Build basic monthly metrics from posts data alone
      const monthLabels: Record<string, string> = {
        '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai',
        '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
      };
      const monthMap: Record<string, Post[]> = {};
      basicPosts.forEach((p) => {
        const m = p.date.slice(0, 7);
        if (!monthMap[m]) monthMap[m] = [];
        monthMap[m].push(p);
      });
      const basicMetrics: MonthlyMetrics[] = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, mPosts]) => {
          const [year, m] = month.split('-');
          const eng = mPosts.reduce((s, p) => s + p.likes + p.comments, 0);
          return {
            month, label: `${monthLabels[m]}/${year.slice(2)}`,
            followers: 0, followersGained: 0, posts: mPosts.length,
            reach: 0, impressions: 0, engagement: eng, engagementRate: 0,
            profileVisits: 0, websiteClicks: 0,
          };
        });

      // Show what we have so far — page is now usable
      setState((s) => ({
        ...s,
        posts: basicPosts,
        monthlyMetrics: basicMetrics.length > 0 ? basicMetrics : s.monthlyMetrics,
        account,
        usingMockData: false,
        syncMessage: 'Buscando métricas detalhadas...',
      }));

      // 6. Fetch post insights in background (slow — batched Meta API calls)
      try {
        const insightsRes = await fetchWithTimeout('/api/post-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postsData.data.map((p) => ({ id: p.id, type: p.media_type }))),
        }, 45000);

        if (insightsRes.ok) {
          const insightsData = await insightsRes.json() as Record<string, Record<string, number>>;
          const enrichedPosts: Post[] = basicPosts.map((post) => {
            const m = insightsData[post.id] || {};
            const saves = m.saved || 0;
            const shares = m.shares || 0;
            const reach = m.reach || 0;
            const impressions = m.impressions || 0;
            const plays = m.plays || m.video_views;
            const eng = post.likes + post.comments + saves + shares;
            return {
              ...post, saves, shares, reach, impressions, plays,
              engagementRate: reach > 0 ? parseFloat(((eng / reach) * 100).toFixed(1)) : 0,
            };
          });
          setState((s) => ({ ...s, posts: enrichedPosts, syncMessage: 'Buscando métricas mensais...' }));

          // 7. Fetch monthly insights
          try {
            const monthlyRes = await fetchWithTimeout(
              `/api/monthly-insights?since=${dateRange.start}&until=${dateRange.end}`,
              undefined, 15000,
            );
            if (monthlyRes.ok) {
              const monthlyData = await monthlyRes.json() as {
                insights: { data: Array<{ name: string; values: Array<{ end_time: string; value: number }> }> };
                followers: { data: Array<{ name: string; values: Array<{ end_time: string; value: number }> }> };
              };

              const insMap: Record<string, { reach: number; impressions: number; profile_views: number; website_clicks: number }> = {};
              for (const metric of (monthlyData.insights?.data || [])) {
                for (const val of metric.values) {
                  const mo = val.end_time.slice(0, 7);
                  if (!insMap[mo]) insMap[mo] = { reach: 0, impressions: 0, profile_views: 0, website_clicks: 0 };
                  if (metric.name === 'reach') insMap[mo].reach = val.value;
                  if (metric.name === 'impressions') insMap[mo].impressions = val.value;
                  if (metric.name === 'profile_views') insMap[mo].profile_views = val.value;
                  if (metric.name === 'website_clicks') insMap[mo].website_clicks = val.value;
                }
              }

              const followersTimeline = monthlyData.followers?.data?.[0]?.values || [];
              const followersByMonth: Record<string, number[]> = {};
              followersTimeline.forEach(({ end_time, value }) => {
                const mo = end_time.slice(0, 7);
                if (!followersByMonth[mo]) followersByMonth[mo] = [];
                followersByMonth[mo].push(value);
              });

              const finalMetrics: MonthlyMetrics[] = Object.entries(monthMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, mPosts]) => {
                  const [year, m] = month.split('-');
                  const mi = insMap[month] || { reach: 0, impressions: 0, profile_views: 0, website_clicks: 0 };
                  const enriched = mPosts.map((p) => enrichedPosts.find((ep) => ep.id === p.id) || p);
                  const eng = enriched.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0);
                  const followers = followersByMonth[month]?.length
                    ? Math.max(...followersByMonth[month])
                    : account.followers_count || 0;
                  return {
                    month, label: `${monthLabels[m]}/${year.slice(2)}`,
                    followers, followersGained: 0, posts: mPosts.length,
                    reach: mi.reach, impressions: mi.impressions, engagement: eng,
                    engagementRate: mi.reach > 0 ? parseFloat(((eng / mi.reach) * 100).toFixed(1)) : 0,
                    profileVisits: mi.profile_views, websiteClicks: mi.website_clicks,
                  };
                });

              setState((s) => ({ ...s, monthlyMetrics: finalMetrics }));
            }
          } catch { /* monthly insights optional */ }
        }
      } catch { /* insights optional */ }

      setState((s) => ({ ...s, syncing: false, syncMessage: '' }));
    } catch (err) {
      // If real data fetch fails after showing mock, revert to mock silently
      console.error('Instagram data error:', err);
      setState((s) => ({
        ...s,
        syncing: false,
        syncMessage: '',
        error: String(err),
        usingMockData: s.posts.length === 0,
      }));
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}
