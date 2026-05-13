"use server";

import { revalidatePath } from "next/cache";
import {
  createPayment,
  deletePayment,
  updatePayment,
} from "@/lib/queries/rentals";
import {
  validateRentalPaymentInput,
  type RawRentalPaymentInput,
} from "./payment-input";

function revalidate(contractId: string) {
  revalidatePath("/ops/rentals");
  revalidatePath(`/ops/rentals/${contractId}`);
}

export async function createPaymentAction(
  contractId: string,
  raw: RawRentalPaymentInput,
): Promise<{ id?: string; error?: string }> {
  const v = validateRentalPaymentInput(raw);
  if (!v.ok) return { error: v.error };
  try {
    const p = await createPayment({ ...v.value, contract_id: contractId });
    revalidate(contractId);
    return { id: p.id };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось добавить платёж.",
    };
  }
}

export async function updatePaymentAction(
  contractId: string,
  paymentId: string,
  raw: RawRentalPaymentInput,
): Promise<{ error?: string }> {
  const v = validateRentalPaymentInput(raw);
  if (!v.ok) return { error: v.error };
  try {
    await updatePayment(paymentId, { ...v.value, contract_id: contractId });
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось обновить платёж.",
    };
  }
}

export async function deletePaymentAction(
  contractId: string,
  paymentId: string,
): Promise<{ error?: string }> {
  try {
    await deletePayment(paymentId);
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось удалить платёж.",
    };
  }
}
