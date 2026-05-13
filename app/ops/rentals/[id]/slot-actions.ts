"use server";

import { revalidatePath } from "next/cache";
import {
  createException,
  createSlot,
  deleteException,
  deleteSlot,
  updateSlot,
} from "@/lib/queries/rentals";
import {
  validateExceptionInput,
  validateSlotInput,
  type RawExceptionInput,
  type RawSlotInput,
} from "./slot-input";

function revalidate(contractId: string) {
  revalidatePath("/ops/rentals");
  revalidatePath(`/ops/rentals/${contractId}`);
  // Scheduler overlay reflects new/removed slots immediately.
  revalidatePath("/ops/schedule");
}

export async function createSlotAction(
  contractId: string,
  raw: RawSlotInput,
): Promise<{ id?: string; error?: string }> {
  const v = validateSlotInput(raw);
  if (!v.ok) return { error: v.error };
  try {
    const slot = await createSlot({ ...v.value, contract_id: contractId });
    revalidate(contractId);
    return { id: slot.id };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось создать слот.",
    };
  }
}

export async function updateSlotAction(
  contractId: string,
  slotId: string,
  raw: RawSlotInput,
): Promise<{ error?: string }> {
  const v = validateSlotInput(raw);
  if (!v.ok) return { error: v.error };
  try {
    await updateSlot(slotId, { ...v.value, contract_id: contractId });
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось обновить слот.",
    };
  }
}

export async function deleteSlotAction(
  contractId: string,
  slotId: string,
): Promise<{ error?: string }> {
  try {
    await deleteSlot(slotId);
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось удалить слот.",
    };
  }
}

export async function createExceptionAction(
  contractId: string,
  slotId: string,
  raw: RawExceptionInput,
): Promise<{ id?: string; error?: string }> {
  const v = validateExceptionInput(raw);
  if (!v.ok) return { error: v.error };
  try {
    const ex = await createException({ ...v.value, slot_id: slotId });
    revalidate(contractId);
    return { id: ex.id };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось добавить исключение.",
    };
  }
}

export async function deleteExceptionAction(
  contractId: string,
  exceptionId: string,
): Promise<{ error?: string }> {
  try {
    await deleteException(exceptionId);
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось удалить исключение.",
    };
  }
}
