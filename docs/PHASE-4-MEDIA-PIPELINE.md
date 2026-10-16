# Phase 4 — Media Pipeline

This document describes how media (images, audio, video) flows from an editor's
upload in the Directus admin to playback on the public site. It covers storage,
validation, derivatives, playback, reuse, and safe deletion.

---

## 1. Storage model

| Layer | Responsibility |
| --- | --- |
| **Object storage (S3-compatible)** | Stores the binary files (originals + generated derivatives). Local dev uses **MinIO**; production uses **Cloudflare R2** (or any S3-compatible provider). |
| **PostgreSQL** | Stores file *metadata* only: id, title, description, filename, MIME type, dimensions, duration, and the storage key. No binaries in the database. |
| **Directus** | Owns the `directus_files` collection, the upload endpoint, and the `/assets/:id` streaming endpoint. |

Editors upload **directly** through the Directus admin. The public site never
accepts uploads and never references external media URLs — every asset is a
Directus file id resolved server-side.

### Why this split

- Binaries scale independently of the database.
- Backups are simpler: database dump + bucket sync.
- Swapping storage providers requires only env changes, not code.

---

## 2. Upload validation

Validation is enforced in two places so a misconfigured client cannot bypass it.

### 2.1 Directus-level (authoritative)

Configured via environment variables in [`docker-compose.yml`](../docker-compose.yml)
and [`docker-compose.prod.yml`](../docker-compose.prod.yml):

| Variable | Purpose | Suggested value |
| --- | --- | --- |
| `FILES_MAX_UPLOAD_SIZE` | Hard cap per file | `512mb` (video) |
| `FILES_MIME_TYPE_ALLOW_LIST` | Allowed MIME types | see below |

Recommended allow list:

```
image/jpeg,image/png,image/webp,image/avif,image/gif,
audio/mpeg,audio/mp4,audio/ogg,audio/wav,
video/mp4,video/webm,video/ogg,
application/pdf
```

### 2.2 Application-level (defence in depth)

The frontend only ever *reads* assets, so it does not accept uploads. However,
the data layer validates that referenced file ids resolve to a known MIME type
before rendering a player, so a broken reference degrades gracefully instead of
rendering an empty `<audio>`/`<video>`.

Media type detection lives in [`src/lib/cms-mappers.ts`](../src/lib/cms-mappers.ts)
(`toMediaAsset`), which maps a Directus file record to the domain `MediaAsset`
type (`kind: "image" | "audio" | "video" | "document"`).

---

## 3. Image derivatives (presets)

Directus generates derivatives **on demand** and caches them in object storage.
The site requests them through the `/assets/:id` endpoint with query parameters.

Helper: [`assetUrlWithPreset()`](../src/lib/directus.ts:60)

```ts
assetUrlWithPreset(fileId, { width: 800, quality: 80, format: "webp" });
// → https://cms.example.org/assets/<id>?width=800&quality=80&format=webp
```

### Recommended presets

| Use case | Parameters |
| --- | --- |
| Card thumbnail | `width=640&quality=78&format=webp` |
| Featured / hero | `width=1600&quality=82&format=webp` |
| Gallery lightbox | `width=1920&quality=85&format=webp` |
| OG image | `width=1200&height=630&fit=cover&quality=82` |

`next/image` is configured in [`next.config.ts`](../next.config.ts) to allow the
Directus host and the storage endpoint as remote patterns, so Next.js can also
optimise these derivatives at the edge.

### No automatic video transcoding

Per the specification, the system does **not** transcode video. Editors upload
web-ready MP4/WebM files. The native `<video>` element streams them with
byte-range support. If transcoding is required later, it should be added as an
external job (e.g. ffmpeg worker) writing back into the same bucket — the site
would then reference the transcoded file id.

---

## 4. Playback

| Media | Component | Notes |
| --- | --- | --- |
| Audio | [`AudioPlayer`](../src/components/media/AudioPlayer.tsx) | Native `<audio>` + custom controls (play/pause, seek, elapsed/total). Persian ARIA labels. Graceful error message. |
| Video | [`VideoPlayer`](../src/components/media/VideoPlayer.tsx) | Native `<video controls>` with poster. Persian fallback text and error alert. |

Both use `preload="metadata"` so the browser fetches only headers until the user
presses play, keeping page weight low. Byte-range requests are supported by the
Directus `/assets/:id` endpoint, enabling seeking without downloading the whole
file.

Transcripts are stored as text fields (`transcript` on podcast episodes and
interviews) and rendered alongside the player for accessibility and SEO.

---

## 5. Media reuse

A single Directus file can be referenced by many content items through
many-to-one / many-to-many relations (e.g. `events.gallery`, `articles.inline_media`,
`podcast_episodes.audio_file`, `interviews.video_file`). The gallery page
aggregates assets across events and articles via
[`getGalleryItems()`](../src/lib/data.ts:262), preserving a back-reference
(`sourceTitle`, `sourceHref`) to the originating content.

---

## 6. Safe deletion

Deletion is **never automatic**. Directus does not cascade-delete files when a
content item is removed, and the site never deletes assets.

Recommended editor workflow:

1. Remove the file reference from the content item (unlink).
2. Check the file's usage in the Directus file library ("Used in" panel).
3. Only delete the file from the library when it is no longer referenced.

This prevents broken references on published pages. A periodic orphan report can
be produced by querying `directus_files` for ids with no incoming relations.

---

## 7. Verification checklist

- [ ] Upload an image in Directus; confirm it appears in the file library.
- [ ] Reference it on an event; confirm the card thumbnail renders via a preset.
- [ ] Upload an MP3; attach to a podcast episode; confirm playback and seeking.
- [ ] Upload an MP4; attach to an interview; confirm playback and poster.
- [ ] Confirm `FILES_MAX_UPLOAD_SIZE` rejects an oversized file.
- [ ] Confirm a disallowed MIME type is rejected.
- [ ] Unlink a file from content; confirm the page still renders (no broken player).
- [ ] Confirm the file is **not** deleted from storage after unlinking.
