interface Env {
  INSTAGRAM_ACCESS_TOKEN: string;
  INSTAGRAM_USER_ID: string;
}

const GRAPH_API = 'https://graph.facebook.com/v19.0';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID } = env;

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return Response.json({ error: 'Missing Instagram credentials' }, { status: 500 });
  }

  const fields = 'id,name,username,profile_picture_url,followers_count,follows_count,media_count,biography,website';
  const url = `${GRAPH_API}/${INSTAGRAM_USER_ID}?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return Response.json({ error: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
