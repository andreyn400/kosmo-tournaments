"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { DIVISION_CATEGORY_KEY } from "@/lib/i18n/scoring-keys";
import {
  TOURNAMENT_FORMAT_KEY,
  TOURNAMENT_STATUS_KEY,
} from "@/lib/i18n/tournament-keys";
import { statusTone } from "@/lib/status-tone";
import type { Court, Division, ScoringSystem, TournamentFormat } from "@/lib/types";
import {
  DivisionForm,
  defaultInitial,
  initialFromDivision,
  type DivisionFormValues,
} from "./DivisionForm";
import { createDivisionAction } from "./create-division-action";
import { updateDivisionAction } from "./update-division-action";
import { deleteDivisionAction } from "./delete-division-action";

type Mode =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "editing"; division: Division };

export function DivisionsPanel({
  tournamentId,
  tournamentCourts,
  tournamentDefaults,
  divisions,
}: {
  tournamentId: string;
  tournamentCourts: Court[];
  tournamentDefaults: {
    format: TournamentFormat;
    scoring_system: ScoringSystem;
    level_min: string | null;
    level_max: string | null;
    court_ids: string[];
  };
  divisions: Division[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setMode({ kind: "idle" });
    setError(null);
  };

  const submit = (values: DivisionFormValues) => {
    setError(null);
    startTransition(async () => {
      const payload = {
        tournamentId,
        name: values.name,
        category: values.category,
        format: values.format,
        scoring_system: values.scoring_system,
        level_min: values.level_min || null,
        level_max: values.level_max || null,
        max_players: values.max_players
          ? Number.parseInt(values.max_players, 10)
          : null,
        court_ids: Array.from(values.court_ids),
      };
      const res =
        mode.kind === "editing"
          ? await updateDivisionAction({
              ...payload,
              divisionId: mode.division.id,
            })
          : await createDivisionAction(payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      reset();
      router.refresh();
    });
  };

  const confirmDelete = (divisionId: string) => {
    setError(null);
    setDeletingId(divisionId);
    startTransition(async () => {
      const res = await deleteDivisionAction({ tournamentId, divisionId });
      setDeletingId(null);
      setConfirmingId(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-black">
          {t("divisions.title")} · {divisions.length}
        </h2>
        {mode.kind === "idle" ? (
          <Button
            size="sm"
            onClick={() => {
              setError(null);
              setMode({ kind: "creating" });
            }}
          >
            {t("divisions.add_cta")}
          </Button>
        ) : null}
      </div>

      {mode.kind === "creating" ? (
        <DivisionForm
          initial={defaultInitial(tournamentDefaults)}
          tournamentId={tournamentId}
          tournamentCourts={tournamentCourts}
          submitLabel={t("divisions.submit.create")}
          pending={pending}
          error={error}
          onSubmit={submit}
          onCancel={reset}
        />
      ) : null}

      {mode.kind === "editing" ? (
        <DivisionForm
          initial={initialFromDivision(mode.division)}
          tournamentId={tournamentId}
          divisionId={mode.division.id}
          tournamentCourts={tournamentCourts}
          submitLabel={t("divisions.submit.save")}
          pending={pending}
          error={error}
          onSubmit={submit}
          onCancel={reset}
        />
      ) : null}

      {mode.kind === "idle" && error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm"
        >
          {error}
        </div>
      ) : null}

      {divisions.length === 0 && mode.kind === "idle" ? (
        <p className="text-sm text-muted">{t("divisions.empty")}</p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {divisions.map((d) => {
          const courtNums = tournamentCourts
            .filter((c) => d.court_ids.includes(c.id))
            .map((c) => c.number)
            .sort((a, b) => a - b);
          const levelRange =
            d.level_min && d.level_max
              ? d.level_min === d.level_max
                ? t("level.level_one", { level: d.level_min })
                : t("level.level_range", { min: d.level_min, max: d.level_max })
              : t("level.all_levels");
          const isConfirming = confirmingId === d.id;
          const isDeleting = deletingId === d.id;
          const courtPrefix = t("court.prefix");
          return (
            <li
              key={d.id}
              className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-black">{d.name}</h3>
                    <Badge tone="neutral">
                      {t(DIVISION_CATEGORY_KEY[d.category])}
                    </Badge>
                    <Badge tone="format">
                      {t(TOURNAMENT_FORMAT_KEY[d.format])}
                    </Badge>
                    <Badge tone={statusTone(d.status)}>
                      {t(TOURNAMENT_STATUS_KEY[d.status])}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span>{levelRange}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {courtNums.length > 0
                        ? courtNums.map((n) => `${courtPrefix}${n}`).join(" ")
                        : t("divisions.no_courts")}
                    </span>
                    {d.max_players ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          {t("divisions.max_players", { n: d.max_players })}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {mode.kind === "idle" && !isConfirming ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link href={`/tournament/${tournamentId}/division/${d.id}`}>
                      <Button size="sm" variant="ghost">
                        {t("divisions.row.open_cta")}
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setError(null);
                        setMode({ kind: "editing", division: d });
                      }}
                    >
                      {t("divisions.row.edit_cta")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setError(null);
                        setConfirmingId(d.id);
                      }}
                    >
                      {t("divisions.row.delete_cta")}
                    </Button>
                  </div>
                ) : null}
              </div>

              {isConfirming ? (
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                  <span className="text-sm text-black">
                    {t("divisions.delete_confirm", { name: d.name })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isDeleting}
                      onClick={() => confirmDelete(d.id)}
                    >
                      {isDeleting ? t("btn.deleting") : t("btn.yes")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isDeleting}
                      onClick={() => {
                        setConfirmingId(null);
                        setError(null);
                      }}
                    >
                      {t("btn.no")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
