import { ApiFault } from "./errors";

export const SESSION_COOKIE = "gs_safety_session";

export function requestToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  const pair = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`));
  return pair ? pair.slice(SESSION_COOKIE.length + 1) : null;
}

export function enforceSameOrigin(request: Request): void {
  if (request.headers.get("authorization")?.startsWith("Bearer ")) return;
  const origin = request.headers.get("origin");
  const target = new URL(request.url);
  if (origin !== null) {
    let browserOrigin: URL;
    try {
      browserOrigin = new URL(origin);
    } catch (error) {
      if (error instanceof TypeError)
        throw new ApiFault(403, "ORIGIN_DENIED", "Invalid browser origin");
      throw error;
    }
    const requestHost = request.headers.get("host") ?? target.host;
    if (browserOrigin.host !== requestHost || browserOrigin.protocol !== target.protocol)
      throw new ApiFault(403, "ORIGIN_DENIED", "Cross-origin browser mutation denied");
  }
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new ApiFault(403, "ORIGIN_DENIED", "Cross-site browser mutation denied");
}

export function sessionCookie(token: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}
