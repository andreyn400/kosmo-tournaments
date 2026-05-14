import type { ProgramInput } from "@/lib/types";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";

export interface RawProgramInput {
  name: string;
  type: string;
  duration_minutes: number;
  price_peak_rub: number;
  price_offpeak_rub: number;
  courts_needed: number;
  max_players: number | null;
  description: string;
  is_active: boolean;
}

export function validateProgramInput(
  raw: RawProgramInput,
): { ok: true; value: ProgramInput } | { ok: false; error: FieldError } {
  const name = raw.name.trim();
  if (!name) return { ok: false, error: fieldErr("error.required.program_name") };

  const type = raw.type.trim();
  if (!type) return { ok: false, error: fieldErr("error.invalid.type_required") };

  if (
    !Number.isInteger(raw.duration_minutes) ||
    raw.duration_minutes < 15 ||
    raw.duration_minutes > 480
  ) {
    return { ok: false, error: fieldErr("error.invalid.duration_min_15_480") };
  }
  if (raw.duration_minutes % 15 !== 0) {
    return { ok: false, error: fieldErr("error.invalid.duration_multiple_of_15") };
  }

  if (
    !Number.isInteger(raw.price_peak_rub) ||
    raw.price_peak_rub < 0 ||
    raw.price_peak_rub > 1_000_000
  ) {
    return { ok: false, error: fieldErr("error.invalid.price_peak_range") };
  }
  if (
    !Number.isInteger(raw.price_offpeak_rub) ||
    raw.price_offpeak_rub < 0 ||
    raw.price_offpeak_rub > 1_000_000
  ) {
    return { ok: false, error: fieldErr("error.invalid.price_offpeak_range") };
  }

  if (
    !Number.isInteger(raw.courts_needed) ||
    raw.courts_needed < 1 ||
    raw.courts_needed > 10
  ) {
    return { ok: false, error: fieldErr("error.invalid.courts_range_1_10") };
  }

  let maxPlayers: number | null = null;
  if (raw.max_players !== null) {
    if (
      !Number.isInteger(raw.max_players) ||
      raw.max_players < 1 ||
      raw.max_players > 64
    ) {
      return { ok: false, error: fieldErr("error.invalid.max_players_range") };
    }
    maxPlayers = raw.max_players;
  }

  return {
    ok: true,
    value: {
      name,
      type,
      duration_minutes: raw.duration_minutes,
      price_peak_rub: raw.price_peak_rub,
      price_offpeak_rub: raw.price_offpeak_rub,
      courts_needed: raw.courts_needed,
      max_players: maxPlayers,
      description: raw.description.trim() || null,
      is_active: raw.is_active,
    },
  };
}
