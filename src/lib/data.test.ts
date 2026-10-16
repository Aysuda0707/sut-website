import { describe, expect, it } from "vitest";
import {
  getArchiveYears,
  getEventBySlug,
  getEvents,
  getEventsByYear,
  search,
} from "./data";

describe("events data layer", () => {
  it("returns only published events, newest first", async () => {
    const events = await getEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.status === "published")).toBe(true);
    for (let i = 1; i < events.length; i++) {
      expect(
        new Date(events[i - 1].eventDate).getTime(),
      ).toBeGreaterThanOrEqual(new Date(events[i].eventDate).getTime());
    }
  });

  it("finds an event by slug", async () => {
    const event = await getEventBySlug("nowruz-1403");
    expect(event).not.toBeNull();
    expect(event?.archiveYear).toBe(1403);
  });

  it("returns null for an unknown slug", async () => {
    expect(await getEventBySlug("does-not-exist")).toBeNull();
  });

  it("filters events by structured archive year", async () => {
    const events = await getEventsByYear(1402);
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.archiveYear === 1402)).toBe(true);
  });

  it("lists archive years newest first", async () => {
    const years = await getArchiveYears();
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });
});

describe("search", () => {
  it("finds content by Persian title", async () => {
    const results = await search("نوروز");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.type === "event")).toBe(true);
  });

  it("finds content by English tag text", async () => {
    const results = await search("music");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns no results for an empty query", async () => {
    expect(await search("")).toEqual([]);
  });

  it("returns no results for a non-matching query", async () => {
    expect(await search("zzzzzznomatch")).toEqual([]);
  });
});
