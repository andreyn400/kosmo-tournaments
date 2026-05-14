"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { getWeekdayLongLabels } from "@/lib/i18n/format";
import type { Court } from "@/lib/types";
import type { WizardSlot, WizardState } from "./WizardShell";

interface Step3Props {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  courts: Court[];
}

function nextLocalId() {
  return Math.random().toString(36).slice(2, 10);
}

function blankDraft(courts: Court[]): WizardSlot {
  return {
    _id: nextLocalId(),
    court_ids: courts[0] ? [courts[0].id] : [],
    day_of_week: 1,
    start_time: "19:00",
    end_time: "21:00",
    notes: "",
  };
}

export function Step3Slots({ state, setState, courts }: Step3Props) {
  const { t, lang } = useTranslation();
  const dayLong = getWeekdayLongLabels(lang);
  const [draft, setDraft] = useState<WizardSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const courtById = new Map(courts.map((c) => [c.id, c]));

  function startAdding() {
    setDraft(blankDraft(courts));
    setError(null);
  }

  function commitDraft() {
    if (!draft) return;
    if (draft.court_ids.length === 0) {
      setError(t("rentals.wizard.slots.error.no_court"));
      return;
    }
    if (draft.end_time <= draft.start_time) {
      setError(t("rentals.wizard.slots.error.end_not_after_start"));
      return;
    }
    setState((s) => ({ ...s, slots: [...s.slots, draft] }));
    setDraft(null);
    setError(null);
  }

  function cancelDraft() {
    setDraft(null);
    setError(null);
  }

  function removeSlot(id: string) {
    setState((s) => ({ ...s, slots: s.slots.filter((sl) => sl._id !== id) }));
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-black">
          {t("rentals.wizard.slots.title")}
        </h2>
        <p className="text-[11.5px] text-muted">
          {t("rentals.wizard.slots.help")}
        </p>
      </header>

      {state.slots.length > 0 && (
        <ul className="rounded-card border border-border bg-surface divide-y divide-border">
          {state.slots.map((s, i) => {
            const courtLabels = s.court_ids
              .map((id) => courtById.get(id)?.name ?? "?")
              .join(", ");
            return (
              <li
                key={s._id}
                className={`flex items-center gap-3 px-4 py-2.5 ${i % 2 === 1 ? "bg-subtle/30" : ""}`}
              >
                <span className="text-sm font-semibold text-black w-28 flex-shrink-0">
                  {dayLong[s.day_of_week]}
                </span>
                <span className="text-xs text-secondary tabular-nums flex-shrink-0">
                  {s.start_time}–{s.end_time}
                </span>
                <span className="text-xs text-secondary truncate flex-1 min-w-0">
                  · {courtLabels}
                </span>
                {s.notes && (
                  <span className="text-[11px] text-muted truncate hidden sm:inline">
                    {s.notes}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeSlot(s._id)}
                  aria-label={t("rentals.wizard.slots.remove_slot_aria")}
                  className="text-muted hover:text-[var(--color-danger)] flex-shrink-0 transition-colors"
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
              </li>
            );
          })}
        </ul>
      )}

      {draft ? (
        <div className="rounded-md bg-subtle border border-border p-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_5.5rem_5.5rem]">
            <Field label={t("rentals.wizard.slots.field.day")}>
              <select
                value={draft.day_of_week}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    day_of_week: Number.parseInt(e.target.value, 10),
                  })
                }
                className="w-full h-9 px-3 rounded-[var(--radius-button)] bg-surface border border-border text-black text-sm"
              >
                {dayLong.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("rentals.wizard.slots.field.start")}>
              <Input
                type="time"
                value={draft.start_time}
                onChange={(e) =>
                  setDraft({ ...draft, start_time: e.target.value })
                }
                className="!h-9"
              />
            </Field>
            <Field label={t("rentals.wizard.slots.field.end")}>
              <Input
                type="time"
                value={draft.end_time}
                onChange={(e) =>
                  setDraft({ ...draft, end_time: e.target.value })
                }
                className="!h-9"
              />
            </Field>
          </div>

          <Field label={t("rentals.wizard.slots.field.courts")}>
            <div className="flex flex-wrap gap-1.5">
              {courts.length === 0 ? (
                <span className="text-[11px] text-fade">
                  {t("rentals.wizard.slots.no_active_courts")}
                </span>
              ) : (
                courts.map((c) => {
                  const on = draft.court_ids.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          court_ids: on
                            ? draft.court_ids.filter((x) => x !== c.id)
                            : [...draft.court_ids, c.id],
                        })
                      }
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

          <Field label={t("rentals.wizard.slots.field.notes")}>
            <Input
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder={t("rentals.wizard.slots.placeholder.notes")}
              className="!h-9"
            />
          </Field>

          {error && (
            <p className="text-[12px] text-[var(--color-danger)]">{error}</p>
          )}

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={cancelDraft}
            >
              {t("btn.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={commitDraft}>
              {t("rentals.wizard.slots.add_commit")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={startAdding}
          className="self-start"
        >
          {t("rentals.wizard.slots.add_cta")}
        </Button>
      )}

      {state.slots.length === 0 && !draft && (
        <p className="text-[11.5px] text-muted -mt-2">
          {t("rentals.wizard.slots.empty_hint")}
        </p>
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
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
