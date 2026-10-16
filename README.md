# آرشیو گروه دانشجویی آذربایجان — دانشگاه صنعتی شریف

A Persian-first cultural media archive for the Azerbaijan student group at
Sharif University of Technology.

> **Project status:** All six phases complete. The public frontend, CMS schema,
> media pipeline, integration layer, security hardening, backups, and
> documentation are in place. The site runs on local fixtures out of the box,
> ships with a **built-in admin panel** (no Docker, no database) for everyday
> editing, and switches to Directus automatically once the CMS is configured.

---

## Current state

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Architecture, data model, page map, checklist | ✅ Complete — [`docs/PHASE-1-ARCHITECTURE.md`](docs/PHASE-1-ARCHITECTURE.md) |
| 2 | Public frontend with sample content, RTL, responsive | ✅ Complete |
| 3 | CMS schema, DB relationships, auth, admin workflows | ✅ Complete — [`cms/`](cms) |
| 4 | Direct media uploads, persistent storage, playback | ✅ Complete — [`docs/PHASE-4-MEDIA-PIPELINE.md`](docs/PHASE-4-MEDIA-PIPELINE.md) |
| 5 | Frontend ↔ CMS integration, search, filters | ✅ Complete — [`src/lib/cms-source.ts`](src/lib/cms-source.ts) |
| 6 | SEO, security, backups, deployment, docs | ✅ Complete — [`docs/`](docs) |

The data-access layer in [`src/lib/data.ts`](src/lib/data.ts) is **three-source**
and resolves in this order:

1. **Directus** — when `DIRECTUS_URL` and `DIRECTUS_STATIC_TOKEN` are set, it
   reads from the CMS via [`src/lib/cms-source.ts`](src/lib/cms-source.ts).
2. **Built-in store** — when `data/content.json` exists (created by the built-in
   admin panel), it reads from [`src/lib/local-source.ts`](src/lib/local-source.ts).
3. **Fixtures** — otherwise it falls back to
   [`src/lib/sample-data.ts`](src/lib/sample-data.ts).

If a Directus request fails, the layer logs a warning and gracefully falls back
to the store/fixtures instead of erroring. Pages import only from `data.ts`, so
no page changes are needed to switch sources.

---

## Technology

- **Next.js 16.4.0** (App Router, Turbopack, `output: "standalone"`) with
  **React 19.3.0**
- **TypeScript 5.7** (strict)
- CSS Modules with a design-token system (no heavy UI dependencies)
- **Vazirmatn** Persian font via `next/font`
- RTL by default (`<html lang="fa" dir="rtl">`)
- **Directus 12** (CMS), **PostgreSQL 16**, **S3-compatible object storage**
- **Docker Compose** (dev + prod), **Caddy** (automatic HTTPS)

---

## Requirements

- Node.js ≥ 20 (verified on v24.20.0)
- npm ≥ 10 (verified on 11.19.0)
- **Docker Desktop** — *optional*. Only needed for the full Directus/Postgres
  stack. The site and the built-in admin panel run without Docker.

---

## Quick start (no Docker)

```bash
npm install
npm run dev          # http://localhost:3000 — runs on fixtures
```

The public site is immediately available. To edit content, use the built-in
admin panel (see below) — no database or Docker required.

### Other scripts

```bash
npm run build      # Production build
npm run start      # Serve the production build
npm run typecheck  # TypeScript check (no emit)
npm run lint       # ESLint (via next lint)
npm run test       # Vitest
```

---

## Built-in admin panel (no Docker, no database)

The project ships with a lightweight admin panel that stores all content in a
single JSON file (`data/content.json`) and uploaded media in `public/uploads/`.
It is the fastest way to run the site and is ideal for small teams.

### 1. Configure the admin password

Add to `.env` (see [`.env.example`](.env.example)):

```
ADMIN_PASSWORD=choose-a-strong-password
ADMIN_SESSION_SECRET=<random-64-hex-chars>
```

Generate a secret with `openssl rand -hex 32` (or any long random string). If
`ADMIN_PASSWORD` is left unset, the panel falls back to `admin` and shows a
warning banner — **change it before deploying**.

### 2. Sign in

Start the dev server and open <http://localhost:3000/admin>. You are redirected
to `/admin/login`; enter the password to reach the dashboard.

### 3. What you can manage

| Section | What it does |
|---------|--------------|
| **داشبورد** | Counts of every collection and the store file location. |
| **رویدادها / نوشته‌ها / پادکست / گفت‌وگوها** | Create, edit, publish, and delete content. |
| **رسانه** | Upload photos, audio, and video; browse and delete assets. |
| **تنظیمات** | Site name, tagline, contact email, intro, footer, plus categories and tags. |

Content is written to `data/content.json` and appears on the public site
immediately. The store is seeded from the Phase 2 fixtures on first run, so the
site is never empty.

### 4. Storage & backups

- **Content:** `data/content.json` — a single, human-readable, diffable file.
  Back it up by copying it.
- **Media:** `public/uploads/` — uploaded files (git-ignored; the folder is kept
  via `.gitkeep`).
- Deleting `data/content.json` resets the site to the fixtures on next request.

### 5. Security notes

- The admin uses a signed, HTTP-only session cookie (HMAC-SHA256) and a
  constant-time password check (scrypt). Set a strong `ADMIN_PASSWORD` and a
  unique `ADMIN_SESSION_SECRET`.
- Uploads are validated by MIME type and size (see
  [`src/app/api/admin/upload/route.ts`](src/app/api/admin/upload/route.ts)).
- The admin routes are marked `noindex` and are excluded from the sitemap.

### 6. When to move to Directus

The built-in panel is single-user and file-based. Move to the Directus stack
below when you need multiple editors, roles/permissions, a database, or
S3-backed media. The data layer switches automatically once Directus is
configured — no page changes required.

---

## Full stack with Docker (optional)

### 1. Install Docker Desktop

1. Download Docker Desktop for Windows from
   <https://www.docker.com/products/docker-desktop/>.
2. Run the installer and enable the **WSL 2** backend when prompted.
3. Restart when asked, then launch Docker Desktop and wait for "Engine running".
4. Verify in a terminal:
   ```bash
   docker --version
   docker compose version
   ```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `POSTGRES_PASSWORD`
- `DIRECTUS_KEY`, `DIRECTUS_SECRET` (generate with `openssl rand -hex 32`)
- `DIRECTUS_ADMIN_EMAIL`, `DIRECTUS_ADMIN_PASSWORD`
- `STORAGE_S3_KEY`, `STORAGE_S3_SECRET`

### 3. Start the development stack

```bash
docker compose up -d
```

This starts PostgreSQL, MinIO (object storage), a bucket initialiser, and
Directus. Directus is available at <http://localhost:8055>.

### 4. Apply the schema and seed content

```bash
# Apply the Directus schema snapshot
docker compose exec directus npx directus schema apply --yes /directus/snapshots/schema.yaml

# Seed sample content (idempotent)
docker compose exec directus node /directus/seed.mjs
```

### 5. Point the frontend at the CMS

Create a read-only static token in Directus (Settings → Access Tokens), then add
to `.env.local`:

```
DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=<your-read-only-token>
```

Restart `npm run dev`. The site now reads live content from Directus.

### 6. Production stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy provisions HTTPS automatically for the domains in `Caddyfile`. See
[`docs/BACKUP-RESTORE.md`](docs/BACKUP-RESTORE.md) for backups.

---

## Project structure

```
src/
  app/                     # Next.js App Router routes
    page.tsx               # Home (CMS-managed sections)
    events/                # Events archive + [slug] detail
    podcast/               # Podcast archive + [slug] detail
    interviews/            # Interviews archive + [slug] detail
    stories/               # Articles/reports archive + [slug] detail
    gallery/               # Media gallery
    about/                 # About the group
    search/                # Search results
    archive/[year]/        # Year-based archive entry point
    admin/                 # Built-in admin panel (login + (panel) route group)
    api/admin/             # Admin API: login, logout, content CRUD, upload, settings
    not-found.tsx          # Custom 404
    sitemap.ts             # Generated sitemap.xml
    robots.ts              # Generated robots.txt
    layout.tsx             # Root layout (RTL, fonts, header/footer)
    globals.css            # Design tokens + global styles
  components/
    layout/                # Header, footer, breadcrumbs, mobile nav, search
    ui/                    # Container, PageHeader, Badge, cards, Section
    media/                 # Accessible AudioPlayer + VideoPlayer
    archive/               # Archive filter chips
    admin/                 # AdminNav + generic CollectionManager (CRUD UI)
  lib/
    types.ts               # Domain types (mirror Directus collections)
    data-types.ts          # Shared data-layer types (SearchResult, GalleryItem)
    sample-data.ts         # Fixtures (Persian content)
    data.ts                # Three-source data-access layer
    store.ts               # Built-in JSON content store (data/content.json)
    local-source.ts        # Store-backed data source
    auth.ts                # Admin auth (scrypt password + signed session cookie)
    admin-client.ts        # Browser fetch helpers for the admin panel
    directus.ts            # Server-only Directus client + asset URL helpers
    cms-mappers.ts         # Directus records → domain types
    cms-source.ts          # CMS-backed data source
    rate-limit.ts          # In-memory sliding-window limiter
    format.ts              # Persian date/digit/duration formatting
    site.ts                # Static site config + navigation
  proxy.ts                 # Rate limiting for the search endpoint (Next 16 proxy)
data/
  content.json             # Built-in store (git-ignored; seeded from fixtures)
public/
  uploads/                 # Uploaded media (git-ignored; kept via .gitkeep)
cms/
  snapshots/schema.yaml    # Directus schema snapshot
  roles-and-policies.md    # RBAC model
  seed.mjs                 # Idempotent seed script
scripts/
  backup.sh                # Database + media backup
  restore.sh               # Restore from a backup
docs/
  PHASE-1-ARCHITECTURE.md  # Architecture, data model, page map, checklist
  PHASE-4-MEDIA-PIPELINE.md# Media upload, derivatives, playback, deletion
  EDITOR-GUIDE.md          # Non-technical editor guide (Persian + English)
  BACKUP-RESTORE.md        # Backup & tested restore procedure
  FEATURES-LIMITATIONS.md  # Features, limitations, services, traceability
docker-compose.yml         # Dev stack (Postgres + Directus + MinIO)
docker-compose.prod.yml    # Prod stack (Postgres + Directus + web + Caddy)
Dockerfile                 # Multi-stage Next.js standalone image
Caddyfile                  # Automatic HTTPS reverse proxy
```

---

## Pages implemented

1. Home — intro, featured item, recent events/reports, selected podcast &
   interviews, year archive entry point, quick links
2. Events archive — filter by year, category, tag
3. Event detail — gallery, metadata, related reports
4. Podcast archive
5. Podcast episode detail — accessible audio player
6. Interviews archive
7. Interview detail — video player
8. Stories & reports archive
9. Article detail — inline media, related events
10. Media gallery
11. About the group
12. Search results
13. Custom 404
14. Year archive (`/archive/[year]`)

Plus generated `sitemap.xml` and `robots.txt`.

---

## Accessibility & SEO

- Semantic HTML, skip link, labeled forms, visible focus states
- Keyboard-accessible mobile menu and audio player
- `prefers-reduced-motion` support
- Per-page metadata, Open Graph, canonical base URL
- Persian language metadata (`lang="fa"`, `dir="rtl"`, `og:locale=fa_IR`)
- Mixed Persian/English handling via `.ltr-inline`
- Generated sitemap and robots

---

## Security

- Server-only Directus client; admin credentials never reach the browser
- Read-only static token for public content; RBAC enforced server-side
- Interviews require recorded consent before publishing
- Hardened headers: HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Permissions-Policy`
- Rate limiting on the search endpoint (30 req/min per IP)
- Upload size and MIME-type allow lists enforced by Directus

---

## Verification performed

- `npm run build` — succeeds, 31 static pages generated
- `npm run typecheck` — zero errors
- `npm run test` — 28 tests pass (formatting, data layer, search, CMS mappers,
  rate limiter)
- All routes return expected HTTP status codes (200 / 404)
- Rendered HTML confirmed to contain `lang="fa" dir="rtl"` and Persian content
- Search verified with both Persian and English queries, including tag text

### Test runner note

The project pins **Vitest 3.2.7**. Vitest 4.x and 5.x currently fail to
initialise on Node 24.20.0 (Windows) with
`TypeError: Cannot read properties of undefined (reading 'config')` at the
first `describe()` call, so the last working 3.x line is used. To keep the
dependency tree free of known advisories, [`package.json`](package.json)
overrides two transitive packages to their patched releases:

- `tinypool` → `^2.2.0` (fixes prototype-pollution advisories)
- `@vitest/mocker` → `^4.1.11` (fixes the path-traversal advisory)

`npm audit` may still report one *moderate* item against the `vitest` package
itself because it inspects the declared dependency range rather than the
installed override; the actual installed `@vitest/mocker` is patched. This is
a dev-only dependency and does not ship to production.

---

## Documentation

- [Architecture & data model](docs/PHASE-1-ARCHITECTURE.md)
- [Media pipeline](docs/PHASE-4-MEDIA-PIPELINE.md)
- [Editor guide](docs/EDITOR-GUIDE.md)
- [Backup & restore](docs/BACKUP-RESTORE.md)
- [Features, limitations & services](docs/FEATURES-LIMITATIONS.md)
- [Roles & policies](cms/roles-and-policies.md)
