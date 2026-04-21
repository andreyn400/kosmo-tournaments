import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { getDivision, listDivisions } from "@/lib/queries/divisions";
import { listRegistrationsByDivision } from "@/lib/queries/registrations";
import { listPlayers } from "@/lib/queries/players";
import { listCourtsByIds } from "@/lib/queries/courts";
import { listRoundsByDivision } from "@/lib/queries/rounds";
import { listMatchesByDivision } from "@/lib/queries/matches";
import {
  DIVISION_CATEGORY_LABEL_RU,
  FORMAT_LABEL_RU,
  STATUS_LABEL_RU,
} from "@/lib/constants";
import { statusTone } from "@/lib/status-tone";
import { AddPlayerPanel } from "../../AddPlayerPanel";
import { AddPairPanel } from "../../AddPairPanel";
import { RegistrationRow } from "../../RegistrationRow";
import { StartDivisionButton } from "./StartDivisionButton";

export default async function DivisionDetailPage({
  params,
}: {
  params: Promise<{ id: string; divisionId: string }>;
}) {
  const { id, divisionId } = await params;
  const [t, division] = await Promise.all([
    getTournament(id),
    getDivision(divisionId),
  ]);
  if (!t || !division || division.tournament_id !== id) notFound();

  const [registrations, allPlayers, divisionCourts, siblingDivisions] =
    await Promise.all([
      listRegistrationsByDivision(divisionId),
      listPlayers(),
      division.court_ids.length > 0
        ? listCourtsByIds(division.court_ids)
        : Promise.resolve([]),
      listDivisions(id),
    ]);

  const registeredIds = new Set(registrations.map((r) => r.player_id));
  const isTeamFormat =
    division.format === "team_americano" || division.format === "team_mexicano";
  const playerNameById = new Map(allPlayers.map((p) => [p.id, p.name]));

  const canAdd =
    division.status === "draft" || division.status === "registration_open";

  const courtIdSet = new Set(division.court_ids);
  const allConflictCourtIds = new Set<string>();
  for (const d of siblingDivisions) {
    if (d.id === division.id) continue;
    if (d.status !== "in_progress") continue;
    for (const cid of d.court_ids) {
      if (courtIdSet.has(cid)) allConflictCourtIds.add(cid);
    }
  }
  const conflictCourts =
    allConflictCourtIds.size > 0
      ? await listCourtsByIds(Array.from(allConflictCourtIds))
      : [];
  const conflictCourtNumberById = new Map(
    conflictCourts.map((c) => [c.id, c.number]),
  );
  const courtConflicts = siblingDivisions
    .filter(
      (d) =>
        d.id !== division.id &&
        d.status === "in_progress" &&
        d.court_ids.some((cid) => courtIdSet.has(cid)),
    )
    .flatMap((d) =>
      d.court_ids
        .filter((cid) => courtIdSet.has(cid))
        .map((cid) => ({
          courtNumber: conflictCourtNumberById.get(cid) ?? null,
          divisionName: d.name,
        })),
    );

  const [rounds, divisionMatches] =
    division.status === "in_progress" || division.status === "completed"
      ? await Promise.all([
          listRoundsByDivision(division.id),
          listMatchesByDivision(division.id),
        ])
      : [[], []];

  const levelRange =
    division.level_min && division.level_max
      ? division.level_min === division.level_max
        ? `Уровень ${division.level_min}`
        : `${division.level_min} – ${division.level_max}`
      : "Все уровни";

  const courtNums = divisionCourts
    .map((c) => c.number)
    .sort((a, b) => a - b);

  const headerAction = (
    <Link href={`/tournament/${t.id}`}>
      <Button variant="secondary" size="md">
        Назад к турниру
      </Button>
    </Link>
  );

  const title = `${t.name} · ${division.name}`;

  return (
    <PageShell title={title} action={headerAction}>
      <div className="flex flex-col gap-6 max-w-3xl">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">
              {DIVISION_CATEGORY_LABEL_RU[division.category]}
            </Badge>
            <Badge tone="format">{FORMAT_LABEL_RU[division.format]}</Badge>
            <Badge tone={statusTone(division.status)}>
              {STATUS_LABEL_RU[division.status]}
            </Badge>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Row label="Уровни" value={levelRange} />
            <Row
              label="Макс. игроков"
              value={division.max_players ? String(division.max_players) : "—"}
            />
            <Row
              label="Корты"
              value={
                courtNums.length > 0
                  ? courtNums.map((n) => `К${n}`).join(" ")
                  : "Не выбраны"
              }
            />
          </dl>
        </Card>

        {canAdd ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">Запуск дивизиона</h2>
            <p className="text-sm text-muted">
              Сгенерировать расписание матчей и начать игру.
            </p>
            <StartDivisionButton
              tournamentId={t.id}
              divisionId={division.id}
              playerCount={registrations.length}
              courtConflicts={courtConflicts}
            />
          </Card>
        ) : null}

        {division.status === "in_progress" ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">Дивизион идёт</h2>
            <p className="text-sm text-muted">
              Раундов: {rounds.length}, матчей: {divisionMatches.length}.
            </p>
            <div>
              <Link href={`/tournament/${t.id}/division/${division.id}/play`}>
                <Button size="lg">Экран живой игры</Button>
              </Link>
            </div>
          </Card>
        ) : null}

        {division.status === "completed" ? (
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold text-black">Дивизион завершён</h2>
            <p className="text-sm text-muted">
              Раундов: {rounds.length}, матчей: {divisionMatches.length}.
            </p>
            <div>
              <Link
                href={`/tournament/${t.id}/division/${division.id}/results`}
              >
                <Button size="lg">Итоги дивизиона</Button>
              </Link>
            </div>
          </Card>
        ) : null}

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-black">
              Игроки · {registrations.length}
              {division.max_players ? ` / ${division.max_players}` : ""}
            </h2>
          </div>

          {registrations.length === 0 ? (
            <p className="text-sm text-muted">Игроков пока нет.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
              {registrations.map((r, idx) => (
                <RegistrationRow
                  key={r.id}
                  index={idx}
                  tournamentId={t.id}
                  registrationId={r.id}
                  divisionId={division.id}
                  player={r.player}
                  partnerName={
                    isTeamFormat && r.partner_id
                      ? (playerNameById.get(r.partner_id) ?? null)
                      : null
                  }
                  canRemove={canAdd}
                />
              ))}
            </ul>
          )}

          {canAdd ? (
            <div className="pt-2 border-t border-border">
              {isTeamFormat ? (
                <AddPairPanel
                  tournamentId={t.id}
                  divisionId={division.id}
                  allPlayers={allPlayers}
                  registeredIds={registeredIds}
                />
              ) : (
                <AddPlayerPanel
                  tournamentId={t.id}
                  divisionId={division.id}
                  allPlayers={allPlayers}
                  registeredIds={registeredIds}
                  levelMin={division.level_min}
                  levelMax={division.level_max}
                />
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </PageShell>
  );
}

function Row({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={
        wide ? "sm:col-span-2 flex flex-col gap-0.5" : "flex flex-col gap-0.5"
      }
    >
      <dt className="text-xs text-muted uppercase tracking-wider">{label}</dt>
      <dd className="text-black">{value}</dd>
    </div>
  );
}
