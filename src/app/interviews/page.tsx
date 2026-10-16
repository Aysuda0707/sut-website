import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardGrid } from "@/components/ui/CardGrid";
import { ContentCard } from "@/components/ui/ContentCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getInterviews } from "@/lib/data";
import { formatYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "گفت‌وگوها",
  description: "گفت‌وگوهای ویدیویی با هنرمندان، استادان و دانش‌آموختگان.",
};

export default async function InterviewsPage() {
  const interviews = await getInterviews();

  return (
    <>
      <Breadcrumbs items={[{ label: "گفت‌وگوها" }]} />
      <Container>
        <PageHeader
          eyebrow="ویدیویی"
          title="گفت‌وگوها"
          description="گفت‌وگو با هنرمندان، استادان و دانش‌آموختگان درباره فرهنگ و تجربه‌هایشان."
        />
        <CardGrid>
          {interviews.map((i) => (
            <ContentCard
              key={i.id}
              href={`/interviews/${i.slug}`}
              title={i.title}
              summary={i.summary}
              image={i.featuredImage}
              eyebrow={i.fieldOfStudy ?? "گفت‌وگو"}
              meta={`${i.intervieweeName} — سال ${formatYear(i.recordingYear)}`}
            />
          ))}
        </CardGrid>
      </Container>
    </>
  );
}
