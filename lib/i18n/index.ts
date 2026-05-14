import { en } from "./en";
import { ru, type Dictionary } from "./ru";
import type { Lang } from "./types";

export { ru, en };
export type { Dictionary };
export type TranslationKey = keyof Dictionary;

export const DICTS: Record<Lang, Dictionary> = { ru, en };

export type TranslationVars = Record<string, string | number>;

function interpolate(template: string, vars: TranslationVars | undefined): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (full, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : full,
  );
}

export function translate(
  lang: Lang,
  key: TranslationKey,
  vars?: TranslationVars,
): string {
  const dict = DICTS[lang];
  const fromLang = (dict as Record<string, string | undefined>)[key as string];
  if (typeof fromLang === "string") return interpolate(fromLang, vars);
  const fromRu = (DICTS.ru as Record<string, string | undefined>)[key as string];
  if (typeof fromRu === "string") return interpolate(fromRu, vars);
  return String(key);
}

export interface PluralKeys {
  one: TranslationKey;
  few?: TranslationKey;
  many: TranslationKey;
}

export function tPlural(
  lang: Lang,
  count: number,
  keys: PluralKeys,
  vars?: TranslationVars,
): string {
  const mergedVars = { count, ...(vars ?? {}) };
  if (lang === "ru") {
    const mod10 = count % 10;
    const mod100 = count % 100;
    let pluralKey: TranslationKey;
    if (mod10 === 1 && mod100 !== 11) {
      pluralKey = keys.one;
    } else if (
      mod10 >= 2 &&
      mod10 <= 4 &&
      (mod100 < 12 || mod100 > 14)
    ) {
      pluralKey = keys.few ?? keys.many;
    } else {
      pluralKey = keys.many;
    }
    return translate(lang, pluralKey, mergedVars);
  }
  const pluralKey: TranslationKey = count === 1 ? keys.one : keys.many;
  return translate(lang, pluralKey, mergedVars);
}

export type { Lang } from "./types";
export { LANG_COOKIE, LANG_COOKIE_MAX_AGE, LANGS, DEFAULT_LANG, isLang } from "./types";
