import { PageShell } from "@/components/site/PageShell";
import { listPlayers } from "@/lib/queries/players";
import { PlayersPanel } from "./PlayersPanel";

export default async function PlayersPage() {
  const players = await listPlayers();
  return (
    <PageShell title="Игроки">
      <PlayersPanel players={players} />
    </PageShell>
  );
}
