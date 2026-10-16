import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { search } from "@/lib/data";
import { contentLabels } from "@/lib/site";
import { formatPersianDate, formatYear } from "@/lib/format";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "جست‌وجو",
  description: "جست‌وجو در آرشیو رویدادها، نوشته‌ها، پادکست‌ها و گفت‌وگوها.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await search(query) : [];

  return (
    <>
      <Breadcrumbs items={[{ label: "جست‌وجو" }]} />
      <Container>
        <PageHeader
          eyebrow="جست‌وجو"
          title={query ? `نتایج برای «${query}»` : "جست‌وجو در آرشیو"}
          description={
            query
              ? `${formatYear(results.length)} نتیجه یافت شد.`
              : "عبارت مورد نظر خود را در کادر جست‌وجوی بالای صفحه وارد کنید."
          }
        />

        {query && results.length === 0 && (
          <p className={styles.empty}>
            نتیجه‌ای یافت نشد. لطفاً عبارت دیگری را امتحان کنید.
          </p>
        )}

        {results.length > 0 && (
          <ul className={styles.list}>
            {results.map((r) => (
              <li key={`${r.type}-${r.slug}`} className={styles.item}>
                <div className={styles.itemHead}>
                  <Badge tone="gold">{contentLabels[r.type]}</Badge>
                  {r.date && (
                    <span className={styles.date}>{formatPersianDate(r.date)}</span>
                  )}
                </div>
                <h2 className={styles.itemTitle}>
                  <Link href={r.href}>{r.title}</Link>
                </h2>
                <p className={styles.itemSummary}>{r.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
