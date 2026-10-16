/**
 * Data access layer.
 *
 * Three-source design, resolved in priority order:
 *   1. Directus CMS — when `DIRECTUS_URL` + `DIRECTUS_STATIC_TOKEN` are set.
 *   2. Local store  — when the built-in admin panel has written `data/content.json`.
 *   3. Fixtures     — the in-repo sample data, so the site is never empty.
 *
 * Pages import only from this module, so switching sources requires no page
 * changes. All functions are async to match the network-backed implementation.
 */

import { isCmsConfigured } from "./directus";
import { cmsSource } from "./cms-source";
import { localSource } from "./local-source";
import { storeExists } from "./store";
import {
  articles,
  categories,
  events,
  interviews,
  podcastEpisodes,
  siteSettings,
  tags,
} from "./sample-data";
import type {
  Article,
  Category,
  EventItem,
  Interview,
  PodcastEpisode,
  SiteSettings,
  Tag,
} from "./types";
import type { GalleryItem, SearchResult, SearchResultType } from "./data-types";

// Re-export shared types so existing `import { SearchResult } from "./data"`
// call sites (and page components) continue to work unchanged.
export type { GalleryItem, SearchResult, SearchResultType };

const PUBLISHED = <T extends { status: string }>(items: T[]): T[] =>
  items.filter((i) => i.status === "published");

/**
 * True when the built-in admin panel has saved content to the local store.
 * Checked once per request; the store module caches the parsed database.
 */
async function useLocalStore(): Promise<boolean> {
  if (isCmsConfigured()) return false;
  return storeExists();
}

/**
 * Run a CMS query, falling back to `fallback` when the CMS is unreachable.
 *
 * The site must never hard-fail because Directus is down or misconfigured: a
 * connection error should degrade gracefully to the local store or fixtures.
 */
async function fromCms<T>(
  query: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.warn(
      "[data] CMS request failed; falling back to local content:",
      error instanceof Error ? error.message : error,
    );
    return fallback();
  }
}

/* --- Site settings -------------------------------------------------------- */

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isCmsConfigured()) {
    return fromCms(
      async () => (await cmsSource.getSiteSettings()) ?? siteSettings,
      async () =>
        (await useLocalStore()) ? localSource.getSiteSettings() : siteSettings,
    );
  }
  if (await useLocalStore()) return localSource.getSiteSettings();
  return siteSettings;
}

/* --- Events --------------------------------------------------------------- */

export async function getEvents(): Promise<EventItem[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getEvents(),
      async () =>
        (await useLocalStore())
          ? localSource.getEvents()
          : PUBLISHED(events).sort(
              (a, b) =>
                new Date(b.eventDate).getTime() -
                new Date(a.eventDate).getTime(),
            ),
    );
  }
  if (await useLocalStore()) return localSource.getEvents();
  return PUBLISHED(events).sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getEventBySlug(slug),
      async () =>
        (await useLocalStore())
          ? localSource.getEventBySlug(slug)
          : (PUBLISHED(events).find((e) => e.slug === slug) ?? null),
    );
  }
  if (await useLocalStore()) return localSource.getEventBySlug(slug);
  return PUBLISHED(events).find((e) => e.slug === slug) ?? null;
}

export async function getFeaturedEvent(): Promise<EventItem | null> {
  if (isCmsConfigured()) {
    return fromCms(
      async () => {
        const settings = await cmsSource.getSiteSettings();
        const featured = settings?.featured;
        if (featured?.kind === "event") {
          return cmsSource.getEventBySlug(featured.slug);
        }
        const all = await cmsSource.getEvents();
        return all.find((e) => e.featuredOnHome) ?? null;
      },
      async () =>
        (await useLocalStore())
          ? localSource.getFeaturedEvent()
          : (PUBLISHED(events).find((e) => e.featuredOnHome) ?? null),
    );
  }
  if (await useLocalStore()) return localSource.getFeaturedEvent();
  const featured = siteSettings.featured;
  if (featured?.kind === "event") {
    return getEventBySlug(featured.slug);
  }
  return PUBLISHED(events).find((e) => e.featuredOnHome) ?? null;
}

/** Distinct archive years, newest first. */
export async function getArchiveYears(): Promise<number[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getArchiveYears(),
      async () => {
        if (await useLocalStore()) return localSource.getArchiveYears();
        const years = new Set(PUBLISHED(events).map((e) => e.archiveYear));
        return [...years].sort((a, b) => b - a);
      },
    );
  }
  if (await useLocalStore()) return localSource.getArchiveYears();
  const years = new Set(PUBLISHED(events).map((e) => e.archiveYear));
  return [...years].sort((a, b) => b - a);
}

export async function getEventsByYear(year: number): Promise<EventItem[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getEventsByYear(year),
      async () =>
        (await useLocalStore())
          ? localSource.getEventsByYear(year)
          : (await getEvents()).filter((e) => e.archiveYear === year),
    );
  }
  if (await useLocalStore()) return localSource.getEventsByYear(year);
  return (await getEvents()).filter((e) => e.archiveYear === year);
}

export async function getEventsByCategory(slug: string): Promise<EventItem[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getEventsByCategory(slug),
      async () =>
        (await useLocalStore())
          ? localSource.getEventsByCategory(slug)
          : (await getEvents()).filter((e) =>
              e.categories.some((c) => c.slug === slug),
            ),
    );
  }
  if (await useLocalStore()) return localSource.getEventsByCategory(slug);
  return (await getEvents()).filter((e) =>
    e.categories.some((c) => c.slug === slug),
  );
}

export async function getEventsByTag(slug: string): Promise<EventItem[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getEventsByTag(slug),
      async () =>
        (await useLocalStore())
          ? localSource.getEventsByTag(slug)
          : (await getEvents()).filter((e) =>
              e.tags.some((t) => t.slug === slug),
            ),
    );
  }
  if (await useLocalStore()) return localSource.getEventsByTag(slug);
  return (await getEvents()).filter((e) => e.tags.some((t) => t.slug === slug));
}

/* --- Articles ------------------------------------------------------------- */

export async function getArticles(): Promise<Article[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getArticles(),
      async () =>
        (await useLocalStore())
          ? localSource.getArticles()
          : PUBLISHED(articles).sort(
              (a, b) =>
                new Date(b.publishDate).getTime() -
                new Date(a.publishDate).getTime(),
            ),
    );
  }
  if (await useLocalStore()) return localSource.getArticles();
  return PUBLISHED(articles).sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getArticleBySlug(slug),
      async () =>
        (await useLocalStore())
          ? localSource.getArticleBySlug(slug)
          : (PUBLISHED(articles).find((a) => a.slug === slug) ?? null),
    );
  }
  if (await useLocalStore()) return localSource.getArticleBySlug(slug);
  return PUBLISHED(articles).find((a) => a.slug === slug) ?? null;
}

export async function getArticlesForEvent(eventSlug: string): Promise<Article[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getArticlesForEvent(eventSlug),
      async () =>
        (await useLocalStore())
          ? localSource.getArticlesForEvent(eventSlug)
          : (await getArticles()).filter((a) =>
              a.relatedEventSlugs?.includes(eventSlug),
            ),
    );
  }
  if (await useLocalStore()) return localSource.getArticlesForEvent(eventSlug);
  return (await getArticles()).filter((a) =>
    a.relatedEventSlugs?.includes(eventSlug),
  );
}

/* --- Podcast -------------------------------------------------------------- */

export async function getPodcastEpisodes(): Promise<PodcastEpisode[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getPodcastEpisodes(),
      async () =>
        (await useLocalStore())
          ? localSource.getPodcastEpisodes()
          : PUBLISHED(podcastEpisodes).sort(
              (a, b) =>
                new Date(b.publishDate).getTime() -
                new Date(a.publishDate).getTime(),
            ),
    );
  }
  if (await useLocalStore()) return localSource.getPodcastEpisodes();
  return PUBLISHED(podcastEpisodes).sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
}

export async function getPodcastEpisodeBySlug(
  slug: string,
): Promise<PodcastEpisode | null> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getPodcastEpisodeBySlug(slug),
      async () =>
        (await useLocalStore())
          ? localSource.getPodcastEpisodeBySlug(slug)
          : (PUBLISHED(podcastEpisodes).find((p) => p.slug === slug) ?? null),
    );
  }
  if (await useLocalStore()) return localSource.getPodcastEpisodeBySlug(slug);
  return PUBLISHED(podcastEpisodes).find((p) => p.slug === slug) ?? null;
}

/* --- Interviews ----------------------------------------------------------- */

export async function getInterviews(): Promise<Interview[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getInterviews(),
      async () =>
        (await useLocalStore())
          ? localSource.getInterviews()
          : PUBLISHED(interviews).sort(
              (a, b) =>
                new Date(b.publishDate ?? "1970-01-01").getTime() -
                new Date(a.publishDate ?? "1970-01-01").getTime(),
            ),
    );
  }
  if (await useLocalStore()) return localSource.getInterviews();
  return PUBLISHED(interviews).sort(
    (a, b) =>
      new Date(b.publishDate ?? "1970-01-01").getTime() -
      new Date(a.publishDate ?? "1970-01-01").getTime(),
  );
}

export async function getInterviewBySlug(slug: string): Promise<Interview | null> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getInterviewBySlug(slug),
      async () =>
        (await useLocalStore())
          ? localSource.getInterviewBySlug(slug)
          : (PUBLISHED(interviews).find((i) => i.slug === slug) ?? null),
    );
  }
  if (await useLocalStore()) return localSource.getInterviewBySlug(slug);
  return PUBLISHED(interviews).find((i) => i.slug === slug) ?? null;
}

/* --- Taxonomy ------------------------------------------------------------- */

export async function getCategories(): Promise<Category[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getCategories(),
      async () =>
        (await useLocalStore()) ? localSource.getCategories() : categories,
    );
  }
  if (await useLocalStore()) return localSource.getCategories();
  return categories;
}

export async function getTags(): Promise<Tag[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getTags(),
      async () => ((await useLocalStore()) ? localSource.getTags() : tags),
    );
  }
  if (await useLocalStore()) return localSource.getTags();
  return tags;
}

/* --- Search --------------------------------------------------------------- */

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

/** Flattens taxonomy (tags + categories) into searchable text. */
function taxonomyText(
  items: { slug: string; name: string }[] | undefined,
): string {
  return (items ?? []).map((i) => `${i.name} ${i.slug}`).join(" ");
}

export async function search(query: string): Promise<SearchResult[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.search(query),
      async () =>
        (await useLocalStore())
          ? localSource.search(query)
          : searchFixtures(query),
    );
  }
  if (await useLocalStore()) return localSource.search(query);
  return searchFixtures(query);
}

function searchFixtures(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  for (const e of PUBLISHED(events)) {
    if (
      matches(
        query,
        e.title,
        e.summary,
        e.reportBody,
        e.location,
        taxonomyText(e.tags),
        taxonomyText(e.categories),
      )
    ) {
      results.push({
        type: "event",
        slug: e.slug,
        title: e.title,
        summary: e.summary,
        date: e.eventDate,
        year: e.archiveYear,
        href: `/events/${e.slug}`,
      });
    }
  }
  for (const a of PUBLISHED(articles)) {
    if (
      matches(
        query,
        a.title,
        a.summary,
        a.body,
        a.authorDisplayName,
        taxonomyText(a.tags),
        taxonomyText(a.categories),
      )
    ) {
      results.push({
        type: "article",
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        date: a.publishDate,
        href: `/stories/${a.slug}`,
      });
    }
  }
  for (const p of PUBLISHED(podcastEpisodes)) {
    if (
      matches(
        query,
        p.title,
        p.shortDescription,
        p.longDescription,
        taxonomyText(p.tags),
      )
    ) {
      results.push({
        type: "podcast",
        slug: p.slug,
        title: p.title,
        summary: p.shortDescription,
        date: p.publishDate,
        href: `/podcast/${p.slug}`,
      });
    }
  }
  for (const i of PUBLISHED(interviews)) {
    if (
      matches(
        query,
        i.title,
        i.summary,
        i.intervieweeName,
        i.fieldOfStudy,
        taxonomyText(i.tags),
      )
    ) {
      results.push({
        type: "interview",
        slug: i.slug,
        title: i.title,
        summary: i.summary,
        date: i.publishDate ?? "",
        year: i.recordingYear,
        href: `/interviews/${i.slug}`,
      });
    }
  }

  return results.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/* --- Media gallery -------------------------------------------------------- */

export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (isCmsConfigured()) {
    return fromCms(
      () => cmsSource.getGalleryItems(),
      async () =>
        (await useLocalStore())
          ? localSource.getGalleryItems()
          : galleryFixtures(),
    );
  }
  if (await useLocalStore()) return localSource.getGalleryItems();
  return galleryFixtures();
}

function galleryFixtures(): GalleryItem[] {
  const items: GalleryItem[] = [];
  for (const e of PUBLISHED(events)) {
    for (const asset of e.gallery) {
      items.push({ asset, sourceTitle: e.title, sourceHref: `/events/${e.slug}` });
    }
  }
  for (const a of PUBLISHED(articles)) {
    for (const asset of a.inlineMedia ?? []) {
      items.push({ asset, sourceTitle: a.title, sourceHref: `/stories/${a.slug}` });
    }
  }
  return items;
}
