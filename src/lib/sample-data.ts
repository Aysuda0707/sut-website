/**
 * Sample content for Phase 2.
 *
 * This is realistic Persian fixture data used to build and review the public
 * frontend before the CMS exists. In Phase 5 the `src/lib/data.ts` access
 * layer switches to Directus; these fixtures remain useful for tests.
 *
 * Images use local SVG placeholders so the project runs with no external
 * dependencies. Audio/video use small public-domain sample URLs.
 */

import type {
  Article,
  Category,
  Contributor,
  EventItem,
  Interview,
  MediaAsset,
  PodcastEpisode,
  SiteSettings,
  Tag,
} from "./types";

/* --- Helpers -------------------------------------------------------------- */

function placeholderImage(
  id: string,
  label: string,
  width = 1600,
  height = 1000,
): MediaAsset {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f3ede4"/>
        <stop offset="1" stop-color="#e3dacd"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="#b08d57" stroke-width="2" stroke-dasharray="10 8"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Tahoma, sans-serif" font-size="${Math.round(width / 22)}" fill="#7a6f61">${label}</text>
  </svg>`;
  return {
    id,
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    title: label,
    alt: label,
    mediaType: "image",
    width,
    height,
  };
}

/* --- Taxonomy ------------------------------------------------------------- */

export const categories: Category[] = [
  { id: "cat-1", slug: "ceremony", name: "آیین و مراسم", description: "مراسم‌های رسمی و آیینی گروه" },
  { id: "cat-2", slug: "workshop", name: "کارگاه و آموزش", description: "کارگاه‌ها و نشست‌های آموزشی" },
  { id: "cat-3", slug: "trip", name: "سفر و بازدید", description: "سفرهای گروهی و بازدیدهای فرهنگی" },
  { id: "cat-4", slug: "art", name: "هنر و موسیقی", description: "برنامه‌های هنری و موسیقایی" },
  { id: "cat-5", slug: "memory", name: "خاطره و روایت", description: "خاطرات و روایت‌های اعضا" },
];

export const tags: Tag[] = [
  { id: "tag-1", slug: "nowruz", name: "نوروز" },
  { id: "tag-2", slug: "music", name: "موسیقی" },
  { id: "tag-3", slug: "poetry", name: "شعر" },
  { id: "tag-4", slug: "heritage", name: "میراث فرهنگی" },
  { id: "tag-5", slug: "students", name: "دانشجویان" },
  { id: "tag-6", slug: "sharif", name: "شریف" },
  { id: "tag-7", slug: "language", name: "زبان ترکی" },
];

export const contributors: Contributor[] = [
  { id: "con-1", name: "مریم حسین‌زاده", role: "دبیر گروه" },
  { id: "con-2", name: "علی رضایی", role: "مسئول رسانه" },
  { id: "con-3", name: "نگار محمدی", role: "گوینده" },
  { id: "con-4", name: "حسین علی‌اف", role: "تدوین" },
];

/* --- Events --------------------------------------------------------------- */

export const events: EventItem[] = [
  {
    id: "evt-1",
    slug: "nowruz-1403",
    title: "جشن نوروز ۱۴۰۳",
    eventType: "آیین و مراسم",
    eventDate: "2024-03-19",
    archiveYear: 1403,
    location: "دانشکده مهندسی کامپیوتر، دانشگاه صنعتی شریف",
    summary:
      "جشن سالانه نوروز گروه دانشجویی آذربایجان با حضور دانشجویان، اجرای موسیقی سنتی و آیین‌های نوروزی برگزار شد.",
    reportBody:
      "<p>جشن نوروز ۱۴۰۳ با استقبال گسترده دانشجویان برگزار شد. در این مراسم، گروه موسیقی سنتی قطعاتی از موسیقی آذربایجان اجرا کرد و آیین‌های نوروزی مانند سفره هفت‌سین و شعرخوانی انجام شد.</p><p>این برنامه فرصتی برای گردهمایی دانشجویان و آشنایی بیشتر با فرهنگ مشترک بود.</p>",
    featuredImage: placeholderImage("img-evt1", "جشن نوروز ۱۴۰۳"),
    gallery: [
      placeholderImage("img-evt1-1", "اجرای موسیقی"),
      placeholderImage("img-evt1-2", "سفره هفت‌سین"),
      placeholderImage("img-evt1-3", "حضور دانشجویان"),
    ],
    organizers: [contributors[0]],
    contributors: [contributors[1]],
    categories: [categories[0], categories[3]],
    tags: [tags[0], tags[1], tags[5]],
    status: "published",
    featuredOnHome: true,
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: "2024-03-21T09:00:00Z",
  },
  {
    id: "evt-2",
    slug: "poetry-workshop-1403",
    title: "کارگاه شعر ترکی",
    eventType: "کارگاه و آموزش",
    eventDate: "2024-05-10",
    archiveYear: 1403,
    location: "سالن اجتماعات دانشکده ادبیات",
    summary:
      "کارگاهی برای آشنایی دانشجویان با وزن و قالب شعر ترکی و بررسی نمونه‌های کلاسیک و معاصر.",
    featuredImage: placeholderImage("img-evt2", "کارگاه شعر ترکی"),
    gallery: [placeholderImage("img-evt2-1", "جلسه کارگاه")],
    organizers: [contributors[0]],
    categories: [categories[1]],
    tags: [tags[2], tags[6]],
    status: "published",
    createdAt: "2024-05-11T08:00:00Z",
    updatedAt: "2024-05-11T08:00:00Z",
  },
  {
    id: "evt-3",
    slug: "tabriz-trip-1402",
    title: "بازدید فرهنگی از تبریز",
    eventType: "سفر و بازدید",
    eventDate: "2023-09-05",
    archiveYear: 1402,
    location: "تبریز، بازار تاریخی و موزه‌ها",
    summary:
      "سفر دو روزه دانشجویان به تبریز با بازدید از بازار تاریخی، موزه آذربایجان و خانه‌های تاریخی.",
    featuredImage: placeholderImage("img-evt3", "بازدید از تبریز"),
    gallery: [
      placeholderImage("img-evt3-1", "بازار تبریز"),
      placeholderImage("img-evt3-2", "موزه آذربایجان"),
    ],
    contributors: [contributors[1]],
    categories: [categories[2]],
    tags: [tags[3], tags[5]],
    status: "published",
    createdAt: "2023-09-06T12:00:00Z",
    updatedAt: "2023-09-06T12:00:00Z",
  },
  {
    id: "evt-4",
    slug: "music-night-1402",
    title: "شب موسیقی آذربایجان",
    eventType: "هنر و موسیقی",
    eventDate: "2023-12-01",
    archiveYear: 1402,
    location: "تالار فرهنگ",
    summary:
      "شب موسیقی با اجرای قطعاتی از موسیقی مقامی آذربایجان توسط دانشجویان و مهمانان.",
    featuredImage: placeholderImage("img-evt4", "شب موسیقی"),
    gallery: [placeholderImage("img-evt4-1", "اجرای زنده")],
    categories: [categories[3]],
    tags: [tags[1], tags[4]],
    status: "published",
    createdAt: "2023-12-02T09:00:00Z",
    updatedAt: "2023-12-02T09:00:00Z",
  },
  {
    id: "evt-5",
    slug: "welcome-freshmen-1401",
    title: "مراسم خوش‌آمدگویی دانشجویان نوورود",
    eventType: "آیین و مراسم",
    eventDate: "2022-10-15",
    archiveYear: 1401,
    location: "دانشگاه صنعتی شریف",
    summary:
      "مراسم آشنایی دانشجویان نوورود با گروه دانشجویی آذربایجان و برنامه‌های پیش‌رو.",
    featuredImage: placeholderImage("img-evt5", "خوش‌آمدگویی نوورودها"),
    gallery: [placeholderImage("img-evt5-1", "معرفی گروه")],
    categories: [categories[0]],
    tags: [tags[5]],
    status: "published",
    createdAt: "2022-10-16T10:00:00Z",
    updatedAt: "2022-10-16T10:00:00Z",
  },
  {
    id: "evt-6",
    slug: "heritage-exhibition-1401",
    title: "نمایشگاه میراث فرهنگی آذربایجان",
    eventType: "هنر و موسیقی",
    eventDate: "2022-12-20",
    archiveYear: 1401,
    location: "نگارخانه دانشگاه",
    summary:
      "نمایشگاهی از صنایع دستی، فرش و آثار هنری مرتبط با میراث فرهنگی آذربایجان.",
    featuredImage: placeholderImage("img-evt6", "نمایشگاه میراث فرهنگی"),
    gallery: [placeholderImage("img-evt6-1", "صنایع دستی")],
    categories: [categories[3]],
    tags: [tags[3], tags[4]],
    status: "published",
    createdAt: "2022-12-21T10:00:00Z",
    updatedAt: "2022-12-21T10:00:00Z",
  },
];

/* --- Articles ------------------------------------------------------------- */

export const articles: Article[] = [
  {
    id: "art-1",
    slug: "report-nowruz-1403",
    title: "گزارش جشن نوروز ۱۴۰۳",
    authorDisplayName: "علی رضایی",
    publishDate: "2024-03-25",
    summary:
      "روایتی از برگزاری جشن نوروز ۱۴۰۳، اجرای موسیقی سنتی و آیین‌های نوروزی در دانشگاه صنعتی شریف.",
    body:
      "<p>جشن نوروز ۱۴۰۳ در فضایی صمیمی و پرشور برگزار شد. دانشجویان از رشته‌های مختلف گرد هم آمدند تا آغاز سال نو را جشن بگیرند.</p><h2>اجرای موسیقی</h2><p>گروه موسیقی سنتی قطعاتی از موسیقی آذربایجان را اجرا کرد که با تشویق حاضران همراه شد.</p><h2>آیین‌های نوروزی</h2><p>سفره هفت‌سین، شعرخوانی و بازی‌های سنتی از بخش‌های دیگر این برنامه بود.</p>",
    featuredImage: placeholderImage("img-art1", "گزارش جشن نوروز"),
    inlineMedia: [placeholderImage("img-art1-1", "اجرای موسیقی در جشن")],
    relatedEventSlugs: ["nowruz-1403"],
    categories: [categories[0]],
    tags: [tags[0], tags[1]],
    status: "published",
    createdAt: "2024-03-25T10:00:00Z",
    updatedAt: "2024-03-25T10:00:00Z",
  },
  {
    id: "art-2",
    slug: "memory-first-year",
    title: "خاطره‌ای از نخستین سال دانشجویی",
    authorDisplayName: "مریم حسین‌زاده",
    publishDate: "2023-11-02",
    summary:
      "روایت شخصی از تجربه نخستین سال دانشجویی و پیوستن به گروه دانشجویی آذربایجان.",
    body:
      "<p>وقتی برای نخستین بار وارد دانشگاه شدم، نمی‌دانستم چه جمعی منتظر من است. گروه دانشجویی آذربایجان نخستین جایی بود که احساس تعلق کردم.</p><p>این متن روایتی کوتاه از آن روزهاست.</p>",
    featuredImage: placeholderImage("img-art2", "خاطره نخستین سال"),
    relatedEventSlugs: ["welcome-freshmen-1401"],
    categories: [categories[4]],
    tags: [tags[5]],
    status: "published",
    createdAt: "2023-11-02T10:00:00Z",
    updatedAt: "2023-11-02T10:00:00Z",
  },
  {
    id: "art-3",
    slug: "essay-language-identity",
    title: "زبان، هویت و نسل دانشجو",
    authorDisplayName: "نگار محمدی",
    publishDate: "2024-01-15",
    summary:
      "جستاری درباره نقش زبان ترکی در شکل‌گیری هویت فرهنگی دانشجویان آذربایجانی.",
    body:
      "<p>زبان تنها ابزار ارتباط نیست؛ حامل حافظه و هویت است. در این جستار به نقش زبان ترکی در تجربه دانشجویی می‌پردازیم.</p><h2>حافظه جمعی</h2><p>شعر، موسیقی و ضرب‌المثل‌ها زبان را به حافظه جمعی پیوند می‌دهند.</p>",
    featuredImage: placeholderImage("img-art3", "زبان و هویت"),
    categories: [categories[4]],
    tags: [tags[6], tags[2]],
    status: "published",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "art-4",
    slug: "report-tabriz-trip",
    title: "گزارش سفر فرهنگی به تبریز",
    authorDisplayName: "علی رضایی",
    publishDate: "2023-09-12",
    summary:
      "گزارشی از سفر دو روزه دانشجویان به تبریز و بازدید از بازار تاریخی و موزه‌ها.",
    body:
      "<p>سفر به تبریز فرصتی بود تا دانشجویان از نزدیک با میراث فرهنگی آذربایجان آشنا شوند.</p><p>بازار تاریخی تبریز، ثبت‌شده در فهرست میراث جهانی، نخستین مقصد ما بود.</p>",
    featuredImage: placeholderImage("img-art4", "گزارش سفر تبریز"),
    relatedEventSlugs: ["tabriz-trip-1402"],
    categories: [categories[2]],
    tags: [tags[3]],
    status: "published",
    createdAt: "2023-09-12T10:00:00Z",
    updatedAt: "2023-09-12T10:00:00Z",
  },
];

/* --- Podcast episodes ----------------------------------------------------- */

export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: "pod-1",
    slug: "episode-1-music-heritage",
    title: "موسیقی مقامی آذربایجان؛ از گذشته تا امروز",
    episodeNumber: 1,
    season: 1,
    publishDate: "2024-02-01",
    shortDescription:
      "گفت‌وگو درباره ریشه‌های موسیقی مقامی آذربایجان و جایگاه آن در میان نسل دانشجو.",
    longDescription:
      "<p>در نخستین قسمت پادکست، به سراغ موسیقی مقامی آذربایجان می‌رویم و درباره سازها، مقام‌ها و نقش آن در هویت فرهنگی گفت‌وگو می‌کنیم.</p>",
    coverImage: placeholderImage("img-pod1", "پادکست قسمت اول", 1200, 1200),
    audioFile: {
      id: "aud-pod1",
      url: "https://download.samplelib.com/mp3/sample-15s.mp3",
      title: "قسمت اول پادکست",
      alt: "فایل صوتی قسمت اول پادکست",
      mediaType: "audio",
      durationSeconds: 15,
    },
    transcript:
      "<p>متن کامل این قسمت به‌زودی در دسترس قرار می‌گیرد.</p>",
    durationSeconds: 15,
    contributors: [contributors[2]],
    tags: [tags[1], tags[4]],
    status: "published",
  },
  {
    id: "pod-2",
    slug: "episode-2-poetry",
    title: "شعر ترکی و نسل امروز",
    episodeNumber: 2,
    season: 1,
    publishDate: "2024-04-10",
    shortDescription:
      "بررسی جایگاه شعر ترکی در میان دانشجویان و شاعران معاصر.",
    longDescription:
      "<p>در این قسمت با یک شاعر جوان گفت‌وگو می‌کنیم و درباره چالش‌ها و فرصت‌های شعر ترکی در دوران معاصر می‌شنویم.</p>",
    coverImage: placeholderImage("img-pod2", "پادکست قسمت دوم", 1200, 1200),
    audioFile: {
      id: "aud-pod2",
      url: "https://download.samplelib.com/mp3/sample-12s.mp3",
      title: "قسمت دوم پادکست",
      alt: "فایل صوتی قسمت دوم پادکست",
      mediaType: "audio",
      durationSeconds: 12,
    },
    durationSeconds: 12,
    contributors: [contributors[2], contributors[3]],
    tags: [tags[2], tags[6]],
    status: "published",
  },
  {
    id: "pod-3",
    slug: "episode-3-nowruz",
    title: "نوروز در آذربایجان",
    episodeNumber: 3,
    season: 1,
    publishDate: "2024-03-15",
    shortDescription:
      "آیین‌های نوروزی در آذربایجان و شباهت‌ها و تفاوت‌های آن با سایر مناطق.",
    longDescription:
      "<p>نوروز در آذربایجان با آیین‌های ویژه‌ای همراه است. در این قسمت به بررسی این آیین‌ها می‌پردازیم.</p>",
    coverImage: placeholderImage("img-pod3", "پادکست قسمت سوم", 1200, 1200),
    audioFile: {
      id: "aud-pod3",
      url: "https://download.samplelib.com/mp3/sample-9s.mp3",
      title: "قسمت سوم پادکست",
      alt: "فایل صوتی قسمت سوم پادکست",
      mediaType: "audio",
      durationSeconds: 9,
    },
    durationSeconds: 9,
    contributors: [contributors[2]],
    tags: [tags[0], tags[4]],
    status: "published",
  },
];

/* --- Interviews ----------------------------------------------------------- */

export const interviews: Interview[] = [
  {
    id: "int-1",
    slug: "interview-music-teacher",
    title: "گفت‌وگو با استاد موسیقی مقامی",
    intervieweeName: "استاد رحیم قلی‌اف",
    recordingYear: 1403,
    publishDate: "2024-06-01",
    featuredImage: placeholderImage("img-int1", "گفت‌وگو با استاد موسیقی"),
    videoFile: {
      id: "vid-int1",
      url: "https://download.samplelib.com/mp4/sample-5s.mp4",
      thumbnailUrl: placeholderImage("img-int1-thumb", "استاد موسیقی", 800, 450).url,
      title: "گفت‌وگو با استاد موسیقی مقامی",
      alt: "ویدیوی گفت‌وگو با استاد موسیقی مقامی",
      mediaType: "video",
      durationSeconds: 5,
    },
    summary:
      "گفت‌وگویی درباره سال‌ها آموزش موسیقی مقامی و انتقال آن به نسل جوان.",
    transcript:
      "<p>متن کامل این گفت‌وگو به‌زودی منتشر می‌شود.</p>",
    fieldOfStudy: "موسیقی مقامی",
    tags: [tags[1], tags[4]],
    consentConfirmed: true,
    status: "published",
  },
  {
    id: "int-2",
    slug: "interview-alumni-engineer",
    title: "گفت‌وگو با دانش‌آموخته مهندسی",
    intervieweeName: "دکتر لیلا احمدی",
    recordingYear: 1402,
    publishDate: "2023-10-20",
    featuredImage: placeholderImage("img-int2", "گفت‌وگو با دانش‌آموخته"),
    videoFile: {
      id: "vid-int2",
      url: "https://download.samplelib.com/mp4/sample-5s.mp4",
      thumbnailUrl: placeholderImage("img-int2-thumb", "دانش‌آموخته مهندسی", 800, 450).url,
      title: "گفت‌وگو با دانش‌آموخته مهندسی",
      alt: "ویدیوی گفت‌وگو با دانش‌آموخته مهندسی",
      mediaType: "video",
      durationSeconds: 5,
    },
    summary:
      "روایت مسیر تحصیلی و حرفه‌ای یک دانش‌آموخته و نقش گروه دانشجویی در آن.",
    fieldOfStudy: "مهندسی کامپیوتر",
    tags: [tags[5]],
    consentConfirmed: true,
    status: "published",
  },
  {
    id: "int-3",
    slug: "interview-poet",
    title: "گفت‌وگو با شاعر جوان",
    intervieweeName: "سارا ولی‌زاده",
    recordingYear: 1403,
    publishDate: "2024-05-05",
    featuredImage: placeholderImage("img-int3", "گفت‌وگو با شاعر"),
    videoFile: {
      id: "vid-int3",
      url: "https://download.samplelib.com/mp4/sample-5s.mp4",
      thumbnailUrl: placeholderImage("img-int3-thumb", "شاعر جوان", 800, 450).url,
      title: "گفت‌وگو با شاعر جوان",
      alt: "ویدیوی گفت‌وگو با شاعر جوان",
      mediaType: "video",
      durationSeconds: 5,
    },
    summary: "گفت‌وگویی درباره شعر معاصر ترکی و تجربه انتشار نخستین مجموعه.",
    fieldOfStudy: "ادبیات",
    tags: [tags[2], tags[6]],
    consentConfirmed: true,
    status: "published",
  },
];

/* --- Site settings -------------------------------------------------------- */

export const siteSettings: SiteSettings = {
  siteName: "گروه دانشجویی آذربایجان",
  tagline: "دانشگاه صنعتی شریف",
  introduction:
    "گروه دانشجویی آذربایجان دانشگاه صنعتی شریف، بستری برای پاسداشت فرهنگ، زبان و هنر آذربایجان و گردهمایی دانشجویان علاقه‌مند است. این آرشیو، روایت فعالیت‌های فرهنگی گروه در طول سال‌هاست.",
  footerText:
    "© گروه دانشجویی آذربایجان — دانشگاه صنعتی شریف. تمامی حقوق محفوظ است.",
  contactEmail: "info@example.com",
  socialLinks: [
    { label: "اینستاگرام", href: "https://instagram.com" },
    { label: "تلگرام", href: "https://telegram.org" },
  ],
  featured: { kind: "event", slug: "nowruz-1403" },
  homeSections: [
    { id: "s-intro", type: "intro", title: "درباره گروه", enabled: true },
    { id: "s-featured", type: "featured", title: "ویژه", enabled: true },
    { id: "s-events", type: "events", title: "رویدادهای تازه", limit: 3, enabled: true },
    { id: "s-articles", type: "articles", title: "گزارش‌ها و نوشته‌ها", limit: 3, enabled: true },
    { id: "s-podcast", type: "podcast", title: "قسمت‌های برگزیده پادکست", limit: 3, enabled: true },
    { id: "s-interviews", type: "interviews", title: "گفت‌وگوهای برگزیده", limit: 3, enabled: true },
    { id: "s-years", type: "years", title: "آرشیو بر اساس سال", enabled: true },
    { id: "s-links", type: "links", title: "دسترسی سریع", enabled: true },
  ],
};
