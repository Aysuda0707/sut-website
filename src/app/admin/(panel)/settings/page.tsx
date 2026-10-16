"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/admin-client";
import { CollectionManager, type FieldDef } from "@/components/admin/CollectionManager";

interface SettingsShape {
  siteName: string;
  tagline: string;
  introduction: string;
  footerText: string;
  contactEmail?: string;
}

const categoryFields: FieldDef[] = [
  { name: "name", label: "نام دسته", type: "text", required: true },
  { name: "slug", label: "نشانی (slug)", type: "text" },
  { name: "description", label: "توضیح", type: "textarea" },
];

const tagFields: FieldDef[] = [
  { name: "name", label: "نام برچسب", type: "text", required: true },
  { name: "slug", label: "نشانی (slug)", type: "text" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsShape | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void getSettings<SettingsShape>().then((res) => {
      if (res.ok && res.data) setSettings(res.data);
      else setError(res.error ?? "خطا در بارگذاری تنظیمات.");
    });
  }, []);

  function set<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    const res = await updateSettings<SettingsShape>(settings);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "ذخیره نشد.");
      return;
    }
    setNotice("تنظیمات ذخیره شد.");
  }

  return (
    <>
      <h1 className="admin-page-title">تنظیمات</h1>
      <p className="admin-page-lead">
        اطلاعات کلی سایت، دسته‌ها و برچسب‌ها.
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

      <div className="admin-card">
        <h2 className="admin-section-title" style={{ marginTop: 0 }}>
          اطلاعات سایت
        </h2>
        {settings ? (
          <>
            <div className="admin-row">
              <div className="admin-field">
                <label htmlFor="s-name">نام سایت</label>
                <input
                  id="s-name"
                  className="admin-input"
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => set("siteName", e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="s-tagline">شعار</label>
                <input
                  id="s-tagline"
                  className="admin-input"
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="s-email">ایمیل تماس</label>
                <input
                  id="s-email"
                  className="admin-input"
                  type="email"
                  value={settings.contactEmail ?? ""}
                  onChange={(e) => set("contactEmail", e.target.value)}
                />
              </div>
            </div>
            <div className="admin-field">
              <label htmlFor="s-intro">معرفی</label>
              <textarea
                id="s-intro"
                className="admin-textarea"
                value={settings.introduction}
                onChange={(e) => set("introduction", e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="s-footer">متن پانویس</label>
              <textarea
                id="s-footer"
                className="admin-textarea"
                value={settings.footerText}
                onChange={(e) => set("footerText", e.target.value)}
              />
            </div>
            <div className="admin-actions">
              <button
                className="admin-btn"
                type="button"
                onClick={save}
                disabled={saving}
              >
                {saving ? <span className="admin-spinner" aria-hidden="true" /> : null}
                {saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}
              </button>
            </div>
          </>
        ) : (
          <p className="admin-muted">در حال بارگذاری…</p>
        )}
      </div>

      <h2 className="admin-section-title">دسته‌ها</h2>
      <CollectionManager
        collection="categories"
        title="دسته‌ها"
        fields={categoryFields}
        labelField="name"
        slugFrom="name"
        emptyRecord={() => ({ name: "", slug: "", description: "" })}
      />

      <h2 className="admin-section-title">برچسب‌ها</h2>
      <CollectionManager
        collection="tags"
        title="برچسب‌ها"
        fields={tagFields}
        labelField="name"
        slugFrom="name"
        emptyRecord={() => ({ name: "", slug: "" })}
      />
    </>
  );
}
