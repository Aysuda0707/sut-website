/**
 * Storage backend abstraction for uploaded media.
 *
 * Two backends are supported, chosen automatically at runtime:
 *
 *   1. **Vercel Blob** — used when `BLOB_READ_WRITE_TOKEN` is set (i.e. on
 *      Vercel, where the filesystem is read-only). Files are stored in the
 *      cloud and served from a public CDN URL.
 *
 *   2. **Local disk** — the default everywhere else (local dev, Docker). Files
 *      are written to `public/uploads/` and served as `/uploads/<name>`.
 *
 * The rest of the app only talks to `saveUpload()` / `deleteUpload()`, so the
 * admin API does not need to know which backend is active.
 *
 * Server-only: uses `node:fs` and the Vercel Blob SDK.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export interface StoredUpload {
  /** Public URL the browser can load the file from. */
  url: string;
  /** Backend-specific key, used to delete the file later. */
  key: string;
  /** Which backend stored the file. */
  backend: "blob" | "local";
}

/** True when uploads should go to Vercel Blob instead of local disk. */
export function usingBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Persist an uploaded file and return its public URL.
 *
 * @param filename  Desired file name (already sanitised by the caller).
 * @param data      Raw file bytes.
 * @param contentType  MIME type reported by the browser.
 */
export async function saveUpload(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<StoredUpload> {
  if (usingBlobStorage()) {
    // Imported lazily so the dependency is only required when actually used.
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${filename}`, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url, key: blob.url, backend: "blob" };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), data);
  return {
    url: `/uploads/${filename}`,
    key: filename,
    backend: "local",
  };
}

/**
 * Remove a previously stored upload. Best-effort: a missing file is not an
 * error. Only local files inside `public/uploads/` are touched, and the
 * resolved path is checked to stay within that directory (path-traversal
 * defence).
 */
export async function deleteUpload(key: string): Promise<void> {
  if (/^https?:\/\//i.test(key)) {
    try {
      const { del } = await import("@vercel/blob");
      await del(key);
    } catch {
      // Already gone or the token is unavailable — nothing to do.
    }
    return;
  }

  const target = path.resolve(UPLOAD_DIR, path.basename(key));
  if (!target.startsWith(path.resolve(UPLOAD_DIR))) return;
  try {
    await fs.unlink(target);
  } catch {
    // File already gone or unreadable — nothing to do.
  }
}

/**
 * Delete the file backing a media asset, accepting either a local
 * `/uploads/...` URL or an absolute Blob URL.
 */
export async function deleteUploadByUrl(url: string | undefined): Promise<void> {
  if (!url) return;
  if (/^https?:\/\//i.test(url)) {
    await deleteUpload(url);
    return;
  }
  if (url.startsWith("/uploads/")) {
    await deleteUpload(path.basename(url));
  }
}
