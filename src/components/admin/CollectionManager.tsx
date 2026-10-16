"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
  uploadFile,
  type AdminCollection,
} from "@/lib/admin-client";

/* --- Field schema --------------------------------------------------------- */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "tags"
  | "media";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
  /** For `media` fields: restrict the picker to these media types. */
  mediaTypes?: ("image" | "audio" | "video")[];
  /** For `tags` fields: which taxonomy collection to pick from. */
  taxonomy?: "tags" | "categories";
  /** Hide from the list table (still editable in the form). */
  hideInList?: boolean;
}

export interface CollectionManagerProps {
  collection: AdminCollection;
  title: string;
  lead?: string;
  fields: FieldDef[];
  /** Field used as the primary label in the list. */
  labelField: string;
  /** Optional secondary line in the list. */
  secondaryField?: string;
  /** Build a fresh empty record for the "new" form. */
  emptyRecord: () => Record<string, unknown>;
  /** Optional slug source field; auto-slugified when creating. */
  slugFrom?: string;
}

interface MediaOption {
  id: string;
  url: string;
  title: string;
  mediaType: "image" | "audio" | "video";
}

interface TaxonomyOption {
  id: string;
  slug: string;
  name: string;
}

type Row = Record<string, unknown> & { id: string };

/* --- Helpers -------------------------------------------------------------- */

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* --- Component ------------------------------------------------------------ */

export function CollectionManager({
  collection,
  title,
  lead,
  fields,
  labelField,
  secondaryField,
  emptyRecord,
  slugFrom,
}: CollectionManagerProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [tagOptions, setTagOptions] = useState<TaxonomyOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<TaxonomyOption[]>([]);

  /** Reload the media list (used after an inline upload from a form). */
  async function reloadMedia() {
    const res = await listRecords<MediaOption>("media");
    if (res.ok && res.data) setMediaOptions(res.data);
  }

  const needsTaxonomy = useMemo(
    () => fields.some((f) => f.type === "tags"),
    [fields],
  );
  const needsMedia = useMemo(
    () => fields.some((f) => f.type === "media"),
    [fields],
  );

  async function refresh() {
    setLoading(true);
    const res = await listRecords<Row>(collection);
    if (res.ok && res.data) {
      setRows(res.data);
      setError(null);
    } else {
      setError(res.error ?? "خطا در بارگذاری.");
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  useEffect(() => {
    if (needsMedia) {
      void listRecords<MediaOption>("media").then((res) => {
        if (res.ok && res.data) setMediaOptions(res.data);
      });
    }
    if (needsTaxonomy) {
      void listRecords<TaxonomyOption>("tags").then((res) => {
        if (res.ok && res.data) setTagOptions(res.data);
      });
      void listRecords<TaxonomyOption>("categories").then((res) => {
        if (res.ok && res.data) setCategoryOptions(res.data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsMedia, needsTaxonomy]);

  function startCreate() {
    const fresh = emptyRecord();
    if (slugFrom) fresh.slug = "";
    setDraft(fresh);
    setEditing(null);
    setNotice(null);
    setError(null);
  }

  function startEdit(row: Row) {
    setDraft(structuredClone(row));
    setEditing(row);
    setNotice(null);
    setError(null);
  }

  function cancel() {
    setDraft(null);
    setEditing(null);
  }

  function setField(name: string, value: unknown) {
    setDraft((d) => (d ? { ...d, [name]: value } : d));
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = { ...draft };
    if (slugFrom) {
      const source = asString(payload[slugFrom]);
      const existingSlug = asString(payload.slug);
      if (!existingSlug && source) payload.slug = slugify(source);
    }

    const res = editing
      ? await updateRecord<Row>(collection, editing.id, payload)
      : await createRecord<Row>(collection, payload);

    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "ذخیره نشد.");
      return;
    }
    setNotice(editing ? "تغییرات ذخیره شد." : "مورد جدید ساخته شد.");
    setDraft(null);
    setEditing(null);
    await refresh();
  }

  async function remove(row: Row) {
    const label = asString(row[labelField]) || row.id;
    if (!window.confirm(`«${label}» حذف شود؟ این کار قابل بازگشت نیست.`)) return;
    const res = await deleteRecord(collection, row.id);
    if (!res.ok) {
      setError(res.error ?? "حذف نشد.");
      return;
    }
    setNotice("حذف شد.");
    await refresh();
  }

  /* --- Render ------------------------------------------------------------- */

  return (
    <>
      <div className="admin-inline" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="admin-page-title">{title}</h1>
          {lead ? <p className="admin-page-lead">{lead}</p> : null}
        </div>
        <button className="admin-btn" type="button" onClick={startCreate}>
          + مورد جدید
        </button>
      </div>

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

      {draft ? (
        <div className="admin-card">
          <h2 className="admin-section-title" style={{ marginTop: 0 }}>
            {editing ? "ویرایش" : "ایجاد"} مورد
          </h2>
          <RecordForm
            fields={fields}
            draft={draft}
            setField={setField}
            mediaOptions={mediaOptions}
            tagOptions={tagOptions}
            categoryOptions={categoryOptions}
            onMediaUploaded={reloadMedia}
          />
          <div className="admin-actions">
            <button
              className="admin-btn"
              type="button"
              onClick={save}
              disabled={saving}
            >
              {saving ? <span className="admin-spinner" aria-hidden="true" /> : null}
              {saving ? "در حال ذخیره…" : "ذخیره"}
            </button>
            <button
              className="admin-btn admin-btn--ghost"
              type="button"
              onClick={cancel}
              disabled={saving}
            >
              انصراف
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="admin-muted">در حال بارگذاری…</p>
      ) : rows.length === 0 ? (
        <div className="admin-empty">هنوز موردی ثبت نشده است.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{fields.find((f) => f.name === labelField)?.label ?? "عنوان"}</th>
              {secondaryField ? (
                <th>{fields.find((f) => f.name === secondaryField)?.label ?? ""}</th>
              ) : null}
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{asString(row[labelField]) || "—"}</td>
                {secondaryField ? (
                  <td className="admin-muted">{asString(row[secondaryField])}</td>
                ) : null}
                <td>
                  <StatusBadge value={asString(row.status)} />
                </td>
                <td>
                  <div className="admin-table__actions">
                    <button
                      className="admin-btn admin-btn--ghost"
                      type="button"
                      onClick={() => startEdit(row)}
                    >
                      ویرایش
                    </button>
                    <button
                      className="admin-btn admin-btn--danger"
                      type="button"
                      onClick={() => remove(row)}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* --- Status badge --------------------------------------------------------- */

function StatusBadge({ value }: { value: string }) {
  if (value === "published") {
    return <span className="admin-badge admin-badge--published">منتشرشده</span>;
  }
  if (value === "draft") {
    return <span className="admin-badge admin-badge--draft">پیش‌نویس</span>;
  }
  if (value === "archived") {
    return <span className="admin-badge">بایگانی</span>;
  }
  return <span className="admin-muted">—</span>;
}

/* --- Record form ---------------------------------------------------------- */

interface RecordFormProps {
  fields: FieldDef[];
  draft: Record<string, unknown>;
  setField: (name: string, value: unknown) => void;
  mediaOptions: MediaOption[];
  tagOptions: TaxonomyOption[];
  categoryOptions: TaxonomyOption[];
  /** Called after an inline upload so the media list can be refreshed. */
  onMediaUploaded: () => Promise<void>;
}

function RecordForm({
  fields,
  draft,
  setField,
  mediaOptions,
  tagOptions,
  categoryOptions,
  onMediaUploaded,
}: RecordFormProps) {
  return (
    <div className="admin-row">
      {fields.map((field) => (
        <div
          className="admin-field"
          key={field.name}
          style={
            field.type === "textarea"
              ? { gridColumn: "1 / -1" }
              : undefined
          }
        >
          <label htmlFor={`f-${field.name}`}>{field.label}</label>
          <FieldInput
            field={field}
            value={draft[field.name]}
            onChange={(v) => setField(field.name, v)}
            mediaOptions={mediaOptions}
            tagOptions={tagOptions}
            categoryOptions={categoryOptions}
            onMediaUploaded={onMediaUploaded}
          />
          {field.hint ? <span className="admin-hint">{field.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}

interface FieldInputProps {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  mediaOptions: MediaOption[];
  tagOptions: TaxonomyOption[];
  categoryOptions: TaxonomyOption[];
  onMediaUploaded: () => Promise<void>;
}

function FieldInput({
  field,
  value,
  onChange,
  mediaOptions,
  tagOptions,
  categoryOptions,
  onMediaUploaded,
}: FieldInputProps) {
  const id = `f-${field.name}`;

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          id={id}
          className="admin-textarea"
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          id={id}
          className="admin-input"
          type="number"
          value={value == null || value === "" ? "" : Number(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      );

    case "date":
      return (
        <input
          id={id}
          className="admin-input"
          type="date"
          value={asString(value).slice(0, 10)}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "select":
      return (
        <select
          id={id}
          className="admin-select"
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— انتخاب کنید —</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case "checkbox":
      return (
        <label className="admin-checkbox" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>{field.label}</span>
        </label>
      );

    case "tags": {
      const options =
        field.taxonomy === "categories" ? categoryOptions : tagOptions;
      const selected = Array.isArray(value)
        ? (value as { id: string }[]).map((v) => v.id)
        : [];
      return (
        <select
          id={id}
          className="admin-select"
          multiple
          size={Math.min(6, Math.max(3, options.length))}
          value={selected}
          onChange={(e) => {
            const ids = Array.from(e.target.selectedOptions).map((o) => o.value);
            const picked = options.filter((o) => ids.includes(o.id));
            onChange(picked);
          }}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      );
    }

    case "media": {
      return (
        <MediaField
          id={id}
          field={field}
          value={value}
          onChange={onChange}
          mediaOptions={mediaOptions}
          onMediaUploaded={onMediaUploaded}
        />
      );
    }

    case "text":
    default:
      return (
        <input
          id={id}
          className="admin-input"
          type="text"
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/* --- Media field with inline upload --------------------------------------- */

interface MediaFieldProps {
  id: string;
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  mediaOptions: MediaOption[];
  onMediaUploaded: () => Promise<void>;
}

/**
 * Media picker that also allows uploading a new file without leaving the form.
 * After a successful upload the new asset is selected automatically and the
 * shared media list is refreshed.
 */
function MediaField({
  id,
  field,
  value,
  onChange,
  mediaOptions,
  onMediaUploaded,
}: MediaFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = field.mediaTypes;
  const options = allowed
    ? mediaOptions.filter((m) => allowed.includes(m.mediaType))
    : mediaOptions;
  const current = value as MediaOption | undefined;

  // Include explicit extensions as well as wildcards: some browsers ignore
  // `audio/*` and would otherwise hide valid files in the picker.
  const ACCEPT_BY_TYPE: Record<string, string> = {
    image: "image/*,.jpg,.jpeg,.png,.webp,.avif,.gif",
    audio: "audio/*,.mp3,.m4a,.aac,.ogg,.oga,.wav,.flac",
    video: "video/*,.mp4,.webm,.mov,.mkv,.m4v,.mpeg",
  };
  const accept = allowed
    ? allowed.map((t) => ACCEPT_BY_TYPE[t]).join(",")
    : "image/*,audio/*,video/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.mp3,.m4a,.aac,.ogg,.oga,.wav,.flac,.mp4,.webm,.mov,.mkv,.m4v,.mpeg";

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const res = await uploadFile(file, { title: file.name, alt: file.name });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "بارگذاری ناموفق بود.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    await onMediaUploaded();
    // Use the media type the server determined (it also falls back to the
    // file extension when the browser sends a generic MIME type).
    onChange({
      id: res.data.id,
      url: res.data.url,
      title: res.data.title || file.name,
      mediaType: res.data.mediaType,
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="admin-media-field">
      <select
        id={id}
        className="admin-select"
        value={current?.id ?? ""}
        onChange={(e) => {
          const picked = options.find((o) => o.id === e.target.value);
          onChange(picked ?? null);
        }}
      >
        <option value="">— بدون فایل —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title} ({o.mediaType})
          </option>
        ))}
      </select>

      <div className="admin-media-field__upload">
        <input
          ref={fileRef}
          className="admin-input"
          type="file"
          accept={accept}
          onChange={onPick}
          disabled={busy}
          aria-label="بارگذاری فایل جدید"
        />
        {busy ? (
          <span className="admin-hint">
            <span className="admin-spinner" aria-hidden="true" /> در حال بارگذاری…
          </span>
        ) : null}
        {error ? (
          <span className="admin-hint admin-hint--error" role="alert">
            {error}
          </span>
        ) : null}
      </div>

      {current?.mediaType === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="admin-media-field__preview" src={current.url} alt="" />
      ) : null}
    </div>
  );
}
