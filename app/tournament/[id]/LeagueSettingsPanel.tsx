"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  SCORING_GROUP_LABEL_RU,
  SCORING_SYSTEM_HELPER_RU,
  SCORING_SYSTEM_LABEL_RU,
  SCORING_SYSTEMS,
  scoringGroup,
} from "@/lib/scoring-systems";
import type { ScoringSystem, FinalsStatus } from "@/lib/types";
import { updateLeagueSettingsAction } from "./update-league-settings-action";

const SCORING_GROUPED: Record<
  ReturnType<typeof scoringGroup>,
  ScoringSystem[]
> = {
  points: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "points"),
  games: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "games"),
  sets: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "sets"),
};

export function LeagueSettingsPanel({
  tournamentId,
  qualificationSpots,
  finalsDate,
  finalsScoringSystem,
  finalsStatus,
}: {
  tournamentId: string;
  qualificationSpots: number;
  finalsDate: string | null;
  finalsScoringSystem: ScoringSystem | null;
  finalsStatus: FinalsStatus;
}) {
  const initialScoring: ScoringSystem = finalsScoringSystem ?? "sets_best3";
  const [open, setOpen] = useState(false);
  const [spots, setSpots] = useState<string>(String(qualificationSpots));
  const [date, setDate] = useState<string>(finalsDate ?? "");
  const [scoring, setScoring] = useState<ScoringSystem>(initialScoring);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const lockedBecauseCreated = finalsStatus !== "not_created";

  const reset = () => {
    setSpots(String(qualificationSpots));
    setDate(finalsDate ?? "");
    setScoring(initialScoring);
    setError(null);
  };

  const cancel = () => {
    reset();
    setOpen(false);
  };

  const submit = () => {
    setError(null);
    const n = Number(spots);
    startTransition(async () => {
      const res = await updateLeagueSettingsAction({
        tournamentId,
        qualificationSpots: n,
        finalsDate: date || null,
        finalsScoringSystem: scoring,
      });
      if (res.error) setError(res.error);
      else setOpen(false);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold text-black">Настройки сезона</h2>
          <p className="text-xs text-muted">
            Квалификация, дата и система счёта финала
          </p>
        </div>
        {!open ? (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            Редактировать
          </Button>
        ) : null}
      </div>

      {!open ? (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <InfoItem
            label="Квалификационных мест"
            value={String(qualificationSpots)}
          />
          <InfoItem
            label="Дата финала"
            value={finalsDate ?? "—"}
          />
          <InfoItem
            label="Система счёта финала"
            value={SCORING_SYSTEM_LABEL_RU[initialScoring]}
          />
        </dl>
      ) : (
        <div className="flex flex-col gap-4 pt-2 border-t border-border">
          {lockedBecauseCreated ? (
            <p className="text-xs text-warning">
              Финальная сетка уже создана. Изменения в этих настройках не повлияют
              на существующую сетку.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Квалификационных мест" required>
              <Select value={spots} onChange={(e) => setSpots(e.target.value)}>
                {[2, 4, 8, 16, 32].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Дата финала">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Система счёта финала"
            hint={SCORING_SYSTEM_HELPER_RU[scoring]}
          >
            <Select
              value={scoring}
              onChange={(e) => setScoring(e.target.value as ScoringSystem)}
            >
              <optgroup label={SCORING_GROUP_LABEL_RU.sets}>
                {SCORING_GROUPED.sets.map((s) => (
                  <option key={s} value={s}>
                    {SCORING_SYSTEM_LABEL_RU[s]}
                  </option>
                ))}
              </optgroup>
              <optgroup label={SCORING_GROUP_LABEL_RU.games}>
                {SCORING_GROUPED.games.map((s) => (
                  <option key={s} value={s}>
                    {SCORING_SYSTEM_LABEL_RU[s]}
                  </option>
                ))}
              </optgroup>
              <optgroup label={SCORING_GROUP_LABEL_RU.points}>
                {SCORING_GROUPED.points.map((s) => (
                  <option key={s} value={s}>
                    {SCORING_SYSTEM_LABEL_RU[s]}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Field>

          {error ? (
            <div
              role="alert"
              className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3 py-2 text-sm"
            >
              {error}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={pending}>
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
            <Button variant="secondary" onClick={cancel} disabled={pending}>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted uppercase tracking-wider">{label}</dt>
      <dd className="text-black">{value}</dd>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-black">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
