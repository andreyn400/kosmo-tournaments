"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type {
  Court,
  RentalSlot,
  RentalSlotException,
} from "@/lib/types";
import { DAY_LABELS_LONG } from "../../coaches/format";
import { SlotForm } from "./SlotForm";
import { ExceptionForm } from "./ExceptionForm";
import {
  createExceptionAction,
  createSlotAction,
  deleteExceptionAction,
  deleteSlotAction,
  updateSlotAction,
} from "./slot-actions";
import type { RawExceptionInput, RawSlotInput } from "./slot-input";

interface SlotsPanelProps {
  contractId: string;
  slots: RentalSlot[];
  exceptions: RentalSlotException[];
  courts: Court[];
}

export function SlotsPanel({
  contractId,
  slots,
  exceptions,
  courts,
}: SlotsPanelProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [exceptionForSlotId, setExceptionForSlotId] = useState<string | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  // Group exceptions by slot for quick lookup.
  const exceptionsBySlot = useMemo(() => {
    const m = new Map<string, RentalSlotException[]>();
    for (const e of exceptions) {
      const arr = m.get(e.slot_id) ?? [];
      arr.push(e);
      m.set(e.slot_id, arr);
    }
    return m;
  }, [exceptions]);

  function handleCreateSlot(raw: RawSlotInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createSlotAction(contractId, raw);
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

  function handleUpdateSlot(
    slotId: string,
    raw: RawSlotInput,
  ): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateSlotAction(contractId, slotId, raw);
        if (!res.error) {
          setEditingSlotId(null);
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm("Удалить этот слот? Все его исключения тоже удалятся."))
      return;
    startTransition(async () => {
      const res = await deleteSlotAction(contractId, slotId);
      if (res.error) {
        alert(res.error);
        return;
      }
      setEditingSlotId(null);
      router.refresh();
    });
  }

  function handleCreateException(
    slotId: string,
    raw: RawExceptionInput,
  ): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createExceptionAction(contractId, slotId, raw);
        if (res.id) {
          setExceptionForSlotId(null);
          router.refresh();
          resolve({});
          return;
        }
        resolve({ error: res.error });
      });
    });
  }

  async function handleDeleteException(exceptionId: string) {
    if (!confirm("Удалить это исключение?")) return;
    startTransition(async () => {
      const res = await deleteExceptionAction(contractId, exceptionId);
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
        <h2 className="text-sm font-semibold text-black">Расписание</h2>
        <span className="text-xs text-muted">
          {slots.length === 0
            ? "Слотов нет"
            : `${slots.length} ${pluralSlots(slots.length)}`}
        </span>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          disabled={creating}
          className="ml-auto"
        >
          + Добавить слот
        </Button>
      </header>

      <p className="text-[11px] text-muted -mt-1">
        Слот повторяется каждую неделю в течение срока контракта. Изменения
        применяются ко всей истории слота — для частичных правок добавьте
        паузу или отмену.
      </p>

      {creating && (
        <SlotForm
          mode="create"
          courts={courts}
          onCancel={() => setCreating(false)}
          onSubmit={handleCreateSlot}
          pending={pending}
        />
      )}

      {slots.length === 0 && !creating ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">
            Слотов пока нет. Добавьте первый — он начнёт отображаться в общем
            расписании на странице «Расписание».
          </p>
        </div>
      ) : slots.length > 0 ? (
        <div className="rounded-card border border-border bg-surface overflow-hidden">
          {slots.map((s, i) => (
            <Fragment key={s.id}>
              <SlotRow
                slot={s}
                courts={courts}
                exceptions={exceptionsBySlot.get(s.id) ?? []}
                editing={editingSlotId === s.id}
                addingException={exceptionForSlotId === s.id}
                zebra={i % 2 === 1}
                onEdit={() => setEditingSlotId(s.id)}
                onCancelEdit={() => setEditingSlotId(null)}
                onUpdate={(raw) => handleUpdateSlot(s.id, raw)}
                onDelete={() => handleDeleteSlot(s.id)}
                onAddException={() => setExceptionForSlotId(s.id)}
                onCancelException={() => setExceptionForSlotId(null)}
                onCreateException={(raw) => handleCreateException(s.id, raw)}
                onDeleteException={handleDeleteException}
                pending={pending}
              />
            </Fragment>
          ))}
        </div>
      ) : null}
    </section>
  );
}

interface SlotRowProps {
  slot: RentalSlot;
  courts: Court[];
  exceptions: RentalSlotException[];
  editing: boolean;
  addingException: boolean;
  zebra: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (raw: RawSlotInput) => Promise<{ error?: string }>;
  onDelete: () => Promise<void>;
  onAddException: () => void;
  onCancelException: () => void;
  onCreateException: (
    raw: RawExceptionInput,
  ) => Promise<{ error?: string }>;
  onDeleteException: (exceptionId: string) => void;
  pending: boolean;
}

function SlotRow({
  slot,
  courts,
  exceptions,
  editing,
  addingException,
  zebra,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onAddException,
  onCancelException,
  onCreateException,
  onDeleteException,
  pending,
}: SlotRowProps) {
  const courtsById = new Map(courts.map((c) => [c.id, c]));
  const courtLabels = slot.court_ids
    .map((id) => courtsById.get(id)?.name ?? "?")
    .join(", ");

  return (
    <div
      className={`border-b border-border last:border-b-0 ${zebra ? "bg-subtle/30" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-black">
              {DAY_LABELS_LONG[slot.day_of_week]}
            </span>
            <span className="text-xs text-secondary tabular-nums">
              {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
            </span>
            <span className="text-xs text-secondary">· {courtLabels}</span>
            {exceptions.length > 0 && (
              <span className="inline-flex items-center px-1.5 h-5 rounded text-[9.5px] font-semibold uppercase tracking-wider bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                {exceptions.length}{" "}
                {pluralExceptions(exceptions.length)}
              </span>
            )}
          </div>
          {slot.notes && (
            <p className="text-[11px] text-muted mt-0.5 truncate">
              {slot.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!editing && !addingException && (
            <>
              <button
                type="button"
                onClick={onAddException}
                disabled={pending}
                className="text-[11px] font-semibold text-secondary hover:text-accent px-2 h-7 rounded transition-colors"
              >
                + Исключение
              </button>
              <button
                type="button"
                onClick={onEdit}
                disabled={pending}
                className="text-[11px] font-semibold text-secondary hover:text-accent px-2 h-7 rounded transition-colors"
              >
                Изменить
              </button>
            </>
          )}
        </div>
      </div>

      {exceptions.length > 0 && (
        <ul className="px-4 pb-2 flex flex-col gap-1">
          {exceptions.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-2 text-[11.5px] py-1 px-2 rounded bg-[var(--color-warning-soft)]/40"
            >
              <span
                className={`inline-flex items-center px-1.5 h-5 rounded text-[9.5px] font-semibold uppercase tracking-wider ${
                  e.exception_type === "pause"
                    ? "bg-[var(--color-warning)] text-white"
                    : "bg-[var(--color-danger)] text-white"
                }`}
              >
                {e.exception_type === "pause" ? "Пауза" : "Отмена"}
              </span>
              <span className="tabular-nums text-secondary">
                {e.from_date === e.to_date
                  ? e.from_date
                  : `${e.from_date} – ${e.to_date}`}
              </span>
              {e.reason && (
                <span className="text-muted truncate">· {e.reason}</span>
              )}
              <button
                type="button"
                onClick={() => onDeleteException(e.id)}
                disabled={pending}
                aria-label="Удалить исключение"
                className="ml-auto text-muted hover:text-[var(--color-danger)] transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {(editing || addingException) && (
        <div className="px-4 pb-3 pt-1">
          {editing && (
            <SlotForm
              mode="edit"
              slot={slot}
              courts={courts}
              onCancel={onCancelEdit}
              onSubmit={onUpdate}
              onDelete={onDelete}
              pending={pending}
            />
          )}
          {addingException && (
            <ExceptionForm
              onCancel={onCancelException}
              onSubmit={onCreateException}
              pending={pending}
            />
          )}
        </div>
      )}
    </div>
  );
}

function pluralSlots(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "слотов";
  if (mod10 === 1) return "слот";
  if (mod10 >= 2 && mod10 <= 4) return "слота";
  return "слотов";
}

function pluralExceptions(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "исключений";
  if (mod10 === 1) return "исключение";
  if (mod10 >= 2 && mod10 <= 4) return "исключения";
  return "исключений";
}
