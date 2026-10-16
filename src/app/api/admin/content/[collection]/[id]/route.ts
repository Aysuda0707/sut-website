/**
 * Admin content API — single record operations.
 *
 *   PATCH  /api/admin/content/:collection/:id  → update a record
 *   DELETE /api/admin/content/:collection/:id  → delete a record
 *
 * Requires an authenticated admin session.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  deleteRecord,
  getRecord,
  upsertRecord,
  type CollectionName,
} from "@/lib/store";
import type { MediaAsset } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED: CollectionName[] = [
  "events",
  "articles",
  "podcasts",
  "interviews",
  "categories",
  "tags",
  "contributors",
  "media",
];

function isAllowed(name: string): name is CollectionName {
  return (ALLOWED as string[]).includes(name);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }
  const { collection, id } = await params;
  if (!isAllowed(collection)) {
    return NextResponse.json({ error: "مجموعه نامعتبر." }, { status: 404 });
  }

  const existing = await getRecord(collection, id);
  if (!existing) {
    return NextResponse.json({ error: "یافت نشد." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر." }, { status: 400 });
  }

  const merged = {
    ...(existing as unknown as Record<string, unknown>),
    ...body,
    id,
    ...(collection === "events" || collection === "articles"
      ? { updatedAt: new Date().toISOString() }
      : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saved = await upsertRecord(collection, merged as any);
  return NextResponse.json({ ok: true, data: saved });
}

/**
 * Best-effort removal of the physical file backing a media asset. Only files
 * inside `public/uploads/` are touched, and the resolved path is checked to
 * stay within that directory (defence against path traversal).
 */
async function removeUploadedFile(asset: MediaAsset): Promise<void> {
  if (!asset.url?.startsWith("/uploads/")) return;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const target = path.resolve(uploadsDir, path.basename(asset.url));
  if (!target.startsWith(path.resolve(uploadsDir))) return;
  try {
    await fs.unlink(target);
  } catch {
    // File already gone or unreadable — nothing to do.
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }
  const { collection, id } = await params;
  if (!isAllowed(collection)) {
    return NextResponse.json({ error: "مجموعه نامعتبر." }, { status: 404 });
  }

  // Capture the media record before deleting it so we can remove its file.
  const existing =
    collection === "media"
      ? ((await getRecord("media", id)) as MediaAsset | null)
      : null;

  const removed = await deleteRecord(collection, id);
  if (!removed) {
    return NextResponse.json({ error: "یافت نشد." }, { status: 404 });
  }

  if (existing) {
    await removeUploadedFile(existing);
  }

  return NextResponse.json({ ok: true });
}
