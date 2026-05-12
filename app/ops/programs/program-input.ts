import type { ProgramInput } from "@/lib/types";

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
): { ok: true; value: ProgramInput } | { ok: false; error: string } {
  const name = raw.name.trim();
  if (!name) return { ok: false, error: "Введите название программы." };

  const type = raw.type.trim();
  if (!type) return { ok: false, error: "Выберите или введите тип." };

  if (
    !Number.isInteger(raw.duration_minutes) ||
    raw.duration_minutes < 15 ||
    raw.duration_minutes > 480
  ) {
    return {
      ok: false,
      error: "Длительность — целое число минут от 15 до 480.",
    };
  }
  if (raw.duration_minutes % 15 !== 0) {
    return { ok: false, error: "Длительность кратна 15 минутам." };
  }

  for (const [field, label] of [
    ["price_peak_rub", "Пиковая цена"],
    ["price_offpeak_rub", "Внепиковая цена"],
  ] as const) {
    const v = raw[field];
    if (!Number.isInteger(v) || v < 0 || v > 1_000_000) {
      return { ok: false, error: `${label} — целое число от 0 до 1 000 000 ₽.` };
    }
  }

  if (
    !Number.isInteger(raw.courts_needed) ||
    raw.courts_needed < 1 ||
    raw.courts_needed > 10
  ) {
    return { ok: false, error: "Кортов нужно — целое число от 1 до 10." };
  }

  let maxPlayers: number | null = null;
  if (raw.max_players !== null) {
    if (
      !Number.isInteger(raw.max_players) ||
      raw.max_players < 1 ||
      raw.max_players > 64
    ) {
      return { ok: false, error: "Макс. игроков — целое число от 1 до 64." };
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
