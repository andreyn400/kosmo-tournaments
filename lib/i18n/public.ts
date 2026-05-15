import "server-only";

import { headers } from "next/headers";
import { DEFAULT_LANG, isLang, type Lang } from "./types";

export async function resolvePublicLang(
  searchParamsLang: string | string[] | undefined,
): Promise<Lang> {
  const raw = Array.isArray(searchParamsLang)
    ? searchParamsLang[0]
    : searchParamsLang;
  if (isLang(raw)) return raw;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.trim().toLowerCase().startsWith("en") ? "en" : DEFAULT_LANG;
}
