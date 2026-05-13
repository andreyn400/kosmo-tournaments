"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatRub } from "../../coaches/format";
import { PAYMENT_SCHEDULE_LABELS } from "../format";
import type { WizardScheduleEntry, WizardState } from "./WizardShell";

interface Step4Props {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onRegenerate: () => void;
}

function nextLocalId() {
  return Math.random().toString(36).slice(2, 10);
}

export function Step4Schedule({ state, setState, onRegenerate }: Step4Props) {
  const total = Number.parseInt(state.total_value_rub, 10) || 0;

  const sum = useMemo(
    () =>
      state.schedule.reduce(
        (acc, e) => acc + (Number.parseInt(e.amount_due_rub, 10) || 0),
        0,
      ),
    [state.schedule],
  );

  const diff = total - sum;

  function updateEntry(id: string, patch: Partial<WizardScheduleEntry>) {
    setState((s) => ({
      ...s,
      schedule: s.schedule.map((e) => (e._id === id ? { ...e, ...patch } : e)),
    }));
  }

  function removeEntry(id: string) {
    setState((s) => ({
      ...s,
      schedule: s.schedule.filter((e) => e._id !== id),
    }));
  }

  function addEntry() {
    setState((s) => ({
      ...s,
      schedule: [
        ...s.schedule,
        {
          _id: nextLocalId(),
          period_label: "",
          amount_due_rub: "0",
          due_date: s.start_date,
          notes: "",
        },
      ],
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-black">График платежей</h2>
        <p className="text-[11.5px] text-muted">
          Автоматически рассчитан по типу{" "}
          <span className="font-semibold text-secondary">
            «{PAYMENT_SCHEDULE_LABELS[state.payment_schedule_type]}»
          </span>
          : первый и последний периоды пропорциональны количеству дней.
          Изменения можно вносить вручную; сумма должна совпадать со
          стоимостью контракта.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-md bg-subtle border border-border px-3 py-2 text-[11.5px]">
        <span>
          Стоимость контракта:{" "}
          <span className="font-semibold text-black tabular-nums">
            {formatRub(total)}
          </span>
        </span>
        <span className="text-fade">·</span>
        <span>
          Сумма по графику:{" "}
          <span
            className={`font-semibold tabular-nums ${
              sum === total
                ? "text-[var(--color-success)]"
                : "text-[var(--color-warning)]"
            }`}
          >
            {formatRub(sum)}
          </span>
        </span>
        {diff !== 0 && (
          <>
            <span className="text-fade">·</span>
            <span>
              Расхождение:{" "}
              <span className="font-semibold text-[var(--color-danger)] tabular-nums">
                {diff > 0 ? "+" : ""}
                {formatRub(diff)}
              </span>
            </span>
          </>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRegenerate}
          className="ml-auto"
        >
          Перегенерировать
        </Button>
      </div>

      {state.schedule.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">
            Записей графика нет. Это нормально для типа «По договорённости» —
            добавьте записи вручную или создайте контракт как есть и заполните
            график позже.
          </p>
        </div>
      ) : (
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-subtle/30 text-[10.5px] uppercase tracking-wider text-muted font-semibold">
                <th className="pl-4 pr-2 py-2 text-left">Период</th>
                <th className="px-2 py-2 text-left w-36">Дата</th>
                <th className="px-2 py-2 text-right w-32">Сумма, ₽</th>
                <th className="pl-2 pr-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {state.schedule.map((e, i) => (
                <tr
                  key={e._id}
                  className={i % 2 === 1 ? "bg-subtle/30" : ""}
                  style={{ height: "44px" }}
                >
                  <td className="pl-4 pr-2 py-1.5">
                    <Input
                      value={e.period_label}
                      onChange={(ev) =>
                        updateEntry(e._id, { period_label: ev.target.value })
                      }
                      className="!h-8 !text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="date"
                      value={e.due_date}
                      onChange={(ev) =>
                        updateEntry(e._id, { due_date: ev.target.value })
                      }
                      className="!h-8 !text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={e.amount_due_rub}
                      onChange={(ev) =>
                        updateEntry(e._id, { amount_due_rub: ev.target.value })
                      }
                      className="!h-8 !text-xs text-right"
                    />
                  </td>
                  <td className="pl-2 pr-4 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeEntry(e._id)}
                      aria-label="Удалить запись"
                      className="text-muted hover:text-[var(--color-danger)] transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <path d="M6 6l12 12M6 18L18 6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addEntry}
        className="self-start"
      >
        + Добавить запись
      </Button>
    </div>
  );
}
