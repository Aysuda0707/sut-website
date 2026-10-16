# راهنمای ویرایشگر — آرشیو گروه دانشجویی آذربایجان

# Editor Guide — Azerbaijan Student Group Archive

This guide is for **non-technical editors** who manage content. No coding is
required.

There are two ways to edit content, depending on how the site is deployed:

- **Built-in admin panel** (default) — a lightweight panel inside the website
  itself. No database, no Docker. Best for small teams. See section 1 below.
- **Directus** (optional) — a full CMS with multiple users and roles. Used when
  the site is deployed with the Docker stack. See section 2.

---

## 1. پنل مدیریت داخلی / The built-in admin panel

This is the default editor. It stores everything in a single file on the server
and needs no extra software.

### 1.1 ورود / Signing in

1. Open `https://<your-site>/admin` (locally: <http://localhost:3000/admin>).
2. You are redirected to the login page. Enter the **admin password**.
3. The interface is in **Persian** and right-to-left.

The password is set by the administrator in the `.env` file
(`ADMIN_PASSWORD`). If you do not know it, ask the administrator. If the panel
shows a yellow warning banner, the default password is still in use — tell the
administrator to change it.

### 1.2 بخش‌ها / Sections

| Section | What you can do |
| --- | --- |
| **داشبورد** | See how many items exist in each collection. |
| **رویدادها** | Add, edit, publish, and delete events. |
| **نوشته‌ها** | Add, edit, publish, and delete articles/reports. |
| **پادکست** | Add, edit, publish, and delete podcast episodes. |
| **گفت‌وگوها** | Add, edit, publish, and delete interviews. |
| **رسانه** | Upload photos, audio, and video; browse and delete files. |
| **تنظیمات** | Edit site name, tagline, contact email, intro, footer, and the category/tag lists. |

### 1.3 افزودن محتوا / Adding content

1. Open the relevant section (e.g. **رویدادها**).
2. Click **افزودن** (Add) to open a blank form.
3. Fill in the fields. The **نامک (slug)** is generated from the title — you can
   edit it, but use Latin letters, digits, and hyphens only.
4. Set **وضعیت (status)** to **منتشرشده (published)** to make it visible on the
   public site. **پیش‌نویس (draft)** keeps it hidden.
5. Click **ذخیره** (Save). The change appears on the site immediately.

To edit or delete an item, use the **ویرایش** / **حذف** buttons in its row.

### 1.4 رسانه / Media

- Open **رسانه**, choose a file, give it a **title** and (for images) **alt
  text**, then upload.
- Allowed types: JPEG, PNG, WebP, AVIF, GIF, MP3, M4A, OGG, WAV, MP4, WebM.
- Maximum sizes: images 25 MB, audio 200 MB, video 2 GB (set by the
  administrator).
- To attach media to content, copy its URL from the media list and paste it into
  the relevant field, or pick it where the form offers a media selector.
- **Deleting media is permanent.** Only delete a file after checking it is no
  longer used.

### 1.5 پشتیبان‌گیری / Backups

All content lives in one file (`data/content.json`) and all media in
`public/uploads/`. To back up, copy both. To reset the site to the original
sample content, ask the administrator to remove `data/content.json`.

---

## 2. پنل Directus / The Directus admin panel (optional)

Used only when the site is deployed with the full Docker stack. It adds multiple
users, roles, and a database.

### 2.1 ورود / Signing in

1. Open the admin URL (e.g. `https://cms.example.org/admin`).
2. Enter your email and password.
3. The interface is in **Persian** and right-to-left by default.

If you forget your password, use "فراموشی رمز عبور" or ask an administrator.

---

## 2. نقش‌ها / Your role

| Role | Can do |
| --- | --- |
| **مدیر (Administrator)** | Everything, including users, roles, and settings. |
| **ویرایشگر (Editor)** | Create, edit, publish, and archive all content. Upload media. |
| **نویسنده (Contributor)** | Create and edit **drafts** only. Cannot publish. |

If you cannot see a "انتشار" (Publish) button, your role is Contributor — submit
your draft for review instead.

---

## 4. وضعیت محتوا / Content status

Every content item has a status:

| Status | Meaning |
| --- | --- |
| **پیش‌نویس (Draft)** | Work in progress. Not visible on the public site. |
| **منتشرشده (Published)** | Live on the public site. |
| **بایگانی‌شده (Archived)** | Hidden from the site but kept for the record. |

Only **Published** items appear on the public website.

---

## 5. انواع محتوا / Content types

### 5.1 رویدادها / Events

Fields to fill:

- **عنوان (Title)** — the event name.
- **نامک (Slug)** — URL-friendly id, e.g. `nowruz-1403`. Use Latin letters,
  digits, and hyphens only.
- **تاریخ رویداد (Event date)** — when it happened.
- **سال آرشیو (Archive year)** — the Persian year used for year navigation
  (e.g. `1403`). This drives the `/archive/[year]` pages.
- **نوع رویداد (Event type)** — e.g. جشن، کارگاه، نشست.
- **مکان (Location)** — optional.
- **خلاصه (Summary)** — one or two sentences for cards and search.
- **گزارش (Report body)** — the full write-up (rich text).
- **تصویر شاخص (Featured image)** — the card/hero image.
- **گالری (Gallery)** — additional images.
- **دسته‌ها و برچسب‌ها (Categories & tags)** — for filtering and search.
- **برجسته در صفحه اصلی (Featured on home)** — toggle to feature it.

### 5.2 پادکست / Podcast episodes

- **عنوان، نامک، شماره قسمت، فصل**
- **تاریخ انتشار (Publish date)**
- **توضیح کوتاه / توضیح بلند**
- **فایل صوتی (Audio file)** — upload the MP3/M4A. Required for playback.
- **مدت (Duration seconds)** — used for the player display.
- **متن پیاده‌شده (Transcript)** — optional but recommended for accessibility.
- **تصویر جلد (Cover image)**

### 5.3 گفت‌وگوها / Interviews

- **عنوان، نامک**
- **نام مصاحبه‌شونده (Interviewee name)**
- **سال ضبط (Recording year)**
- **رشته تحصیلی (Field of study)** — optional.
- **خلاصه (Summary)**
- **فایل ویدیو (Video file)** — upload the MP4/WebM.
- **رضایت ثبت‌شده (Consent confirmed)** — **must be on** for the interview to
  appear publicly. Never publish an interview without recorded consent.
- **متن پیاده‌شده (Transcript)** — optional.

### 5.4 نوشته‌ها و گزارش‌ها / Articles & reports

- **عنوان، نامک، نویسنده**
- **تاریخ انتشار**
- **خلاصه (Summary)**
- **متن (Body)** — rich text; you can embed images.
- **تصویر شاخص (Featured image)**
- **رسانه درون‌متنی (Inline media)**
- **رویدادهای مرتبط (Related events)** — link the report to its event(s).
- **دسته‌ها و برچسب‌ها**

### 5.5 تنظیمات سایت / Site settings

A single record controlling:

- **نام سایت، شعار، معرفی گروه**
- **متن پاورقی (Footer text)**
- **ایمیل تماس**
- **شبکه‌های اجتماعی**
- **محتوای برجسته صفحه اصلی (Featured item)** — choose a kind (event /
  article / podcast / interview) and its slug.
- **بخش‌های صفحه اصلی (Home sections)** — order and visibility of home blocks.

Changes here appear on the site without any code changes.

---

## 6. رسانه / Media

- Upload images, audio, and video **directly** in the admin — never paste
  external URLs.
- Allowed types: JPEG, PNG, WebP, AVIF, GIF, MP3, M4A, OGG, WAV, MP4, WebM, PDF.
- Maximum file size is set by the administrator (typically 512 MB).
- Give every file a **title** and, for images, an **alt text** (use the
  description field) — this helps accessibility and search.
- **Deleting media is manual and deliberate.** Unlinking a file from content
  does not delete it. Only delete from the file library after checking it is no
  longer used.

See [`docs/PHASE-4-MEDIA-PIPELINE.md`](PHASE-4-MEDIA-PIPELINE.md) for details.

---

## 7. کار روزمره / Everyday workflow

1. **Create** a new item and fill the required fields.
2. **Save as draft** and review the preview.
3. **Upload** any media and attach it.
4. **Set the slug** carefully — changing it later breaks existing links.
5. **Publish** when ready (Editors only).
6. **Archive** old items instead of deleting them.

---

## 8. نکات مهم / Important tips

- **Slugs are permanent.** Once published, avoid changing them.
- **Archive year** must be the Persian year, not the Gregorian year.
- **Consent** is mandatory for interviews.
- **Drafts are invisible** to the public — use them freely.
- **Never delete** a file that is still referenced by published content.
- If something looks wrong on the site, check the item's **status** first.

---

## 9. پرسش‌های رایج / FAQ

**The item is published but not on the site.**
Check the status is "منتشرشده", the publish date is not in the future, and (for
interviews) consent is confirmed. In the built-in panel changes appear
immediately; with Directus, caches refresh within a few minutes.

**I can't find the Publish button.**
In the built-in panel, use the **وضعیت (status)** field and choose
**منتشرشده**. In Directus, your role is Contributor — save the draft and ask an
Editor to publish.

**I uploaded a video but it won't play.**
Confirm the file is MP4 or WebM and finished uploading. Very large files may
take time. The system does not transcode video, so the file must be web-ready.

**Can I reorder home page sections?**
Yes — edit **تنظیمات سایت → بخش‌های صفحه اصلی**.
