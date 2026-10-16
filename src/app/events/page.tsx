import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardGrid } from "@/components/ui/CardGrid";
import { ContentCard } from "@/components/ui/ContentCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ArchiveFilters } from "@/components/archive/ArchiveFilters";
import { getCategories, getEvents, getTags } from "@/lib/data";
import { formatPersianDate, formatYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "آرشیو رویدادها",
  description: "مرور رویدادهای فرهنگی گروه دانشجویی آذربایجان بر اساس سال، دسته‌بندی و برچسب.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; category?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const [allEvents, categories, tags] = await Promise.all([
    getEvents(),
    getCategories(),
    getTags(),
  ]);

  const years = [...new Set(allEvents.map((e) => e.archiveYear))].sort(
    (a, b) => b - a,
  );

  let events = allEvents;
  if (params.year) events = events.filter((e) => e.archiveYear === Number(params.year));
  if (params.category)
    events = events.filter((e) => e.categories.some((c) => c.slug === params.category));
  if (params.tag) events = events.filter((e) => e.tags.some((t) => t.slug === params.tag));

  return (
    <>
      <Breadcrumbs items={[{ label: "رویدادها" }]} />
      <Container>
        <PageHeader
          eyebrow="آرشیو"
          title="رویدادها"
          description="مجموعه‌ای از رویدادهای فرهنگی، هنری و آموزشی گروه در طول سال‌ها."
        />

        <ArchiveFilters
          years={years}
          categories={categories}
          tags={tags}
          active={{ year: params.year, category: params.category, tag: params.tag }}
          basePath="/events"
        />

        {events.length === 0 ? (
          <p>رویدادی با این فیلترها یافت نشد.</p>
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
                meta={`${formatPersianDate(e.eventDate)} — سال ${formatYear(e.archiveYear)}`}
              />
            ))}
          </CardGrid>
        )}
      </Container>
    </>
  );
}
