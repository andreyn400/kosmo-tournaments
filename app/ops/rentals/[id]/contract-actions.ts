"use server";

import { revalidatePath } from "next/cache";
import {
  deleteContract,
  updateContract,
} from "@/lib/queries/rentals";
import { validateContractInput, type RawContractInput } from "./contract-input";

export async function updateContractAction(
  id: string,
  raw: RawContractInput,
): Promise<{ error?: string }> {
  const v = validateContractInput(raw);
  if (!v.ok) return { error: v.error };
  try {
    await updateContract(id, v.value);
    revalidatePath("/ops/rentals");
    revalidatePath(`/ops/rentals/${id}`);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Не удалось обновить контракт.",
    };
  }
}

export async function deleteContractAction(
  id: string,
): Promise<{ error?: string }> {
  try {
    await deleteContract(id);
    revalidatePath("/ops/rentals");
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Не удалось удалить контракт.",
    };
  }
}
