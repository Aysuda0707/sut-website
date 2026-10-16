/**
 * POST /api/admin/login
 *
 * Verifies the admin password and, on success, sets a signed session cookie.
 * Rate-limited in-memory to slow down brute-force attempts.
 */

import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { hit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  // 10 attempts per 5 minutes per IP.
  const limit = hit(`login:${ip}`, 10, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "تلاش‌های بیش از حد. لطفاً کمی بعد دوباره امتحان کنید." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
  }

  if (!password || !verifyPassword(password)) {
    return NextResponse.json(
      { error: "رمز عبور نادرست است." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(),
    sessionCookieOptions(),
  );
  return response;
}
