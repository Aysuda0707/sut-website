import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "پنل مدیریت",
  robots: { index: false, follow: false },
};

/**
 * Admin shell. Intentionally separate from the public site chrome so editors
 * get a focused, distraction-free workspace. The public header/footer are
 * suppressed by nesting under this route segment.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-root">{children}</div>;
}
