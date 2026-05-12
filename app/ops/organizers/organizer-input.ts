import type { OrganizerInput } from "@/lib/types";

export interface RawOrganizerInput {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string;
}

export type ValidatedInput =
  | { ok: true; value: OrganizerInput }
  | { ok: false; error: string };

export function validateOrganizerInput(raw: RawOrganizerInput): ValidatedInput {
  const name = raw.name.trim();
  if (!name) return { ok: false, error: "Введите название организатора" };
  if (name.length > 200)
    return { ok: false, error: "Название слишком длинное (макс. 200)" };

  const email = raw.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Неверный формат email" };
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
