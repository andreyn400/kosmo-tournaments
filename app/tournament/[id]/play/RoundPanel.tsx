"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "@/components/i18n/useTranslation";
import type {
  Court,
  Match,
  Player,
  Round,
  ScoringSystem,
  TournamentType,
} from "@/lib/types";
import { MatchCard } from "./MatchCard";
import { advanceRoundAction } from "./advance-round-action";
import { finalizeTournamentAction } from "./finalize-tournament-action";
import { finalizeDivisionAction } from "../division/[divisionId]/play/finalize-division-action";

export function RoundPanel({
  tournamentId,
  tournamentType,
  sessionId,
  divisionId,
  round,
  matches,
  playerById,
  courtById,
  scoringSystem,
  isCurrent,
  isLast,
  allRoundsComplete,
}: {
  tournamentId: string;
  tournamentType: TournamentType;
  sessionId: string;
  divisionId?: string | null;
  round: Round;
  matches: Match[];
  playerById: Map<string, Player>;
  courtById: Map<string, Court>;
  scoringSystem: ScoringSystem;
  isCurrent: boolean;
  isLast: boolean;
  allRoundsComplete: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allCompleted =
    matches.length > 0 && matches.every((m) => m.status === "completed");

  const advance = () => {
    setError(null);
    startTransition(async () => {
      const res = await advanceRoundAction({
        tournamentId,
        sessionId,
        currentRoundId: round.id,
        divisionId: divisionId ?? null,
      });
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  const finalize = () => {
    setError(null);
    startTransition(async () => {
      const res = divisionId
        ? await finalizeDivisionAction({ tournamentId, divisionId })
        : await finalizeTournamentAction(tournamentId);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">
          {t("round.title_n", { n: round.round_number })}
        </h2>
        <RoundBadge round={round} />
      </div>

      <div className="flex flex-col gap-3">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            tournamentId={tournamentId}
            match={m}
            playerById={playerById}
            courtById={courtById}
            scoringSystem={scoringSystem}
            editable={isCurrent}
          />
        ))}
      </div>

      {isCurrent && allCompleted && !isLast ? (
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth disabled={pending} onClick={advance}>
            {pending ? t("round.advancing") : t("round.advance_next")}
          </Button>
          {error ? <ErrorBanner message={error} /> : null}
        </div>
      ) : null}

      {isCurrent && allCompleted && isLast ? (
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth disabled={pending} onClick={advance}>
            {pending ? t("round.finalizing") : t("round.advance_last")}
          </Button>
          {error ? <ErrorBanner message={error} /> : null}
        </div>
      ) : null}

      {allRoundsComplete && isLast ? (
        <div className="flex flex-col gap-2">
          <Button
            variant="dark"
            size="lg"
            fullWidth
            disabled={pending}
            onClick={finalize}
          >
            {pending
              ? t("round.elo_updating")
              : tournamentType === "league_season"
                ? t("round.finalize_session")
                : t("round.finalize_tournament")}
          </Button>
          <p className="text-xs text-muted">
            {tournamentType === "league_season"
              ? t("round.session_summary")
              : t("round.tournament_summary")}
          </p>
          {error ? <ErrorBanner message={error} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function RoundBadge({ round }: { round: Round }) {
  const { t } = useTranslation();
  if (round.status === "in_progress")
    return <Badge tone="status-progress">{t("round.badge.in_progress")}</Badge>;
  if (round.status === "completed")
    return <Badge tone="status-completed">{t("round.badge.completed")}</Badge>;
  return <Badge tone="neutral">{t("round.badge.pending")}</Badge>;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm"
    >
      {message}
    </div>
  );
}
