"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type {
  RentalContractStatus,
  RentalPaymentScheduleType,
} from "@/lib/types";
import {
  PAYMENT_SCHEDULE_LABELS,
  STATUS_LABELS,
} from "../format";
import { formatRub } from "../../coaches/format";
import type { WizardState } from "./WizardShell";

interface Step2Props {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}

export function Step2Contract({ state, update }: Step2Props) {
  const total = Number.parseInt(state.total_value_rub, 10) || 0;
  const deposit = Number.parseInt(state.deposit_rub, 10) || 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-black">Условия контракта</h2>
        <p className="text-[11.5px] text-muted">
          Стоимость и период определяют график платежей в следующем шаге.
          Номер контракта можно оставить пустым и присвоить позже.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Номер контракта">
          <Input
            value={state.contract_number}
            onChange={(e) => update("contract_number", e.target.value)}
            placeholder="RC-2026-001"
          />
        </Field>
        <Field label="Статус при создании">
          <Select
            value={state.status}
            onChange={(e) =>
              update("status", e.target.value as RentalContractStatus)
            }
          >
            {(
              Object.keys(STATUS_LABELS) as RentalContractStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Дата начала *">
          <Input
            type="date"
            value={state.start_date}
            onChange={(e) => update("start_date", e.target.value)}
          />
        </Field>
        <Field label="Дата окончания *">
          <Input
            type="date"
            value={state.end_date}
            onChange={(e) => update("end_date", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Стоимость, ₽ *">
          <Input
            type="number"
            min={0}
            value={state.total_value_rub}
            onChange={(e) => update("total_value_rub", e.target.value)}
            inputMode="numeric"
            placeholder="1200000"
          />
        </Field>
        <Field label="Депозит, ₽">
          <Input
            type="number"
            min={0}
            value={state.deposit_rub}
            onChange={(e) => update("deposit_rub", e.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field label="График платежей">
          <Select
            value={state.payment_schedule_type}
            onChange={(e) =>
              update(
                "payment_schedule_type",
                e.target.value as RentalPaymentScheduleType,
              )
            }
          >
            {(
              Object.keys(
                PAYMENT_SCHEDULE_LABELS,
              ) as RentalPaymentScheduleType[]
            ).map((t) => (
              <option key={t} value={t}>
                {PAYMENT_SCHEDULE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Ссылка на документ">
        <Input
          type="url"
          value={state.document_url}
          onChange={(e) => update("document_url", e.target.value)}
          placeholder="https://drive.google.com/..."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Заметки (видны в карточке)">
          <Textarea
            rows={2}
            value={state.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </Field>
        <Field label="Служебные заметки (ops-only)">
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
            Итого:{" "}
            <span className="font-semibold text-black tabular-nums">
              {formatRub(total)}
            </span>
          </span>
          {deposit > 0 && (
            <span>
              Депозит:{" "}
              <span className="font-semibold text-black tabular-nums">
                {formatRub(deposit)}
              </span>
            </span>
          )}
          <span className="text-muted">
            · График:{" "}
            {PAYMENT_SCHEDULE_LABELS[state.payment_schedule_type]}
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
