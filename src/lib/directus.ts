/**
 * Directus client (server-side only).
 *
 * The frontend never exposes admin credentials to the browser. This module is
 * imported exclusively by the data layer, which runs on the server.
 *
 * When `DIRECTUS_URL` and `DIRECTUS_STATIC_TOKEN` are not set, `isCmsConfigured()`
 * returns false and the data layer falls back to local fixtures. This keeps the
 * site fully runnable before the CMS is provisioned (and in CI).
 */

import {
  createDirectus,
  rest,
  staticToken,
  type DirectusClient,
  type RestClient,
  type StaticTokenClient,
} from "@directus/sdk";

export type CmsClient = DirectusClient<unknown> &
  RestClient<unknown> &
  StaticTokenClient<unknown>;

let client: CmsClient | null = null;

/** True when both the Directus URL and a read-only token are configured. */
export function isCmsConfigured(): boolean {
  return Boolean(process.env.DIRECTUS_URL && process.env.DIRECTUS_STATIC_TOKEN);
}

/**
 * Returns a memoised Directus client, or null when the CMS is not configured.
 */
export function getCmsClient(): CmsClient | null {
  if (!isCmsConfigured()) return null;
  if (client) return client;

  const url = process.env.DIRECTUS_URL as string;
  const token = process.env.DIRECTUS_STATIC_TOKEN as string;

  client = createDirectus(url).with(staticToken(token)).with(rest());
  return client;
}

/**
 * Builds a public asset URL for a Directus file id.
 * Uses the Directus `/assets/:id` endpoint, which streams from object storage.
 */
export function assetUrl(fileId: string | null | undefined): string {
  if (!fileId) return "";
  const base = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
  return `${base}/assets/${fileId}`;
}

/**
 * Builds a Directus asset URL with image transformation presets.
 * Directus generates derivatives on demand and caches them.
 */
export function assetUrlWithPreset(
  fileId: string | null | undefined,
  params: { width?: number; height?: number; quality?: number; format?: "webp" | "avif" } = {},
): string {
  if (!fileId) return "";
  const base = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
  const qs = new URLSearchParams();
  if (params.width) qs.set("width", String(params.width));
  if (params.height) qs.set("height", String(params.height));
  if (params.quality) qs.set("quality", String(params.quality));
  if (params.format) qs.set("format", params.format);
  const query = qs.toString();
  return `${base}/assets/${fileId}${query ? `?${query}` : ""}`;
}
