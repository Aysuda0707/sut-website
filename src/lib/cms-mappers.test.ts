import { describe, expect, it } from "vitest";
import {
  toArticle,
  toEvent,
  toInterview,
  toMediaAsset,
  toPodcast,
  toSiteSettings,
  type RawArticle,
  type RawEvent,
  type RawInterview,
  type RawPodcast,
  type RawSiteSettings,
} from "./cms-mappers";

describe("toMediaAsset", () => {
  it("returns an empty asset for null input", () => {
    const asset = toMediaAsset(null);
    expect(asset.id).toBe("");
    expect(asset.url).toBe("");
    expect(asset.mediaType).toBe("image");
  });

  it("detects audio, video, and image media types", () => {
    expect(toMediaAsset({ id: "a", type: "audio/mpeg" }).mediaType).toBe("audio");
    expect(toMediaAsset({ id: "v", type: "video/mp4" }).mediaType).toBe("video");
    expect(toMediaAsset({ id: "i", type: "image/png" }).mediaType).toBe("image");
  });

  it("falls back to filename for title and alt", () => {
    const asset = toMediaAsset({ id: "x", filename_download: "photo.jpg" });
    expect(asset.title).toBe("photo.jpg");
    expect(asset.alt).toBe("photo.jpg");
  });
});

describe("toEvent", () => {
  const raw: RawEvent = {
    id: "e1",
    status: "published",
    slug: "nowruz-1403",
    title: "جشن نوروز",
    event_type: { id: "t1", slug: "celebration", name: "جشن" },
    event_date: "2024-03-20",
    archive_year: 1403,
    summary: "خلاصه",
    featured_on_home: true,
    categories: [{ id: "c1", slug: "culture", name: "فرهنگ" }],
    tags: [{ id: "g1", slug: "music", name: "موسیقی" }],
    gallery: [{ id: "f1", type: "image/jpeg" }],
    organizers: [{ id: "p1", name: "علی", role: "سرپرست" }],
  };

  it("maps core fields and taxonomy", () => {
    const event = toEvent(raw);
    expect(event.slug).toBe("nowruz-1403");
    expect(event.archiveYear).toBe(1403);
    expect(event.eventType).toBe("جشن");
    expect(event.categories[0].slug).toBe("culture");
    expect(event.tags[0].slug).toBe("music");
    expect(event.gallery).toHaveLength(1);
    expect(event.organizers?.[0].name).toBe("علی");
    expect(event.featuredOnHome).toBe(true);
  });

  it("defaults missing optional collections to empty arrays", () => {
    const minimal = toEvent({
      id: "e2",
      status: "published",
      slug: "s",
      title: "t",
      event_date: "2024-01-01",
      archive_year: 1402,
      summary: "s",
    });
    expect(minimal.gallery).toEqual([]);
    expect(minimal.tags).toEqual([]);
    expect(minimal.categories).toEqual([]);
    expect(minimal.featuredOnHome).toBe(false);
  });
});

describe("toArticle", () => {
  it("maps related content slugs", () => {
    const raw: RawArticle = {
      id: "a1",
      status: "published",
      slug: "essay",
      title: "مقاله",
      author_display_name: "نویسنده",
      publish_date: "2024-05-01",
      summary: "خلاصه",
      body: "متن",
      related_events: [{ events_id: { slug: "nowruz-1403" } }],
      related_interviews: [{ interviews_id: { slug: "interview-1" } }],
      related_podcasts: [{ podcast_episodes_id: { slug: "ep-1" } }],
    };
    const article = toArticle(raw);
    expect(article.relatedEventSlugs).toEqual(["nowruz-1403"]);
    expect(article.relatedInterviewSlugs).toEqual(["interview-1"]);
    expect(article.relatedPodcastSlugs).toEqual(["ep-1"]);
  });
});

describe("toPodcast", () => {
  it("maps audio file and duration", () => {
    const raw: RawPodcast = {
      id: "p1",
      status: "published",
      slug: "ep-1",
      title: "قسمت اول",
      episode_number: 1,
      publish_date: "2024-02-01",
      short_description: "کوتاه",
      duration_seconds: 1830,
      audio_file: { id: "audio1", type: "audio/mpeg" },
    };
    const podcast = toPodcast(raw);
    expect(podcast.episodeNumber).toBe(1);
    expect(podcast.durationSeconds).toBe(1830);
    expect(podcast.audioFile.mediaType).toBe("audio");
  });
});

describe("toInterview", () => {
  it("preserves consent flag", () => {
    const raw: RawInterview = {
      id: "i1",
      status: "published",
      slug: "interview-1",
      title: "گفت‌وگو",
      interviewee_name: "مریم",
      recording_year: 1402,
      summary: "خلاصه",
      consent_confirmed: true,
      video_file: { id: "v1", type: "video/mp4" },
    };
    const interview = toInterview(raw);
    expect(interview.consentConfirmed).toBe(true);
    expect(interview.videoFile.mediaType).toBe("video");
    expect(interview.recordingYear).toBe(1402);
  });
});

describe("toSiteSettings", () => {
  it("maps featured selection when both kind and slug are present", () => {
    const raw: RawSiteSettings = {
      site_name: "آرشیو",
      featured_kind: "event",
      featured_slug: "nowruz-1403",
    };
    const settings = toSiteSettings(raw);
    expect(settings.featured).toEqual({ kind: "event", slug: "nowruz-1403" });
  });

  it("omits featured when incomplete", () => {
    const settings = toSiteSettings({ site_name: "آرشیو", featured_kind: "event" });
    expect(settings.featured).toBeUndefined();
  });
});
