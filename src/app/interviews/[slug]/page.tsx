import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { getInterviewBySlug, getInterviews } from "@/lib/data";
import { formatPersianDate, formatYear } from "@/lib/format";
import styles from "./page.module.css";

export async function generateStaticParams() {
  const interviews = await getInterviews();
  return interviews.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const interview = await getInterviewBySlug(slug);
  if (!interview) return { title: "گفت‌وگو یافت نشد" };
  return {
    title: interview.title,
    description: interview.summary,
    openGraph: {
      title: interview.title,
      description: interview.summary,
      ...(interview.featuredImage?.url
        ? { images: [{ url: interview.featuredImage.url }] }
        : {}),
    },
  };
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const interview = await getInterviewBySlug(slug);
  if (!interview) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "گفت‌وگوها", href: "/interviews" },
          { label: interview.title },
        ]}
      />
      <Container>
        <article className={styles.article}>
          <header className={styles.header}>
            <div className={styles.badges}>
              <Badge tone="gold">سال {formatYear(interview.recordingYear)}</Badge>
              {interview.fieldOfStudy && <Badge>{interview.fieldOfStudy}</Badge>}
            </div>
            <h1 className={styles.title}>{interview.title}</h1>
            <p className={styles.interviewee}>
              گفت‌وگو با <strong>{interview.intervieweeName}</strong>
            </p>
            {interview.publishDate && (
              <p className={styles.date}>{formatPersianDate(interview.publishDate)}</p>
            )}
          </header>

          {interview.videoFile?.url && (
            <VideoPlayer
              src={interview.videoFile.url}
              poster={interview.videoFile.thumbnailUrl}
              title={interview.title}
            />
          )}

          <p className={styles.summary}>{interview.summary}</p>

          {interview.transcript && (
            <section className={styles.transcript} aria-label="متن گفت‌وگو">
              <h2 className={styles.transcriptTitle}>متن کامل</h2>
              <div dangerouslySetInnerHTML={{ __html: interview.transcript }} />
            </section>
          )}

          <div className={styles.taxonomy}>
            {interview.tags.map((t) => (
              <Badge key={t.id} href={`/search?q=${encodeURIComponent(t.name)}`}>
                #{t.name}
              </Badge>
            ))}
          </div>
        </article>

        <p className={styles.back}>
          <Link href="/interviews">← بازگشت به آرشیو گفت‌وگوها</Link>
        </p>
      </Container>
    </>
  );
}
