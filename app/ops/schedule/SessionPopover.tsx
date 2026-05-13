"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type {
  Coach,
  Court,
  Program,
  ScheduleSessionForGrid,
  ScheduleSessionStatus,
} from "@/lib/types";
import {
  OPS_OPEN_HOUR,
  isPeakWindow,
  minutesFromTime,
  timeFromMinutes,
} from "@/lib/ops-constants";
import { formatRub } from "../coaches/format";
import { ProgramPicker } from "./ProgramPicker";
import { ChipRow, PreviewCell, Section, ToggleChip } from "./PopoverAtoms";
import type { RawScheduleInput } from "./schedule-input";

const POPOVER_WIDTH = 480;
const POPOVER_GAP = 8;
const VIEWPORT_MARGIN = 12;

interface SessionPopoverProps {
  mode: "create" | "edit";
  anchor: DOMRect;
  /** create-mode prefill */
  prefillDate?: string;
  prefillTime?: string;
  prefillCourtId?: string;
  /** edit-mode source */
  session?: ScheduleSessionForGrid;
  programs: Program[];
  courts: Court[];
  coaches: Coach[];
  onClose: () => void;
  onSubmit: (raw: RawScheduleInput) => Promise<{ id?: string; error?: string }>;
  onDelete?: () => Promise<{ error?: string }>;
}

interface FormState {
  programId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  courtIds: string[];
  coachIds: string[];
  attendeeCount: string;
  status: ScheduleSessionStatus;
  manualRevenue: boolean;
  revenue: string;
  courtRevenue: string;
  coachingFee: string;
  notes: string;
}

/** Add duration minutes to HH:MM, clamping into the closing minutes range. */
function addMinutes(start: string, minutes: number): string {
  return timeFromMinutes(minutesFromTime(start) + minutes);
}

function makeInitial(
  mode: "create" | "edit",
  session: ScheduleSessionForGrid | undefined,
  programs: Program[],
  courts: Court[],
  prefillDate: string | undefined,
  prefillTime: string | undefined,
  prefillCourtId: string | undefined,
): FormState {
  if (mode === "edit" && session) {
    return {
      programId: session.program_id,
      date: session.date,
      startTime: session.start_time.slice(0, 5),
      endTime: session.end_time.slice(0, 5),
      courtIds: [...session.court_ids],
      coachIds: session.coach_chips.map((c) => c.id),
      attendeeCount: String(session.attendee_count),
      status: session.status,
      // Same convention as the coach-page form: edit mode opens in auto-calc
      // so changing players/time updates revenue live. Flipping the override
      // checkbox reveals the saved snapshot in the manual inputs.
      manualRevenue: false,
      revenue: String(session.revenue_rub),
      courtRevenue: String(session.court_revenue_rub),
      coachingFee: String(session.coaching_fee_rub),
      notes: session.notes ?? "",
    };
  }

  const start = prefillTime ?? `${String(OPS_OPEN_HOUR).padStart(2, "0")}:00`;
  const firstProgram = programs[0] ?? null;
  const duration = firstProgram?.duration_minutes ?? 60;

  // Default courts: program needs N → take prefillCourt + the next N-1
  // contiguous ones if they exist; else just prefillCourt.
  let courtIds: string[] = [];
  if (prefillCourtId) {
    const startIdx = courts.findIndex((c) => c.id === prefillCourtId);
    const needed = firstProgram?.courts_needed ?? 1;
    if (startIdx >= 0) {
      courtIds = courts.slice(startIdx, startIdx + needed).map((c) => c.id);
    }
  }
  if (courtIds.length === 0 && courts[0]) courtIds = [courts[0].id];

  return {
    programId: firstProgram?.id ?? null,
    date: prefillDate ?? new Date().toISOString().slice(0, 10),
    startTime: start,
    endTime: addMinutes(start, duration),
    courtIds,
    coachIds: [],
    attendeeCount: String(firstProgram?.max_players ?? 4),
    status: "scheduled",
    manualRevenue: false,
    revenue: "0",
    courtRevenue: "0",
    coachingFee: "0",
    notes: "",
  };
}

export function SessionPopover(props: SessionPopoverProps) {
  const {
    mode,
    anchor,
    session,
    programs,
    courts,
    coaches,
    onClose,
    onSubmit,
    onDelete,
    prefillDate,
    prefillTime,
    prefillCourtId,
  } = props;

  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<FormState>(() =>
    makeInitial(
      mode,
      session,
      programs,
      courts,
      prefillDate,
      prefillTime,
      prefillCourtId,
    ),
  );

  const program = useMemo(
    () => programs.find((p) => p.id === state.programId) ?? null,
    [programs, state.programId],
  );

  // Position the popover next to the anchor, viewport-clamped.
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const height = popover?.offsetHeight ?? 560;

    let left = anchor.right + POPOVER_GAP;
    if (left + POPOVER_WIDTH > vpW - VIEWPORT_MARGIN) {
      left = anchor.left - POPOVER_WIDTH - POPOVER_GAP;
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    let top = anchor.top;
    if (top + height > vpH - VIEWPORT_MARGIN) {
      top = vpH - height - VIEWPORT_MARGIN;
    }
    if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;

    setPosition({ top, left });
  }, [anchor]);

  // Close on outside click / Esc.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    // Defer pointer listener by one tick so the click that opened the popover
    // doesn't immediately close it.
    const t = setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function onProgramChange(p: Program | null) {
    setState((s) => {
      const duration = p?.duration_minutes ?? minutesFromTime(s.endTime) - minutesFromTime(s.startTime);
      const newAttendees = p?.max_players != null ? String(p.max_players) : s.attendeeCount;
      // Re-fit courts to the new program's courts_needed when shrinking; never
      // expand silently (user must add courts explicitly).
      let newCourtIds = s.courtIds;
      if (p && newCourtIds.length > p.courts_needed) {
        newCourtIds = newCourtIds.slice(0, p.courts_needed);
      }
      return {
        ...s,
        programId: p?.id ?? null,
        endTime: addMinutes(s.startTime, duration),
        attendeeCount: newAttendees,
        courtIds: newCourtIds,
      };
    });
  }

  function onStartChange(t: string) {
    setState((s) => {
      const dur = minutesFromTime(s.endTime) - minutesFromTime(s.startTime);
      return {
        ...s,
        startTime: t,
        endTime: dur > 0 ? addMinutes(t, dur) : s.endTime,
      };
    });
  }

  function toggleCourt(id: string) {
    setState((s) => ({
      ...s,
      courtIds: s.courtIds.includes(id)
        ? s.courtIds.filter((c) => c !== id)
        : [...s.courtIds, id],
    }));
  }

  function toggleCoach(id: string) {
    setState((s) => ({
      ...s,
      coachIds: s.coachIds.includes(id)
        ? s.coachIds.filter((c) => c !== id)
        : [...s.coachIds, id],
    }));
  }

  // Live revenue preview — same formula as 10.3.
  const attendeeCount = Number.parseInt(state.attendeeCount, 10) || 0;
  const preview = useMemo(() => {
    if (!program) return null;
    const peak = isPeakWindow(state.startTime, state.endTime);
    const pricePerPlayer = peak
      ? program.price_peak_rub
      : program.price_offpeak_rub;
    const revenue = pricePerPlayer * attendeeCount;
    const courtRev = pricePerPlayer * program.courts_needed;
    const coachingFee = Math.max(0, revenue - courtRev);
    return { peak, price: pricePerPlayer, revenue, courtRev, coachingFee };
  }, [program, state.startTime, state.endTime, attendeeCount]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setPending(true);
      try {
        const raw: RawScheduleInput = {
          program_id: state.programId,
          date: state.date,
          start_time: state.startTime,
          end_time: state.endTime,
          court_ids: state.courtIds,
          coach_ids: state.coachIds,
          attendee_count: attendeeCount,
          notes: state.notes,
          status: state.status,
          autoCalcRevenue: !state.manualRevenue,
          revenue_rub: Number.parseInt(state.revenue, 10) || 0,
          court_revenue_rub: Number.parseInt(state.courtRevenue, 10) || 0,
          coaching_fee_rub: Number.parseInt(state.coachingFee, 10) || 0,
        };
        const res = await onSubmit(raw);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } finally {
        setPending(false);
      }
    },
    [state, attendeeCount, onSubmit, onClose],
  );

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    if (!confirm("Удалить сессию? Это действие нельзя отменить.")) return;
    setError(null);
    setPending(true);
    try {
      const res = await onDelete();
      if (res.error) setError(res.error);
      else onClose();
    } finally {
      setPending(false);
    }
  }, [onDelete, onClose]);

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={mode === "create" ? "Создать сессию" : "Редактировать сессию"}
      className="fixed z-50 bg-surface rounded-card border border-border shadow-xl flex flex-col"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        width: POPOVER_WIDTH,
        maxHeight: "calc(100vh - 24px)",
        opacity: position ? 1 : 0,
        transition: "opacity 80ms ease-out",
      }}
    >
      <header className="flex items-center justify-between px-4 h-11 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-black">
          {mode === "create" ? "Создать сессию" : "Сессия"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="w-7 h-7 inline-flex items-center justify-center rounded text-muted hover:bg-subtle hover:text-black transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
      >
        <Section label="Программа">
          <ProgramPicker
            programs={programs}
            selectedId={state.programId}
            onSelect={onProgramChange}
          />
        </Section>

        <div className="grid grid-cols-[1fr_5.5rem_5.5rem] gap-2">
          <Section label="Дата">
            <Input
              type="date"
              value={state.date}
              onChange={(e) => set("date", e.target.value)}
              className="!h-9"
            />
          </Section>
          <Section label="Начало">
            <Input
              type="time"
              value={state.startTime}
              onChange={(e) => onStartChange(e.target.value)}
              className="!h-9"
            />
          </Section>
          <Section label="Конец">
            <Input
              type="time"
              value={state.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              className="!h-9"
            />
          </Section>
        </div>

        <Section label="Корты">
          <ChipRow>
            {courts.length === 0 ? (
              <span className="text-[11px] text-fade">Нет активных кортов.</span>
            ) : (
              courts.map((c) => (
                <ToggleChip
                  key={c.id}
                  active={state.courtIds.includes(c.id)}
                  onClick={() => toggleCourt(c.id)}
                  label={c.name}
                />
              ))
            )}
          </ChipRow>
        </Section>

        <Section
          label={`Тренеры${state.coachIds.length > 0 ? ` · ${state.coachIds.length}` : " · необязательно"}`}
        >
          <ChipRow>
            {coaches.length === 0 ? (
              <span className="text-[11px] text-fade">Нет активных тренеров.</span>
            ) : (
              coaches.map((c) => (
                <ToggleChip
                  key={c.id}
                  active={state.coachIds.includes(c.id)}
                  onClick={() => toggleCoach(c.id)}
                  label={c.name}
                  accentColor={c.color}
                />
              ))
            )}
          </ChipRow>
        </Section>

        <div className="grid grid-cols-[6rem_1fr] gap-2">
          <Section label="Игроков">
            <Input
              type="number"
              min={0}
              max={64}
              value={state.attendeeCount}
              onChange={(e) => set("attendeeCount", e.target.value)}
              className="!h-9"
            />
          </Section>
          <Section label="Статус">
            <Select
              value={state.status}
              onChange={(e) => set("status", e.target.value as ScheduleSessionStatus)}
              className="!h-9"
            >
              <option value="scheduled">Запланирована</option>
              <option value="completed">Проведена</option>
              <option value="cancelled">Отменена</option>
            </Select>
          </Section>
        </div>

        {preview && !state.manualRevenue && (
          <div className="rounded-md bg-subtle border border-border p-2.5 grid grid-cols-4 gap-2 text-[10.5px]">
            <PreviewCell
              label={preview.peak ? "Пик" : "Off-peak"}
              value={`${formatRub(preview.price)} / игр.`}
              tone={preview.peak ? "warn" : "muted"}
            />
            <PreviewCell label="Выручка" value={formatRub(preview.revenue)} />
            <PreviewCell label="Корт" value={formatRub(preview.courtRev)} />
            <PreviewCell label="Тренировка" value={formatRub(preview.coachingFee)} />
          </div>
        )}

        <label className="inline-flex items-center gap-2 text-[11.5px] text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.manualRevenue}
            onChange={(e) => set("manualRevenue", e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
          Указать суммы вручную
        </label>

        {state.manualRevenue && (
          <div className="grid grid-cols-3 gap-2">
            <Section label="Выручка, ₽">
              <Input
                type="number"
                min={0}
                value={state.revenue}
                onChange={(e) => set("revenue", e.target.value)}
                className="!h-9"
              />
            </Section>
            <Section label="Корт, ₽">
              <Input
                type="number"
                min={0}
                value={state.courtRevenue}
                onChange={(e) => set("courtRevenue", e.target.value)}
                className="!h-9"
              />
            </Section>
            <Section label="Тренировка, ₽">
              <Input
                type="number"
                min={0}
                value={state.coachingFee}
                onChange={(e) => set("coachingFee", e.target.value)}
                className="!h-9"
              />
            </Section>
          </div>
        )}

        <Section label="Заметки">
          <Textarea
            rows={2}
            value={state.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Необязательная заметка"
          />
        </Section>

        {error && (
          <p className="text-[12px] text-[var(--color-danger)] bg-[var(--color-danger-soft)] rounded px-2 py-1.5">
            {error}
          </p>
        )}
      </form>

      <footer className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-subtle/40 flex-shrink-0">
        {mode === "edit" && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={pending}
            className="!text-[var(--color-danger)] hover:!bg-[var(--color-danger-soft)] mr-auto"
          >
            Удалить
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={pending}
          className={mode === "edit" ? "" : "ml-auto"}
        >
          Отмена
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
          disabled={pending}
        >
          {pending
            ? "Сохранение…"
            : mode === "create"
              ? "Создать"
              : "Сохранить"}
        </Button>
      </footer>
    </div>
  );
}

