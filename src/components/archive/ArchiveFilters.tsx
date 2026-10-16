import Link from "next/link";
import type { Category, Tag } from "@/lib/types";
import { formatYear } from "@/lib/format";
import styles from "./ArchiveFilters.module.css";

interface Active {
  year?: string;
  category?: string;
  tag?: string;
}

function buildHref(basePath: string, active: Active, key: keyof Active, value?: string) {
  const next: Active = { ...active };
  if (!value || next[key] === value) {
    delete next[key];
  } else {
    next[key] = value;
  }
  const qs = new URLSearchParams(
    Object.entries(next).filter(([, v]) => v) as [string, string][],
  ).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function ArchiveFilters({
  years,
  categories,
  tags,
  active,
  basePath,
}: {
  years: number[];
  categories: Category[];
  tags: Tag[];
  active: Active;
  basePath: string;
}) {
  return (
    <div className={styles.filters}>
      <div className={styles.group}>
        <span className={styles.label}>سال:</span>
        <div className={styles.chips}>
          <Link
            href={buildHref(basePath, active, "year")}
            className={[styles.chip, !active.year ? styles.active : ""].join(" ")}
          >
            همه
          </Link>
          {years.map((y) => (
            <Link
              key={y}
              href={buildHref(basePath, active, "year", String(y))}
              className={[
                styles.chip,
                active.year === String(y) ? styles.active : "",
              ].join(" ")}
            >
              {formatYear(y)}
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>دسته‌بندی:</span>
        <div className={styles.chips}>
          <Link
            href={buildHref(basePath, active, "category")}
            className={[styles.chip, !active.category ? styles.active : ""].join(" ")}
          >
            همه
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref(basePath, active, "category", c.slug)}
              className={[
                styles.chip,
                active.category === c.slug ? styles.active : "",
              ].join(" ")}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>برچسب:</span>
        <div className={styles.chips}>
          <Link
            href={buildHref(basePath, active, "tag")}
            className={[styles.chip, !active.tag ? styles.active : ""].join(" ")}
          >
            همه
          </Link>
          {tags.map((t) => (
            <Link
              key={t.id}
              href={buildHref(basePath, active, "tag", t.slug)}
              className={[styles.chip, active.tag === t.slug ? styles.active : ""].join(" ")}
            >
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
