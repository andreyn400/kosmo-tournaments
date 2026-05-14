import type {
  RentalClientType,
  RentalContractInput,
  RentalContractStatus,
  RentalPaymentScheduleType,
} from "@/lib/types";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

export interface RawContractInput {
  client_name: string;
  client_type: RentalClientType;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  legal_entity_name: string;
  inn: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  total_value_rub: string;
  deposit_rub: string;
  payment_schedule_type: RentalPaymentScheduleType;
  document_url: string;
  status: RentalContractStatus;
  notes: string;
  internal_notes: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ValidatedContract =
  | { ok: true; value: RentalContractInput }
  | { ok: false; error: FieldError };

export function validateContractInput(
  raw: RawContractInput,
): ValidatedContract {
  const name = raw.client_name.trim();
  if (!name) return { ok: false, error: fieldErr("error.required.client_name") };

  if (!DATE_RE.test(raw.start_date)) {
    return { ok: false, error: fieldErr("error.required.date_start") };
  }
  if (!DATE_RE.test(raw.end_date)) {
    return { ok: false, error: fieldErr("error.required.date_end") };
  }
  if (raw.end_date < raw.start_date) {
    return {
      ok: false,
      error: fieldErr("error.invalid.date_end_before_start"),
    };
  }

  const total = Number.parseInt(raw.total_value_rub, 10);
  if (!Number.isFinite(total) || total < 0) {
    return {
      ok: false,
      error: fieldErr("error.invalid.contract_value_non_negative_int"),
    };
  }
  if (total > 1_000_000_000) {
    return { ok: false, error: fieldErr("error.invalid.price_too_large") };
  }

  const deposit = Number.parseInt(raw.deposit_rub, 10) || 0;
  if (deposit < 0) {
    return {
      ok: false,
      error: fieldErr("error.invalid.deposit_non_negative_int"),
    };
  }

  const email = raw.contact_email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: fieldErr("error.invalid.email_format") };
  }

  const inn = raw.inn.trim();
  if (inn && !/^\d{10}$|^\d{12}$/.test(inn)) {
    return { ok: false, error: fieldErr("error.invalid.inn_format") };
  }

  return {
    ok: true,
    value: {
      client_name: name,
      client_type: raw.client_type,
      contact_person: raw.contact_person.trim() || null,
      contact_phone: raw.contact_phone.trim() || null,
      contact_email: email || null,
      legal_entity_name: raw.legal_entity_name.trim() || null,
      inn: inn || null,
      contract_number: raw.contract_number.trim() || null,
      start_date: raw.start_date,
      end_date: raw.end_date,
      total_value_rub: total,
      deposit_rub: deposit,
      payment_schedule_type: raw.payment_schedule_type,
      document_url: raw.document_url.trim() || null,
      status: raw.status,
      notes: raw.notes.trim() || null,
      internal_notes: raw.internal_notes.trim() || null,
    },
  };
}
