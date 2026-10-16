import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { CardGrid } from "@/components/ui/CardGrid";
import { ContentCard } from "@/components/ui/ContentCard";
import { Badge } from "@/components/ui/Badge";
import {
  getArticles,
  getEvents,
  getFeaturedEvent,
  getInterviews,
  getPodcastEpisodes,
  getSiteSettings,
  getArchiveYears,
} from "@/lib/data";
import { formatPersianDate, formatYear } from "@/lib/format";
import styles from "./page.module.css";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const [featured, events, articles, podcasts, interviews, years] =
    await Promise.all([
      getFeaturedEvent(),
      getEvents(),
      getArticles(),
      getPodcastEpisodes(),
      getInterviews(),
      getArchiveYears(),
    ]);

  const sections = settings.homeSections.filter((s) => s.enabled);
  const byId = (id: string) => sections.find((s) => s.id === id);

  return (
    <>
      {/* Hero / introduction */}
      <section className={styles.hero}>
        <Container>
          <p className={styles.heroEyebrow}>{settings.tagline}</p>
          <h1 className={styles.heroTitle}>{settings.siteName}</h1>
          <p className={styles.heroText}>{settings.introduction}</p>
          <div className={styles.heroActions}>
            <Link href="/events" className={styles.primaryCta}>
              مرور آرشیو رویدادها
            </Link>
            <Link href="/about" className={styles.secondaryCta}>
              درباره گروه
            </Link>
          </div>
        </Container>
      </section>

      <Container>
        {/* Featured item */}
        {byId("s-featured") && featured && (
          <Section title={byId("s-featured")!.title}>
            <ContentCard
              variant="featured"
              href={`/events/${featured.slug}`}
              title={featured.title}
              summary={featured.summary}
              image={featured.featuredImage}
              eyebrow={featured.eventType}
              meta={`${formatPersianDate(featured.eventDate)} — سال ${formatYear(featured.archiveYear)}`}
            />
          </Section>
        )}

        {/* Recent events */}
        {byId("s-events") && (
          <Section
            title={byId("s-events")!.title}
            moreHref="/events"
          >
            <CardGrid>
              {events.slice(0, byId("s-events")!.limit ?? 3).map((e) => (
                <ContentCard
                  key={e.id}
                  href={`/events/${e.slug}`}
                  title={e.title}
                  summary={e.summary}
                  image={e.featuredImage}
                  eyebrow={e.eventType}
                  meta={`${formatPersianDate(e.eventDate)} — سال ${formatYear(e.archiveYear)}`}
                />
              ))}
            </CardGrid>
          </Section>
        )}

        {/* Recent articles/reports */}
        {byId("s-articles") && (
          <Section title={byId("s-articles")!.title} moreHref="/stories">
            <CardGrid>
              {articles.slice(0, byId("s-articles")!.limit ?? 3).map((a) => (
                <ContentCard
                  key={a.id}
                  href={`/stories/${a.slug}`}
                  title={a.title}
                  summary={a.summary}
                  image={a.featuredImage}
                  eyebrow="نوشته"
                  meta={`${a.authorDisplayName} — ${formatPersianDate(a.publishDate)}`}
                />
              ))}
            </CardGrid>
          </Section>
        )}

        {/* Selected podcast episodes */}
        {byId("s-podcast") && (
          <Section title={byId("s-podcast")!.title} moreHref="/podcast">
            <CardGrid>
              {podcasts.slice(0, byId("s-podcast")!.limit ?? 3).map((p) => (
                <ContentCard
                  key={p.id}
                  href={`/podcast/${p.slug}`}
                  title={p.title}
                  summary={p.shortDescription}
                  image={p.coverImage}
                  eyebrow={`قسمت ${formatYear(p.episodeNumber)}`}
                  meta={formatPersianDate(p.publishDate)}
                />
              ))}
            </CardGrid>
          </Section>
        )}

        {/* Selected interviews */}
        {byId("s-interviews") && (
          <Section title={byId("s-interviews")!.title} moreHref="/interviews">
            <CardGrid>
              {interviews.slice(0, byId("s-interviews")!.limit ?? 3).map((i) => (
                <ContentCard
                  key={i.id}
                  href={`/interviews/${i.slug}`}
                  title={i.title}
                  summary={i.summary}
                  image={i.featuredImage}
                  eyebrow="گفت‌وگو"
                  meta={`سال ${formatYear(i.recordingYear)}`}
                />
              ))}
            </CardGrid>
          </Section>
        )}

        {/* Year-based archive entry point */}
        {byId("s-years") && (
          <Section
            title={byId("s-years")!.title}
            description="برای مرور فعالیت‌های هر سال، یک سال را انتخاب کنید."
          >
            <ul className={styles.years}>
              {years.map((y) => (
                <li key={y}>
                  <Link href={`/archive/${y}`} className={styles.yearLink}>
                    <span className={styles.yearNumber}>{formatYear(y)}</span>
                    <span className={styles.yearLabel}>آرشیو سال</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Quick links */}
        {byId("s-links") && (
          <Section title={byId("s-links")!.title}>
            <div className={styles.quickLinks}>
              <Badge href="/events" tone="accent">رویدادها</Badge>
              <Badge href="/podcast" tone="accent">پادکست</Badge>
              <Badge href="/interviews" tone="accent">گفت‌وگوها</Badge>
              <Badge href="/stories" tone="accent">نوشته‌ها</Badge>
              <Badge href="/gallery" tone="accent">گالری</Badge>
              <Badge href="/about" tone="accent">درباره گروه</Badge>
            </div>
          </Section>
        )}
      </Container>
    </>
  );
}
