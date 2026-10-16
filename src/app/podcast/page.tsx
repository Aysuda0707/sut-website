import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardGrid } from "@/components/ui/CardGrid";
import { ContentCard } from "@/components/ui/ContentCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getPodcastEpisodes } from "@/lib/data";
import { formatDuration, formatPersianDate, formatYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "پادکست",
  description: "قسمت‌های پادکست گروه دانشجویی آذربایجان درباره فرهنگ، موسیقی و زبان.",
};

export default async function PodcastPage() {
  const episodes = await getPodcastEpisodes();

  return (
    <>
      <Breadcrumbs items={[{ label: "پادکست" }]} />
      <Container>
        <PageHeader
          eyebrow="صوتی"
          title="پادکست"
          description="گفت‌وگوها و روایت‌هایی درباره فرهنگ، موسیقی و زبان آذربایجان."
        />
        <CardGrid>
          {episodes.map((p) => (
            <ContentCard
              key={p.id}
              href={`/podcast/${p.slug}`}
              title={p.title}
              summary={p.shortDescription}
              image={p.coverImage}
              eyebrow={`قسمت ${formatYear(p.episodeNumber)}${p.season ? ` — فصل ${formatYear(p.season)}` : ""}`}
              meta={`${formatPersianDate(p.publishDate)} — ${formatDuration(p.durationSeconds)}`}
            />
          ))}
        </CardGrid>
      </Container>
    </>
  );
}
