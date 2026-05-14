"use server";

import { revalidatePath } from "next/cache";
import {
  createScheduleEntry,
  deleteScheduleEntry,
  getContract,
  replaceSchedule,
  updateScheduleEntry,
} from "@/lib/queries/rentals";
import { generateSchedule } from "@/lib/rental-schedule-gen";
import { getServerDict, getServerLang } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import {
  validateScheduleEntryInput,
  type RawScheduleEntryInput,
} from "./payment-input";

function revalidate(contractId: string) {
  revalidatePath("/ops/rentals");
  revalidatePath(`/ops/rentals/${contractId}`);
}

export async function createScheduleEntryAction(
  contractId: string,
  raw: RawScheduleEntryInput,
): Promise<{ id?: string; error?: string }> {
  const dict = await getServerDict();
  const v = validateScheduleEntryInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };
  try {
    const e = await createScheduleEntry({ ...v.value, contract_id: contractId });
    revalidate(contractId);
    return { id: e.id };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : dict["error.failed.create.schedule_record"],
    };
  }
}

export async function updateScheduleEntryAction(
  contractId: string,
  entryId: string,
  raw: RawScheduleEntryInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const v = validateScheduleEntryInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };
  try {
    await updateScheduleEntry(entryId, { ...v.value, contract_id: contractId });
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : dict["error.failed.update.schedule_record"],
    };
  }
}

export async function deleteScheduleEntryAction(
  contractId: string,
  entryId: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    await deleteScheduleEntry(entryId);
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : dict["error.failed.delete.schedule_record"],
    };
  }
}

/**
 * Wipe and regenerate the schedule from current contract terms. Dangerous if
 * payments are already linked to entries — those `schedule_id` FKs nullify
 * via the existing `on delete set null`, so historic links are lost but the
 * payments themselves survive. UI must confirm before calling.
 */
export async function regenerateScheduleAction(
  contractId: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const lang = await getServerLang();
  try {
    const contract = await getContract(contractId);
    if (!contract) return { error: dict["error.not_found.contract"] };
    const entries = generateSchedule({
      start_date: contract.start_date,
      end_date: contract.end_date,
      total_value_rub: contract.total_value_rub,
      payment_schedule_type: contract.payment_schedule_type,
      labels: {
        fullPayment: dict["rental.schedule.full_payment_label"],
        lang,
      },
    });
    await replaceSchedule(contractId, entries);
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : dict["error.failed.recompute.schedule"],
    };
  }
}
