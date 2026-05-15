import type { Lang } from "@/lib/i18n/types";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

type Props = {
  lang: Lang;
  children: React.ReactNode;
};

export function PublicShell({ lang, children }: Props) {
  return (
    <div
      lang={lang}
      className="min-h-screen flex flex-col bg-[var(--bg-page)]"
    >
      <PublicHeader lang={lang} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
