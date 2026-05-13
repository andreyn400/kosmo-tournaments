"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NAV_SECTIONS,
  type NavSection,
  isLinkActive,
  isSectionActive,
} from "./navLinks";

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col p-3 pt-1">
      {NAV_SECTIONS.map((section, idx) => (
        <Fragment key={section.title}>
          {section.dividerAbove && (
            <hr
              aria-hidden
              className="my-3 mx-1 border-0 border-t border-border"
            />
          )}
          <SectionGroup
            section={section}
            pathname={pathname}
            isFirst={idx === 0}
            onNavigate={onNavigate}
          />
        </Fragment>
      ))}
    </nav>
  );
}

function SectionGroup({
  section,
  pathname,
  isFirst,
  onNavigate,
}: {
  section: NavSection;
  pathname: string;
  isFirst: boolean;
  onNavigate?: () => void;
}) {
  const sectionActive = isSectionActive(pathname, section);
  return (
    <div className={isFirst ? "" : "mt-4"}>
      <div
        className={[
          "px-4 pt-1 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] select-none transition-colors",
          sectionActive ? "text-[var(--color-accent)]" : "text-muted",
        ].join(" ")}
      >
        {section.title}
      </div>
      <div className="flex flex-col gap-0.5">
        {section.links.map((link) => {
          const active = isLinkActive(pathname, link.href);
          return (
            <Link
              key={link.href}
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
              {link.icon && (
                <span className="text-base leading-none" aria-hidden>
                  {link.icon}
                </span>
              )}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
