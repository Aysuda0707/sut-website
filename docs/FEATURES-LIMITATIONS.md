# Features, Limitations & Services

A candid inventory of what the archive does, what it deliberately does not do,
and the external services it depends on.

---

## 1. Features

### Public site

- **13 public pages**: Home, Events archive, Event detail, Podcast archive,
  Podcast episode detail, Interviews archive, Interview detail, Stories/reports
  archive, Article detail, Media gallery, About, Search results, custom 404 —
  plus a year-based archive (`/archive/[year]`).
- **Persian-first, RTL by default** (`<html lang="fa" dir="rtl">`) with correct
  mixed Persian/English handling (`.ltr-inline`).
- **Responsive** layout with a keyboard-accessible mobile menu.
- **Editorial design system**: design tokens, typography-first layout, warm and
  timeless palette, elegant year navigation.
- **Accessible media players**: custom audio player (play/pause, seek,
  elapsed/total) and native video player, both with Persian ARIA labels and
  graceful error states.
- **Search** across titles, summaries, bodies, locations, authors, interviewee
  names, and taxonomy (tags + categories), with Persian and English matching.
- **Filtering** by archive year, category, and tag.
- **Structured archive years** driving year navigation.
- **SEO**: per-page metadata, Open Graph, canonical URLs, generated
  `sitemap.xml` and `robots.txt`, `og:locale=fa_IR`.
- **Accessibility**: semantic HTML, skip link, labeled forms, visible focus,
  `prefers-reduced-motion` support.

### Content management (built-in admin panel)

- **Zero-dependency admin** at `/admin` — no Docker, no database, no native
  modules. Content is stored in a single JSON file (`data/content.json`).
- **Password login** with a signed, HTTP-only session cookie (HMAC-SHA256) and a
  constant-time scrypt password check.
- **CRUD for every collection**: events, articles, podcast episodes, interviews,
  categories, tags, and site settings.
- **Media library** with direct photo/audio/video upload to `public/uploads/`,
  validated by MIME type and size.
- **Persian, RTL interface** with a dashboard, per-collection forms, and status
  badges.
- **Immediate publishing** — saved content appears on the public site at once.
- **Seeded from fixtures** on first run, so the site is never empty.

### Content management (Directus, optional)

- **All content in a database** — no hardcoded content on the public site.
- **All media in object storage** — no external media URLs.
- **Normalized data model**: events, articles, podcast episodes, interviews,
  categories, tags, event types, contributors, site settings, media assets.
- **Draft / Published / Archived** workflow with preview.
- **Role-based access control**: Administrator, Editor, Contributor, Public.
- **Consent gate** for interviews (must be confirmed to publish).
- **CMS-managed home page**: featured item and section order/visibility.
- **Persian admin interface** with a simplified content desk.

### Media

- Direct uploads from the admin.
- On-demand image derivatives (thumbnails, hero, gallery, OG) via Directus
  presets, cached in object storage.
- Byte-range streaming for audio and video (seeking without full download).
- **Safe deletion**: unlinking never auto-deletes; deletion is manual.

### Operations

- **Docker Compose** stacks for development and production.
- **Caddy** automatic HTTPS in production.
- **Backup & restore scripts** with a documented, tested restore drill.
- **Rate limiting** on the search endpoint.
- **Hardened security headers** (CSP-friendly, HSTS, Permissions-Policy,
  X-Content-Type-Options, Referrer-Policy, X-Frame-Options).
- **Dual-source data layer**: the site runs on fixtures when the CMS is not
  configured, and on Directus when it is — no page changes required.
- **Automated tests** for formatting, the data layer, search, CMS mappers, and
  the rate limiter.

---

## 2. Limitations (by design)

These are intentional constraints from the specification, not defects.

| Limitation | Rationale |
| --- | --- |
| **No automatic video transcoding** | Editors upload web-ready MP4/WebM. Transcoding would add heavy infrastructure; can be added later as an external job. |
| **No external media URLs** | All media must be uploaded to object storage for durability and control. |
| **No automatic media deletion** | Prevents broken references on published pages. Deletion is a deliberate editor action. |
| **Alumni module not exposed** | The `alumni_profiles` collection exists in the schema for future use but has no public pages yet. |
| **Search is substring-based** | Simple, dependency-free matching. Not full-text ranked; adequate for the archive's size. |
| **Single-instance rate limiter** | The in-memory limiter suits the default single-instance deployment. Multi-instance setups should swap in Redis/Upstash. |
| **No user-generated content** | The public site is read-only; only authenticated editors create content. |
| **Persian-first, not multilingual** | The site is Persian by default; English appears only as inline mixed content. |

---

## 3. Known constraints

- **Vitest is pinned to 3.2.7.** Vitest 4.x/5.x fail to initialise on
  Node 24.20.0 (Windows). See the README "Test runner note".
- **`npm audit` shows one moderate dev-only item** against the `vitest` package
  due to its declared range; the installed transitive `@vitest/mocker` is
  patched via an override. This does not affect production.
- **Docker is optional.** The built-in admin panel and the public site run with
  no Docker, database, or object storage. Docker is only needed for the optional
  Directus/PostgreSQL/S3 stack.
- **The built-in store is single-user and file-based.** It has no roles or
  concurrent-editor locking; move to Directus when those are needed.

---

## 4. External services

| Service | Purpose | Required? | Notes |
| --- | --- | --- | --- |
| **Node.js ≥ 20** | Frontend + built-in admin runtime | Yes | Verified on v24.20.0. |
| **Local JSON store** | Built-in admin content | Yes (default) | `data/content.json`; no service to run. |
| **Local filesystem** | Built-in admin media | Yes (default) | `public/uploads/`. |
| **PostgreSQL 16** | Content database | Optional | Only with the Directus stack. Runs in Docker. |
| **Directus 12** | Headless CMS + admin | Optional | Only with the Directus stack. Runs in Docker. |
| **S3-compatible storage** | Media binaries | Optional | Only with the Directus stack. MinIO locally; Cloudflare R2 (or similar) in production. |
| **Caddy** | Reverse proxy + automatic HTTPS | Production only | Runs in Docker. |
| **Docker + Compose** | Orchestration | Optional | Only needed for the Directus stack. |

No third-party analytics, advertising, or tracking services are used.

---

## 5. Acceptance criteria traceability

| # | Criterion | Where satisfied |
| --- | --- | --- |
| 1 | All content in a persistent DB | Built-in JSON store (`data/content.json`) by default; Directus + PostgreSQL optionally (schema in [`cms/snapshots/schema.yaml`](../cms/snapshots/schema.yaml)) |
| 2 | All media in persistent storage | Built-in `public/uploads/` by default; S3-compatible storage optionally ([`docs/PHASE-4-MEDIA-PIPELINE.md`](PHASE-4-MEDIA-PIPELINE.md)) |
| 3 | No hardcoded content | [`src/lib/data.ts`](../src/lib/data.ts) reads CMS, the built-in store, or fixtures only |
| 4 | 13 public pages + nav/footer/breadcrumbs | [`src/app/`](../src/app) |
| 5 | Home page fully CMS-manageable | `site_settings.home_sections` + featured item |
| 6 | Structured events with archive year | `events.archive_year`; `/archive/[year]` |
| 7 | Podcast audio playback | [`AudioPlayer`](../src/components/media/AudioPlayer.tsx) |
| 8 | Interviews with video + consent | `interviews.consent_confirmed`; [`VideoPlayer`](../src/components/media/VideoPlayer.tsx) |
| 9 | Articles linked to events | `articles.related_events` relation |
| 10 | Search + filters | [`search()`](../src/lib/data.ts:164); archive filters |
| 11 | SEO + accessibility | metadata, sitemap, robots, ARIA, RTL |
| 12 | Security + backups | headers, rate limiting, [`scripts/backup.sh`](../scripts/backup.sh) |

---

## 6. Deliverables

| Deliverable | Location |
| --- | --- |
| Source code | [`src/`](../src) |
| Built-in admin panel | [`src/app/admin/`](../src/app/admin), [`src/lib/store.ts`](../src/lib/store.ts), [`src/lib/auth.ts`](../src/lib/auth.ts) |
| Database schema | [`cms/snapshots/schema.yaml`](../cms/snapshots/schema.yaml) |
| Docker configuration | [`docker-compose.yml`](../docker-compose.yml), [`docker-compose.prod.yml`](../docker-compose.prod.yml), [`Dockerfile`](../Dockerfile), [`Caddyfile`](../Caddyfile) |
| Environment template | [`.env.example`](../.env.example) |
| Migrations / seed | [`cms/seed.mjs`](../cms/seed.mjs), schema snapshot |
| README | [`README.md`](../README.md) |
| Editor guide | [`docs/EDITOR-GUIDE.md`](EDITOR-GUIDE.md) |
| Backup guide | [`docs/BACKUP-RESTORE.md`](BACKUP-RESTORE.md) |
| Tests | [`src/lib/*.test.ts`](../src/lib) |
| Feature/limitations list | this document |
