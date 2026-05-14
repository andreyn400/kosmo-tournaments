"use server";

import { revalidatePath } from "next/cache";
import { deletePayment } from "@/lib/queries/organizers";
import { getServerDict } from "@/lib/i18n/server";

export async function deletePaymentAction(
  organizerId: string,
  paymentId: string,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  try {
    await deletePayment(paymentId);
    revalidatePath(`/ops/organizers/${organizerId}`);
    revalidatePath("/ops/organizers");
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
