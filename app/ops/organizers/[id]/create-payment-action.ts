"use server";

import { revalidatePath } from "next/cache";
import { createPayment } from "@/lib/queries/organizers";
import { getServerDict } from "@/lib/i18n/server";
import { resolveErrorWithDict } from "@/lib/i18n/error-helpers";
import { validatePaymentInput, type RawPaymentInput } from "./payment-input";

export async function createPaymentAction(
  organizerId: string,
  raw: RawPaymentInput,
): Promise<{ id?: string; error?: string }> {
  const dict = await getServerDict();
  const v = validatePaymentInput(raw);
  if (!v.ok) return { error: resolveErrorWithDict(v.error, dict) };

  try {
    const payment = await createPayment({ ...v.value, organizer_id: organizerId });
    revalidatePath(`/ops/organizers/${organizerId}`);
    revalidatePath("/ops/organizers");
    return { id: payment.id };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : dict["error.failed.create.schedule_record"],
    };
  }
}
