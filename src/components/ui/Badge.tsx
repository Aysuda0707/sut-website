import Link from "next/link";
import styles from "./Badge.module.css";

export function Badge({
  children,
  href,
  tone = "neutral",
}: {
  children: React.ReactNode;
  href?: string;
  tone?: "neutral" | "accent" | "gold";
}) {
  const className = [styles.badge, styles[tone]].join(" ");
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <span className={className}>{children}</span>;
}
