export type NavLink = {
  href: string;
  label: string;
  icon: string;
};

export const navLinks: NavLink[] = [
  { href: "/", label: "Турниры", icon: "🏆" },
  { href: "/players", label: "Игроки", icon: "👥" },
  { href: "/courts", label: "Корты", icon: "🎾" },
  { href: "/calendar", label: "Календарь", icon: "📅" },
  { href: "/analytics", label: "Аналитика", icon: "📊" },
];
