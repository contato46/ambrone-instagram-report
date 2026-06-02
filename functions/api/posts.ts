interface Env {
  INSTAGRAM_ACCESS_TOKEN: string;
  INSTAGRAM_USER_ID: string;
}

interface MediaItem {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp: string;
  permalink: string;
  like_count: number;
  comments_count: number;
}

interface MediaResponse {
  data: MediaItem[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
}

const GRAPH_API = 'https://graph.facebook.com/v19.0';
const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } = env;

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return Response.json({ error: 'Missing Instagram credentials' }, { status: 500 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get('since') || '2025-07-01';
  const until = url.searchParams.get('until') || '2026-05-31';
  const sinceDate = new Date(since);
  const untilDate = new Date(until);
  untilDate.setHours(23, 59, 59);

  const allPosts: MediaItem[] = [];
  let nextUrl: string | null =
    `${GRAPH_API}/${INSTAGRAM_USER_ID}/media?fields=${FIELDS}&limit=100&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
  let reachedBefore = false;
  let pages = 0;

  while (nextUrl && !reachedBefore && pages < 20) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      const err = await res.json() as Record<string, unknown>;
      return Response.json({ error: err }, { status: res.status });
    }

    const body = await res.json() as MediaResponse;
    pages++;

    for (const item of body.data) {
      const postDate = new Date(item.timestamp);
      if (postDate > untilDate) continue;
      if (postDate < sinceDate) {
        reachedBefore = true;
        break;
      }
      allPosts.push(item);
    }

    nextUrl = body.paging?.next || null;
  }

  return Response.json({ data: allPosts, total: allPosts.length });
};
