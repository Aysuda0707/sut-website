"use client";

import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "داشبورد" },
  { href: "/admin/events", label: "رویدادها" },
  { href: "/admin/articles", label: "نوشته‌ها" },
  { href: "/admin/podcasts", label: "پادکست" },
  { href: "/admin/interviews", label: "گفت‌وگوها" },
  { href: "/admin/media", label: "رسانه" },
  { href: "/admin/settings", label: "تنظیمات" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <nav className="admin-nav" aria-label="ناوبری پنل مدیریت">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <a
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </a>
        );
      })}
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        onClick={logout}
      >
        خروج
      </button>
    </nav>
  );
}
