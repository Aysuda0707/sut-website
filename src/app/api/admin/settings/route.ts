/**
 * Admin settings API.
 *
 *   GET   /api/admin/settings  → read site settings
 *   PATCH /api/admin/settings  → update site settings (partial merge)
 *
 * Requires an authenticated admin session.
 */

import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }
  return NextResponse.json({ data: await getSettings() });
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }

  let body: Partial<SiteSettings>;
  try {
    body = (await request.json()) as Partial<SiteSettings>;
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر." }, { status: 400 });
  }

  const saved = await updateSettings(body);
  return NextResponse.json({ ok: true, data: saved });
}
