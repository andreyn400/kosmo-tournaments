import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { getServerDict } from "@/lib/i18n/server";
import { listTournaments } from "@/lib/queries/tournaments";
import { listCourts } from "@/lib/queries/courts";
import { listRegisteredPlayersByTournaments } from "@/lib/queries/registrations";
import { listDivisionsByTournaments } from "@/lib/queries/divisions";

export default async function HomePage() {
  const [all, courts, dict] = await Promise.all([
    listTournaments(),
    listCourts(),
    getServerDict(),
  ]);
  const tournamentIds = all.map((t) => t.id);
  const [playersByTournament, divisionsByTournament] = await Promise.all([
    listRegisteredPlayersByTournaments(tournamentIds),
    listDivisionsByTournaments(tournamentIds),
  ]);
  const leagues = all.filter((t) => t.type === "league_season");
  const oneDays = all.filter((t) => t.type === "one_day");

  return (
    <PageShell
      title={dict["home.title"]}
      action={
        <div className="flex items-center gap-2">
          <Link href="/league/new">
            <Button variant="secondary" size="md">
              <span className="hidden sm:inline">
                {dict["home.new_league_long"]}
              </span>
              <span className="sm:hidden">{dict["home.new_league_short"]}</span>
            </Button>
          </Link>
          <Link href="/tournament/new">
            <Button size="md">
              <span className="hidden sm:inline">
                {dict["home.new_tournament_long"]}
              </span>
              <span className="sm:hidden">
                {dict["home.new_tournament_short"]}
              </span>
            </Button>
          </Link>
        </div>
      }
    >
      {all.length === 0 ? (
        <Card className="flex flex-col items-center text-center gap-5 py-14">
          <div className="h-14 w-14 rounded-full bg-accent-soft border border-accent/20 flex items-center justify-center">
            <span className="h-3 w-3 rounded-sm bg-accent" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold text-black">
              {dict["home.empty_title"]}
            </h2>
            <p className="text-muted text-sm max-w-sm">
              {dict["home.empty_copy"]}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/tournament/new">
              <Button size="lg">{dict["home.new_tournament_long"]}</Button>
            </Link>
            <Link href="/league/new">
              <Button size="lg" variant="secondary">
                {dict["home.new_league_long"]}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          <Section
            title={dict["home.section.leagues"]}
            count={leagues.length}
            emptyHref="/league/new"
            emptyCta={dict["home.new_league_long"]}
            emptyCopy={dict["home.leagues_empty_copy"]}
          >
            {leagues.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                courts={courts}
                players={playersByTournament.get(t.id) ?? []}
                divisionCount={divisionsByTournament.get(t.id)?.length ?? 0}
              />
            ))}
          </Section>
          <Section
            title={dict["home.section.one_day"]}
            count={oneDays.length}
            emptyHref="/tournament/new"
            emptyCta={dict["home.new_tournament_long"]}
            emptyCopy={dict["home.one_day_empty_copy"]}
          >
            {oneDays.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                courts={courts}
                players={playersByTournament.get(t.id) ?? []}
                divisionCount={divisionsByTournament.get(t.id)?.length ?? 0}
              />
            ))}
          </Section>
        </div>
      )}
    </PageShell>
  );
}

function Section({
  title,
  count,
  emptyHref,
  emptyCta,
  emptyCopy,
  children,
}: {
  title: string;
  count: number;
  emptyHref: string;
  emptyCta: string;
  emptyCopy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-[11px] font-semibold text-muted uppercase tracking-[0.12em] whitespace-nowrap">
          {title} {count > 0 ? `· ${count}` : ""}
        </h2>
        <span aria-hidden className="flex-1 border-t border-border" />
      </div>
      {count === 0 ? (
        <Card className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted flex-1 min-w-0">{emptyCopy}</p>
          <Link href={emptyHref}>
            <Button variant="secondary" size="sm">
              {emptyCta}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      )}
    </section>
  );
}
