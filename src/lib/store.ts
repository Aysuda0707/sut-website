/**
 * Content store.
 *
 * A tiny persistence layer that keeps all editorial content in a single JSON
 * document. It is the storage engine behind the built-in admin panel and is
 * read by `src/lib/data.ts` when present.
 *
 * Two backends are supported, chosen automatically at runtime:
 *
 *   1. **Vercel Blob** — used when `BLOB_READ_WRITE_TOKEN` is set (i.e. on
 *      Vercel, where the filesystem is read-only). The JSON document is stored
 *      as a single blob and re-read on demand.
 *
 *   2. **Local disk** — the default everywhere else (local dev, Docker). The
 *      document lives at `data/content.json`, written atomically (temp file +
 *      rename) so a crash mid-write cannot corrupt it.
 *
 * Design goals:
 *   - Zero external services beyond the optional Blob token.
 *   - Human-readable, diffable, easy to back up (just copy the file).
 *   - Seeded from the Phase 2 fixtures on first run so the site is never empty.
 *   - Server-only: uses `node:fs`. Never import this from a client component.
 *
 * Concurrency: writes are serialised through a simple promise queue.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  articles as fixtureArticles,
  categories as fixtureCategories,
  contributors as fixtureContributors,
  events as fixtureEvents,
  interviews as fixtureInterviews,
  podcastEpisodes as fixturePodcasts,
  siteSettings as fixtureSiteSettings,
  tags as fixtureTags,
} from "./sample-data";
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

/* --- Shape ---------------------------------------------------------------- */

export interface ContentDatabase {
  /** Schema version, bumped when the shape changes. */
  version: number;
  categories: Category[];
  tags: Tag[];
  contributors: Contributor[];
  events: EventItem[];
  articles: Article[];
  podcasts: PodcastEpisode[];
  interviews: Interview[];
  /** Uploaded media assets, keyed by id. */
  media: MediaAsset[];
  settings: SiteSettings;
}

export type CollectionName =
  | "categories"
  | "tags"
  | "contributors"
  | "events"
  | "articles"
  | "podcasts"
  | "interviews"
  | "media";

const STORE_VERSION = 1;

/* --- Paths ---------------------------------------------------------------- */

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "content.json");

/** Blob key for the JSON document when running on Vercel. */
const BLOB_KEY = "data/content.json";

/**
 * True when the store should live in Vercel Blob instead of on local disk.
 * Vercel's serverless filesystem is read-only, so writes must go to Blob.
 */
function usingBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function storeFilePath(): string {
  return usingBlobStore() ? `blob:${BLOB_KEY}` : STORE_FILE;
}

/**
 * True when the store exists. On Blob we cannot cheaply probe without a
 * network call, so we report `true` and let `readStore()` fall back to the
 * seed when the blob is missing. On disk we check the file directly.
 */
export async function storeExists(): Promise<boolean> {
  if (usingBlobStore()) return true;
  try {
    await fs.access(STORE_FILE);
    return true;
  } catch {
    return false;
  }
}

/* --- Seed ----------------------------------------------------------------- */

function seedDatabase(): ContentDatabase {
  return {
    version: STORE_VERSION,
    categories: structuredClone(fixtureCategories),
    tags: structuredClone(fixtureTags),
    contributors: structuredClone(fixtureContributors),
    events: structuredClone(fixtureEvents),
    articles: structuredClone(fixtureArticles),
    podcasts: structuredClone(fixturePodcasts),
    interviews: structuredClone(fixtureInterviews),
    media: [],
    settings: structuredClone(fixtureSiteSettings),
  };
}

/* --- Read / write --------------------------------------------------------- */

let cache: ContentDatabase | null = null;
/**
 * Modification time (ms) of the store file the current `cache` was built from.
 * Used to detect edits made by another process (e.g. the admin API route) so a
 * long-lived page-render process does not serve stale content.
 */
let cacheMtimeMs = 0;
let writeQueue: Promise<void> = Promise.resolve();

/** Current mtime of the store file, or 0 when it does not exist yet. */
async function storeMtimeMs(): Promise<number> {
  if (usingBlobStore()) return 0;
  try {
    const stat = await fs.stat(STORE_FILE);
    return stat.mtimeMs;
  } catch {
    return 0;
  }
}

/** Read the raw JSON document from whichever backend is active. */
async function readRaw(): Promise<string | null> {
  if (usingBlobStore()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
      const match = blobs.find((b) => b.pathname === BLOB_KEY);
      if (!match) return null;
      const res = await fetch(match.url, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  try {
    return await fs.readFile(STORE_FILE, "utf8");
  } catch {
    return null;
  }
}

async function ensureStore(): Promise<ContentDatabase> {
  const diskMtime = await storeMtimeMs();

  // Serve the in-memory copy only while it still matches what is on disk.
  // (On Blob, mtime is always 0, so we re-read on every cold start.)
  if (cache && diskMtime !== 0 && diskMtime === cacheMtimeMs) {
    return cache;
  }

  const raw = await readRaw();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ContentDatabase;
      // Merge in any collections added by a newer version of the app.
      const seeded = seedDatabase();
      cache = {
        ...seeded,
        ...parsed,
        settings: { ...seeded.settings, ...parsed.settings },
      };
      cacheMtimeMs = diskMtime;
      return cache;
    } catch {
      // Corrupt document — fall through and reseed.
    }
  }

  // First run (or unreadable document): create it from fixtures.
  const seeded = seedDatabase();
  await persist(seeded);
  cache = seeded;
  cacheMtimeMs = await storeMtimeMs();
  return cache;
}

async function persist(db: ContentDatabase): Promise<void> {
  const json = JSON.stringify(db, null, 2);

  if (usingBlobStore()) {
    try {
      const { put } = await import("@vercel/blob");
      await put(BLOB_KEY, json, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (err) {
      // Never let a storage hiccup take down the request; the in-memory copy
      // still serves the current process.
      console.error("store: failed to persist to Vercel Blob", err);
    }
    return;
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${STORE_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, json, "utf8");
    await fs.rename(tmp, STORE_FILE);
  } catch (err) {
    console.error("store: failed to persist to disk", err);
  }
}

/** Read the whole database (cached in memory for the process lifetime). */
export async function readDatabase(): Promise<ContentDatabase> {
  return ensureStore();
}

/**
 * Apply a mutation to the database and persist it atomically.
 * Mutations are serialised so concurrent requests cannot interleave writes.
 */
export async function mutateDatabase<T>(
  fn: (db: ContentDatabase) => T | Promise<T>,
): Promise<T> {
  const db = await ensureStore();
  const result = await fn(db);
  writeQueue = writeQueue.then(() => persist(db));
  await writeQueue;
  return result;
}

/** Force a re-read from disk on the next access (used after external edits). */
export function invalidateCache(): void {
  cache = null;
}

/* --- Generic collection helpers ------------------------------------------- */

/** Collections that are plain arrays of records with an `id`. */
type ArrayCollection = Exclude<keyof ContentDatabase, "version" | "settings">;

export async function listCollection<K extends ArrayCollection>(
  name: K,
): Promise<ContentDatabase[K]> {
  const db = await readDatabase();
  return db[name];
}

export async function getRecord<K extends ArrayCollection>(
  name: K,
  id: string,
): Promise<ContentDatabase[K][number] | null> {
  const db = await readDatabase();
  const items = db[name] as { id: string }[];
  return (items.find((i) => i.id === id) as ContentDatabase[K][number]) ?? null;
}

export async function upsertRecord<K extends ArrayCollection>(
  name: K,
  record: ContentDatabase[K][number],
): Promise<ContentDatabase[K][number]> {
  return mutateDatabase((db) => {
    const items = db[name] as { id: string }[];
    const idx = items.findIndex((i) => i.id === record.id);
    if (idx >= 0) {
      items[idx] = record;
    } else {
      items.push(record);
    }
    return record;
  });
}

export async function deleteRecord<K extends ArrayCollection>(
  name: K,
  id: string,
): Promise<boolean> {
  return mutateDatabase((db) => {
    const items = db[name] as { id: string }[];
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return false;
    items.splice(idx, 1);
    return true;
  });
}

/* --- Settings ------------------------------------------------------------- */

export async function getSettings(): Promise<SiteSettings> {
  const db = await readDatabase();
  return db.settings;
}

export async function updateSettings(
  patch: Partial<SiteSettings>,
): Promise<SiteSettings> {
  return mutateDatabase((db) => {
    db.settings = { ...db.settings, ...patch };
    return db.settings;
  });
}

/* --- Media ---------------------------------------------------------------- */

export async function addMedia(asset: MediaAsset): Promise<MediaAsset> {
  return mutateDatabase((db) => {
    db.media.push(asset);
    return asset;
  });
}

export async function listMedia(): Promise<MediaAsset[]> {
  const db = await readDatabase();
  return db.media;
}

/* --- ID helpers ----------------------------------------------------------- */

/** Generate a short, URL-safe unique id. */
export function newId(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}-${time}${rand}`;
}

/** Slugify a title, keeping Persian/Arabic letters intact. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
