import type {
  RentalExceptionType,
  RentalSlotExceptionInput,
  RentalSlotInput,
} from "@/lib/types";

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
  | { ok: false; error: string };

export function validateSlotInput(raw: RawSlotInput): ValidatedSlot {
  if (raw.court_ids.length === 0) {
    return { ok: false, error: "Выберите хотя бы один корт" };
  }
  if (!Number.isInteger(raw.day_of_week) || raw.day_of_week < 0 || raw.day_of_week > 6) {
    return { ok: false, error: "День недели вне диапазона" };
  }
  if (!TIME_RE.test(raw.start_time) || !TIME_RE.test(raw.end_time)) {
    return { ok: false, error: "Время в формате ЧЧ:ММ" };
  }
  if (raw.end_time <= raw.start_time) {
    return { ok: false, error: "Время окончания должно быть позже начала" };
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
  | { ok: false; error: string };

export function validateExceptionInput(
  raw: RawExceptionInput,
): ValidatedException {
  if (!DATE_RE.test(raw.from_date)) {
    return { ok: false, error: "Укажите дату начала исключения" };
  }
  if (!DATE_RE.test(raw.to_date)) {
    return { ok: false, error: "Укажите дату окончания исключения" };
  }
  if (raw.to_date < raw.from_date) {
    return { ok: false, error: "Окончание не может быть раньше начала" };
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
