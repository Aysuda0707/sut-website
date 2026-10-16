/**
 * Shared data-layer types.
 *
 * These live in their own module so that both the fixture source (`data.ts`)
 * and the CMS source (`cms-source.ts`) can import them without creating a
 * circular dependency between the two implementations.
 */

import type { MediaAsset } from "./types";

export type SearchResultType = "event" | "article" | "podcast" | "interview";

export interface SearchResult {
  type: SearchResultType;
  slug: string;
  title: string;
  summary: string;
  date: string;
  year?: number;
  href: string;
}

export interface GalleryItem {
  asset: MediaAsset;
  sourceTitle: string;
  sourceHref: string;
}
