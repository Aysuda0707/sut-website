/**
 * Admin content API.
 *
 *   GET    /api/admin/content/:collection        → list all records
 *   POST   /api/admin/content/:collection        → create a record
 *   PATCH  /api/admin/content/:collection/:id    → update a record
 *   DELETE /api/admin/content/:collection/:id    → delete a record
 *
 * Supported collections: events, articles, podcasts, interviews, categories,
 * tags, contributors, media. Settings are handled by a separate route.
 *
 * All handlers require an authenticated admin session.
 */

import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  deleteRecord,
  listCollection,
  newId,
  upsertRecord,
  type CollectionName,
} from "@/lib/store";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }
  const { collection } = await params;
  if (!isAllowed(collection)) {
    return NextResponse.json({ error: "مجموعه نامعتبر." }, { status: 404 });
  }
  const items = await listCollection(collection);
  return NextResponse.json({ data: items });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }
  const { collection } = await params;
  if (!isAllowed(collection)) {
    return NextResponse.json({ error: "مجموعه نامعتبر." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const record = {
    ...body,
    id: (body.id as string) || newId(collection.slice(0, 3)),
    ...(collection === "events" || collection === "articles"
      ? { createdAt: (body.createdAt as string) || now, updatedAt: now }
      : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saved = await upsertRecord(collection, record as any);
  return NextResponse.json({ ok: true, data: saved }, { status: 201 });
}
