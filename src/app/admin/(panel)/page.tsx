import { readDatabase } from "@/lib/store";
import { storeFilePath } from "@/lib/store";

/**
 * Admin dashboard. Shows a quick overview of how much content exists in the
 * local store and links into each collection.
 */
export default async function AdminDashboardPage() {
  const db = await readDatabase();

  const tiles = [
    { href: "/admin/events", label: "رویدادها", count: db.events.length },
    { href: "/admin/articles", label: "نوشته‌ها", count: db.articles.length },
    { href: "/admin/podcasts", label: "قسمت‌های پادکست", count: db.podcasts.length },
    { href: "/admin/interviews", label: "گفت‌وگوها", count: db.interviews.length },
    { href: "/admin/media", label: "فایل‌های رسانه", count: db.media.length },
    { href: "/admin/settings", label: "دسته‌ها و برچسب‌ها", count: db.categories.length + db.tags.length },
  ];

  return (
    <>
      <h1 className="admin-page-title">داشبورد</h1>
      <p className="admin-page-lead">
        محتوای سایت را از این‌جا مدیریت کنید. تغییرات بلافاصله در سایت اعمال
        می‌شوند.
      </p>

      <div className="admin-grid">
        {tiles.map((tile) => (
          <a key={tile.href} className="admin-tile" href={tile.href}>
            <div className="admin-tile__count">{tile.count}</div>
            <div className="admin-tile__label">{tile.label}</div>
          </a>
        ))}
      </div>

      <div className="admin-card" style={{ marginTop: "var(--space-6)" }}>
        <h2 className="admin-section-title" style={{ marginTop: 0 }}>
          محل ذخیره‌سازی
        </h2>
        <p className="admin-muted">
          همه‌ی محتوا در یک فایل JSON روی سرور ذخیره می‌شود. برای پشتیبان‌گیری
          کافی است همین فایل را کپی کنید.
        </p>
        <p>
          <code>{storeFilePath()}</code>
        </p>
      </div>
    </>
  );
}
