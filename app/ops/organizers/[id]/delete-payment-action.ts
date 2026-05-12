"use server";

import { revalidatePath } from "next/cache";
import { deletePayment } from "@/lib/queries/organizers";

export async function deletePaymentAction(
  organizerId: string,
  paymentId: string,
): Promise<{ error?: string }> {
  try {
    await deletePayment(paymentId);
    revalidatePath(`/ops/organizers/${organizerId}`);
    revalidatePath("/ops/organizers");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось удалить запись.",
    };
  }
}
