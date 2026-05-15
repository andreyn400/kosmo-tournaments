import { Suspense } from "react";
import { translate } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/types";
import { PublicLanguageToggle } from "./PublicLanguageToggle";

type Props = {
  lang: Lang;
};

export function PublicHeader({ lang }: Props) {
  const brandLetter = translate(lang, "brand.icon_letter");

  return (
    <header className="w-full bg-[var(--bg-surface)] border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5" aria-label="KOSMO">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white font-bold text-sm">
            {brandLetter}
          </span>
          <span className="text-[13px] font-bold tracking-[0.14em] text-black leading-none">
            KOSMO
          </span>
        </div>
        <Suspense fallback={null}>
          <PublicLanguageToggle lang={lang} />
        </Suspense>
      </div>
    </header>
  );
}
