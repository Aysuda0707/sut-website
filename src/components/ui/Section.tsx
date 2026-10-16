import Link from "next/link";
import styles from "./Section.module.css";

export function Section({
  title,
  description,
  moreHref,
  moreLabel = "مشاهده همه",
  children,
}: {
  title: string;
  description?: string;
  moreHref?: string;
  moreLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {moreHref && (
          <Link href={moreHref} className={styles.more}>
            {moreLabel} ←
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
