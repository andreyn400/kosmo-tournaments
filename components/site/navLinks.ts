export type NavLink = {
  href: string;
  label: string;
  icon?: string;
};

export type NavSection = {
  title: string;
  dividerAbove?: boolean;
  links: NavLink[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "КОРТЫ",
    links: [
      { href: "/ops/schedule", label: "Расписание" },
      { href: "/ops/rentals", label: "Аренда" },
      { href: "/calendar", label: "Календарь" },
      { href: "/courts", label: "Корты" },
      { href: "/ops/report", label: "Отчёт" },
    ],
  },
  {
    title: "ТУРНИРЫ",
    links: [
      { href: "/", label: "Турниры и лиги" },
      { href: "/players", label: "Игроки" },
      { href: "/analytics", label: "Аналитика" },
    ],
  },
  {
    title: "ПЕРСОНАЛ",
    links: [
      { href: "/ops/coaches", label: "Тренеры" },
      { href: "/ops/organizers", label: "Организаторы" },
    ],
  },
  {
    title: "ПРОГРАММЫ",
    links: [{ href: "/ops/programs", label: "Программы" }],
  },
  {
    title: "СИСТЕМА",
    dividerAbove: true,
    links: [{ href: "/display", label: "Дисплей", icon: "📺" }],
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
