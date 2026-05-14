"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { setLangAction } from "@/lib/i18n/set-lang-action";
import {
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  translate,
  tPlural,
  type Lang,
  type PluralKeys,
  type TranslationKey,
  type TranslationVars,
} from "@/lib/i18n";

export interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  tPlural: (count: number, keys: PluralKeys, vars?: TranslationVars) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

function writeClientCookie(lang: Lang): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
}

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      setLangState(next);
      writeClientCookie(next);
      void setLangAction(next).then(() => {
        router.refresh();
      });
    },
    [lang, router],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      tPlural: (count, keys, vars) => tPlural(lang, count, keys, vars),
    }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
