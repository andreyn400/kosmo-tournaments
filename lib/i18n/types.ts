export type Lang = "ru" | "en";

export const LANGS: readonly Lang[] = ["ru", "en"] as const;

export const DEFAULT_LANG: Lang = "ru";

export const LANG_COOKIE = "kosmo_lang";

export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLang(value: string | undefined | null): value is Lang {
  return value === "ru" || value === "en";
}
