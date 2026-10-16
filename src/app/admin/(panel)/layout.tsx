import { redirect } from "next/navigation";
import { isAuthenticated, usingDefaultPassword } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Authenticated admin shell. Every page nested here requires a valid session;
 * unauthenticated visitors are redirected to the login page.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <a className="admin-topbar__brand" href="/admin">
          مدیریت آرشیو
        </a>
        <AdminNav />
        <span className="admin-topbar__spacer" />
        <a className="admin-btn admin-btn--ghost" href="/" target="_blank" rel="noreferrer">
          مشاهده سایت
        </a>
      </header>

      <main className="admin-main">
        {usingDefaultPassword() ? (
          <div className="admin-alert admin-alert--warn" role="status">
            گذرواژه پیش‌فرض فعال است. برای امنیت بیشتر، مقدار
            <code> ADMIN_PASSWORD </code>
            را در فایل <code>.env.local</code> تنظیم کنید.
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
