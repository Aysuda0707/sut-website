/**
 * Minimal authentication for the built-in admin panel.
 *
 * Deliberately dependency-free: uses Node's `crypto` for password hashing
 * (scrypt) and HMAC-signed session cookies. This is intentionally simple and
 * appropriate for a single-editor archive; it is NOT a multi-tenant auth system.
 *
 * Configuration (in `.env.local`):
 *   ADMIN_PASSWORD        — required to log in. If unset, a default is used and
 *                           a warning is printed at startup.
 *   ADMIN_SESSION_SECRET  — HMAC key for signing session cookies. If unset, a
 *                           random per-process secret is generated (sessions
 *                           then reset on restart).
 *
 * Server-only: never import from a client component.
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "sut_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const DEFAULT_PASSWORD = "admin";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || DEFAULT_PASSWORD;
}

function sessionSecret(): string {
  const configured = process.env.ADMIN_SESSION_SECRET?.trim();
  if (configured) return configured;
  // Fall back to a per-process random secret. Sessions reset on restart.
  if (!globalThis.__sutSessionSecret) {
    globalThis.__sutSessionSecret = randomBytes(32).toString("hex");
  }
  return globalThis.__sutSessionSecret;
}

declare global {
  // eslint-disable-next-line no-var
  var __sutSessionSecret: string | undefined;
}

/** True when the operator has not overridden the default password. */
export function usingDefaultPassword(): boolean {
  return adminPassword() === DEFAULT_PASSWORD;
}

/* --- Password verification ------------------------------------------------ */

/**
 * Verify a submitted password against the configured one using a
 * constant-time comparison. scrypt is used to normalise length and add cost.
 */
export function verifyPassword(submitted: string): boolean {
  const expected = adminPassword();
  const salt = "sut-archive-admin";
  const a = scryptSync(submitted, salt, 32);
  const b = scryptSync(expected, salt, 32);
  return timingSafeEqual(a, b);
}

/* --- Session tokens ------------------------------------------------------- */

interface SessionPayload {
  sub: "admin";
  iat: number;
  exp: number;
}

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

export function createSessionToken(): string {
  const now = Date.now();
  const payload: SessionPayload = {
    sub: "admin",
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

/* --- Cookie helpers (server components / route handlers) ------------------ */

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}
