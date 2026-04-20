import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { listTournaments } from "@/lib/queries/tournaments";
import { listCourts } from "@/lib/queries/courts";

export default async function HomePage() {
  const [all, courts] = await Promise.all([listTournaments(), listCourts()]);
  const leagues = all.filter((t) => t.type === "league_season");
  const oneDays = all.filter((t) => t.type === "one_day");

  return (
    <PageShell
      title="Главная"
      action={
        <div className="flex items-center gap-2">
          <Link href="/league/new">
            <Button variant="secondary" size="md">
              <span className="hidden sm:inline">+ Новая лига</span>
              <span className="sm:hidden">+ Лига</span>
            </Button>
          </Link>
          <Link href="/tournament/new">
            <Button size="md">
              <span className="hidden sm:inline">+ Новый турнир</span>
              <span className="sm:hidden">+ Турнир</span>
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
            <h2 className="text-xl font-semibold text-black">Пока пусто</h2>
            <p className="text-muted text-sm max-w-sm">
              Создайте первый турнир или лигу, чтобы начать регистрацию
              игроков и расписание матчей.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/tournament/new">
              <Button size="lg">+ Новый турнир</Button>
            </Link>
            <Link href="/league/new">
              <Button size="lg" variant="secondary">
                + Новая лига
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          <Section
            title="Лиги"
            count={leagues.length}
            emptyHref="/league/new"
            emptyCta="+ Новая лига"
            emptyCopy="Сезонные лиги с несколькими сессиями и кумулятивной таблицей."
          >
            {leagues.map((t) => (
              <TournamentCard key={t.id} tournament={t} courts={courts} />
            ))}
          </Section>
          <Section
            title="Турниры одного дня"
            count={oneDays.length}
            emptyHref="/tournament/new"
            emptyCta="+ Новый турнир"
            emptyCopy="Однодневные турниры: Американо, Мексикано, Круговой, Команды."
          >
            {oneDays.map((t) => (
              <TournamentCard key={t.id} tournament={t} courts={courts} />
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
