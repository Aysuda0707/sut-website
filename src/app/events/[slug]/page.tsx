import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ContentCard } from "@/components/ui/ContentCard";
import { CardGrid } from "@/components/ui/CardGrid";
import { Section } from "@/components/ui/Section";
import {
  getArticlesForEvent,
  getEventBySlug,
  getEvents,
} from "@/lib/data";
import { formatPersianDate, formatYear } from "@/lib/format";
import styles from "./page.module.css";

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "رویداد یافت نشد" };
  return {
    title: event.title,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      ...(event.featuredImage
        ? { images: [{ url: event.featuredImage.url }] }
        : {}),
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const relatedArticles = await getArticlesForEvent(event.slug);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "رویدادها", href: "/events" },
          { label: event.title },
        ]}
      />
      <Container>
        <article className={styles.article}>
          <header className={styles.header}>
            <div className={styles.badges}>
              <Badge tone="gold">{event.eventType}</Badge>
              <Badge href={`/archive/${event.archiveYear}`}>
                سال {formatYear(event.archiveYear)}
              </Badge>
            </div>
            <h1 className={styles.title}>{event.title}</h1>
            <p className={styles.summary}>{event.summary}</p>
            <dl className={styles.meta}>
              <div>
                <dt>تاریخ</dt>
                <dd>{formatPersianDate(event.eventDate)}</dd>
              </div>
              {event.location && (
                <div>
                  <dt>مکان</dt>
                  <dd>{event.location}</dd>
                </div>
              )}
              {event.organizers && event.organizers.length > 0 && (
                <div>
                  <dt>برگزارکنندگان</dt>
                  <dd>{event.organizers.map((o) => o.name).join("، ")}</dd>
                </div>
              )}
            </dl>
          </header>

          {event.featuredImage && (
            <figure className={styles.heroFigure}>
              <Image
                src={event.featuredImage.url}
                alt={event.featuredImage.alt}
                width={event.featuredImage.width ?? 1600}
                height={event.featuredImage.height ?? 1000}
                className={styles.heroImage}
                priority
                unoptimized={event.featuredImage.url.startsWith("data:")}
              />
              {event.featuredImage.caption && (
                <figcaption>{event.featuredImage.caption}</figcaption>
              )}
            </figure>
          )}

          {event.reportBody && (
            <div
              className={styles.body}
              dangerouslySetInnerHTML={{ __html: event.reportBody }}
            />
          )}

          {event.gallery.length > 0 && (
            <section className={styles.gallery} aria-label="گالری تصاویر">
              <h2 className={styles.galleryTitle}>تصاویر</h2>
              <ul className={styles.galleryGrid}>
                {event.gallery.map((img) => (
                  <li key={img.id} className={styles.galleryItem}>
                    <Image
                      src={img.url}
                      alt={img.alt}
                      width={img.width ?? 800}
                      height={img.height ?? 600}
                      className={styles.galleryImage}
                      unoptimized={img.url.startsWith("data:")}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className={styles.taxonomy}>
            {event.categories.map((c) => (
              <Badge key={c.id} href={`/events?category=${c.slug}`}>
                {c.name}
              </Badge>
            ))}
            {event.tags.map((t) => (
              <Badge key={t.id} href={`/events?tag=${t.slug}`}>
                #{t.name}
              </Badge>
            ))}
          </div>
        </article>

        {relatedArticles.length > 0 && (
          <Section title="گزارش‌های مرتبط" moreHref="/stories">
            <CardGrid>
              {relatedArticles.map((a) => (
                <ContentCard
                  key={a.id}
                  href={`/stories/${a.slug}`}
                  title={a.title}
                  summary={a.summary}
                  image={a.featuredImage}
                  eyebrow="گزارش"
                  meta={`${a.authorDisplayName} — ${formatPersianDate(a.publishDate)}`}
                />
              ))}
            </CardGrid>
          </Section>
        )}

        <p className={styles.back}>
          <Link href="/events">← بازگشت به آرشیو رویدادها</Link>
        </p>
      </Container>
    </>
  );
}
