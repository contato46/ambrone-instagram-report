interface Env {
  INSTAGRAM_ACCESS_TOKEN: string;
  INSTAGRAM_USER_ID: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const configured = Boolean(env.INSTAGRAM_ACCESS_TOKEN && env.INSTAGRAM_USER_ID);
  return Response.json({ configured });
};
