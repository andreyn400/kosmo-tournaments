"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "./navLinks";

type SidebarNavProps = {
  onNavigate?: () => void;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {navLinks.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Fragment key={link.href}>
            {link.dividerBefore && (
              <hr
                aria-hidden
                className="my-2 mx-1 border-0 border-t border-border"
              />
            )}
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={[
                "relative flex items-center gap-3 h-10 pl-4 pr-3 rounded-md text-sm transition-colors",
                active
                  ? "text-black bg-subtle font-semibold"
                  : "text-muted hover:text-black hover:bg-subtle font-medium",
              ].join(" ")}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-accent rounded-r"
                />
              )}
              <span className="text-base leading-none" aria-hidden>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
