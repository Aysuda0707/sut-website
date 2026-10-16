/**
 * Static site configuration and navigation.
 * Values that editors should control live in site_settings (CMS); this file
 * holds only structural constants.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface NavItem {
  href: string;
  label: string;
}

export const primaryNav: NavItem[] = [
  { href: "/", label: "خانه" },
  { href: "/events", label: "رویدادها" },
  { href: "/podcast", label: "پادکست" },
  { href: "/interviews", label: "گفت‌وگوها" },
  { href: "/stories", label: "نوشته‌ها" },
  { href: "/gallery", label: "گالری" },
  { href: "/about", label: "درباره گروه" },
];

export const contentLabels: Record<string, string> = {
  event: "رویداد",
  article: "نوشته",
  podcast: "پادکست",
  interview: "گفت‌وگو",
};
