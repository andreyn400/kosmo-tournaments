"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  isLang,
  type Lang,
} from "./types";

export async function setLangAction(lang: Lang): Promise<void> {
  if (!isLang(lang)) return;
  const store = await cookies();
  store.set(LANG_COOKIE, lang, {
    maxAge: LANG_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
