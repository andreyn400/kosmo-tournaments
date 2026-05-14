"use server";

import { revalidatePath } from "next/cache";
import {
  createPayment,
  deletePayment,
  updatePayment,
} from "@/lib/queries/rentals";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
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
  const dict = await getServerDict();
  const v = validateRentalPaymentInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };
  try {
    const p = await createPayment({ ...v.value, contract_id: contractId });
    revalidate(contractId);
    return { id: p.id };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.create.payment"],
    };
  }
}

export async function updatePaymentAction(
  contractId: string,
  paymentId: string,
  raw: RawRentalPaymentInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const v = validateRentalPaymentInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };
  try {
    await updatePayment(paymentId, { ...v.value, contract_id: contractId });
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.update.payment"],
    };
  }
}

export async function deletePaymentAction(
  contractId: string,
  paymentId: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    await deletePayment(paymentId);
    revalidate(contractId);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : dict["error.failed.delete.payment"],
    };
  }
}
