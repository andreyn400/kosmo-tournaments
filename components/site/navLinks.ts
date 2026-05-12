export type NavLink = {
  href: string;
  label: string;
  icon: string;
  dividerBefore?: boolean;
};

export type AppMode = "tournaments" | "ops";

export const tournamentNavLinks: NavLink[] = [
  { href: "/", label: "Турниры", icon: "🏆" },
  { href: "/players", label: "Игроки", icon: "👥" },
  { href: "/courts", label: "Корты", icon: "🎾" },
  { href: "/calendar", label: "Календарь", icon: "📅" },
  { href: "/analytics", label: "Аналитика", icon: "📊" },
  { href: "/display", label: "Дисплей", icon: "📺", dividerBefore: true },
];

export const opsNavLinks: NavLink[] = [
  { href: "/ops/schedule", label: "Расписание", icon: "🗓" },
  { href: "/ops/rentals", label: "Аренда", icon: "📜" },
  { href: "/ops/coaches", label: "Тренеры", icon: "🎓" },
  { href: "/ops/organizers", label: "Организаторы", icon: "💼" },
  { href: "/ops/programs", label: "Программы", icon: "📦" },
  { href: "/ops/report", label: "Отчёт", icon: "📈" },
];

export const MODE_DEFAULT_PATH: Record<AppMode, string> = {
  tournaments: "/",
  ops: "/ops/schedule",
};

export function getModeFromPathname(pathname: string): AppMode {
  return pathname.startsWith("/ops") ? "ops" : "tournaments";
}

export function getNavLinksForMode(mode: AppMode): NavLink[] {
  return mode === "ops" ? opsNavLinks : tournamentNavLinks;
}

