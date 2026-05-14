"use server";

import { revalidatePath } from "next/cache";
import { updatePayment } from "@/lib/queries/organizers";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validatePaymentInput, type RawPaymentInput } from "./payment-input";

export async function updatePaymentAction(
  organizerId: string,
  paymentId: string,
  raw: RawPaymentInput,
): Promise<{ error?: string }> {
  const dict = await getServerDict();
  const v = validatePaymentInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    await updatePayment(paymentId, { ...v.value, organizer_id: organizerId });
    revalidatePath(`/ops/organizers/${organizerId}`);
    revalidatePath("/ops/organizers");
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
