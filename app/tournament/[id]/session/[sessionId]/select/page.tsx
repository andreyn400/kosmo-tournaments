import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/site/PageShell";
import { getTournament } from "@/lib/queries/tournaments";
import { getSession } from "@/lib/queries/sessions";
import { listRegistrations } from "@/lib/queries/registrations";
import { formatDateRu } from "@/lib/format-date";
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

  const registrations = await listRegistrations(id);
  const candidates = registrations
    .map((r) => r.player)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return (
    <PageShell
      title={`Сессия ${session.session_number} · ${formatDateRu(session.session_date)}`}
      action={
        <Link href={`/tournament/${id}`}>
          <Button variant="secondary" size="md">
            К лиге
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
              Выберите участников этой сессии из списка лиги.
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
