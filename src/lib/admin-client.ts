/**
 * Browser-side helpers for talking to the admin API.
 *
 * Kept intentionally small: a typed fetch wrapper plus the collection names the
 * admin UI is allowed to manage. Client-only (uses `fetch`).
 */

export type AdminCollection =
  | "events"
  | "articles"
  | "podcasts"
  | "interviews"
  | "categories"
  | "tags"
  | "contributors"
  | "media";

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: T;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `خطا (${res.status})` };
    }
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "خطای شبکه." };
  }
}

export function listRecords<T>(collection: AdminCollection): Promise<ApiResult<T[]>> {
  return request<T[]>(`/api/admin/content/${collection}`);
}

export function createRecord<T>(
  collection: AdminCollection,
  body: Record<string, unknown>,
): Promise<ApiResult<T>> {
  return request<T>(`/api/admin/content/${collection}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateRecord<T>(
  collection: AdminCollection,
  id: string,
  body: Record<string, unknown>,
): Promise<ApiResult<T>> {
  return request<T>(`/api/admin/content/${collection}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteRecord(
  collection: AdminCollection,
  id: string,
): Promise<ApiResult<unknown>> {
  return request(`/api/admin/content/${collection}/${id}`, {
    method: "DELETE",
  });
}

export function getSettings<T>(): Promise<ApiResult<T>> {
  return request<T>("/api/admin/settings");
}

export function updateSettings<T>(
  patch: object,
): Promise<ApiResult<T>> {
  return request<T>("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export interface UploadedAsset {
  id: string;
  url: string;
  title: string;
  alt: string;
  mediaType: "image" | "audio" | "video";
}

export async function uploadFile(
  file: File,
  meta: { title?: string; alt?: string } = {},
): Promise<ApiResult<UploadedAsset>> {
  const form = new FormData();
  form.append("file", file);
  if (meta.title) form.append("title", meta.title);
  if (meta.alt) form.append("alt", meta.alt);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const json = (await res.json().catch(() => ({}))) as {
      asset?: UploadedAsset;
      error?: string;
    };
    if (!res.ok || !json.asset) {
      return { ok: false, error: json.error ?? `خطا (${res.status})` };
    }
    return { ok: true, data: json.asset };
  } catch {
    return { ok: false, error: "خطای شبکه." };
  }
}
