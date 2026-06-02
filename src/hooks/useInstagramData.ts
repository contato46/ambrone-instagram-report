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

const TOKEN = import.meta.env.VITE_INSTAGRAM_TOKEN as string | undefined;
const USER_ID = import.meta.env.VITE_INSTAGRAM_USER_ID as string | undefined;
const API = 'https://graph.facebook.com/v19.0';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai',
  '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function parseMediaType(type: string): Post['type'] {
  if (type === 'CAROUSEL_ALBUM') return 'carousel';
  if (type === 'VIDEO') return 'video';
  if (type === 'REEL') return 'reel';
  return 'image';
}

function buildMetrics(posts: Post[]): MonthlyMetrics[] {
  const map: Record<string, Post[]> = {};
  posts.forEach((p) => { const m = p.date.slice(0, 7); if (!map[m]) map[m] = []; map[m].push(p); });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, mPosts]) => {
    const [year, m] = month.split('-');
    const eng = mPosts.reduce((s, p) => s + p.likes + p.comments, 0);
    return {
      month, label: `${MONTH_LABELS[m]}/${year.slice(2)}`,
      followers: 0, followersGained: 0, posts: mPosts.length,
      reach: 0, impressions: 0, engagement: eng, engagementRate: 0,
      profileVisits: 0, websiteClicks: 0,
    };
  });
}

function filterMockByDate(dateRange: DateRange): MonthlyMetrics[] {
  return MONTHLY_METRICS.filter(
    (m) => m.month >= dateRange.start.slice(0, 7) && m.month <= dateRange.end.slice(0, 7),
  );
}

export function useInstagramData(dateRange: DateRange) {
  const [state, setState] = useState<InstagramDataState>({
    posts: [], monthlyMetrics: [], account: null,
    loading: true, error: null, usingMockData: false,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    if (!TOKEN || !USER_ID) {
      const mockPosts = ALL_POSTS.filter(
        (p) => p.date >= dateRange.start && p.date <= dateRange.end,
      );
      setState({
        posts: mockPosts, monthlyMetrics: filterMockByDate(dateRange),
        account: null, loading: false, error: null, usingMockData: true,
      });
      return;
    }

    try {
      // Fetch account + posts in parallel
      const [accountRes, postsRes] = await Promise.all([
        fetch(`${API}/${USER_ID}?fields=id,name,username,profile_picture_url,followers_count,media_count&access_token=${TOKEN}`),
        fetch(`${API}/${USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count&limit=50&access_token=${TOKEN}`),
      ]);

      const account = accountRes.ok ? await accountRes.json() as AccountInfo : null;
      setState((s) => ({ ...s, account: account || s.account }));

      if (!postsRes.ok) throw new Error('Erro ao buscar posts');
      const postsData = await postsRes.json() as {
        data: Array<{
          id: string; caption?: string; media_type: string;
          media_url?: string; thumbnail_url?: string;
          timestamp: string; permalink: string;
          like_count: number; comments_count: number;
        }>;
        paging?: { next?: string };
      };

      // Filter to date range
      const filtered = postsData.data.filter((p) => {
        const d = p.timestamp.slice(0, 10);
        return d >= dateRange.start && d <= dateRange.end;
      });

      // If there's a next page and we haven't reached the start date yet, fetch it
      let allItems = [...filtered];
      if (
        postsData.paging?.next &&
        postsData.data.length > 0 &&
        postsData.data[postsData.data.length - 1].timestamp.slice(0, 10) >= dateRange.start
      ) {
        try {
          const page2Res = await fetch(postsData.paging.next);
          if (page2Res.ok) {
            const page2 = await page2Res.json() as typeof postsData;
            const page2Filtered = page2.data.filter((p) => {
              const d = p.timestamp.slice(0, 10);
              return d >= dateRange.start && d <= dateRange.end;
            });
            allItems = [...allItems, ...page2Filtered];
          }
        } catch { /* ignore pagination errors */ }
      }

      const posts: Post[] = allItems.map((item) => {
        const type = parseMediaType(item.media_type);
        return {
          id: item.id, date: item.timestamp.slice(0, 10), type,
          caption: item.caption || '',
          thumbnail: (type === 'video' || type === 'reel')
            ? (item.thumbnail_url || item.media_url || '')
            : (item.media_url || ''),
          likes: item.like_count || 0,
          comments: item.comments_count || 0,
          saves: 0, shares: 0, reach: 0, impressions: 0, plays: undefined,
          engagementRate: 0,
        };
      });

      setState({
        posts, monthlyMetrics: buildMetrics(posts),
        account, loading: false, error: null, usingMockData: false,
      });
    } catch (err) {
      const mockPosts = ALL_POSTS.filter(
        (p) => p.date >= dateRange.start && p.date <= dateRange.end,
      );
      setState({
        posts: mockPosts, monthlyMetrics: filterMockByDate(dateRange),
        account: null, loading: false, error: String(err), usingMockData: true,
      });
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => { load(); }, [load]);

  return state;
}
