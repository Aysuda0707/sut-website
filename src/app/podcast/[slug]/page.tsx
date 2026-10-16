import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { getPodcastEpisodeBySlug, getPodcastEpisodes } from "@/lib/data";
import { formatDuration, formatPersianDate, formatYear } from "@/lib/format";
import styles from "./page.module.css";

export async function generateStaticParams() {
  const episodes = await getPodcastEpisodes();
  return episodes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ep = await getPodcastEpisodeBySlug(slug);
  if (!ep) return { title: "قسمت یافت نشد" };
  return {
    title: ep.title,
    description: ep.shortDescription,
    openGraph: {
      title: ep.title,
      description: ep.shortDescription,
      ...(ep.coverImage?.url ? { images: [{ url: ep.coverImage.url }] } : {}),
    },
  };
}

export default async function PodcastEpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = await getPodcastEpisodeBySlug(slug);
  if (!episode) notFound();

  return (
    <>
      <Breadcrumbs
        items={[{ label: "پادکست", href: "/podcast" }, { label: episode.title }]}
      />
      <Container>
        <article className={styles.article}>
          <div className={styles.top}>
            {episode.coverImage?.url && (
              <div className={styles.cover}>
                <Image
                  src={episode.coverImage.url}
                  alt={episode.coverImage.alt || episode.title}
                  width={episode.coverImage.width ?? 1200}
                  height={episode.coverImage.height ?? 1200}
                  className={styles.coverImage}
                  priority
                  unoptimized={episode.coverImage.url.startsWith("data:")}
                />
              </div>
            )}
            <div className={styles.info}>
              <div className={styles.badges}>
                <Badge tone="gold">قسمت {formatYear(episode.episodeNumber)}</Badge>
                {episode.season && <Badge>فصل {formatYear(episode.season)}</Badge>}
              </div>
              <h1 className={styles.title}>{episode.title}</h1>
              <p className={styles.meta}>
                {formatPersianDate(episode.publishDate)} — {formatDuration(episode.durationSeconds)}
              </p>
              <p className={styles.short}>{episode.shortDescription}</p>
            </div>
          </div>

          {episode.audioFile?.url && (
            <div className={styles.playerWrap}>
              <AudioPlayer
                src={episode.audioFile.url}
                title={episode.title}
                durationSeconds={episode.durationSeconds}
              />
            </div>
          )}

          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: episode.longDescription }}
          />

          {episode.transcript && (
            <section className={styles.transcript} aria-label="متن گفت‌وگو">
              <h2 className={styles.transcriptTitle}>متن کامل</h2>
              <div dangerouslySetInnerHTML={{ __html: episode.transcript }} />
            </section>
          )}

          {episode.contributors && episode.contributors.length > 0 && (
            <p className={styles.contributors}>
              <strong>همکاران:</strong>{" "}
              {episode.contributors.map((c) => c.name).join("، ")}
            </p>
          )}

          <div className={styles.taxonomy}>
            {episode.tags.map((t) => (
              <Badge key={t.id} href={`/search?q=${encodeURIComponent(t.name)}`}>
                #{t.name}
              </Badge>
            ))}
          </div>
        </article>

        <p className={styles.back}>
          <Link href="/podcast">← بازگشت به آرشیو پادکست</Link>
        </p>
      </Container>
    </>
  );
}
