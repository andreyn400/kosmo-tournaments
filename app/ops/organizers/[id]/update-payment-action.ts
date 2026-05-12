"use server";

import { revalidatePath } from "next/cache";
import { updatePayment } from "@/lib/queries/organizers";
import { validatePaymentInput, type RawPaymentInput } from "./payment-input";

export async function updatePaymentAction(
  organizerId: string,
  paymentId: string,
  raw: RawPaymentInput,
): Promise<{ error?: string }> {
  const v = validatePaymentInput(raw);
  if (!v.ok) return { error: v.error };

  try {
    await updatePayment(paymentId, { ...v.value, organizer_id: organizerId });
    revalidatePath(`/ops/organizers/${organizerId}`);
    revalidatePath("/ops/organizers");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось обновить запись.",
    };
  }
}
