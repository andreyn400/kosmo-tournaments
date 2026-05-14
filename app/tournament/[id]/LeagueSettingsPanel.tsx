"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/components/i18n/useTranslation";
import {
  SCORING_GROUP_LABEL_KEY,
  SCORING_SYSTEM_HELPER_KEY,
  SCORING_SYSTEM_LABEL_KEY,
} from "@/lib/i18n/scoring-keys";
import { SCORING_SYSTEMS, scoringGroup } from "@/lib/scoring-systems";
import type { ScoringSystem, FinalsStatus } from "@/lib/types";
import { updateLeagueSettingsAction } from "./update-league-settings-action";

const SCORING_GROUPED: Record<
  ReturnType<typeof scoringGroup>,
  ScoringSystem[]
> = {
  points: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "points"),
  games: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "games"),
  combined: SCORING_SYSTEMS.filter((s) => scoringGroup(s) === "combined"),
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
  const { t } = useTranslation();
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
          <h2 className="font-semibold text-black">
            {t("league_settings.title")}
          </h2>
          <p className="text-xs text-muted">{t("league_settings.subtitle")}</p>
        </div>
        {!open ? (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            {t("league_settings.edit_cta")}
          </Button>
        ) : null}
      </div>

      {!open ? (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <InfoItem
            label={t("league_settings.field.spots")}
            value={String(qualificationSpots)}
          />
          <InfoItem
            label={t("league_settings.field.finals_date")}
            value={finalsDate ?? "—"}
          />
          <InfoItem
            label={t("league_settings.field.scoring")}
            value={t(SCORING_SYSTEM_LABEL_KEY[initialScoring])}
          />
        </dl>
      ) : (
        <div className="flex flex-col gap-4 pt-2 border-t border-border">
          {lockedBecauseCreated ? (
            <p className="text-xs text-warning">
              {t("league_settings.locked_warning")}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("league_settings.field.spots")} required>
              <Select value={spots} onChange={(e) => setSpots(e.target.value)}>
                {[2, 4, 8, 16, 32].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t("league_settings.field.finals_date")}>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>

          <Field
            label={t("league_settings.field.scoring")}
            hint={t(SCORING_SYSTEM_HELPER_KEY[scoring])}
          >
            <Select
              value={scoring}
              onChange={(e) => setScoring(e.target.value as ScoringSystem)}
            >
              <optgroup label={t(SCORING_GROUP_LABEL_KEY.sets)}>
                {SCORING_GROUPED.sets.map((s) => (
                  <option key={s} value={s}>
                    {t(SCORING_SYSTEM_LABEL_KEY[s])}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t(SCORING_GROUP_LABEL_KEY.games)}>
                {SCORING_GROUPED.games.map((s) => (
                  <option key={s} value={s}>
                    {t(SCORING_SYSTEM_LABEL_KEY[s])}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t(SCORING_GROUP_LABEL_KEY.combined)}>
                {SCORING_GROUPED.combined.map((s) => (
                  <option key={s} value={s}>
                    {t(SCORING_SYSTEM_LABEL_KEY[s])}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t(SCORING_GROUP_LABEL_KEY.points)}>
                {SCORING_GROUPED.points.map((s) => (
                  <option key={s} value={s}>
                    {t(SCORING_SYSTEM_LABEL_KEY[s])}
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
              {pending ? t("btn.saving") : t("btn.save")}
            </Button>
            <Button variant="secondary" onClick={cancel} disabled={pending}>
              {t("btn.cancel")}
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
