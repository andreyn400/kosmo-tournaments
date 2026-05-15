"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LANGS } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/types";

const LANG_LABEL: Record<Lang, string> = {
  ru: "RU",
  en: "EN",
};

type Props = {
  lang: Lang;
};

export function PublicLanguageToggle({ lang }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onSelect(target: Lang) {
    if (target === lang) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", target);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-stretch overflow-hidden rounded-md border border-border bg-surface"
    >
      {LANGS.map((option) => {
        const active = option === lang;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option)}
            className={[
              "relative inline-flex h-7 w-9 items-center justify-center text-xs tracking-wide transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              active
                ? "bg-subtle text-black font-semibold"
                : "text-muted hover:text-black",
            ].join(" ")}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute left-0 top-1 bottom-1 w-[2px] rounded-sm bg-[var(--color-accent)]"
              />
            ) : null}
            {LANG_LABEL[option]}
          </button>
        );
      })}
    </div>
  );
}
