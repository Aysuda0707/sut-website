import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { primaryNav } from "@/lib/site";
import { MobileNav } from "./MobileNav";
import { SearchBox } from "./SearchBox";
import styles from "./SiteHeader.module.css";

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={settings.siteName}>
          <span className={styles.brandMark} aria-hidden="true">
            آ
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{settings.siteName}</span>
            <span className={styles.brandTagline}>{settings.tagline}</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="ناوبری اصلی">
          <ul className={styles.navList}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <SearchBox />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
