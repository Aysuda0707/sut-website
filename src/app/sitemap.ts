import type { MetadataRoute } from "next";
import {
  getArchiveYears,
  getArticles,
  getEvents,
  getInterviews,
  getPodcastEpisodes,
} from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, articles, podcasts, interviews, years] = await Promise.all([
    getEvents(),
    getArticles(),
    getPodcastEpisodes(),
    getInterviews(),
    getArchiveYears(),
  ]);

  const staticRoutes = [
    "",
    "/events",
    "/podcast",
    "/interviews",
    "/stories",
    "/gallery",
    "/about",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  return [
    ...staticRoutes,
    ...events.map((e) => ({
      url: `${SITE_URL}/events/${e.slug}`,
      lastModified: new Date(e.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${SITE_URL}/stories/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...podcasts.map((p) => ({
      url: `${SITE_URL}/podcast/${p.slug}`,
      lastModified: new Date(p.publishDate),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...interviews.map((i) => ({
      url: `${SITE_URL}/interviews/${i.slug}`,
      lastModified: new Date(i.publishDate ?? "1970-01-01"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...years.map((y) => ({
      url: `${SITE_URL}/archive/${y}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
