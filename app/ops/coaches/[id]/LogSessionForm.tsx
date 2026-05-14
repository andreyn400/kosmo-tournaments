"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";
import { SCHEDULE_SESSION_STATUS_KEY } from "@/lib/i18n/coach-keys";
import type {
  Coach,
  Court,
  Program,
  ScheduleSessionStatus,
  ScheduleSessionWithMeta,
} from "@/lib/types";
import { isPeakWindow } from "@/lib/program-groups";
import { computeEarnings } from "@/lib/coach-earnings";
import { todayIso } from "../format";
import { endFromStart, type RawSessionInput } from "./session-input";

type Mode = "create" | "edit";

interface LogSessionFormProps {
  mode: Mode;
  coach: Coach;
  programs: Program[];
  courts: Court[];
  session?: ScheduleSessionWithMeta;
  onCancel: () => void;
  onSubmit: (input: RawSessionInput) => Promise<{ error?: string }>;
  pending: boolean;
  onDelete?: () => void;
}

interface FormState {
  programId: string;
  date: string;
  startTime: string;
  duration: number;
  endTime: string;
  courtIds: string[];
  attendeeCount: string;
  notes: string;
  status: ScheduleSessionStatus;
  manualRevenue: boolean;
  revenue: string;
  courtRevenue: string;
  coachingFee: string;
}

function makeInitial(
  session: ScheduleSessionWithMeta | undefined,
  programs: Program[],
  courts: Court[],
): FormState {
  if (session) {
    const startMin =
      Number.parseInt(session.start_time.slice(0, 2), 10) * 60 +
      Number.parseInt(session.start_time.slice(3, 5), 10);
    const endMin =
      Number.parseInt(session.end_time.slice(0, 2), 10) * 60 +
      Number.parseInt(session.end_time.slice(3, 5), 10);
    return {
      programId: session.program_id ?? "",
      date: session.date,
      startTime: session.start_time.slice(0, 5),
      duration: endMin - startMin,
      endTime: session.end_time.slice(0, 5),
      courtIds: session.court_ids ?? [],
      attendeeCount: String(session.attendee_count),
      notes: session.notes ?? "",
      status: session.status,
      manualRevenue: false,
      revenue: String(session.revenue_rub),
      courtRevenue: String(session.court_revenue_rub),
      coachingFee: String(session.coaching_fee_rub),
    };
  }
  const firstProgram = programs[0];
  const duration = firstProgram?.duration_minutes ?? 60;
  const startTime = "19:00";
  return {
    programId: firstProgram?.id ?? "",
    date: todayIso(),
    startTime,
    duration,
    endTime: endFromStart(startTime, duration),
    courtIds: courts.slice(0, firstProgram?.courts_needed ?? 1).map((c) => c.id),
    attendeeCount: String(firstProgram?.max_players ?? 4),
    notes: "",
    status: "completed",
    manualRevenue: false,
    revenue: "0",
    courtRevenue: "0",
    coachingFee: "0",
  };
}

const STATUS_OPTIONS: ScheduleSessionStatus[] = [
  "completed",
  "scheduled",
  "cancelled",
];

export function LogSessionForm({
  mode,
  coach,
  programs,
  courts,
  session,
  onCancel,
  onSubmit,
  pending,
  onDelete,
}: LogSessionFormProps) {
  const { t, lang } = useTranslation();
  const [state, setState] = useState<FormState>(() =>
    makeInitial(session, programs, courts),
  );
  const [error, setError] = useState<string | null>(null);

  const program = useMemo(
    () => programs.find((p) => p.id === state.programId) ?? null,
    [programs, state.programId],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function onProgramChange(id: string) {
    const p = programs.find((x) => x.id === id);
    setState((s) => {
      const duration = p?.duration_minutes ?? s.duration;
      return {
        ...s,
        programId: id,
        duration,
        endTime: endFromStart(s.startTime, duration),
        courtIds:
          p && s.courtIds.length === 0
            ? courts.slice(0, p.courts_needed).map((c) => c.id)
            : s.courtIds,
        attendeeCount: p?.max_players != null ? String(p.max_players) : s.attendeeCount,
      };
    });
  }

  function onStartTimeChange(time: string) {
    setState((s) => ({
      ...s,
      startTime: time,
      endTime: endFromStart(time, s.duration),
    }));
  }

  function toggleCourt(id: string) {
    setState((s) => ({
      ...s,
      courtIds: s.courtIds.includes(id)
        ? s.courtIds.filter((c) => c !== id)
        : [...s.courtIds, id],
    }));
  }

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
    const payout = computeEarnings(coach, {
      court_revenue_rub: courtRev,
      coaching_fee_rub: coachingFee,
    });
    const clubNet = revenue - payout;
    return {
      peak,
      price: pricePerPlayer,
      revenue,
      courtRev,
      coachingFee,
      payout,
      clubNet,
    };
  }, [program, coach, state.startTime, state.endTime, attendeeCount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const raw: RawSessionInput = {
      program_id: state.programId || null,
      date: state.date,
      start_time: state.startTime,
      end_time: state.endTime,
      court_ids: state.courtIds,
      attendee_count: Number.parseInt(state.attendeeCount, 10) || 0,
      notes: state.notes,
      status: state.status,
      autoCalcRevenue: !state.manualRevenue,
      revenue_rub: Number.parseInt(state.revenue, 10) || 0,
      court_revenue_rub: Number.parseInt(state.courtRevenue, 10) || 0,
      coaching_fee_rub: Number.parseInt(state.coachingFee, 10) || 0,
    };
    const res = await onSubmit(raw);
    if (res.error) setError(res.error);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 p-4 rounded-md bg-subtle border border-border"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem_7rem]">
        <Field label={t("coach.session.field.program")}>
          <Select
            value={state.programId}
            onChange={(e) => onProgramChange(e.target.value)}
          >
            <option value="">{t("coach.session.placeholder.no_program")}</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("coach.session.field.date")}>
          <Input
            type="date"
            value={state.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>
        <Field label={t("coach.session.field.status")}>
          <Select
            value={state.status}
            onChange={(e) =>
              set("status", e.target.value as ScheduleSessionStatus)
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {t(SCHEDULE_SESSION_STATUS_KEY[opt])}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("coach.session.field.start")}>
          <Input
            type="time"
            value={state.startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
          />
        </Field>
        <Field label={t("coach.session.field.end")}>
          <Input
            type="time"
            value={state.endTime}
            onChange={(e) => set("endTime", e.target.value)}
          />
        </Field>
        <Field label={t("coach.session.field.players")}>
          <Input
            type="number"
            min={0}
            max={64}
            value={state.attendeeCount}
            onChange={(e) => set("attendeeCount", e.target.value)}
          />
        </Field>
      </div>

      <Field label={t("coach.session.field.courts")}>
        <div className="flex flex-wrap gap-1.5">
          {courts.length === 0 ? (
            <span className="text-xs text-fade">
              {t("coach.session.no_active_courts")}
            </span>
          ) : (
            courts.map((c) => {
              const on = state.courtIds.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleCourt(c.id)}
                  aria-pressed={on}
                  className={[
                    "px-2.5 h-8 rounded text-xs font-semibold border transition-colors",
                    on
                      ? "bg-accent text-white border-accent"
                      : "bg-surface text-secondary border-border hover:border-border-strong",
                  ].join(" ")}
                >
                  {c.name}
                </button>
              );
            })
          )}
        </div>
      </Field>

      {preview && !state.manualRevenue && (
        <div className="rounded-md bg-surface border border-border p-3 grid grid-cols-3 sm:grid-cols-6 gap-3 text-xs">
          <Preview
            label={
              preview.peak
                ? t("coach.session.preview.peak")
                : t("coach.session.preview.off_peak")
            }
            value={`${formatRub(preview.price, lang)} ${t("coach.session.preview.per_player")}`}
          />
          <Preview
            label={t("coach.metric.revenue")}
            value={formatRub(preview.revenue, lang)}
          />
          <Preview
            label={t("coach.metric.court")}
            value={formatRub(preview.courtRev, lang)}
          />
          <Preview
            label={t("coach.metric.coaching")}
            value={formatRub(preview.coachingFee, lang)}
          />
          <Preview
            label={t("coach.metric.coach")}
            value={formatRub(preview.payout, lang)}
            tone="accent"
          />
          <Preview
            label={t("coach.metric.club")}
            value={formatRub(preview.clubNet, lang)}
            tone="success"
          />
        </div>
      )}

      <label className="inline-flex items-center gap-2 text-xs text-secondary cursor-pointer select-none">
        <input
          type="checkbox"
          checked={state.manualRevenue}
          onChange={(e) => set("manualRevenue", e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        {t("coach.session.field.manual_revenue")}
      </label>

      {state.manualRevenue && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("coach.session.field.revenue_rub")}>
            <Input
              type="number"
              min={0}
              value={state.revenue}
              onChange={(e) => set("revenue", e.target.value)}
            />
          </Field>
          <Field label={t("coach.session.field.court_revenue_rub")}>
            <Input
              type="number"
              min={0}
              value={state.courtRevenue}
              onChange={(e) => set("courtRevenue", e.target.value)}
            />
          </Field>
          <Field label={t("coach.session.field.coaching_fee_rub")}>
            <Input
              type="number"
              min={0}
              value={state.coachingFee}
              onChange={(e) => set("coachingFee", e.target.value)}
            />
          </Field>
        </div>
      )}

      <Field label={t("coach.session.field.notes")}>
        <Textarea
          rows={2}
          value={state.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={t("coach.session.placeholder.notes")}
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
              ? t("coach.session.submit_create")
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
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Preview({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "accent" | "success";
}) {
  const valueCls =
    tone === "accent"
      ? "text-accent"
      : tone === "success"
        ? "text-[var(--color-success)]"
        : "text-black";
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted truncate">
        {label}
      </span>
      <span className={`${valueCls} font-semibold tabular-nums text-sm truncate`}>
        {value}
      </span>
    </div>
  );
}
