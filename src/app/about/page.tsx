import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getSiteSettings } from "@/lib/data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "درباره گروه",
  description: "معرفی گروه دانشجویی آذربایجان دانشگاه صنعتی شریف و اهداف آن.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Breadcrumbs items={[{ label: "درباره گروه" }]} />
      <Container narrow>
        <PageHeader eyebrow="معرفی" title="درباره گروه" />
        <div className={styles.body}>
          <p className={styles.lead}>{settings.introduction}</p>

          <h2>اهداف ما</h2>
          <ul>
            <li>پاسداشت و معرفی فرهنگ، زبان و هنر آذربایجان.</li>
            <li>ایجاد فضایی برای گردهمایی و هم‌افزایی دانشجویان.</li>
            <li>مستندسازی و آرشیو فعالیت‌های فرهنگی گروه.</li>
            <li>پیوند نسل‌های دانشجویی از طریق روایت و گفت‌وگو.</li>
          </ul>

          <h2>این آرشیو</h2>
          <p>
            این وب‌سایت، آرشیوی از رویدادها، پادکست‌ها، گفت‌وگوها و نوشته‌های
            گروه است. محتوای آن به‌صورت مستمر توسط اعضای گروه به‌روزرسانی
            می‌شود.
          </p>

          <h2>ارتباط با ما</h2>
          {settings.contactEmail && (
            <p>
              برای ارتباط، می‌توانید به نشانی{" "}
              <a href={`mailto:${settings.contactEmail}`} className="ltr-inline">
                {settings.contactEmail}
              </a>{" "}
              ایمیل بزنید.
            </p>
          )}
          <ul className={styles.social}>
            {settings.socialLinks.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>

          <p className={styles.cta}>
            <Link href="/events">مرور آرشیو رویدادها ←</Link>
          </p>
        </div>
      </Container>
    </>
  );
}
