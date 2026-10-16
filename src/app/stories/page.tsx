import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardGrid } from "@/components/ui/CardGrid";
import { ContentCard } from "@/components/ui/ContentCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getArticles } from "@/lib/data";
import { formatPersianDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "نوشته‌ها و گزارش‌ها",
  description: "گزارش رویدادها، جستارهای فرهنگی، خاطرات و روایت‌های گروه.",
};

export default async function StoriesPage() {
  const articles = await getArticles();

  return (
    <>
      <Breadcrumbs items={[{ label: "نوشته‌ها" }]} />
      <Container>
        <PageHeader
          eyebrow="تحریریه"
          title="نوشته‌ها و گزارش‌ها"
          description="گزارش رویدادها، جستارهای فرهنگی، خاطرات و روایت‌های اعضای گروه."
        />
        <CardGrid>
          {articles.map((a) => (
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
      </Container>
    </>
  );
}
