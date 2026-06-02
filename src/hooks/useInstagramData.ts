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

interface InstagramDataState {
  posts: Post[];
  monthlyMetrics: MonthlyMetrics[];
  account: AccountInfo | null;
  loading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  error: string | null;
  usingMockData: boolean;
}

const IS_DEV = import.meta.env.DEV;
const USE_MOCK = IS_DEV || import.meta.env.VITE_USE_MOCK === 'true';

function parseMediaType(type: string): Post['type'] {
  if (type === 'CAROUSEL_ALBUM') return 'carousel';
  if (type === 'VIDEO') return 'video';
  if (type === 'REEL') return 'reel';
  return 'image';
}

function buildMonthlyMetrics(
  posts: Post[],
  insights: Record<string, { reach: number; impressions: number; profile_views: number; website_clicks: number }>,
  followersData: Array<{ end_time: string; value: number }>,
): MonthlyMetrics[] {
  const months: Record<string, { posts: Post[]; followers: number[] }> = {};

  posts.forEach((post) => {
    const month = post.date.slice(0, 7);
    if (!months[month]) months[month] = { posts: [], followers: [] };
    months[month].posts.push(post);
  });

  followersData.forEach(({ end_time, value }) => {
    const month = end_time.slice(0, 7);
    if (months[month]) months[month].followers.push(value);
  });

  const MONTH_LABELS: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  };

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { posts: mPosts, followers }]) => {
      const [year, m] = month.split('-');
      const monthInsights = insights[month] || { reach: 0, impressions: 0, profile_views: 0, website_clicks: 0 };
      const totalEngagement = mPosts.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0);
      const avgFollowers = followers.length > 0 ? Math.max(...followers) : 0;
      const engRate = monthInsights.reach > 0 ? (totalEngagement / monthInsights.reach) * 100 : 0;

      return {
        month,
        label: `${MONTH_LABELS[m]}/${year.slice(2)}`,
        followers: avgFollowers,
        followersGained: 0,
        posts: mPosts.length,
        reach: monthInsights.reach,
        impressions: monthInsights.impressions,
        engagement: totalEngagement,
        engagementRate: parseFloat(engRate.toFixed(1)),
        profileVisits: monthInsights.profile_views,
        websiteClicks: monthInsights.website_clicks,
      };
    });
}

export function useInstagramData(dateRange: DateRange) {
  const [state, setState] = useState<InstagramDataState>({
    posts: [],
    monthlyMetrics: [],
    account: null,
    loading: true,
    loadingMessage: 'Iniciando...',
    loadingProgress: 0,
    error: null,
    usingMockData: USE_MOCK,
  });

  const fetchRealData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, loadingMessage: 'Buscando dados da conta...', loadingProgress: 5 }));

      const [accountRes] = await Promise.all([
        fetch('/api/account'),
      ]);

      if (!accountRes.ok) {
        const err = await accountRes.json() as { error: unknown };
        throw new Error(`Erro na API: ${JSON.stringify(err.error)}`);
      }

      const accountData = await accountRes.json() as AccountInfo;
      setState((s) => ({ ...s, account: accountData, loadingMessage: 'Buscando publicações...', loadingProgress: 20 }));

      const postsRes = await fetch(`/api/posts?since=${dateRange.start}&until=${dateRange.end}`);
      if (!postsRes.ok) throw new Error('Erro ao buscar posts');

      const postsData = await postsRes.json() as { data: Array<{
        id: string; caption?: string; media_type: string; media_url?: string;
        thumbnail_url?: string; timestamp: string; permalink: string;
        like_count: number; comments_count: number;
      }>; total: number };

      setState((s) => ({ ...s, loadingMessage: 'Buscando métricas dos posts...', loadingProgress: 45 }));

      const insightsRes = await fetch('/api/post-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postsData.data.map((p) => ({ id: p.id, type: p.media_type }))),
      });

      const insightsData = await insightsRes.json() as Record<string, Record<string, number>>;

      setState((s) => ({ ...s, loadingMessage: 'Calculando métricas mensais...', loadingProgress: 70 }));

      const monthlyRes = await fetch(`/api/monthly-insights?since=${dateRange.start}&until=${dateRange.end}`);
      const monthlyData = await monthlyRes.json() as {
        insights: { data: Array<{ name: string; period: string; values: Array<{ end_time: string; value: number }> }> };
        followers: { data: Array<{ name: string; values: Array<{ end_time: string; value: number }> }> };
      };

      const parsedPosts: Post[] = postsData.data.map((item) => {
        const metrics = insightsData[item.id] || {};
        const likes = item.like_count || metrics.likes || 0;
        const comments = item.comments_count || metrics.comments || 0;
        const saves = metrics.saved || 0;
        const shares = metrics.shares || 0;
        const reach = metrics.reach || 0;
        const impressions = metrics.impressions || 0;
        const plays = metrics.plays || metrics.video_views;
        const engagement = likes + comments + saves + shares;
        const type = parseMediaType(item.media_type);

        return {
          id: item.id,
          date: item.timestamp.slice(0, 10),
          type,
          caption: item.caption || '',
          thumbnail: type === 'video' || type === 'reel'
            ? (item.thumbnail_url || item.media_url || '')
            : (item.media_url || ''),
          likes,
          comments,
          saves,
          shares,
          reach,
          impressions,
          plays,
          engagementRate: reach > 0 ? parseFloat(((engagement / reach) * 100).toFixed(1)) : 0,
        };
      });

      const monthlyInsightsMap: Record<string, { reach: number; impressions: number; profile_views: number; website_clicks: number }> = {};
      if (monthlyData.insights?.data) {
        for (const metric of monthlyData.insights.data) {
          for (const val of metric.values) {
            const month = val.end_time.slice(0, 7);
            if (!monthlyInsightsMap[month]) monthlyInsightsMap[month] = { reach: 0, impressions: 0, profile_views: 0, website_clicks: 0 };
            if (metric.name === 'reach') monthlyInsightsMap[month].reach = val.value;
            if (metric.name === 'impressions') monthlyInsightsMap[month].impressions = val.value;
            if (metric.name === 'profile_views') monthlyInsightsMap[month].profile_views = val.value;
            if (metric.name === 'website_clicks') monthlyInsightsMap[month].website_clicks = val.value;
          }
        }
      }

      const followersTimeline = monthlyData.followers?.data?.[0]?.values || [];
      const metrics = buildMonthlyMetrics(parsedPosts, monthlyInsightsMap, followersTimeline);

      setState({
        posts: parsedPosts,
        monthlyMetrics: metrics,
        account: accountData,
        loading: false,
        loadingMessage: '',
        loadingProgress: 100,
        error: null,
        usingMockData: false,
      });
    } catch (err) {
      console.error('Instagram API error, falling back to mock data:', err);
      setState({
        posts: ALL_POSTS,
        monthlyMetrics: MONTHLY_METRICS,
        account: null,
        loading: false,
        loadingMessage: '',
        loadingProgress: 100,
        error: String(err),
        usingMockData: true,
      });
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    if (USE_MOCK) {
      const timer = setTimeout(() => {
        setState({
          posts: ALL_POSTS,
          monthlyMetrics: MONTHLY_METRICS,
          account: null,
          loading: false,
          loadingMessage: '',
          loadingProgress: 100,
          error: null,
          usingMockData: true,
        });
      }, 800);
      return () => clearTimeout(timer);
    } else {
      fetchRealData();
    }
  }, [fetchRealData]);

  return state;
}
