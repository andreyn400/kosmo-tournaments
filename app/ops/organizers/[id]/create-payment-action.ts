"use server";

import { revalidatePath } from "next/cache";
import { createPayment } from "@/lib/queries/organizers";
import { validatePaymentInput, type RawPaymentInput } from "./payment-input";

export async function createPaymentAction(
  organizerId: string,
  raw: RawPaymentInput,
): Promise<{ id?: string; error?: string }> {
  const v = validatePaymentInput(raw);
  if (!v.ok) return { error: v.error };

  try {
    const payment = await createPayment({ ...v.value, organizer_id: organizerId });
    revalidatePath(`/ops/organizers/${organizerId}`);
    revalidatePath("/ops/organizers");
    return { id: payment.id };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось добавить запись.",
    };
  }
}
