interface Env {
  INSTAGRAM_ACCESS_TOKEN: string;
  INSTAGRAM_USER_ID: string;
}

interface InsightValue {
  value: number;
  end_time: string;
}

interface InsightMetric {
  name: string;
  period: string;
  values: InsightValue[];
}

interface InsightResponse {
  data: InsightMetric[];
  paging?: { previous: string; next: string };
}

const GRAPH_API = 'https://graph.facebook.com/v19.0';

function toUnix(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } = env;

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return Response.json({ error: 'Missing credentials' }, { status: 500 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get('since') || '2025-07-01';
  const until = url.searchParams.get('until') || '2026-05-31';

  const metrics = 'impressions,reach,profile_views,website_clicks';
  const insightsUrl = `${GRAPH_API}/${INSTAGRAM_USER_ID}/insights?metric=${metrics}&period=month&since=${toUnix(since)}&until=${toUnix(until)}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  const followersUrl = `${GRAPH_API}/${INSTAGRAM_USER_ID}/insights?metric=follower_count&period=day&since=${toUnix(since)}&until=${toUnix(until)}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  try {
    const [insightsRes, followersRes] = await Promise.all([
      fetch(insightsUrl),
      fetch(followersUrl),
    ]);

    const [insightsData, followersData] = await Promise.all([
      insightsRes.json() as Promise<InsightResponse | { error: unknown }>,
      followersRes.json() as Promise<InsightResponse | { error: unknown }>,
    ]);

    return Response.json({ insights: insightsData, followers: followersData });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
