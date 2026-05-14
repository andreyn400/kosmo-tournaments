import type { OrganizerInput } from "@/lib/types";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

export interface RawOrganizerInput {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string;
}

export type ValidatedInput =
  | { ok: true; value: OrganizerInput }
  | { ok: false; error: FieldError };

export function validateOrganizerInput(raw: RawOrganizerInput): ValidatedInput {
  const name = raw.name.trim();
  if (!name)
    return { ok: false, error: fieldErr("error.required.organizer_name") };
  if (name.length > 200)
    return { ok: false, error: fieldErr("error.too_long.name_200") };

  const email = raw.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: fieldErr("error.invalid.email_format") };
  }

  return {
    ok: true,
    value: {
      name,
      contact_name: raw.contact_name.trim() || null,
      phone: raw.phone.trim() || null,
      email: email || null,
      notes: raw.notes.trim() || null,
    },
  };
}
