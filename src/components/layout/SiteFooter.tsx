import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { primaryNav } from "@/lib/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.col}>
          <h2 className={styles.heading}>{settings.siteName}</h2>
          <p className={styles.text}>{settings.tagline}</p>
          {settings.contactEmail && (
            <p className={styles.text}>
              <a href={`mailto:${settings.contactEmail}`} className="ltr-inline">
                {settings.contactEmail}
              </a>
            </p>
          )}
        </div>

        <nav className={styles.col} aria-label="پیوندهای پانوشت">
          <h2 className={styles.heading}>بخش‌ها</h2>
          <ul className={styles.list}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.col}>
          <h2 className={styles.heading}>ما را دنبال کنید</h2>
          <ul className={styles.list}>
            {settings.socialLinks.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copy}>{settings.footerText}</p>
      </div>
    </footer>
  );
}
