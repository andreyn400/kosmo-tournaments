"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import type { Coach } from "@/lib/types";
import type { RawCoachInput } from "./coach-input";

type Mode = "create" | "edit";

interface CoachFormProps {
  mode: Mode;
  coach?: Coach;
  onCancel: () => void;
  onSubmit: (input: RawCoachInput) => Promise<{ error?: string }>;
  pending: boolean;
  onDelete?: () => void;
}

interface FormState {
  name: string;
  phone: string;
  specialization: string;
  level: string;
  bio: string;
  photoUrl: string;
  color: string;
  rateType: "flat" | "percent";
  flatRate: string;
  courtPct: string;
  coachingPct: string;
  isActive: boolean;
  notes: string;
}

function makeInitial(coach: Coach | undefined): FormState {
  return {
    name: coach?.name ?? "",
    phone: coach?.phone ?? "",
    specialization: coach?.specialization ?? "",
    level: coach?.level ?? "",
    bio: coach?.bio ?? "",
    photoUrl: coach?.photo_url ?? "",
    color: coach?.color ?? "#4fc3f7",
    rateType: coach?.rate_type ?? "flat",
    flatRate: String(coach?.flat_rate_rub ?? 0),
    courtPct: String(coach?.rate_court_percent ?? 0),
    coachingPct: String(coach?.rate_coaching_percent ?? 0),
    isActive: coach?.is_active ?? true,
    notes: coach?.notes ?? "",
  };
}

export function CoachForm({
  mode,
  coach,
  onCancel,
  onSubmit,
  pending,
  onDelete,
}: CoachFormProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(() => makeInitial(coach));
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const raw: RawCoachInput = {
      name: state.name,
      phone: state.phone,
      specialization: state.specialization,
      level: state.level,
      bio: state.bio,
      photo_url: state.photoUrl,
      color: state.color,
      rate_type: state.rateType,
      flat_rate_rub: Number.parseInt(state.flatRate, 10) || 0,
      rate_court_percent: Number.parseFloat(state.courtPct) || 0,
      rate_coaching_percent: Number.parseFloat(state.coachingPct) || 0,
      is_active: state.isActive,
      notes: state.notes,
    };
    const res = await onSubmit(raw);
    if (res.error) setError(res.error);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 p-4 rounded-md bg-subtle border border-border"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_minmax(0,12rem)_4.5rem]">
        <Field label={t("coaches.field.name")}>
          <Input
            value={state.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={t("coaches.placeholder.name")}
            autoFocus={mode === "create"}
          />
        </Field>
        <Field label={t("coaches.field.phone")}>
          <Input
            value={state.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+7 …"
          />
        </Field>
        <Field label={t("coaches.field.color")}>
          <input
            type="color"
            value={state.color}
            onChange={(e) => set("color", e.target.value)}
            className="w-full h-11 rounded-[var(--radius-button)] border border-border bg-subtle cursor-pointer"
            aria-label={t("coaches.aria.color_picker")}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("coaches.field.specialization")}>
          <Input
            value={state.specialization}
            onChange={(e) => set("specialization", e.target.value)}
            placeholder={t("coaches.placeholder.specialization")}
          />
        </Field>
        <Field label={t("coaches.field.level")}>
          <Input
            value={state.level}
            onChange={(e) => set("level", e.target.value)}
            placeholder={t("coaches.placeholder.level")}
          />
        </Field>
      </div>

      <Field label={t("coaches.field.photo_url")}>
        <Input
          value={state.photoUrl}
          onChange={(e) => set("photoUrl", e.target.value)}
          placeholder={t("coaches.placeholder.photo_url")}
        />
      </Field>

      <Field label={t("coaches.field.bio")}>
        <Textarea
          rows={2}
          value={state.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder={t("coaches.placeholder.bio")}
        />
      </Field>

      <fieldset className="grid gap-3 p-3 rounded-md bg-surface border border-border">
        <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {t("coaches.field.pay_model")}
        </legend>
        <div className="flex gap-3">
          <RateRadio
            checked={state.rateType === "flat"}
            label={t("coaches.rate.flat_long")}
            hint={t("coaches.rate.flat_hint")}
            onClick={() => set("rateType", "flat")}
          />
          <RateRadio
            checked={state.rateType === "percent"}
            label={t("coaches.rate.percent_long")}
            hint={t("coaches.rate.percent_hint")}
            onClick={() => set("rateType", "percent")}
          />
        </div>

        {state.rateType === "flat" ? (
          <Field label={t("coaches.field.flat_rate")}>
            <Input
              type="number"
              min={0}
              value={state.flatRate}
              onChange={(e) => set("flatRate", e.target.value)}
            />
          </Field>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("coaches.field.court_percent")}>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={state.courtPct}
                onChange={(e) => set("courtPct", e.target.value)}
              />
            </Field>
            <Field label={t("coaches.field.coaching_percent")}>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={state.coachingPct}
                onChange={(e) => set("coachingPct", e.target.value)}
              />
            </Field>
          </div>
        )}
      </fieldset>

      <Field label={t("coaches.field.notes")}>
        <Textarea
          rows={2}
          value={state.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={t("coaches.placeholder.notes")}
        />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm text-secondary cursor-pointer select-none">
        <input
          type="checkbox"
          checked={state.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        {t("coaches.field.is_active")}
      </label>

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
              ? t("coaches.add_submit_create")
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

function RateRadio({
  checked,
  label,
  hint,
  onClick,
}: {
  checked: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={[
        "flex-1 text-left p-3 rounded-md border transition-colors",
        checked
          ? "border-accent bg-accent-soft"
          : "border-border bg-subtle hover:bg-hover",
      ].join(" ")}
    >
      <div
        className={[
          "text-sm font-semibold",
          checked ? "text-accent" : "text-black",
        ].join(" ")}
      >
        {label}
      </div>
      <div className="text-[11px] text-muted mt-0.5">{hint}</div>
    </button>
  );
}
