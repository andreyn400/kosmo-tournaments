import "server-only";

import { cookies } from "next/headers";
import {
  DEFAULT_LANG,
  DICTS,
  LANG_COOKIE,
  isLang,
  translate,
  type Dictionary,
  type Lang,
  type TranslationKey,
  type TranslationVars,
} from ".";

export async function getServerLang(): Promise<Lang> {
  const store = await cookies();
  const raw = store.get(LANG_COOKIE)?.value;
  return isLang(raw) ? raw : DEFAULT_LANG;
}

export async function getServerDict(): Promise<Dictionary> {
  const lang = await getServerLang();
  return DICTS[lang];
}

export async function st(
  key: TranslationKey,
  vars?: TranslationVars,
): Promise<string> {
  const lang = await getServerLang();
  return translate(lang, key, vars);
}
