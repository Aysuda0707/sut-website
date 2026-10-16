#!/usr/bin/env node
/**
 * Seed the Directus instance with taxonomy, site settings, and sample content.
 *
 * Prerequisites:
 *   1. The stack is running:            docker compose up -d
 *   2. The schema has been applied:     docker compose exec directus \
 *        npx directus schema apply /directus/snapshots/schema.yaml
 *
 * Run:
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_ADMIN_EMAIL=admin@example.com \
 *   DIRECTUS_ADMIN_PASSWORD=... \
 *   node cms/seed.mjs
 *
 * The script is idempotent: it upserts by slug, so re-running will not create
 * duplicates.
 */

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error(
    "Missing DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD environment variables.",
  );
  process.exit(1);
}

let token = null;

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  token = json.data.access_token;
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

/** Upsert a record by a unique field (default: slug). */
async function upsert(collection, uniqueField, record) {
  const value = record[uniqueField];
  const existing = await api(
    `/items/${collection}?filter[${uniqueField}][_eq]=${encodeURIComponent(value)}&limit=1`,
  );
  if (existing.data.length > 0) {
    const id = existing.data[0].id;
    await api(`/items/${collection}/${id}`, { method: "PATCH", body: record });
    return id;
  }
  const created = await api(`/items/${collection}`, {
    method: "POST",
    body: record,
  });
  return created.data.id;
}

const categories = [
  { slug: "ceremony", name: "آیین و مراسم", description: "مراسم‌های رسمی و آیینی گروه" },
  { slug: "workshop", name: "کارگاه و آموزش", description: "کارگاه‌ها و نشست‌های آموزشی" },
  { slug: "trip", name: "سفر و بازدید", description: "سفرهای گروهی و بازدیدهای فرهنگی" },
  { slug: "art", name: "هنر و موسیقی", description: "برنامه‌های هنری و موسیقایی" },
  { slug: "memory", name: "خاطره و روایت", description: "خاطرات و روایت‌های اعضا" },
];

const tags = [
  { slug: "nowruz", name: "نوروز" },
  { slug: "music", name: "موسیقی" },
  { slug: "poetry", name: "شعر" },
  { slug: "heritage", name: "میراث فرهنگی" },
  { slug: "students", name: "دانشجویان" },
  { slug: "sharif", name: "شریف" },
  { slug: "language", name: "زبان ترکی" },
];

const eventTypes = [
  { slug: "ceremony", name: "مراسم" },
  { slug: "workshop", name: "کارگاه" },
  { slug: "trip", name: "سفر" },
  { slug: "performance", name: "اجرا" },
];

const contributors = [
  { name: "مریم حسین‌زاده", role: "دبیر گروه" },
  { name: "علی رضایی", role: "مسئول رسانه" },
  { name: "نگار محمدی", role: "گوینده" },
  { name: "حسین علی‌اف", role: "تدوین" },
];

const siteSettings = {
  site_name: "گروه دانشجویی آذربایجان — دانشگاه صنعتی شریف",
  tagline: "آرشیو فرهنگی و رسانه‌ای",
  introduction:
    "گروه دانشجویی آذربایجان دانشگاه صنعتی شریف، بستری برای پاسداشت فرهنگ، هنر و زبان آذربایجان است. این آرشیو رویدادها، پادکست‌ها، گفت‌وگوها و گزارش‌های گروه را در یک مجموعهٔ ماندگار گرد می‌آورد.",
  footer_text: "© گروه دانشجویی آذربایجان — دانشگاه صنعتی شریف",
  contact_email: "info@example.com",
  social_links: [
    { label: "اینستاگرام", href: "https://instagram.com" },
    { label: "تلگرام", href: "https://telegram.org" },
  ],
  featured_kind: "event",
  featured_slug: "nowruz-1403",
  home_sections: [
    { id: "intro", type: "intro", title: "دربارهٔ گروه", enabled: true },
    { id: "featured", type: "featured", title: "ویژه", enabled: true },
    { id: "events", type: "events", title: "رویدادهای تازه", limit: 3, enabled: true },
    { id: "articles", type: "articles", title: "گزارش‌ها و روایت‌ها", limit: 3, enabled: true },
    { id: "podcast", type: "podcast", title: "پادکست", limit: 3, enabled: true },
    { id: "interviews", type: "interviews", title: "گفت‌وگوها", limit: 3, enabled: true },
    { id: "years", type: "years", title: "آرشیو سال‌ها", enabled: true },
    { id: "links", type: "links", title: "دسترسی سریع", enabled: true },
  ],
};

async function main() {
  console.log(`Connecting to Directus at ${BASE} ...`);
  await login();
  console.log("Authenticated.");

  console.log("Seeding taxonomy ...");
  const catIds = {};
  for (const c of categories) {
    catIds[c.slug] = await upsert("categories", "slug", { ...c, status: "published" });
  }
  const tagIds = {};
  for (const t of tags) {
    tagIds[t.slug] = await upsert("tags", "slug", t);
  }
  const typeIds = {};
  for (const e of eventTypes) {
    typeIds[e.slug] = await upsert("event_types", "slug", e);
  }
  const conIds = {};
  for (const c of contributors) {
    conIds[c.name] = await upsert("contributors", "name", c);
  }

  console.log("Seeding site settings ...");
  const existingSettings = await api("/items/site_settings?limit=1");
  if (existingSettings.data.length > 0) {
    await api(`/items/site_settings/${existingSettings.data[0].id}`, {
      method: "PATCH",
      body: siteSettings,
    });
  } else {
    await api("/items/site_settings", { method: "POST", body: siteSettings });
  }

  console.log("Seeding sample events ...");
  const events = [
    {
      slug: "nowruz-1403",
      title: "جشن نوروز ۱۴۰۳",
      event_type: typeIds.ceremony,
      event_date: "2024-03-19",
      archive_year: 1403,
      location: "دانشکدهٔ مهندسی کامپیوتر",
      summary: "جشن سالانهٔ نوروز با حضور دانشجویان و اجرای موسیقی زنده.",
      report_body: "<p>جشن نوروز ۱۴۰۳ با استقبال گستردهٔ دانشجویان برگزار شد.</p>",
      categories: [catIds.ceremony, catIds.art],
      tags: [tagIds.nowruz, tagIds.music, tagIds.sharif],
      status: "published",
      featured_on_home: true,
    },
    {
      slug: "poetry-workshop-1403",
      title: "کارگاه شعر آذربایجان",
      event_type: typeIds.workshop,
      event_date: "2024-05-10",
      archive_year: 1403,
      location: "سالن اجتماعات",
      summary: "کارگاهی برای آشنایی با شعر و ادبیات ترکی آذربایجانی.",
      categories: [catIds.workshop],
      tags: [tagIds.poetry, tagIds.language],
      status: "published",
    },
    {
      slug: "music-night-1402",
      title: "شب موسیقی آذربایجان",
      event_type: typeIds.performance,
      event_date: "2023-11-02",
      archive_year: 1402,
      location: "آمفی‌تئاتر دانشگاه",
      summary: "اجرای گروهی موسیقی مقامی آذربایجان توسط دانشجویان.",
      categories: [catIds.art],
      tags: [tagIds.music, tagIds.students],
      status: "published",
    },
  ];
  for (const e of events) {
    await upsert("events", "slug", e);
  }

  console.log("Seeding sample articles ...");
  const articles = [
    {
      slug: "report-nowruz-1403",
      title: "گزارش جشن نوروز ۱۴۰۳",
      author_display_name: "مریم حسین‌زاده",
      publish_date: "2024-03-25",
      summary: "روایتی از برگزاری جشن نوروز و برنامه‌های فرهنگی گروه.",
      body: "<p>جشن نوروز امسال با برنامه‌های متنوعی همراه بود...</p>",
      categories: [catIds.ceremony],
      tags: [tagIds.nowruz, tagIds.music],
      status: "published",
    },
    {
      slug: "essay-language-identity",
      title: "زبان، هویت و ماندگاری",
      author_display_name: "علی رضایی",
      publish_date: "2024-06-01",
      summary: "یادداشتی دربارهٔ نقش زبان مادری در هویت فرهنگی.",
      body: "<p>زبان تنها ابزار ارتباط نیست؛ حامل حافظه و هویت است...</p>",
      categories: [catIds.memory],
      tags: [tagIds.language, tagIds.heritage],
      status: "published",
    },
  ];
  for (const a of articles) {
    await upsert("articles", "slug", a);
  }

  console.log("Seeding sample podcast episodes ...");
  const episodes = [
    {
      slug: "episode-1-music-heritage",
      title: "موسیقی مقامی آذربایجان؛ از گذشته تا امروز",
      episode_number: 1,
      publish_date: "2024-04-01",
      short_description: "نگاهی به تاریخ و تحول موسیقی مقامی آذربایجان.",
      long_description: "<p>در این قسمت به سراغ موسیقی مقامی می‌رویم...</p>",
      duration_seconds: 1800,
      tags: [tagIds.music, tagIds.heritage],
      status: "published",
    },
  ];
  for (const p of episodes) {
    await upsert("podcast_episodes", "slug", p);
  }

  console.log("Seeding sample interviews ...");
  const interviews = [
    {
      slug: "interview-music-teacher",
      title: "گفت‌وگو با استاد موسیقی مقامی",
      interviewee_name: "استاد رحیم‌اف",
      recording_year: 1402,
      publish_date: "2024-02-01",
      summary: "گفت‌وگویی دربارهٔ آموزش موسیقی مقامی به نسل جوان.",
      field_of_study: "موسیقی مقامی",
      tags: [tagIds.music, tagIds.heritage],
      consent_confirmed: true,
      status: "published",
    },
  ];
  for (const i of interviews) {
    await upsert("interviews", "slug", i);
  }

  console.log("\nSeed complete.");
  console.log("Next: create the read-only token and set DIRECTUS_STATIC_TOKEN.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
