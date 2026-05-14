import type {
  RentalExceptionType,
  RentalSlotExceptionInput,
  RentalSlotInput,
} from "@/lib/types";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface RawSlotInput {
  court_ids: string[];
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes: string;
}

export type ValidatedSlot =
  | { ok: true; value: Omit<RentalSlotInput, "contract_id"> }
  | { ok: false; error: FieldError };

export function validateSlotInput(raw: RawSlotInput): ValidatedSlot {
  if (raw.court_ids.length === 0) {
    return { ok: false, error: fieldErr("error.courts.at_least_one") };
  }
  if (!Number.isInteger(raw.day_of_week) || raw.day_of_week < 0 || raw.day_of_week > 6) {
    return { ok: false, error: fieldErr("error.invalid.weekday_out_of_range") };
  }
  if (!TIME_RE.test(raw.start_time) || !TIME_RE.test(raw.end_time)) {
    return { ok: false, error: fieldErr("error.invalid.time_format_short") };
  }
  if (raw.end_time <= raw.start_time) {
    return { ok: false, error: fieldErr("error.invalid.end_time_after_start") };
  }
  return {
    ok: true,
    value: {
      court_ids: raw.court_ids,
      day_of_week: raw.day_of_week,
      start_time: raw.start_time,
      end_time: raw.end_time,
      notes: raw.notes.trim() || null,
    },
  };
}

export interface RawExceptionInput {
  exception_type: RentalExceptionType;
  from_date: string;
  to_date: string;
  reason: string;
}

export type ValidatedException =
  | { ok: true; value: Omit<RentalSlotExceptionInput, "slot_id"> }
  | { ok: false; error: FieldError };

export function validateExceptionInput(
  raw: RawExceptionInput,
): ValidatedException {
  if (!DATE_RE.test(raw.from_date)) {
    return {
      ok: false,
      error: fieldErr("error.required.exception_date_start"),
    };
  }
  if (!DATE_RE.test(raw.to_date)) {
    return {
      ok: false,
      error: fieldErr("error.required.exception_date_end"),
    };
  }
  if (raw.to_date < raw.from_date) {
    return { ok: false, error: fieldErr("error.invalid.end_before_start") };
  }
  return {
    ok: true,
    value: {
      exception_type: raw.exception_type,
      from_date: raw.from_date,
      to_date: raw.to_date,
      reason: raw.reason.trim() || null,
    },
  };
}
