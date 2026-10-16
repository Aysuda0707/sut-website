import Link from "next/link";
import Image from "next/image";
import type { MediaAsset } from "@/lib/types";
import styles from "./ContentCard.module.css";

export interface ContentCardProps {
  href: string;
  title: string;
  summary: string;
  image: MediaAsset;
  meta?: string;
  eyebrow?: string;
  /** Larger, image-forward variant for featured/hero placements. */
  variant?: "default" | "featured";
}

export function ContentCard({
  href,
  title,
  summary,
  image,
  meta,
  eyebrow,
  variant = "default",
}: ContentCardProps) {
  return (
    <article
      className={[styles.card, variant === "featured" ? styles.featured : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <Link href={href} className={styles.link}>
        <div className={styles.media}>
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            className={styles.image}
            unoptimized={image.url.startsWith("data:")}
          />
        </div>
        <div className={styles.body}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.summary}>{summary}</p>
          {meta && <p className={styles.meta}>{meta}</p>}
        </div>
      </Link>
    </article>
  );
}
