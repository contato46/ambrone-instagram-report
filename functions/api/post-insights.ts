interface Env {
  INSTAGRAM_ACCESS_TOKEN: string;
}

interface BatchRequest {
  method: string;
  relative_url: string;
}

interface InsightValue {
  value: number;
  end_time: string;
}

interface InsightMetric {
  name: string;
  values: InsightValue[];
  id: string;
}

interface InsightData {
  data: InsightMetric[];
  id: string;
}

const GRAPH_API = 'https://graph.facebook.com/v19.0';
const BATCH_SIZE = 50;

function getMetricsForType(mediaType: string): string {
  if (mediaType === 'VIDEO' || mediaType === 'REEL') {
    return 'reach,impressions,saved,shares,plays,video_views';
  }
  return 'reach,impressions,saved,shares';
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const { INSTAGRAM_ACCESS_TOKEN } = env;

  if (!INSTAGRAM_ACCESS_TOKEN) {
    return Response.json({ error: 'Missing access token' }, { status: 500 });
  }

  const body = await request.json() as Array<{ id: string; type: string }>;
  const results: Record<string, Record<string, number>> = {};

  for (let i = 0; i < body.length; i += BATCH_SIZE) {
    const chunk = body.slice(i, i + BATCH_SIZE);
    const batch: BatchRequest[] = chunk.map(({ id, type }) => ({
      method: 'GET',
      relative_url: `${id}/insights?metric=${getMetricsForType(type)}`,
    }));

    const formData = new FormData();
    formData.append('access_token', INSTAGRAM_ACCESS_TOKEN);
    formData.append('batch', JSON.stringify(batch));

    const res = await fetch(GRAPH_API, { method: 'POST', body: formData });
    const batchResults = await res.json() as Array<{ code: number; body: string }>;

    for (let j = 0; j < chunk.length; j++) {
      const { id } = chunk[j];
      const result = batchResults[j];
      if (!result || result.code !== 200) {
        results[id] = {};
        continue;
      }

      try {
        const parsed = JSON.parse(result.body) as InsightData;
        const metrics: Record<string, number> = {};
        for (const metric of parsed.data) {
          const val = metric.values?.[0]?.value ?? metric.values?.reduce((s, v) => s + v.value, 0) ?? 0;
          metrics[metric.name] = typeof val === 'number' ? val : 0;
        }
        results[id] = metrics;
      } catch {
        results[id] = {};
      }
    }
  }

  return Response.json(results);
};
