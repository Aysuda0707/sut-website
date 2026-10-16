/**
 * Mappers: Directus records → domain types.
 *
 * Directus returns flat records with relation fields expanded (when requested
 * via `fields`). These functions normalise them into the domain types defined
 * in `types.ts`, so pages never depend on Directus' shape.
 */

import { assetUrl } from "./directus";
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

/* --- Raw Directus shapes (partial, only fields we request) ---------------- */

export interface RawFile {
  id: string;
  title?: string | null;
  description?: string | null;
  filename_download?: string | null;
  type?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export interface RawTaxonomy {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface RawContributor {
  id: string;
  name: string;
  role?: string | null;
}

export interface RawEvent {
  id: string;
  status: string;
  slug: string;
  title: string;
  event_type?: RawTaxonomy | null;
  event_date: string;
  archive_year: number;
  location?: string | null;
  summary: string;
  report_body?: string | null;
  featured_image?: RawFile | null;
  gallery?: RawFile[] | null;
  organizers?: RawContributor[] | null;
  contributors?: RawContributor[] | null;
  categories?: RawTaxonomy[] | null;
  tags?: RawTaxonomy[] | null;
  featured_on_home?: boolean | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_og_image?: RawFile | null;
  date_created?: string | null;
  date_updated?: string | null;
}

export interface RawArticle {
  id: string;
  status: string;
  slug: string;
  title: string;
  author_display_name: string;
  publish_date: string;
  summary: string;
  body: string;
  featured_image?: RawFile | null;
  inline_media?: RawFile[] | null;
  related_events?: { events_id: { slug: string } }[] | null;
  related_interviews?: { interviews_id: { slug: string } }[] | null;
  related_podcasts?: { podcast_episodes_id: { slug: string } }[] | null;
  categories?: RawTaxonomy[] | null;
  tags?: RawTaxonomy[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_og_image?: RawFile | null;
  date_created?: string | null;
  date_updated?: string | null;
}

export interface RawPodcast {
  id: string;
  status: string;
  slug: string;
  title: string;
  episode_number: number;
  season?: number | null;
  publish_date: string;
  short_description: string;
  long_description?: string | null;
  cover_image?: RawFile | null;
  audio_file?: RawFile | null;
  transcript?: string | null;
  duration_seconds: number;
  contributors?: RawContributor[] | null;
  tags?: RawTaxonomy[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_og_image?: RawFile | null;
}

export interface RawInterview {
  id: string;
  status: string;
  slug: string;
  title: string;
  interviewee_name: string;
  recording_year: number;
  publish_date?: string | null;
  featured_image?: RawFile | null;
  video_file?: RawFile | null;
  summary: string;
  transcript?: string | null;
  field_of_study?: string | null;
  tags?: RawTaxonomy[] | null;
  consent_confirmed: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_og_image?: RawFile | null;
}

export interface RawSiteSettings {
  site_name: string;
  tagline?: string | null;
  introduction?: string | null;
  footer_text?: string | null;
  contact_email?: string | null;
  social_links?: { label: string; href: string }[] | null;
  featured_kind?: string | null;
  featured_slug?: string | null;
  home_sections?: SiteSettings["homeSections"] | null;
}

/* --- Helpers -------------------------------------------------------------- */

function mediaTypeOf(file: RawFile): MediaAsset["mediaType"] {
  const t = file.type ?? "";
  if (t.startsWith("audio")) return "audio";
  if (t.startsWith("video")) return "video";
  return "image";
}

export function toMediaAsset(file: RawFile | null | undefined): MediaAsset {
  if (!file) {
    return {
      id: "",
      url: "",
      title: "",
      alt: "",
      mediaType: "image",
    };
  }
  return {
    id: file.id,
    url: assetUrl(file.id),
    thumbnailUrl: file.type?.startsWith("video") ? assetUrl(file.id) : undefined,
    title: file.title ?? file.filename_download ?? "",
    alt: file.title ?? file.filename_download ?? "",
    description: file.description ?? undefined,
    mediaType: mediaTypeOf(file),
    width: file.width ?? undefined,
    height: file.height ?? undefined,
    durationSeconds: file.duration ?? undefined,
  };
}

function toCategory(t: RawTaxonomy): Category {
  return { id: t.id, slug: t.slug, name: t.name, description: t.description ?? undefined };
}

function toTag(t: RawTaxonomy): Tag {
  return { id: t.id, slug: t.slug, name: t.name };
}

function toContributor(c: RawContributor): Contributor {
  return { id: c.id, name: c.name, role: c.role ?? undefined };
}

function seoOf(raw: {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_og_image?: RawFile | null;
}) {
  if (!raw.seo_title && !raw.seo_description && !raw.seo_og_image) return undefined;
  return {
    title: raw.seo_title ?? undefined,
    description: raw.seo_description ?? undefined,
    ogImage: raw.seo_og_image ? assetUrl(raw.seo_og_image.id) : undefined,
  };
}

/* --- Public mappers ------------------------------------------------------- */

export function toEvent(raw: RawEvent): EventItem {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    eventType: raw.event_type?.name ?? "",
    eventDate: raw.event_date,
    archiveYear: raw.archive_year,
    location: raw.location ?? undefined,
    summary: raw.summary,
    reportBody: raw.report_body ?? undefined,
    featuredImage: toMediaAsset(raw.featured_image),
    gallery: (raw.gallery ?? []).map(toMediaAsset),
    organizers: (raw.organizers ?? []).map(toContributor),
    contributors: (raw.contributors ?? []).map(toContributor),
    categories: (raw.categories ?? []).map(toCategory),
    tags: (raw.tags ?? []).map(toTag),
    status: raw.status as EventItem["status"],
    featuredOnHome: raw.featured_on_home ?? false,
    seo: seoOf(raw),
    createdAt: raw.date_created ?? "",
    updatedAt: raw.date_updated ?? "",
  };
}

export function toArticle(raw: RawArticle): Article {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    authorDisplayName: raw.author_display_name,
    publishDate: raw.publish_date,
    summary: raw.summary,
    body: raw.body,
    featuredImage: toMediaAsset(raw.featured_image),
    inlineMedia: (raw.inline_media ?? []).map(toMediaAsset),
    relatedEventSlugs: (raw.related_events ?? []).map((r) => r.events_id.slug),
    relatedInterviewSlugs: (raw.related_interviews ?? []).map((r) => r.interviews_id.slug),
    relatedPodcastSlugs: (raw.related_podcasts ?? []).map((r) => r.podcast_episodes_id.slug),
    categories: (raw.categories ?? []).map(toCategory),
    tags: (raw.tags ?? []).map(toTag),
    status: raw.status as Article["status"],
    seo: seoOf(raw),
    createdAt: raw.date_created ?? "",
    updatedAt: raw.date_updated ?? "",
  };
}

export function toPodcast(raw: RawPodcast): PodcastEpisode {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    episodeNumber: raw.episode_number,
    season: raw.season ?? undefined,
    publishDate: raw.publish_date,
    shortDescription: raw.short_description,
    longDescription: raw.long_description ?? "",
    coverImage: toMediaAsset(raw.cover_image),
    audioFile: toMediaAsset(raw.audio_file),
    transcript: raw.transcript ?? undefined,
    durationSeconds: raw.duration_seconds,
    contributors: (raw.contributors ?? []).map(toContributor),
    tags: (raw.tags ?? []).map(toTag),
    status: raw.status as PodcastEpisode["status"],
    seo: seoOf(raw),
  };
}

export function toInterview(raw: RawInterview): Interview {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    intervieweeName: raw.interviewee_name,
    recordingYear: raw.recording_year,
    publishDate: raw.publish_date ?? undefined,
    featuredImage: toMediaAsset(raw.featured_image),
    videoFile: toMediaAsset(raw.video_file),
    summary: raw.summary,
    transcript: raw.transcript ?? undefined,
    fieldOfStudy: raw.field_of_study ?? undefined,
    tags: (raw.tags ?? []).map(toTag),
    consentConfirmed: raw.consent_confirmed,
    status: raw.status as Interview["status"],
    seo: seoOf(raw),
  };
}

export function toSiteSettings(raw: RawSiteSettings): SiteSettings {
  return {
    siteName: raw.site_name,
    tagline: raw.tagline ?? "",
    introduction: raw.introduction ?? "",
    footerText: raw.footer_text ?? "",
    contactEmail: raw.contact_email ?? undefined,
    socialLinks: raw.social_links ?? [],
    featured:
      raw.featured_kind && raw.featured_slug
        ? {
            kind: raw.featured_kind as "event" | "article" | "podcast" | "interview",
            slug: raw.featured_slug,
          }
        : undefined,
    homeSections: raw.home_sections ?? [],
  };
}
