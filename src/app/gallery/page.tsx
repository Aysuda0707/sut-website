import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getGalleryItems } from "@/lib/data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "گالری رسانه",
  description: "تصاویر و رسانه‌های برگزیده از رویدادها و فعالیت‌های گروه.",
};

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <>
      <Breadcrumbs items={[{ label: "گالری" }]} />
      <Container>
        <PageHeader
          eyebrow="رسانه"
          title="گالری رسانه"
          description="تصاویر برگزیده از رویدادها و فعالیت‌های گروه در طول سال‌ها."
        />
        {items.length === 0 ? (
          <p>هنوز رسانه‌ای منتشر نشده است.</p>
        ) : (
          <ul className={styles.grid}>
            {items.map((item) => (
              <li key={item.asset.id} className={styles.item}>
                <Link href={item.sourceHref} className={styles.link}>
                  <div className={styles.media}>
                    <Image
                      src={item.asset.url}
                      alt={item.asset.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 25vw"
                      className={styles.image}
                      unoptimized={item.asset.url.startsWith("data:")}
                    />
                  </div>
                  <span className={styles.caption}>{item.sourceTitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
