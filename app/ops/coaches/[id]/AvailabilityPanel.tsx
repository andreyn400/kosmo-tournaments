"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AvailabilityWindow, CoachAvailability } from "@/lib/types";
import { DAY_LABELS_SHORT, DAY_LABELS_LONG } from "../format";
import { setAvailabilityAction } from "./set-availability-action";

interface AvailabilityPanelProps {
  coachId: string;
  windows: CoachAvailability[];
}

interface DraftWindow {
  start_time: string;
  end_time: string;
}

function groupByDay(windows: CoachAvailability[]): DraftWindow[][] {
  const out: DraftWindow[][] = Array.from({ length: 7 }, () => []);
  for (const w of windows) {
    out[w.day_of_week].push({
      start_time: w.start_time.slice(0, 5),
      end_time: w.end_time.slice(0, 5),
    });
  }
  for (const day of out) {
    day.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
  return out;
}

export function AvailabilityPanel({
  coachId,
  windows,
}: AvailabilityPanelProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftWindow[][]>(() =>
    groupByDay(windows),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(groupByDay(windows));
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function addWindow(day: number) {
    setDraft((cur) => {
      const next = cur.map((d) => [...d]);
      next[day].push({ start_time: "10:00", end_time: "14:00" });
      return next;
    });
  }

  function removeWindow(day: number, idx: number) {
    setDraft((cur) => {
      const next = cur.map((d) => [...d]);
      next[day].splice(idx, 1);
      return next;
    });
  }

  function updateWindow(
    day: number,
    idx: number,
    key: keyof DraftWindow,
    value: string,
  ) {
    setDraft((cur) => {
      const next = cur.map((d) => [...d]);
      next[day][idx] = { ...next[day][idx], [key]: value };
      return next;
    });
  }

  function save() {
    setError(null);
    const flat: AvailabilityWindow[] = [];
    for (let day = 0; day < 7; day++) {
      for (const w of draft[day]) {
        flat.push({
          day_of_week: day,
          start_time: w.start_time,
          end_time: w.end_time,
        });
      }
    }
    startTransition(async () => {
      const res = await setAvailabilityAction(coachId, flat);
      if (res.error) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  const grouped = groupByDay(windows);
  const hasAny = grouped.some((d) => d.length > 0);

  return (
    <section className="rounded-card border border-border bg-surface p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black">Расписание</h2>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={startEdit}>
            Изменить
          </Button>
        )}
      </header>

      {editing ? (
        <>
          <p className="text-[11px] text-muted">
            Добавьте окна доступности по дням недели. Можно несколько окон в один день.
          </p>
          <div className="grid gap-2">
            {draft.map((day, i) => (
              <DayEditor
                key={i}
                dayIndex={i}
                windows={day}
                onAdd={() => addWindow(i)}
                onRemove={(idx) => removeWindow(i, idx)}
                onUpdate={(idx, key, value) => updateWindow(i, idx, key, value)}
              />
            ))}
          </div>
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={cancel}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button size="sm" onClick={save} disabled={pending}>
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </>
      ) : !hasAny ? (
        <p className="text-sm text-muted">
          Расписание не задано. Нажмите «Изменить», чтобы добавить окна.
        </p>
      ) : (
        <div className="grid gap-1.5">
          {grouped.map((day, i) => (
            <DayRow key={i} dayIndex={i} windows={day} />
          ))}
        </div>
      )}
    </section>
  );
}

function DayRow({
  dayIndex,
  windows,
}: {
  dayIndex: number;
  windows: DraftWindow[];
}) {
  return (
    <div className="flex items-center gap-3 min-h-7">
      <span
        className="inline-flex items-center justify-center w-9 h-6 rounded text-[10px] font-bold uppercase tracking-wider bg-subtle text-secondary border border-border"
        title={DAY_LABELS_LONG[dayIndex]}
      >
        {DAY_LABELS_SHORT[dayIndex]}
      </span>
      {windows.length === 0 ? (
        <span className="text-xs text-fade">Не работает</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {windows.map((w, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 h-6 rounded bg-accent-soft text-accent text-[11px] font-semibold tabular-nums"
            >
              {w.start_time}–{w.end_time}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DayEditor({
  dayIndex,
  windows,
  onAdd,
  onRemove,
  onUpdate,
}: {
  dayIndex: number;
  windows: DraftWindow[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, key: keyof DraftWindow, value: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <span
        className="inline-flex items-center justify-center w-9 h-6 mt-1 rounded text-[10px] font-bold uppercase tracking-wider bg-subtle text-secondary border border-border flex-shrink-0"
        title={DAY_LABELS_LONG[dayIndex]}
      >
        {DAY_LABELS_SHORT[dayIndex]}
      </span>
      <div className="flex-1 flex flex-wrap items-center gap-2">
        {windows.map((w, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-1 px-1.5 py-1 rounded bg-subtle border border-border"
          >
            <Input
              type="time"
              value={w.start_time}
              onChange={(e) => onUpdate(idx, "start_time", e.target.value)}
              className="!h-8 !w-[5.5rem] !px-2 text-xs"
            />
            <span className="text-fade text-xs" aria-hidden>
              –
            </span>
            <Input
              type="time"
              value={w.end_time}
              onChange={(e) => onUpdate(idx, "end_time", e.target.value)}
              className="!h-8 !w-[5.5rem] !px-2 text-xs"
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              aria-label="Удалить окно"
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded text-fade hover:text-[var(--color-danger)] hover:bg-surface"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center px-2 h-8 rounded bg-surface border border-dashed border-border text-xs text-muted hover:text-black hover:border-border-strong"
        >
          + Окно
        </button>
      </div>
    </div>
  );
}
