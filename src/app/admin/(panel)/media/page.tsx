"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteRecord,
  listRecords,
  uploadFile,
} from "@/lib/admin-client";

interface MediaRow {
  id: string;
  url: string;
  title: string;
  alt: string;
  mediaType: "image" | "audio" | "video";
  caption?: string;
  credit?: string;
}

/**
 * Media library. Upload photos, audio, and video; they are written to
 * `public/uploads/` and recorded in the content store. Editors can then pick
 * them from any content form.
 */
export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    const res = await listRecords<MediaRow>("media");
    if (res.ok && res.data) setItems(res.data);
    else setError(res.error ?? "خطا در بارگذاری.");
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("فایلی انتخاب نشده است.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await uploadFile(file, {
      title: title || file.name,
      alt: alt || title || file.name,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "بارگذاری ناموفق بود.");
      return;
    }
    setNotice("فایل بارگذاری شد.");
    setTitle("");
    setAlt("");
    if (fileRef.current) fileRef.current.value = "";
    await refresh();
  }

  async function remove(row: MediaRow) {
    if (!window.confirm(`«${row.title}» حذف شود؟`)) return;
    const res = await deleteRecord("media", row.id);
    if (!res.ok) {
      setError(res.error ?? "حذف نشد.");
      return;
    }
    setNotice("حذف شد.");
    await refresh();
  }

  return (
    <>
      <h1 className="admin-page-title">کتابخانه رسانه</h1>
      <p className="admin-page-lead">
        عکس، صدا و ویدیو را بارگذاری کنید تا در فرم‌های محتوا قابل انتخاب باشند.
      </p>

      {error ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="admin-alert admin-alert--ok" role="status">
          {notice}
        </div>
      ) : null}

      <form className="admin-card" onSubmit={onUpload}>
        <h2 className="admin-section-title" style={{ marginTop: 0 }}>
          بارگذاری فایل جدید
        </h2>
        <div className="admin-row">
          <div className="admin-field">
            <label htmlFor="media-file">فایل</label>
            <input
              id="media-file"
              ref={fileRef}
              className="admin-input"
              type="file"
              accept="image/*,audio/*,video/*"
              required
            />
            <span className="admin-hint">
              تصویر تا ۲۵ مگابایت، صدا تا ۲۰۰ مگابایت، ویدیو تا ۲ گیگابایت.
            </span>
          </div>
          <div className="admin-field">
            <label htmlFor="media-title">عنوان</label>
            <input
              id="media-title"
              className="admin-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="media-alt">متن جانشین (alt)</label>
            <input
              id="media-alt"
              className="admin-input"
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </div>
        </div>
        <div className="admin-actions">
          <button className="admin-btn" type="submit" disabled={busy}>
            {busy ? <span className="admin-spinner" aria-hidden="true" /> : null}
            {busy ? "در حال بارگذاری…" : "بارگذاری"}
          </button>
        </div>
      </form>

      <h2 className="admin-section-title">فایل‌های موجود</h2>
      {loading ? (
        <p className="admin-muted">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <div className="admin-empty">هنوز فایلی بارگذاری نشده است.</div>
      ) : (
        <div className="admin-media-grid">
          {items.map((item) => (
            <div className="admin-media-card" key={item.id}>
              <div className="admin-media-card__thumb">
                {item.mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.alt} />
                ) : (
                  <span className="admin-badge">{item.mediaType}</span>
                )}
              </div>
              <div className="admin-media-card__body">
                <div className="admin-media-card__title">{item.title}</div>
                <div className="admin-media-card__meta">{item.mediaType}</div>
                <button
                  className="admin-btn admin-btn--danger"
                  type="button"
                  style={{ marginTop: "var(--space-2)" }}
                  onClick={() => remove(item)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
