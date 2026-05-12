import type { CoachInput, CoachRateType } from "@/lib/types";

export interface RawCoachInput {
  name: string;
  phone: string;
  specialization: string;
  level: string;
  bio: string;
  photo_url: string;
  color: string;
  rate_type: string;
  flat_rate_rub: number;
  rate_court_percent: number;
  rate_coaching_percent: number;
  is_active: boolean;
  notes: string;
}

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function validateCoachInput(
  raw: RawCoachInput,
): { ok: true; value: CoachInput } | { ok: false; error: string } {
  const name = raw.name.trim();
  if (!name) return { ok: false, error: "Введите имя тренера." };

  if (raw.rate_type !== "flat" && raw.rate_type !== "percent") {
    return { ok: false, error: "Тип ставки указан неверно." };
  }
  const rate_type = raw.rate_type as CoachRateType;

  if (
    !Number.isInteger(raw.flat_rate_rub) ||
    raw.flat_rate_rub < 0 ||
    raw.flat_rate_rub > 1_000_000
  ) {
    return {
      ok: false,
      error: "Фиксированная ставка — целое число от 0 до 1 000 000 ₽.",
    };
  }

  for (const [field, label] of [
    ["rate_court_percent", "Процент с корта"],
    ["rate_coaching_percent", "Процент с тренировки"],
  ] as const) {
    const v = raw[field];
    if (!Number.isFinite(v) || v < 0 || v > 100) {
      return { ok: false, error: `${label} — число от 0 до 100.` };
    }
  }

  const color = COLOR_RE.test(raw.color) ? raw.color : "#4fc3f7";

  return {
    ok: true,
    value: {
      name,
      phone: raw.phone.trim() || null,
      specialization: raw.specialization.trim() || null,
      level: raw.level.trim() || null,
      bio: raw.bio.trim() || null,
      photo_url: raw.photo_url.trim() || null,
      color,
      rate_type,
      flat_rate_rub: raw.flat_rate_rub,
      rate_court_percent: raw.rate_court_percent,
      rate_coaching_percent: raw.rate_coaching_percent,
      is_active: raw.is_active,
      notes: raw.notes.trim() || null,
    },
  };
}
