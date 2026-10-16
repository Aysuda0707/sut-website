# Roles, Policies & Permissions

This document defines the RBAC model for the archive. It is applied in Directus
under **Settings → Access Policies** and **Settings → Roles**. The goal is that
non-technical editors can manage content without ever seeing raw tables, and
that the public API can only ever read **published** content.

---

## Roles

| Role | Purpose | Admin panel access |
|------|---------|--------------------|
| **Administrator** | Full control, schema, users, settings | Yes |
| **Editor** | Create/edit/publish content, upload media, manage taxonomy, choose featured items | Yes (scoped) |
| **Contributor** | Create drafts and upload media, **cannot publish** | Yes (scoped) |
| **Public** | Read-only published content via API | No |

---

## Policies

### `Public read` (attached to the Public role)

Read-only, published-only. Used by the frontend's static token.

| Collection | Action | Permission |
|------------|--------|------------|
| `events` | read | `status = published` |
| `articles` | read | `status = published` |
| `podcast_episodes` | read | `status = published` |
| `interviews` | read | `status = published` **and** `consent_confirmed = true` |
| `categories`, `tags`, `event_types`, `contributors` | read | all |
| `site_settings` | read | all |
| `directus_files` | read | all |

> **Important:** the interview rule enforces the consent requirement at the API
> layer, so an interview can never be served publicly without consent even if an
> editor forgets to check the box.

### `Editor content` (attached to the Editor role)

| Collection | Create | Read | Update | Delete |
|------------|:------:|:----:|:------:|:------:|
| `events`, `articles`, `podcast_episodes`, `interviews` | ✅ | ✅ | ✅ | ✅ |
| `categories`, `tags`, `event_types`, `contributors` | ✅ | ✅ | ✅ | ✅ |
| `site_settings` | — | ✅ | ✅ | — |
| `directus_files` | ✅ | ✅ | ✅ | ✅ |

Editors may set `status` to `published`.

### `Contributor drafts` (attached to the Contributor role)

| Collection | Create | Read | Update | Delete |
|------------|:------:|:----:|:------:|:------:|
| `events`, `articles`, `podcast_episodes`, `interviews` | ✅ | own | own | own |
| `directus_files` | ✅ | ✅ | own | own |

Contributors **cannot** set `status` to `published`. A field-level validation
rule restricts the allowed values to `draft` only.

---

## Field-level validation

| Collection | Field | Rule |
|------------|-------|------|
| all | `slug` | required, unique, matches `^[a-z0-9-]+$` |
| `interviews` | `consent_confirmed` | must be `true` to publish |
| `podcast_episodes` | `audio_file` | required |
| `events` | `archive_year` | required, integer |
| `events` | `event_date` | required |

These are enforced with Directus **field validation** rules and, where needed,
a **Flow** that blocks the publish transition when the rule fails.

---

## Persian admin labels

Collection and field names are translated to Persian via
**Settings → Translations**. The `note` fields in
[`snapshots/schema.yaml`](snapshots/schema.yaml) already carry Persian hints so
editors see guidance inline.

---

## Simplified "content desk"

To avoid exposing raw tables, create a Directus **Insights dashboard** named
«میز محتوا» with quick actions:

1. **رویداد تازه** — quick-create an event.
2. **بارگذاری رسانه** — upload photos/video.
3. **گزارش برای رویداد** — create an article and link it to an event.
4. **قسمت پادکست** — create a podcast episode with audio.
5. **گفت‌وگو** — create an interview (consent checkbox prominent).

Editors work from this dashboard; the underlying collections remain available
for advanced use.
