"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub, formatShortDateWithWeekday } from "@/lib/i18n/format";
import { todayIso } from "../../coaches/format";
import type {
  RentalPayment,
  RentalPaymentScheduleEntry,
} from "@/lib/types";
import {
  createScheduleEntryAction,
  deleteScheduleEntryAction,
  regenerateScheduleAction,
  updateScheduleEntryAction,
} from "./schedule-actions";
import {
  validateScheduleEntryInput,
  type RawScheduleEntryInput,
} from "./payment-input";

interface SchedulePanelProps {
  contractId: string;
  schedule: RentalPaymentScheduleEntry[];
  payments: RentalPayment[];
}

type EntryStatus = "settled" | "partial" | "overdue" | "upcoming";

export function SchedulePanel({
  contractId,
  schedule,
  payments,
}: SchedulePanelProps) {
  const router = useRouter();
  const { t, tPlural } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const paidByScheduleId = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of payments) {
      if (!p.schedule_id) continue;
      if (p.payment_type !== "payment") continue;
      m.set(p.schedule_id, (m.get(p.schedule_id) ?? 0) + p.amount_rub);
    }
    return m;
  }, [payments]);

  const today = todayIso();

  function handleCreate(
    raw: RawScheduleEntryInput,
  ): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createScheduleEntryAction(contractId, raw);
        if (res.id) {
          setCreating(false);
          router.refresh();
          resolve({});
          return;
        }
        resolve({ error: res.error });
      });
    });
  }

  function handleUpdate(
    entryId: string,
    raw: RawScheduleEntryInput,
  ): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateScheduleEntryAction(contractId, entryId, raw);
        if (!res.error) {
          setEditingId(null);
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  async function handleDelete(entryId: string) {
    if (!confirm(t("schedule_panel.delete_confirm"))) return;
    startTransition(async () => {
      const res = await deleteScheduleEntryAction(contractId, entryId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleRegenerate() {
    const ok = confirm(t("schedule_panel.regenerate_confirm"));
    if (!ok) return;
    startTransition(async () => {
      const res = await regenerateScheduleAction(contractId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-black">
          {t("schedule_panel.title")}
        </h2>
        <span className="text-xs text-muted">
          {schedule.length === 0
            ? t("schedule_panel.count_empty")
            : `${schedule.length} ${tPlural(schedule.length, {
                one: "schedule_panel.entries.one",
                few: "schedule_panel.entries.few",
                many: "schedule_panel.entries.many",
              })}`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRegenerate}
            disabled={pending}
          >
            {t("schedule_panel.regenerate_cta")}
          </Button>
          <Button
            size="sm"
            onClick={() => setCreating(true)}
            disabled={creating}
          >
            {t("schedule_panel.add_entry_cta")}
          </Button>
        </div>
      </header>

      {creating && (
        <ScheduleEntryForm
          mode="create"
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
          pending={pending}
        />
      )}

      {schedule.length === 0 && !creating ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">{t("schedule_panel.empty")}</p>
        </div>
      ) : schedule.length > 0 ? (
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-subtle/30 text-[10.5px] uppercase tracking-wider text-muted font-semibold">
                <th className="pl-4 pr-2 py-2 text-left">
                  {t("schedule_panel.col.period")}
                </th>
                <th className="px-2 py-2 text-left whitespace-nowrap">
                  {t("schedule_panel.col.date")}
                </th>
                <th className="px-2 py-2 text-right whitespace-nowrap">
                  {t("schedule_panel.col.amount")}
                </th>
                <th className="px-2 py-2 text-right whitespace-nowrap">
                  {t("schedule_panel.col.paid")}
                </th>
                <th className="pl-2 pr-4 py-2 text-left">
                  {t("schedule_panel.col.status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((e, i) => {
                const paid = paidByScheduleId.get(e.id) ?? 0;
                const status = entryStatus(e, paid, today);
                return (
                  <Fragment key={e.id}>
                    <ScheduleRow
                      entry={e}
                      paid={paid}
                      status={status}
                      expanded={editingId === e.id}
                      zebra={i % 2 === 1}
                      onToggle={() =>
                        setEditingId(editingId === e.id ? null : e.id)
                      }
                    />
                    {editingId === e.id && (
                      <tr className="bg-subtle/30">
                        <td colSpan={5} className="p-2 border-y border-border">
                          <ScheduleEntryForm
                            mode="edit"
                            entry={e}
                            onCancel={() => setEditingId(null)}
                            onSubmit={(raw) => handleUpdate(e.id, raw)}
                            onDelete={() => handleDelete(e.id)}
                            pending={pending}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function entryStatus(
  e: RentalPaymentScheduleEntry,
  paid: number,
  today: string,
): EntryStatus {
  if (paid >= e.amount_due_rub) return "settled";
  if (paid > 0) return "partial";
  if (e.due_date < today) return "overdue";
  return "upcoming";
}

function ScheduleRow({
  entry: e,
  paid,
  status,
  expanded,
  zebra,
  onToggle,
}: {
  entry: RentalPaymentScheduleEntry;
  paid: number;
  status: EntryStatus;
  expanded: boolean;
  zebra: boolean;
  onToggle: () => void;
}) {
  const { lang } = useTranslation();
  const rowBg = expanded
    ? "bg-accent-soft/50"
    : zebra
      ? "bg-subtle/40 hover:bg-subtle"
      : "hover:bg-subtle";

  return (
    <tr
      onClick={onToggle}
      className={`cursor-pointer transition-colors ${rowBg}`}
      style={{ height: "44px" }}
    >
      <td className="pl-4 pr-2 align-middle text-sm text-black truncate">
        {e.period_label}
      </td>
      <td className="px-2 align-middle text-xs text-secondary tabular-nums whitespace-nowrap">
        {formatShortDateWithWeekday(e.due_date, lang)}
      </td>
      <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
        {formatRub(e.amount_due_rub, lang)}
      </td>
      <td className="px-2 align-middle text-xs tabular-nums text-right whitespace-nowrap">
        {paid > 0 ? (
          <span
            className={
              paid >= e.amount_due_rub
                ? "text-[var(--color-success)] font-semibold"
                : "text-[var(--color-warning)] font-semibold"
            }
          >
            {formatRub(paid, lang)}
          </span>
        ) : (
          <span className="text-fade">—</span>
        )}
      </td>
      <td className="pl-2 pr-4 align-middle whitespace-nowrap">
        <StatusBadge status={status} />
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const { t } = useTranslation();
  const map: Record<
    EntryStatus,
    { bg: string; text: string; labelKey: Parameters<typeof t>[0] }
  > = {
    settled: {
      bg: "bg-[var(--color-success-soft)]",
      text: "text-[var(--color-success)]",
      labelKey: "schedule_panel.entry_status.settled",
    },
    partial: {
      bg: "bg-[var(--color-warning-soft)]",
      text: "text-[var(--color-warning)]",
      labelKey: "schedule_panel.entry_status.partial",
    },
    overdue: {
      bg: "bg-[var(--color-danger-soft)]",
      text: "text-[var(--color-danger)]",
      labelKey: "schedule_panel.entry_status.overdue",
    },
    upcoming: {
      bg: "bg-subtle",
      text: "text-secondary",
      labelKey: "schedule_panel.entry_status.upcoming",
    },
  };
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 h-6 rounded text-[10.5px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
    >
      {t(cfg.labelKey)}
    </span>
  );
}

function ScheduleEntryForm({
  mode,
  entry,
  onCancel,
  onSubmit,
  onDelete,
  pending,
}: {
  mode: "create" | "edit";
  entry?: RentalPaymentScheduleEntry;
  onCancel: () => void;
  onSubmit: (raw: RawScheduleEntryInput) => Promise<{ error?: string }>;
  onDelete?: () => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<RawScheduleEntryInput>({
    period_label: entry?.period_label ?? "",
    amount_due_rub: entry ? String(entry.amount_due_rub) : "",
    due_date: entry?.due_date ?? todayIso(),
    notes: entry?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validateScheduleEntryInput(state);
    if (!v.ok) {
      setError(t(v.error.key, v.error.vars));
      return;
    }
    const res = await onSubmit(state);
    if (res.error) setError(res.error);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="grid gap-3 p-3 rounded-md bg-surface border border-border"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem]">
        <Field label={t("schedule_panel.entry_form.field.period")}>
          <Input
            value={state.period_label}
            onChange={(e) =>
              setState((s) => ({ ...s, period_label: e.target.value }))
            }
            placeholder={t("schedule_panel.entry_form.placeholder.period")}
            className="!h-9"
            autoFocus={mode === "create"}
          />
        </Field>
        <Field label={t("schedule_panel.entry_form.field.due_date")}>
          <Input
            type="date"
            value={state.due_date}
            onChange={(e) =>
              setState((s) => ({ ...s, due_date: e.target.value }))
            }
            className="!h-9"
          />
        </Field>
        <Field label={t("schedule_panel.entry_form.field.amount")}>
          <Input
            type="number"
            min={0}
            value={state.amount_due_rub}
            onChange={(e) =>
              setState((s) => ({ ...s, amount_due_rub: e.target.value }))
            }
            inputMode="numeric"
            className="!h-9"
          />
        </Field>
      </div>

      <Field label={t("schedule_panel.entry_form.field.notes")}>
        <Input
          value={state.notes}
          onChange={(e) =>
            setState((s) => ({ ...s, notes: e.target.value }))
          }
          className="!h-9"
        />
      </Field>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 justify-end">
        {mode === "edit" && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={pending}
            className="!text-[var(--color-danger)] hover:!bg-[var(--color-danger-soft)] mr-auto"
          >
            {t("coaches.delete_cta")}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          {t("btn.cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending
            ? t("btn.saving")
            : mode === "create"
              ? t("slots.form.submit_create")
              : t("btn.save")}
        </Button>
      </div>
    </form>
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
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
