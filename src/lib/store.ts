/**
 * Local content store.
 *
 * A tiny, dependency-free persistence layer that keeps all editorial content in
 * a single JSON file on disk (`data/content.json`). It is the storage engine
 * behind the built-in admin panel and is read by `src/lib/data.ts` when present.
 *
 * Design goals:
 *   - Zero external services (no Docker, no database, no native modules).
 *   - Human-readable, diffable, easy to back up (just copy the file).
 *   - Seeded from the Phase 2 fixtures on first run so the site is never empty.
 *   - Server-only: uses `node:fs`. Never import this from a client component.
 *
 * Concurrency: writes are serialised through a simple promise queue and written
 * atomically (temp file + rename) so a crash mid-write cannot corrupt the store.
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

export function storeFilePath(): string {
  return STORE_FILE;
}

/**
 * True when the store file exists on disk. Used by the data layer to decide
 * whether the built-in admin panel has saved content worth reading.
 */
export async function storeExists(): Promise<boolean> {
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
  try {
    const stat = await fs.stat(STORE_FILE);
    return stat.mtimeMs;
  } catch {
    return 0;
  }
}

async function ensureStore(): Promise<ContentDatabase> {
  const diskMtime = await storeMtimeMs();

  // Serve the in-memory copy only while it still matches what is on disk.
  if (cache && diskMtime !== 0 && diskMtime === cacheMtimeMs) {
    return cache;
  }

  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
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
    // First run (or unreadable file): create it from fixtures.
    const seeded = seedDatabase();
    await persist(seeded);
    cache = seeded;
    cacheMtimeMs = await storeMtimeMs();
    return cache;
  }
}

async function persist(db: ContentDatabase): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, STORE_FILE);
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
