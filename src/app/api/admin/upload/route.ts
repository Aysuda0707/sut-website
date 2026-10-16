/**
 * POST /api/admin/upload
 *
 * Accepts a single file (photo, audio, or video) as multipart/form-data,
 * validates its type and size, stores it (Vercel Blob in production, local
 * disk elsewhere), and records a MediaAsset in the content store. Returns the
 * created asset.
 *
 * Validation mirrors the limits documented in docs/PHASE-4-MEDIA-PIPELINE.md.
 */

import path from "node:path";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { addMedia, newId } from "@/lib/store";
import { saveUpload } from "@/lib/storage";
import type { MediaAsset } from "@/lib/types";

export const runtime = "nodejs";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];
const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/x-aac",
  "audio/ogg",
  "audio/x-ogg",
  "audio/vorbis",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave",
  "audio/flac",
  "audio/x-flac",
  "audio/webm",
];
const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/x-m4v",
  "video/mpeg",
  "video/ogg",
];

/**
 * Extension → media kind. Used as a fallback when the browser sends a missing
 * or generic MIME type (e.g. `application/octet-stream`), which is common on
 * Windows where `.mp3` is often reported as `audio/mp3` or not at all.
 */
const EXTENSION_KINDS: Record<string, MediaAsset["mediaType"]> = {
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".webp": "image",
  ".avif": "image",
  ".gif": "image",
  ".mp3": "audio",
  ".m4a": "audio",
  ".aac": "audio",
  ".ogg": "audio",
  ".oga": "audio",
  ".wav": "audio",
  ".flac": "audio",
  ".mp4": "video",
  ".webm": "video",
  ".mov": "video",
  ".mkv": "video",
  ".m4v": "video",
  ".mpeg": "video",
  ".mpg": "video",
};

function maxBytesFor(kind: MediaAsset["mediaType"]): number {
  const mb =
    kind === "image"
      ? Number(process.env.MEDIA_MAX_IMAGE_MB ?? 25)
      : kind === "audio"
        ? Number(process.env.MEDIA_MAX_AUDIO_MB ?? 200)
        : Number(process.env.MEDIA_MAX_VIDEO_MB ?? 2048);
  return mb * 1024 * 1024;
}

/**
 * Resolve the media kind from the MIME type, falling back to the file
 * extension when the browser sends a missing or generic type.
 */
function kindOf(mime: string, filename = ""): MediaAsset["mediaType"] | null {
  if (IMAGE_TYPES.includes(mime)) return "image";
  if (AUDIO_TYPES.includes(mime)) return "audio";
  if (VIDEO_TYPES.includes(mime)) return "video";

  // Fallback: many browsers (especially on Windows) send a generic or empty
  // MIME type for audio/video. Trust the extension in that case.
  const ext = path.extname(filename).toLowerCase();
  return EXTENSION_KINDS[ext] ?? null;
}

function safeExtension(name: string, mime: string): string {
  const ext = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  if (ext) return ext;
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/mp4": ".m4a",
    "audio/m4a": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/aac": ".aac",
    "audio/x-aac": ".aac",
    "audio/ogg": ".ogg",
    "audio/x-ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/wave": ".wav",
    "audio/flac": ".flac",
    "audio/x-flac": ".flac",
    "audio/webm": ".weba",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-matroska": ".mkv",
    "video/x-m4v": ".m4v",
    "video/mpeg": ".mpeg",
    "video/ogg": ".ogv",
  };
  return map[mime] ?? "";
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "فرم نامعتبر." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی انتخاب نشده است." }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  const kind = kindOf(mime, file.name);
  if (!kind) {
    return NextResponse.json(
      { error: `نوع فایل پشتیبانی نمی‌شود: ${mime}` },
      { status: 415 },
    );
  }

  const maxBytes = maxBytesFor(kind);
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error: `حجم فایل بیش از حد مجاز است (حداکثر ${Math.round(
          maxBytes / 1024 / 1024,
        )} مگابایت).`,
      },
      { status: 413 },
    );
  }

  const id = newId("media");
  const ext = safeExtension(file.name, mime);
  const filename = `${id}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  let stored;
  try {
    stored = await saveUpload(filename, buffer, mime);
  } catch (err) {
    console.error("upload: failed to store file", err);
    return NextResponse.json(
      { error: "ذخیره‌سازی فایل ناموفق بود." },
      { status: 500 },
    );
  }

  const title = (form.get("title") as string) || file.name;
  const alt = (form.get("alt") as string) || title;

  const asset: MediaAsset = {
    id,
    url: stored.url,
    title,
    alt,
    mediaType: kind,
  };

  await addMedia(asset);

  return NextResponse.json({ ok: true, asset });
}
