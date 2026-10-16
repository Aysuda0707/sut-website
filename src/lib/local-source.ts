/**
 * Local store data source.
 *
 * Mirrors the shape of `cmsSource` (see `cms-source.ts`) but reads from the
 * built-in JSON store (`src/lib/store.ts`) instead of Directus. This lets the
 * data layer prefer locally-edited content when the admin panel has been used,
 * while still falling back to fixtures when the store is empty.
 *
 * Server-only: the store uses `node:fs`.
 */

import { readDatabase } from "./store";
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

const PUBLISHED = <T extends { status: string }>(items: T[]): T[] =>
  items.filter((i) => i.status === "published");

function byDateDesc<T>(items: T[], key: (item: T) => string | undefined): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(key(b) ?? "1970-01-01").getTime() -
      new Date(key(a) ?? "1970-01-01").getTime(),
  );
}

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function taxonomyText(
  items: { slug: string; name: string }[] | undefined,
): string {
  return (items ?? []).map((i) => `${i.name} ${i.slug}`).join(" ");
}

export const localSource = {
  async getSiteSettings(): Promise<SiteSettings> {
    const db = await readDatabase();
    return db.settings;
  },

  async getEvents(): Promise<EventItem[]> {
    const db = await readDatabase();
    return byDateDesc(PUBLISHED(db.events), (e) => e.eventDate);
  },

  async getEventBySlug(slug: string): Promise<EventItem | null> {
    const db = await readDatabase();
    return PUBLISHED(db.events).find((e) => e.slug === slug) ?? null;
  },

  async getFeaturedEvent(): Promise<EventItem | null> {
    const db = await readDatabase();
    const featured = db.settings.featured;
    if (featured?.kind === "event") {
      return PUBLISHED(db.events).find((e) => e.slug === featured.slug) ?? null;
    }
    return PUBLISHED(db.events).find((e) => e.featuredOnHome) ?? null;
  },

  async getArchiveYears(): Promise<number[]> {
    const db = await readDatabase();
    const years = new Set(PUBLISHED(db.events).map((e) => e.archiveYear));
    return [...years].sort((a, b) => b - a);
  },

  async getEventsByYear(year: number): Promise<EventItem[]> {
    const all = await this.getEvents();
    return all.filter((e) => e.archiveYear === year);
  },

  async getEventsByCategory(slug: string): Promise<EventItem[]> {
    const all = await this.getEvents();
    return all.filter((e) => e.categories.some((c) => c.slug === slug));
  },

  async getEventsByTag(slug: string): Promise<EventItem[]> {
    const all = await this.getEvents();
    return all.filter((e) => e.tags.some((t) => t.slug === slug));
  },

  async getArticles(): Promise<Article[]> {
    const db = await readDatabase();
    return byDateDesc(PUBLISHED(db.articles), (a) => a.publishDate);
  },

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const db = await readDatabase();
    return PUBLISHED(db.articles).find((a) => a.slug === slug) ?? null;
  },

  async getArticlesForEvent(eventSlug: string): Promise<Article[]> {
    const all = await this.getArticles();
    return all.filter((a) => a.relatedEventSlugs?.includes(eventSlug));
  },

  async getPodcastEpisodes(): Promise<PodcastEpisode[]> {
    const db = await readDatabase();
    return byDateDesc(PUBLISHED(db.podcasts), (p) => p.publishDate);
  },

  async getPodcastEpisodeBySlug(
    slug: string,
  ): Promise<PodcastEpisode | null> {
    const db = await readDatabase();
    return PUBLISHED(db.podcasts).find((p) => p.slug === slug) ?? null;
  },

  async getInterviews(): Promise<Interview[]> {
    const db = await readDatabase();
    return byDateDesc(PUBLISHED(db.interviews), (i) => i.publishDate);
  },

  async getInterviewBySlug(slug: string): Promise<Interview | null> {
    const db = await readDatabase();
    return PUBLISHED(db.interviews).find((i) => i.slug === slug) ?? null;
  },

  async getCategories(): Promise<Category[]> {
    const db = await readDatabase();
    return db.categories;
  },

  async getTags(): Promise<Tag[]> {
    const db = await readDatabase();
    return db.tags;
  },

  async search(query: string): Promise<SearchResult[]> {
    const db = await readDatabase();
    const results: SearchResult[] = [];

    for (const e of PUBLISHED(db.events)) {
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
    for (const a of PUBLISHED(db.articles)) {
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
    for (const p of PUBLISHED(db.podcasts)) {
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
    for (const i of PUBLISHED(db.interviews)) {
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
  },

  async getGalleryItems(): Promise<GalleryItem[]> {
    const db = await readDatabase();
    const items: GalleryItem[] = [];
    for (const e of PUBLISHED(db.events)) {
      for (const asset of e.gallery) {
        items.push({
          asset,
          sourceTitle: e.title,
          sourceHref: `/events/${e.slug}`,
        });
      }
    }
    for (const a of PUBLISHED(db.articles)) {
      for (const asset of a.inlineMedia ?? []) {
        items.push({
          asset,
          sourceTitle: a.title,
          sourceHref: `/stories/${a.slug}`,
        });
      }
    }
    return items;
  },
};
