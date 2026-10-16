import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSiteSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazirmatn",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.siteName} — ${settings.tagline}`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.introduction,
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: settings.siteName,
      title: `${settings.siteName} — ${settings.tagline}`,
      description: settings.introduction,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body>
        <a href="#main" className="skip-link">
          پرش به محتوای اصلی
        </a>
        <SiteHeader settings={settings} />
        <main id="main">{children}</main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
