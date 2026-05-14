import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { getSession } from "@/lib/queries/sessions";
import { listRegistrations } from "@/lib/queries/registrations";
import { getServerLang } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/format";
import { SelectPlayersForm } from "./SelectPlayersForm";

export default async function SelectPlayersPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();
  if (tournament.type !== "league_season") notFound();

  const session = await getSession(sessionId);
  if (!session || session.tournament_id !== id) notFound();
  if (session.status !== "scheduled") {
    redirect(`/tournament/${id}`);
  }

  const lang = await getServerLang();
  const tr = (
    key: Parameters<typeof translate>[1],
    vars?: Parameters<typeof translate>[2],
  ) => translate(lang, key, vars);

  const registrations = await listRegistrations(id);
  const candidates = registrations
    .map((r) => r.player)
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  const title = tr("session_select.page_title", {
    n: session.session_number,
    date: formatDate(session.session_date, lang),
  });

  return (
    <PageShell
      title={title}
      action={
        <Link href={`/tournament/${id}`}>
          <Button variant="secondary" size="md">
            {tr("session_select.back_to_league")}
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl flex flex-col gap-4">
        <Card>
          <p className="text-sm text-black">
            <span className="font-semibold">{tournament.name}</span>
            {" · "}
            <span className="text-muted">
              {tr("session_select.session_card_copy")}
            </span>
          </p>
        </Card>

        <SelectPlayersForm
          tournamentId={id}
          sessionId={sessionId}
          candidates={candidates}
          defaultStartTime={session.start_time ?? tournament.start_time ?? null}
        />
      </div>
    </PageShell>
  );
}
