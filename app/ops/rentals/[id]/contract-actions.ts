"use server";

import { revalidatePath } from "next/cache";
import {
  deleteContract,
  updateContract,
} from "@/lib/queries/rentals";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validateContractInput, type RawContractInput } from "./contract-input";

export async function updateContractAction(
  id: string,
  raw: RawContractInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const v = validateContractInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };
  try {
    await updateContract(id, v.value);
    revalidatePath("/ops/rentals");
    revalidatePath(`/ops/rentals/${id}`);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.update.contract"],
    };
  }
}

export async function deleteContractAction(
  id: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    await deleteContract(id);
    revalidatePath("/ops/rentals");
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.delete.contract"],
    };
  }
}
