# Phase 1 — Architecture Plan, Data Model, Page Map & Implementation Checklist

**Project:** Azerbaijan Student Group Archive — Sharif University of Technology
**Document status:** Phase 1 deliverable (planning). No application code written yet.
**Last updated:** 2026-10-12

---

## 1. Environment inspection results

Verified on the development machine (Windows 11, Git Bash shell):

| Tool | Required | Found | Status |
|------|----------|-------|--------|
| Node.js | ≥ 20 LTS | v24.20.0 | ✅ OK |
| npm | ≥ 10 | 11.19.0 | ✅ OK |
| Git | any | 2.55.0.windows.5 | ✅ OK |
| Python | optional | 3.14 | ✅ OK (not required) |
| **Docker** | required for stack | **not installed** | ❌ BLOCKER |
| **Docker Compose** | required for stack | **not installed** | ❌ BLOCKER |
| **PostgreSQL client** | required for DB work | **not installed** | ⚠️ Needed |
| WSL2 | recommended for Docker Desktop | **not installed** | ⚠️ Needed for Docker |

### Verified current stable dependency versions (checked against npm registry)

| Package | Latest stable | Notes |
|---------|---------------|-------|
| `next` | **16.4.0** | App Router, React 19, RSC. Requires Node ≥ 20. |
| `react` / `react-dom` | **19.3.0** | Bundled with Next 16. |
| `typescript` | **7.0.2** | Next 16 supports TS 5.x+; pin to a tested 5.x if TS 7 causes friction. |
| `directus` | **12.5.0** | Headless CMS + admin UI. Node ≥ 20. |

> **Version strategy:** Pin exact versions in `package.json` and commit `package-lock.json`. Next 16 + React 19 + Directus 12 is the target combination. TypeScript will be pinned to the latest 5.x line initially and upgraded to 7.x only after the build is verified green, to avoid toolchain churn during Phase 2.

---

## 2. Blockers & decisions requiring confirmation

These are the items that must be resolved **before** irreversible infrastructure choices:

1. **Docker is not installed.** The requested stack (Directus + PostgreSQL + S3-compatible storage) is designed to run via Docker Compose. Options:
   - **(A) Recommended:** Install Docker Desktop (requires enabling WSL2 or Hyper-V). Full stack runs locally exactly as in production.
   - **(B) No-Docker local dev:** Run PostgreSQL + Directus natively on Windows and use MinIO as a standalone binary. More manual, diverges from production.
   - **(C) Cloud-hosted services:** Use a managed Postgres + managed S3 (e.g. Supabase/Neon + Cloudflare R2) and run only Next.js + Directus locally.

2. **Object storage provider for production.** S3-compatible is required. Candidates: MinIO (self-hosted), Cloudflare R2, Backblaze B2, AWS S3. This affects cost documentation and the upload configuration.

3. **Deployment target.** Docker-based deployment is required, but the *host* matters (single VPS with Docker Compose vs. a container platform). This affects the deployment guide and backup scripts.

4. **Persian font licensing.** The design calls for excellent Persian typography. Proposed open-source fonts: **Vazirmatn** (SIL OFL) for UI/body and **Estedad** or **Sahel** for headings. Confirm these are acceptable, or specify a licensed brand font.

5. **Directus licensing.** Directus is BSL 1.1 for larger organizations. Confirm the group qualifies for the free tier, or plan an alternative.

---

## 3. High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Public visitors                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 16 (TypeScript, App Router, RTL)                        │
│  - Public pages (SSG/ISR + dynamic)                              │
│  - Server-side data fetching from Directus REST/GraphQL          │
│  - SEO: metadata, sitemap, robots, Open Graph                    │
│  - No direct DB access; no secrets in the browser                │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Directus SDK (server-side, token)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Directus 12 (CMS + Admin UI + Auth + RBAC + Flows)              │
│  - Collections = data model                                      │
│  - Roles/policies = RBAC                                         │
│  - Files = media library (S3 driver)                             │
│  - Persian admin labels via field translations                   │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ SQL                          │ S3 API
                ▼                              ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│  PostgreSQL 16            │   │  S3-compatible object storage    │
│  - Content records        │   │  - Original binaries (photo/     │
│  - Metadata, relations    │   │    audio/video)                  │
│  - Users, roles, settings │   │  - Generated thumbnails/variants │
│  - NO large binaries      │   │  - Byte-range video streaming    │
└───────────────────────────┘   └─────────────────────────────────┘
```

### Separation of concerns
- **Frontend** never talks to PostgreSQL directly and never holds admin credentials.
- **CMS** owns the schema, auth, RBAC, validation, and media handling.
- **Database** stores structured content + metadata only.
- **Object storage** stores all binaries; Directus generates derivatives (thumbnails, presets).

---

## 4. Data model (normalized)

Directus collections map to PostgreSQL tables. All collections include `id` (UUID), `status`, `user_created`, `user_updated`, `date_created`, `date_updated` where applicable.

### 4.1 Core content collections

**`events`**
| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| slug | string, unique, indexed | stable, immutable after publish |
| title | string | |
| event_type | m2o → `event_types` | e.g. ceremony, workshop, trip |
| event_date | date | |
| archive_year | integer, indexed | **structured**, not parsed from title |
| location | string, nullable | |
| summary | text | short |
| report_body | richtext, nullable | optional inline report (long-form reports live in `articles`) |
| featured_image | m2o → `directus_files` | |
| gallery | m2m → `directus_files` (junction `events_files`) | multiple images/videos |
| organizers | m2m → `contributors` | optional |
| contributors | m2m → `contributors` | optional |
| categories | m2m → `categories` | |
| tags | m2m → `tags` | |
| status | enum: draft/published/archived | |
| featured_on_home | boolean | editor-selected |
| seo | json (title, description, og_image) | |

**`articles`** (reports, essays, memories, stories)
| Field | Type | Notes |
|-------|------|-------|
| id, slug (unique), title | | |
| author_display_name | string | |
| publish_date | date | |
| summary | text | |
| body | richtext | rich text with inline media |
| featured_image | m2o → `directus_files` | |
| inline_media | m2m → `directus_files` | |
| related_events | m2m → `events` | a report links to its event |
| related_interviews | m2m → `interviews` | |
| related_podcasts | m2m → `podcast_episodes` | |
| categories, tags | m2m | |
| status | enum: draft/published/archived | |
| seo | json | |

**`podcast_episodes`**
| Field | Type | Notes |
|-------|------|-------|
| id, slug (unique), title | | |
| episode_number | integer | |
| season | integer, nullable | |
| publish_date | date | |
| short_description | text | |
| long_description | richtext | |
| cover_image | m2o → `directus_files` | |
| audio_file | m2o → `directus_files` | **directly uploaded** |
| transcript | richtext, nullable | |
| duration_seconds | integer | |
| contributors | m2m → `contributors` | |
| tags | m2m → `tags` | |
| status | enum: draft/published/archived | |

**`interviews`** (distinct content type)
| Field | Type | Notes |
|-------|------|-------|
| id, slug (unique), title | | |
| interviewee_name | string | display name only |
| recording_year | integer, indexed | |
| publish_date | date, nullable | |
| featured_image | m2o → `directus_files` | |
| video_file | m2o → `directus_files` | uploaded video |
| summary | text | |
| transcript | richtext, nullable | |
| field_of_study | string, nullable | |
| tags | m2m → `tags` | |
| consent_confirmed | boolean | **required true to publish** |
| status | enum: draft/published/archived | |

### 4.2 Taxonomy & supporting collections

- **`categories`** — id, slug, name, description, applies_to (content types).
- **`tags`** — id, slug, name.
- **`event_types`** — id, slug, name.
- **`contributors`** — id, name, role, optional link. (People credited on events/podcasts.)
- **`media_assets`** — *optional wrapper* around `directus_files` to store editorial metadata: title, caption, alt_text, description, credit, media_type, size_bytes, storage_key, usage_count. Keeps Directus file records clean while adding archive-specific metadata and reference tracking.
- **`site_settings`** (singleton) — site title, tagline, logo, primary/secondary colors, font choice, social links, home page section config, featured item references, footer text, contact info.
- **`home_sections`** (optional) — ordered, editor-managed home page blocks (type, title, source collection, filter, limit, order). Enables home page management without code changes.
- **`users` / `roles` / `policies`** — Directus built-ins, configured for RBAC.

### 4.3 Relationships summary
- Event 1—N Articles (via `articles.related_events`).
- Event N—M Files (gallery), N—M Contributors, N—M Categories, N—M Tags.
- Article N—M Events / Interviews / PodcastEpisodes.
- PodcastEpisode N—M Contributors, N—M Tags.
- Interview N—M Tags.
- MediaAsset 1—1 File; MediaAsset N—M any content (reference tracking for safe deletion).

### 4.4 Future Alumni module (planned, not exposed)
Reserved collections (created but not publicly exposed, or documented for later):
- `alumni_profiles` — id, display_name, graduation_year, field_of_study, bio, consent_public (default false), contact (private).
- `memberships` — id, alumni_profile, status, joined_at, role.
No public directory or membership features in the initial release.

### 4.5 Indexes & constraints
- Unique indexes: all `slug` fields.
- Indexes: `events.archive_year`, `events.event_date`, `events.status`, `interviews.recording_year`, `podcast_episodes.publish_date`, `articles.publish_date`.
- Validation: required fields per collection; `consent_confirmed` must be true to publish an interview; slug format `^[a-z0-9-]+$`; file size/type limits enforced in Directus file settings.

---

## 5. Page map (public site)

| # | Route | Page | Rendering |
|---|-------|------|-----------|
| 1 | `/` | Home | ISR |
| 2 | `/events` | Events archive (filter by year/category/tag) | ISR + client filters |
| 3 | `/events/[slug]` | Event detail | ISR |
| 4 | `/podcast` | Podcast archive | ISR |
| 5 | `/podcast/[slug]` | Episode detail (audio player) | ISR |
| 6 | `/interviews` | Interviews archive | ISR |
| 7 | `/interviews/[slug]` | Interview detail (video player) | ISR |
| 8 | `/stories` | Stories & reports archive | ISR |
| 9 | `/stories/[slug]` | Article detail | ISR |
| 10 | `/gallery` | Media gallery | ISR |
| 11 | `/about` | About the group | Static/ISR |
| 12 | `/search` | Search results | Dynamic (server) |
| 13 | `not-found` | Custom 404 | Static |
| — | `/archive/[year]` | Year-based archive entry point | ISR |
| — | `/sitemap.xml`, `/robots.txt` | SEO | Generated |

**Shared layout:** header + primary nav + breadcrumbs + footer; responsive mobile nav; RTL by default (`<html dir="rtl" lang="fa">`).

**Home page sections (CMS-managed):**
1. Short group introduction.
2. Editor-selected featured item.
3. Recently published events.
4. Recently published reports/articles.
5. Selected podcast episodes.
6. Selected interviews.
7. Year-based archive entry point.
8. Links to About + archive sections.

---

## 6. Administration experience plan

- Directus admin UI with **Persian field labels and collection names** via translations.
- Roles/policies:
  - **Administrator** — full access.
  - **Editor** — create/edit/publish content, upload media, manage taxonomy, select featured content.
  - **Contributor** — create drafts, upload media, cannot publish.
  - **Public** — read-only published content via API; no admin access.
- Custom Persian admin workflow: use Directus **insights/dashboards** and **flows** to present a simplified "content desk" (e.g. quick-create event, upload media, link report to event) so editors don't see raw tables.
- Draft/preview: Directus revisions + Next.js draft preview route using a preview token.
- Validation errors surfaced in Persian where practical.

---

## 7. Media pipeline plan

- Uploads go **directly to Directus** → stored in S3-compatible storage.
- Server-side validation: MIME type allowlist, max size per type (configurable), filename sanitization.
- Directus image presets generate thumbnails/optimized variants (AVIF/WebP) for display.
- Video: served from object storage with **byte-range** support; no automatic transcoding in initial release (documented limitation).
- Audio: streamed from object storage; accessible custom player (play/pause, seek, duration, progress).
- **Safe deletion:** MediaAsset tracks references; deletion blocked or warns if referenced. Never auto-delete a file because one record was removed.
- Storage limits and cost considerations documented in `docs/`.

---

## 8. Search, accessibility, SEO plan

- **Search:** Directus `/items` filtering across title/summary/body; optional PostgreSQL full-text search (`tsvector`) or `pg_trgm` for Persian. Start with Directus filters, upgrade to FTS if needed.
- **Filters:** year, content type, category, tag.
- **SEO:** per-page `generateMetadata` (title, description, canonical, Open Graph), `sitemap.ts`, `robots.ts`, semantic HTML, `lang="fa"` + `dir="rtl"`.
- **Accessibility:** keyboard navigation, labeled forms, focus states, ARIA for players, sufficient contrast, reduced-motion support.
- **Performance:** Next Image optimization, ISR caching, minimal client JS, no heavy animation libraries.

---

## 9. Security, reliability & preservation plan

- Directus auth (JWT/refresh), strong password policy, optional 2FA.
- Server-side authorization via Directus RBAC; frontend uses a read-only token scoped to published content.
- All secrets in `.env` (never committed); `.env.example` provided.
- Rate limiting on public forms (search/contact) via Next middleware or reverse proxy.
- Standard protections: HTTPS, secure cookies, CSRF handling, input validation, output escaping, CSP headers.
- **Backups:**
  - PostgreSQL: `pg_dump` scheduled + documented restore.
  - Media: separate sync/backup of the S3 bucket (versioning + lifecycle).
  - A backup is only "verified" after a **tested restore**; document the test procedure.
- Persistent volumes for DB and (if self-hosted) object storage across restarts/redeploys.
- Structured error logging without secrets/PII.

---

## 10. Design direction plan

- Editorial, cultural, archive-oriented; timeless, warm, refined, contemporary.
- Typography-first: Vazirmatn (body/UI), a display face for headings; generous line-height for Persian.
- Strong hierarchy, consistent spacing scale, reusable components.
- Elegant year-based archive navigation (timeline / year grid).
- High-quality event photography as the visual anchor.
- Avoid: generic dashboards, heavy gradients, oversized decorative elements, clichéd motifs.
- Visual identity (colors, fonts, logo) configurable via `site_settings` + CSS variables — no architecture rewrite.

---

## 11. Implementation checklist (phased)

### Phase 2 — Public frontend (sample content)
- [ ] Scaffold Next.js 16 + TypeScript + App Router, RTL, Persian fonts.
- [ ] Design system: tokens, typography, spacing, base components.
- [ ] Layout: header, nav, breadcrumbs, footer, mobile menu.
- [ ] Pages 1–13 with realistic sample content (local fixtures).
- [ ] Accessible audio player + video player components.
- [ ] Responsive verification (desktop/tablet/mobile).

### Phase 3 — CMS, DB, auth, admin
- [ ] Docker Compose: Postgres + Directus (+ MinIO).
- [ ] Define all collections, fields, relations, indexes, validations.
- [ ] Seed taxonomy + site_settings + sample content.
- [ ] Configure roles/policies (Admin/Editor/Contributor/Public).
- [ ] Persian admin labels; simplified content desk.
- [ ] Draft/preview workflow.

### Phase 4 — Media
- [ ] Directus S3 storage driver config.
- [ ] Upload validation (type/size), limits by media type.
- [ ] Image presets/variants; thumbnails.
- [ ] MediaAsset metadata + reference tracking + safe deletion.
- [ ] Audio streaming + video byte-range playback verified.

### Phase 5 — Integration
- [ ] Replace fixtures with Directus SDK data fetching.
- [ ] Search + archive filters wired to CMS.
- [ ] Relationships (report↔event, etc.) verified.
- [ ] Publishing workflow end-to-end verified.

### Phase 6 — SEO, security, backups, deployment, docs
- [ ] Metadata, sitemap, robots, Open Graph.
- [ ] Security hardening + rate limiting + headers.
- [ ] Backup scripts + tested restore procedure.
- [ ] Docker production config + `.env.example`.
- [ ] README, editor guide, backup/restore guide.
- [ ] Automated tests for critical workflows.
- [ ] Feature/limitations/external-services list.

---

## 12. Acceptance-criteria traceability

| # | Criterion | Phase |
|---|-----------|-------|
| 1 | Admin creates event without code | 3 |
| 2 | Upload photos + video from CMS | 4 |
| 3 | Save draft, preview, publish | 3 |
| 4 | Published event appears in year archive + home | 5 |
| 5 | Create article linked to event | 3/5 |
| 6 | Podcast episode with audio, plays publicly | 4/5 |
| 7 | Interview with own detail page | 3/5 |
| 8 | Visitors search & filter archive | 5 |
| 9 | Redeploy doesn't erase content/media | 4/6 |
| 10 | DB + media backups restorable | 6 |
| 11 | Public users can't do admin ops | 3/6 |
| 12 | Deploy on clean env via docs | 6 |

---

## 13. Required deliverables mapping

| Deliverable | Where |
|-------------|-------|
| Complete source code | repo root (`apps/web`, `cms/`) |
| DB/CMS schema & config | `cms/` (snapshot + migrations) |
| Docker & deployment config | `docker-compose.yml`, `docker-compose.prod.yml` |
| `.env.example` (no secrets) | repo root |
| Migrations / reproducible schema | `cms/snapshots`, `cms/migrations` |
| README (dev + prod) | `README.md` |
| Editor content guide | `docs/EDITOR-GUIDE.md` |
| Backup & restore guide | `docs/BACKUP-RESTORE.md` |
| Automated tests | `apps/web/tests`, `cms/tests` |
| Feature/limitations/services list | `docs/FEATURES-LIMITATIONS.md` |
