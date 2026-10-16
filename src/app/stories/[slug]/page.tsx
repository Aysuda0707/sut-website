import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import {
  getArticleBySlug,
  getArticles,
  getEventBySlug,
} from "@/lib/data";
import { formatPersianDate } from "@/lib/format";
import styles from "./page.module.css";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "نوشته یافت نشد" };
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: [{ url: article.featuredImage.url }],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const relatedEvents = await Promise.all(
    (article.relatedEventSlugs ?? []).map((s) => getEventBySlug(s)),
  );

  return (
    <>
      <Breadcrumbs
        items={[{ label: "نوشته‌ها", href: "/stories" }, { label: article.title }]}
      />
      <Container>
        <article className={styles.article}>
          <header className={styles.header}>
            <h1 className={styles.title}>{article.title}</h1>
            <p className={styles.byline}>
              {article.authorDisplayName} — {formatPersianDate(article.publishDate)}
            </p>
            <p className={styles.summary}>{article.summary}</p>
          </header>

          <figure className={styles.heroFigure}>
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.alt}
              width={article.featuredImage.width ?? 1600}
              height={article.featuredImage.height ?? 1000}
              className={styles.heroImage}
              priority
              unoptimized={article.featuredImage.url.startsWith("data:")}
            />
          </figure>

          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {article.inlineMedia && article.inlineMedia.length > 0 && (
            <section className={styles.inlineMedia} aria-label="تصاویر نوشته">
              {article.inlineMedia.map((m) => (
                <figure key={m.id}>
                  <Image
                    src={m.url}
                    alt={m.alt}
                    width={m.width ?? 1200}
                    height={m.height ?? 800}
                    className={styles.inlineImage}
                    unoptimized={m.url.startsWith("data:")}
                  />
                  {m.caption && <figcaption>{m.caption}</figcaption>}
                </figure>
              ))}
            </section>
          )}

          {relatedEvents.filter(Boolean).length > 0 && (
            <section className={styles.related} aria-label="رویدادهای مرتبط">
              <h2 className={styles.relatedTitle}>رویدادهای مرتبط</h2>
              <ul className={styles.relatedList}>
                {relatedEvents.map(
                  (e) =>
                    e && (
                      <li key={e.id}>
                        <Link href={`/events/${e.slug}`}>{e.title}</Link>
                      </li>
                    ),
                )}
              </ul>
            </section>
          )}

          <div className={styles.taxonomy}>
            {article.categories.map((c) => (
              <Badge key={c.id} href={`/stories?category=${c.slug}`}>
                {c.name}
              </Badge>
            ))}
            {article.tags.map((t) => (
              <Badge key={t.id} href={`/search?q=${encodeURIComponent(t.name)}`}>
                #{t.name}
              </Badge>
            ))}
          </div>
        </article>

        <p className={styles.back}>
          <Link href="/stories">← بازگشت به آرشیو نوشته‌ها</Link>
        </p>
      </Container>
    </>
  );
}
