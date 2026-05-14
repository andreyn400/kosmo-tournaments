import type { TranslationKey } from "@/lib/i18n";

export type NavLink = {
  href: string;
  labelKey: TranslationKey;
  icon?: string;
};

export type NavSection = {
  titleKey: TranslationKey;
  dividerAbove?: boolean;
  links: NavLink[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "nav.section.courts",
    links: [
      { href: "/ops/schedule", labelKey: "nav.schedule" },
      { href: "/ops/rentals", labelKey: "nav.rentals" },
      { href: "/calendar", labelKey: "nav.calendar" },
      { href: "/courts", labelKey: "nav.courts" },
      { href: "/ops/report", labelKey: "nav.report" },
    ],
  },
  {
    titleKey: "nav.section.tournaments",
    links: [
      { href: "/", labelKey: "nav.tournaments_and_leagues" },
      { href: "/players", labelKey: "nav.players" },
      { href: "/analytics", labelKey: "nav.analytics" },
    ],
  },
  {
    titleKey: "nav.section.staff",
    links: [
      { href: "/ops/coaches", labelKey: "nav.coaches" },
      { href: "/ops/organizers", labelKey: "nav.organizers" },
    ],
  },
  {
    titleKey: "nav.section.programs",
    links: [{ href: "/ops/programs", labelKey: "nav.programs" }],
  },
  {
    titleKey: "nav.section.system",
    dividerAbove: true,
    links: [{ href: "/display", labelKey: "nav.display", icon: "📺" }],
  },
];

export function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSectionActive(
  pathname: string,
  section: NavSection,
): boolean {
  return section.links.some((link) => isLinkActive(pathname, link.href));
}
