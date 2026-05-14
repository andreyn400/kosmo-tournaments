import type {
  RentalPaymentInput,
  RentalPaymentMethod,
  RentalPaymentType,
} from "@/lib/types";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface RawRentalPaymentInput {
  schedule_id: string;
  payment_date: string;
  amount_rub: string;
  payment_type: RentalPaymentType;
  method: RentalPaymentMethod;
  invoice_number: string;
  notes: string;
}

export type ValidatedRentalPayment =
  | { ok: true; value: Omit<RentalPaymentInput, "contract_id"> }
  | { ok: false; error: FieldError };

export function validateRentalPaymentInput(
  raw: RawRentalPaymentInput,
): ValidatedRentalPayment {
  if (!DATE_RE.test(raw.payment_date)) {
    return { ok: false, error: fieldErr("error.required.date") };
  }
  const amount = Number.parseInt(raw.amount_rub, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: fieldErr("error.invalid.amount_positive") };
  }
  if (amount > 1_000_000_000) {
    return { ok: false, error: fieldErr("error.invalid.amount_too_large") };
  }
  return {
    ok: true,
    value: {
      schedule_id: raw.schedule_id || null,
      payment_date: raw.payment_date,
      amount_rub: amount,
      payment_type: raw.payment_type,
      method: raw.method,
      invoice_number: raw.invoice_number.trim() || null,
      notes: raw.notes.trim() || null,
    },
  };
}

export interface RawScheduleEntryInput {
  period_label: string;
  amount_due_rub: string;
  due_date: string;
  notes: string;
}

const DATE_RE_2 = /^\d{4}-\d{2}-\d{2}$/;

export type ValidatedScheduleEntry =
  | {
      ok: true;
      value: {
        period_label: string;
        amount_due_rub: number;
        due_date: string;
        notes: string | null;
      };
    }
  | { ok: false; error: FieldError };

export function validateScheduleEntryInput(
  raw: RawScheduleEntryInput,
): ValidatedScheduleEntry {
  const label = raw.period_label.trim();
  if (!label) return { ok: false, error: fieldErr("error.required.period_name") };
  if (!DATE_RE_2.test(raw.due_date))
    return { ok: false, error: fieldErr("error.required.payment_date") };
  const amount = Number.parseInt(raw.amount_due_rub, 10);
  if (!Number.isFinite(amount) || amount < 0) {
    return {
      ok: false,
      error: fieldErr("error.invalid.amount_non_negative_int"),
    };
  }
  return {
    ok: true,
    value: {
      period_label: label,
      amount_due_rub: amount,
      due_date: raw.due_date,
      notes: raw.notes.trim() || null,
    },
  };
}
