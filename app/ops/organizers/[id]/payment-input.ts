import type {
  OrganizerPaymentInput,
  OrganizerPaymentType,
} from "@/lib/types";

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
  | { ok: false; error: string };

export function validatePaymentInput(raw: RawPaymentInput): ValidatedPayment {
  if (!raw.date || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
    return { ok: false, error: "Укажите дату" };
  }

  const amount = Number.parseInt(raw.amount_rub, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Сумма должна быть больше нуля" };
  }
  if (amount > 100_000_000) {
    return { ok: false, error: "Сумма выглядит слишком большой" };
  }

  if (!["payment", "deposit", "refund"].includes(raw.type)) {
    return { ok: false, error: "Неверный тип записи" };
  }

  let courts: number | null = null;
  if (raw.courts_booked.trim()) {
    const c = Number.parseInt(raw.courts_booked, 10);
    if (!Number.isFinite(c) || c < 0 || c > 99) {
      return { ok: false, error: "Кортов: 0–99" };
    }
    courts = c;
  }

  let hours: number | null = null;
  if (raw.hours_booked.trim()) {
    const h = Number.parseFloat(raw.hours_booked);
    if (!Number.isFinite(h) || h < 0 || h > 999) {
      return { ok: false, error: "Часов: 0–999" };
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

export const PAYMENT_TYPE_LABELS: Record<OrganizerPaymentType, string> = {
  payment: "Начисление",
  deposit: "Депозит",
  refund: "Возврат",
};

export const PAYMENT_TYPE_DESCRIPTIONS: Record<OrganizerPaymentType, string> = {
  payment: "Счёт за аренду / турнир — увеличивает долг",
  deposit: "Получено от организатора — уменьшает долг",
  refund: "Возвращено организатору — уменьшает долг",
};
