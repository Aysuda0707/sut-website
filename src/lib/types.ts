/**
 * Domain types for the archive.
 *
 * These mirror the Directus collections defined in the Phase 1 architecture
 * document. In Phase 5 the data layer is swapped from local fixtures to the
 * Directus SDK without changing these types.
 */

export type ContentStatus = "draft" | "published" | "archived";

export interface SeoFields {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface MediaAsset {
  id: string;
  /** Public URL of the binary (object storage in production). */
  url: string;
  /** Optional poster/thumbnail URL for videos. */
  thumbnailUrl?: string;
  title: string;
  caption?: string;
  alt: string;
  description?: string;
  credit?: string;
  mediaType: "image" | "audio" | "video";
  width?: number;
  height?: number;
  /** Duration in seconds for audio/video. */
  durationSeconds?: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface Contributor {
  id: string;
  name: string;
  role?: string;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  eventDate: string; // ISO date
  archiveYear: number; // structured, not parsed from title
  location?: string;
  summary: string;
  reportBody?: string;
  featuredImage: MediaAsset;
  gallery: MediaAsset[];
  organizers?: Contributor[];
  contributors?: Contributor[];
  categories: Category[];
  tags: Tag[];
  status: ContentStatus;
  featuredOnHome?: boolean;
  seo?: SeoFields;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  authorDisplayName: string;
  publishDate: string;
  summary: string;
  body: string; // rich text (HTML in fixtures)
  featuredImage: MediaAsset;
  inlineMedia?: MediaAsset[];
  relatedEventSlugs?: string[];
  relatedInterviewSlugs?: string[];
  relatedPodcastSlugs?: string[];
  categories: Category[];
  tags: Tag[];
  status: ContentStatus;
  seo?: SeoFields;
  createdAt: string;
  updatedAt: string;
}

export interface PodcastEpisode {
  id: string;
  slug: string;
  title: string;
  episodeNumber: number;
  season?: number;
  publishDate: string;
  shortDescription: string;
  longDescription: string;
  coverImage: MediaAsset;
  audioFile: MediaAsset;
  transcript?: string;
  durationSeconds: number;
  contributors?: Contributor[];
  tags: Tag[];
  status: ContentStatus;
  seo?: SeoFields;
}

export interface Interview {
  id: string;
  slug: string;
  title: string;
  intervieweeName: string;
  recordingYear: number;
  publishDate?: string;
  featuredImage: MediaAsset;
  videoFile: MediaAsset;
  summary: string;
  transcript?: string;
  fieldOfStudy?: string;
  tags: Tag[];
  consentConfirmed: boolean;
  status: ContentStatus;
  seo?: SeoFields;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  introduction: string;
  footerText: string;
  contactEmail?: string;
  socialLinks: { label: string; href: string }[];
  /** Editor-selected featured item for the home page. */
  featured?: {
    kind: "event" | "article" | "podcast" | "interview";
    slug: string;
  };
  /** Ordered home page section configuration (CMS-managed). */
  homeSections: HomeSection[];
}

export interface HomeSection {
  id: string;
  type: "intro" | "featured" | "events" | "articles" | "podcast" | "interviews" | "years" | "links";
  title: string;
  limit?: number;
  enabled: boolean;
}
