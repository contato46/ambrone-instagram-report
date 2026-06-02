import { useState, useEffect, useRef } from 'react';
import type { Post, MonthlyMetrics, DateRange } from '../types';
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

function mockForRange(dateRange: DateRange) {
  const posts = ALL_POSTS.filter((p) => p.date >= dateRange.start && p.date <= dateRange.end);
  const metrics = MONTHLY_METRICS.filter(
    (m) => m.month >= dateRange.start.slice(0, 7) && m.month <= dateRange.end.slice(0, 7),
  );
  return { posts, monthlyMetrics: metrics };
}

function buildMetrics(posts: Post[]): MonthlyMetrics[] {
  const map: Record<string, Post[]> = {};
  posts.forEach((p) => { const m = p.date.slice(0, 7); if (!map[m]) map[m] = []; map[m].push(p); });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, mp]) => {
    const [year, m] = month.split('-');
    return {
      month, label: `${MONTH_LABELS[m]}/${year.slice(2)}`,
      followers: 0, followersGained: 0, posts: mp.length,
      reach: 0, impressions: 0,
      engagement: mp.reduce((s, p) => s + p.likes + p.comments, 0),
      engagementRate: 0, profileVisits: 0, websiteClicks: 0,
    };
  });
}

async function timedFetch(url: string, opts?: RequestInit, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function useInstagramData(dateRange: DateRange) {
  const mock = mockForRange(dateRange);

  // Page always renders immediately — loading: false from the start
  const [state, setState] = useState<InstagramDataState>({
    ...mock,
    account: null,
    syncing: !!TOKEN && !!USER_ID,
    error: null,
    usingMockData: true,
  });

  const rangeKey = `${dateRange.start}|${dateRange.end}`;
  const prevKey = useRef('');

  useEffect(() => {
    if (prevKey.current === rangeKey) return;
    prevKey.current = rangeKey;

    // Always reset to mock first so the page shows something immediately
    const m = mockForRange(dateRange);
    setState({
      ...m, account: null,
      syncing: !!TOKEN && !!USER_ID,
      error: null, usingMockData: true,
    });

    if (!TOKEN || !USER_ID) return;

    // Hard 15-second safety net — no matter what, stop the syncing indicator
    const safetyTimer = setTimeout(() => {
      setState((s) => ({ ...s, syncing: false }));
    }, 15000);

    (async () => {
      try {
        const fields = 'id,name,username,profile_picture_url,followers_count,media_count';
        const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count';

        const [accRes, postsRes] = await Promise.all([
          timedFetch(`${API}/${USER_ID}?fields=${fields}&access_token=${TOKEN}`, undefined, 8000),
          timedFetch(`${API}/${USER_ID}/media?fields=${mediaFields}&limit=50&access_token=${TOKEN}`, undefined, 10000),
        ]);

        const account: AccountInfo | null = accRes.ok ? await accRes.json() as AccountInfo : null;

        if (!postsRes.ok) throw new Error(`posts ${postsRes.status}`);
        const postsData = await postsRes.json() as {
          data: Array<{
            id: string; caption?: string; media_type: string;
            media_url?: string; thumbnail_url?: string;
            timestamp: string; like_count: number; comments_count: number;
          }>;
          paging?: { next?: string };
        };

        // Filter to selected date range
        let items = postsData.data.filter(
          (p) => p.timestamp.slice(0, 10) >= dateRange.start && p.timestamp.slice(0, 10) <= dateRange.end,
        );

        // If last item is still within range, try one more page
        const last = postsData.data[postsData.data.length - 1];
        if (postsData.paging?.next && last && last.timestamp.slice(0, 10) >= dateRange.start) {
          try {
            const p2 = await timedFetch(postsData.paging.next, undefined, 8000);
            if (p2.ok) {
              const p2d = await p2.json() as typeof postsData;
              items = [
                ...items,
                ...p2d.data.filter((p) => p.timestamp.slice(0, 10) >= dateRange.start && p.timestamp.slice(0, 10) <= dateRange.end),
              ];
            }
          } catch { /* ignore */ }
        }

        const posts: Post[] = items.map((item) => {
          const type = parseType(item.media_type);
          return {
            id: item.id, date: item.timestamp.slice(0, 10), type,
            caption: item.caption || '',
            thumbnail: (type === 'video' || type === 'reel')
              ? (item.thumbnail_url || item.media_url || '')
              : (item.media_url || ''),
            likes: item.like_count || 0, comments: item.comments_count || 0,
            saves: 0, shares: 0, reach: 0, impressions: 0,
            plays: undefined, engagementRate: 0,
          };
        });

        clearTimeout(safetyTimer);
        setState({ posts, monthlyMetrics: buildMetrics(posts), account, syncing: false, error: null, usingMockData: false });
      } catch (err) {
        clearTimeout(safetyTimer);
        setState((s) => ({ ...s, syncing: false, error: String(err) }));
      }
    })();

    return () => clearTimeout(safetyTimer);
  }, [rangeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
