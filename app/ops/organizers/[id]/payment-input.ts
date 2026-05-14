import type {
  OrganizerPaymentInput,
  OrganizerPaymentType,
} from "@/lib/types";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

export interface RawPaymentInput {
  date: string;
  amount_rub: string;
  type: OrganizerPaymentType;
  courts_booked: string;
  hours_booked: string;
  notes: string;
}

export type ValidatedPayment =
  | { ok: true; value: Omit<OrganizerPaymentInput, "organizer_id"> }
  | { ok: false; error: FieldError };

export function validatePaymentInput(raw: RawPaymentInput): ValidatedPayment {
  if (!raw.date || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
    return { ok: false, error: fieldErr("error.required.date") };
  }

  const amount = Number.parseInt(raw.amount_rub, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: fieldErr("error.invalid.amount_positive") };
  }
  if (amount > 100_000_000) {
    return { ok: false, error: fieldErr("error.invalid.amount_too_large") };
  }

  if (!["payment", "deposit", "refund"].includes(raw.type)) {
    return { ok: false, error: fieldErr("error.invalid.entry_type") };
  }

  let courts: number | null = null;
  if (raw.courts_booked.trim()) {
    const c = Number.parseInt(raw.courts_booked, 10);
    if (!Number.isFinite(c) || c < 0 || c > 99) {
      return { ok: false, error: fieldErr("error.invalid.courts_range_0_99") };
    }
    courts = c;
  }

  let hours: number | null = null;
  if (raw.hours_booked.trim()) {
    const h = Number.parseFloat(raw.hours_booked);
    if (!Number.isFinite(h) || h < 0 || h > 999) {
      return { ok: false, error: fieldErr("error.invalid.hours_range_0_999") };
    }
    hours = Math.round(h * 10) / 10;
  }

  return {
    ok: true,
    value: {
      date: raw.date,
      amount_rub: amount,
      type: raw.type,
      courts_booked: courts,
      hours_booked: hours,
      notes: raw.notes.trim() || null,
    },
  };
}

// PAYMENT_TYPE_LABELS / PAYMENT_TYPE_DESCRIPTIONS removed: UI callers translate
// via `lib/i18n/organizer-keys.ts` (ORGANIZER_PAYMENT_TYPE_KEY /
// ORGANIZER_PAYMENT_DESC_KEY).
