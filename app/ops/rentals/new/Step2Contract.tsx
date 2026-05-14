"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";
import {
  RENTAL_SCHEDULE_TYPE_KEY,
  RENTAL_STATUS_KEY,
} from "@/lib/i18n/rental-keys";
import type {
  RentalContractStatus,
  RentalPaymentScheduleType,
} from "@/lib/types";
import type { WizardState } from "./WizardShell";

interface Step2Props {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}

const STATUS_OPTIONS: RentalContractStatus[] = [
  "draft",
  "active",
  "paused",
  "ended",
  "cancelled",
];

const SCHEDULE_OPTIONS: RentalPaymentScheduleType[] = [
  "one_time",
  "monthly",
  "quarterly",
  "custom",
];

export function Step2Contract({ state, update }: Step2Props) {
  const { t, lang } = useTranslation();
  const total = Number.parseInt(state.total_value_rub, 10) || 0;
  const deposit = Number.parseInt(state.deposit_rub, 10) || 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-black">
          {t("rentals.wizard.terms.title")}
        </h2>
        <p className="text-[11.5px] text-muted">
          {t("rentals.wizard.terms.help")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("rentals.wizard.terms.field.contract_number")}>
          <Input
            value={state.contract_number}
            onChange={(e) => update("contract_number", e.target.value)}
            placeholder="RC-2026-001"
          />
        </Field>
        <Field label={t("rentals.wizard.terms.field.status_on_create")}>
          <Select
            value={state.status}
            onChange={(e) =>
              update("status", e.target.value as RentalContractStatus)
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(RENTAL_STATUS_KEY[s])}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("rentals.wizard.terms.field.start_date")}>
          <Input
            type="date"
            value={state.start_date}
            onChange={(e) => update("start_date", e.target.value)}
          />
        </Field>
        <Field label={t("rentals.wizard.terms.field.end_date")}>
          <Input
            type="date"
            value={state.end_date}
            onChange={(e) => update("end_date", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("rentals.wizard.terms.field.total_value")}>
          <Input
            type="number"
            min={0}
            value={state.total_value_rub}
            onChange={(e) => update("total_value_rub", e.target.value)}
            inputMode="numeric"
            placeholder="1200000"
          />
        </Field>
        <Field label={t("rentals.wizard.terms.field.deposit")}>
          <Input
            type="number"
            min={0}
            value={state.deposit_rub}
            onChange={(e) => update("deposit_rub", e.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field label={t("rentals.wizard.terms.field.payment_schedule")}>
          <Select
            value={state.payment_schedule_type}
            onChange={(e) =>
              update(
                "payment_schedule_type",
                e.target.value as RentalPaymentScheduleType,
              )
            }
          >
            {SCHEDULE_OPTIONS.map((sch) => (
              <option key={sch} value={sch}>
                {t(RENTAL_SCHEDULE_TYPE_KEY[sch])}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t("rentals.wizard.terms.field.document_url")}>
        <Input
          type="url"
          value={state.document_url}
          onChange={(e) => update("document_url", e.target.value)}
          placeholder="https://drive.google.com/..."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("rentals.wizard.terms.field.notes")}>
          <Textarea
            rows={2}
            value={state.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </Field>
        <Field label={t("rentals.wizard.terms.field.internal_notes")}>
          <Textarea
            rows={2}
            value={state.internal_notes}
            onChange={(e) => update("internal_notes", e.target.value)}
          />
        </Field>
      </div>

      {total > 0 && (
        <div className="rounded-md bg-subtle border border-border p-3 text-[11.5px] text-secondary flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {t("rentals.wizard.terms.summary.total")}:{" "}
            <span className="font-semibold text-black tabular-nums">
              {formatRub(total, lang)}
            </span>
          </span>
          {deposit > 0 && (
            <span>
              {t("rentals.wizard.terms.summary.deposit")}:{" "}
              <span className="font-semibold text-black tabular-nums">
                {formatRub(deposit, lang)}
              </span>
            </span>
          )}
          <span className="text-muted">
            · {t("rentals.wizard.terms.summary.schedule")}:{" "}
            {t(RENTAL_SCHEDULE_TYPE_KEY[state.payment_schedule_type])}
          </span>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
