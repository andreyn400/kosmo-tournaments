"use server";

import { revalidatePath } from "next/cache";
import {
  createContract,
  createScheduleEntry,
  createSlot,
  deleteContract,
} from "@/lib/queries/rentals";
import { validateContractInput, type RawContractInput } from "../[id]/contract-input";
import { validateSlotInput, type RawSlotInput } from "../[id]/slot-input";
import { validateScheduleEntryInput, type RawScheduleEntryInput } from "../[id]/payment-input";

export interface CreateContractBundle {
  contract: RawContractInput;
  slots: RawSlotInput[];
  schedule: RawScheduleEntryInput[];
}

/**
 * Single-shot contract creation: contract → slots → schedule. Not strictly
 * transactional (Supabase JS lacks BEGIN/COMMIT), but failures roll back by
 * deleting the contract — the FK cascade then drops any partially-inserted
 * slot or schedule rows.
 */
export async function createContractWithBundleAction(
  bundle: CreateContractBundle,
): Promise<{ id?: string; error?: string }> {
  // Validate everything up front so we never even create the contract if
  // anything downstream is malformed.
  const contractV = validateContractInput(bundle.contract);
  if (!contractV.ok) return { error: contractV.error };

  const slotValues = [];
  for (const s of bundle.slots) {
    const v = validateSlotInput(s);
    if (!v.ok) return { error: `Слот: ${v.error}` };
    slotValues.push(v.value);
  }

  const scheduleValues = [];
  for (const e of bundle.schedule) {
    const v = validateScheduleEntryInput(e);
    if (!v.ok) return { error: `График: ${v.error}` };
    scheduleValues.push(v.value);
  }

  let contractId: string | null = null;
  try {
    const contract = await createContract(contractV.value);
    contractId = contract.id;

    for (const s of slotValues) {
      await createSlot({ ...s, contract_id: contract.id });
    }
    for (const e of scheduleValues) {
      await createScheduleEntry({ ...e, contract_id: contract.id });
    }

    revalidatePath("/ops/rentals");
    revalidatePath("/ops/schedule");
    return { id: contract.id };
  } catch (e) {
    // Best-effort rollback: deleting the contract cascades to slots/schedule.
    if (contractId) {
      try {
        await deleteContract(contractId);
      } catch {
        // Swallow — the original error is the meaningful one.
      }
    }
    return {
      error: e instanceof Error ? e.message : "Не удалось создать контракт.",
    };
  }
}
