import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardGrid } from "@/components/ui/CardGrid";
import { ContentCard } from "@/components/ui/ContentCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getArchiveYears, getEventsByYear } from "@/lib/data";
import { formatPersianDate, formatYear } from "@/lib/format";

export async function generateStaticParams() {
  const years = await getArchiveYears();
  return years.map((y) => ({ year: String(y) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `آرشیو سال ${formatYear(Number(year))}`,
    description: `رویدادهای گروه دانشجویی آذربایجان در سال ${formatYear(Number(year))}.`,
  };
}

export default async function YearArchivePage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const yearNum = Number(year);
  const years = await getArchiveYears();
  if (!years.includes(yearNum)) notFound();

  const events = await getEventsByYear(yearNum);

  return (
    <>
      <Breadcrumbs items={[{ label: `آرشیو سال ${formatYear(yearNum)}` }]} />
      <Container>
        <PageHeader
          eyebrow="آرشیو سالانه"
          title={`سال ${formatYear(yearNum)}`}
          description={`رویدادهای ثبت‌شده در سال ${formatYear(yearNum)}.`}
        />
        {events.length === 0 ? (
          <p>در این سال رویدادی ثبت نشده است.</p>
        ) : (
          <CardGrid>
            {events.map((e) => (
              <ContentCard
                key={e.id}
                href={`/events/${e.slug}`}
                title={e.title}
                summary={e.summary}
                image={e.featuredImage}
                eyebrow={e.eventType}
                meta={formatPersianDate(e.eventDate)}
              />
            ))}
          </CardGrid>
        )}
      </Container>
    </>
  );
}
