import { env } from "./env.ts";

const BEARER_PREFIX = "Bearer ";

export function isAuthorized(request: Request): boolean {

  const authorization = request.headers.get("authorization");
  
  if (!authorization) return false;
  if (!authorization.startsWith(BEARER_PREFIX)) return false;

  const token = authorization.slice(BEARER_PREFIX.length);

  return token === env.AUDIO_WEBHOOK_SECRET;

}

export function unauthorized(): Response {
  return Response.json({error: "Unauthorized"}, { status: 401 });
}