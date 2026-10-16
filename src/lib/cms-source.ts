/**
 * CMS-backed data source (Phase 5).
 *
 * Implements the same function surface as the fixture source in `data.ts`,
 * but reads from Directus. Only PUBLISHED content is requested; the read-only
 * token's policy enforces this server-side as well.
 *
 * All queries request exactly the fields they need, including expanded
 * relations, to avoid over-fetching.
 */

import { readItems } from "@directus/sdk";
import { getCmsClient } from "./directus";
import {
  toArticle,
  toEvent,
  toInterview,
  toPodcast,
  toSiteSettings,
  type RawArticle,
  type RawEvent,
  type RawInterview,
  type RawPodcast,
  type RawSiteSettings,
} from "./cms-mappers";
import type {
  Article,
  Category,
  EventItem,
  Interview,
  PodcastEpisode,
  SiteSettings,
  Tag,
} from "./types";
import type { GalleryItem, SearchResult } from "./data-types";

/* --- Field selections ----------------------------------------------------- */

const FILE_FIELDS = ["id", "title", "description", "filename_download", "type", "width", "height", "duration"];
const TAXONOMY_FIELDS = ["id", "slug", "name", "description"];
const CONTRIBUTOR_FIELDS = ["id", "name", "role"];

const EVENT_FIELDS = [
  "id", "status", "slug", "title", "event_date", "archive_year", "location",
  "summary", "report_body", "featured_on_home", "seo_title", "seo_description",
  "date_created", "date_updated",
  { event_type: TAXONOMY_FIELDS },
  { featured_image: FILE_FIELDS },
  { gallery: FILE_FIELDS },
  { organizers: CONTRIBUTOR_FIELDS },
  { contributors: CONTRIBUTOR_FIELDS },
  { categories: TAXONOMY_FIELDS },
  { tags: TAXONOMY_FIELDS },
  { seo_og_image: FILE_FIELDS },
];

const ARTICLE_FIELDS = [
  "id", "status", "slug", "title", "author_display_name", "publish_date",
  "summary", "body", "seo_title", "seo_description", "date_created", "date_updated",
  { featured_image: FILE_FIELDS },
  { inline_media: FILE_FIELDS },
  { related_events: [{ events_id: ["slug"] }] },
  { related_interviews: [{ interviews_id: ["slug"] }] },
  { related_podcasts: [{ podcast_episodes_id: ["slug"] }] },
  { categories: TAXONOMY_FIELDS },
  { tags: TAXONOMY_FIELDS },
  { seo_og_image: FILE_FIELDS },
];

const PODCAST_FIELDS = [
  "id", "status", "slug", "title", "episode_number", "season", "publish_date",
  "short_description", "long_description", "transcript", "duration_seconds",
  "seo_title", "seo_description",
  { cover_image: FILE_FIELDS },
  { audio_file: FILE_FIELDS },
  { contributors: CONTRIBUTOR_FIELDS },
  { tags: TAXONOMY_FIELDS },
  { seo_og_image: FILE_FIELDS },
];

const INTERVIEW_FIELDS = [
  "id", "status", "slug", "title", "interviewee_name", "recording_year",
  "publish_date", "summary", "transcript", "field_of_study", "consent_confirmed",
  "seo_title", "seo_description",
  { featured_image: FILE_FIELDS },
  { video_file: FILE_FIELDS },
  { tags: TAXONOMY_FIELDS },
  { seo_og_image: FILE_FIELDS },
];

/* --- Query helpers -------------------------------------------------------- */

async function fetchEvents(filter: Record<string, unknown> = {}): Promise<EventItem[]> {
  const client = getCmsClient();
  if (!client) return [];
  const rows = (await client.request(
    readItems("events" as never, {
      fields: EVENT_FIELDS as never,
      filter: { status: { _eq: "published" }, ...filter } as never,
      sort: ["-event_date"] as never,
      limit: -1,
    } as never),
  )) as unknown as RawEvent[];
  return rows.map(toEvent);
}

async function fetchArticles(filter: Record<string, unknown> = {}): Promise<Article[]> {
  const client = getCmsClient();
  if (!client) return [];
  const rows = (await client.request(
    readItems("articles" as never, {
      fields: ARTICLE_FIELDS as never,
      filter: { status: { _eq: "published" }, ...filter } as never,
      sort: ["-publish_date"] as never,
      limit: -1,
    } as never),
  )) as unknown as RawArticle[];
  return rows.map(toArticle);
}

async function fetchPodcasts(filter: Record<string, unknown> = {}): Promise<PodcastEpisode[]> {
  const client = getCmsClient();
  if (!client) return [];
  const rows = (await client.request(
    readItems("podcast_episodes" as never, {
      fields: PODCAST_FIELDS as never,
      filter: { status: { _eq: "published" }, ...filter } as never,
      sort: ["-publish_date"] as never,
      limit: -1,
    } as never),
  )) as unknown as RawPodcast[];
  return rows.map(toPodcast);
}

async function fetchInterviews(filter: Record<string, unknown> = {}): Promise<Interview[]> {
  const client = getCmsClient();
  if (!client) return [];
  const rows = (await client.request(
    readItems("interviews" as never, {
      fields: INTERVIEW_FIELDS as never,
      filter: {
        status: { _eq: "published" },
        // Consent is enforced at the API layer too, but we double-guard here.
        consent_confirmed: { _eq: true },
        ...filter,
      } as never,
      sort: ["-recording_year"] as never,
      limit: -1,
    } as never),
  )) as unknown as RawInterview[];
  return rows.map(toInterview);
}

/* --- Public API (mirrors data.ts) ----------------------------------------- */

export const cmsSource = {
  async getSiteSettings(): Promise<SiteSettings | null> {
    const client = getCmsClient();
    if (!client) return null;
    const rows = (await client.request(
      readItems("site_settings" as never, { limit: 1 } as never),
    )) as unknown as RawSiteSettings[];
    return rows.length ? toSiteSettings(rows[0]) : null;
  },

  getEvents: () => fetchEvents(),
  getEventBySlug: async (slug: string) =>
    (await fetchEvents({ slug: { _eq: slug } }))[0] ?? null,
  getEventsByYear: (year: number) => fetchEvents({ archive_year: { _eq: year } }),
  getEventsByCategory: (slug: string) =>
    fetchEvents({ categories: { categories_id: { slug: { _eq: slug } } } }),
  getEventsByTag: (slug: string) =>
    fetchEvents({ tags: { tags_id: { slug: { _eq: slug } } } }),

  async getArchiveYears(): Promise<number[]> {
    const events = await fetchEvents();
    return [...new Set(events.map((e) => e.archiveYear))].sort((a, b) => b - a);
  },

  getArticles: () => fetchArticles(),
  getArticleBySlug: async (slug: string) =>
    (await fetchArticles({ slug: { _eq: slug } }))[0] ?? null,
  getArticlesForEvent: (eventSlug: string) =>
    fetchArticles({ related_events: { events_id: { slug: { _eq: eventSlug } } } }),

  getPodcastEpisodes: () => fetchPodcasts(),
  getPodcastEpisodeBySlug: async (slug: string) =>
    (await fetchPodcasts({ slug: { _eq: slug } }))[0] ?? null,

  getInterviews: () => fetchInterviews(),
  getInterviewBySlug: async (slug: string) =>
    (await fetchInterviews({ slug: { _eq: slug } }))[0] ?? null,

  async getCategories(): Promise<Category[]> {
    const client = getCmsClient();
    if (!client) return [];
    const rows = (await client.request(
      readItems("categories" as never, {
        fields: TAXONOMY_FIELDS as never,
        filter: { status: { _eq: "published" } } as never,
        sort: ["name"] as never,
        limit: -1,
      } as never),
    )) as unknown as { id: string; slug: string; name: string; description?: string | null }[];
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description ?? undefined,
    }));
  },

  async getTags(): Promise<Tag[]> {
    const client = getCmsClient();
    if (!client) return [];
    const rows = (await client.request(
      readItems("tags" as never, {
        fields: ["id", "slug", "name"] as never,
        sort: ["name"] as never,
        limit: -1,
      } as never),
    )) as unknown as { id: string; slug: string; name: string }[];
    return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name }));
  },

  async search(query: string): Promise<SearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    const [events, articles, podcasts, interviews] = await Promise.all([
      fetchEvents({ _or: [{ title: { _icontains: q } }, { summary: { _icontains: q } }] }),
      fetchArticles({ _or: [{ title: { _icontains: q } }, { summary: { _icontains: q } }, { body: { _icontains: q } }] }),
      fetchPodcasts({ _or: [{ title: { _icontains: q } }, { short_description: { _icontains: q } }] }),
      fetchInterviews({ _or: [{ title: { _icontains: q } }, { summary: { _icontains: q } }, { interviewee_name: { _icontains: q } }] }),
    ]);

    const results: SearchResult[] = [
      ...events.map((e) => ({
        type: "event" as const,
        slug: e.slug,
        title: e.title,
        summary: e.summary,
        date: e.eventDate,
        year: e.archiveYear,
        href: `/events/${e.slug}`,
      })),
      ...articles.map((a) => ({
        type: "article" as const,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        date: a.publishDate,
        href: `/stories/${a.slug}`,
      })),
      ...podcasts.map((p) => ({
        type: "podcast" as const,
        slug: p.slug,
        title: p.title,
        summary: p.shortDescription,
        date: p.publishDate,
        href: `/podcast/${p.slug}`,
      })),
      ...interviews.map((i) => ({
        type: "interview" as const,
        slug: i.slug,
        title: i.title,
        summary: i.summary,
        date: i.publishDate ?? "",
        year: i.recordingYear,
        href: `/interviews/${i.slug}`,
      })),
    ];

    return results.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },

  async getGalleryItems(): Promise<GalleryItem[]> {
    const [events, articles] = await Promise.all([fetchEvents(), fetchArticles()]);
    const items: GalleryItem[] = [];
    for (const e of events) {
      for (const asset of e.gallery) {
        items.push({ asset, sourceTitle: e.title, sourceHref: `/events/${e.slug}` });
      }
    }
    for (const a of articles) {
      for (const asset of a.inlineMedia ?? []) {
        items.push({ asset, sourceTitle: a.title, sourceHref: `/stories/${a.slug}` });
      }
    }
    return items;
  },
};
