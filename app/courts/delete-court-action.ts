"use server";

import { revalidatePath } from "next/cache";
import { countTournamentsUsingCourt, deleteCourt } from "@/lib/queries/courts";
import { getServerDict, getServerLang } from "@/lib/i18n/server";
import { translate, type TranslationKey } from "@/lib/i18n";
import { pluralize } from "@/lib/i18n/format";

export async function deleteCourtAction(
  id: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    const refs = await countTournamentsUsingCourt(id);
    if (refs > 0) {
      const lang = await getServerLang();
      const key = pluralize<TranslationKey>(
        refs,
        {
          one: "error.court_used.one",
          few: "error.court_used.few",
          many: "error.court_used.many",
        },
        lang,
      );
      return { error: translate(lang, key, { n: refs }) };
    }
    await deleteCourt(id);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : dict["error.failed.delete.court"],
    };
  }

  revalidatePath("/courts");
  revalidatePath("/tournament/new");
  revalidatePath("/league/new");
  return {};
}
