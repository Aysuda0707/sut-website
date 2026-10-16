/**
 * Edge proxy (formerly "middleware").
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`. The exported
 * function is still invoked for matched requests before they reach a route.
 *
 * Responsibilities:
 *   - Rate-limit the dynamic search endpoint to protect the CMS from abuse.
 *   - Expose rate-limit headers on allowed responses.
 *
 * Static pages are served from the CDN and never reach this proxy, so the
 * overhead is limited to dynamic routes.
 */

import { NextResponse, type NextRequest } from "next/server";
import { hit } from "./lib/rate-limit";

/** Search: 30 requests per minute per IP. */
const SEARCH_LIMIT = 30;
const SEARCH_WINDOW_MS = 60_000;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate-limit the search route (and its API, if added later).
  if (pathname === "/search" || pathname.startsWith("/api/search")) {
    const { allowed, remaining, retryAfter } = hit(
      `search:${clientIp(req)}`,
      SEARCH_LIMIT,
      SEARCH_WINDOW_MS,
    );

    if (!allowed) {
      return new NextResponse("تعداد درخواست‌ها بیش از حد مجاز است.", {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", String(SEARCH_LIMIT));
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Only run on dynamic routes; static assets and pages bypass the proxy.
  matcher: ["/search", "/api/search/:path*"],
};
