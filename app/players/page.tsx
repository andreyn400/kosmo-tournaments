import { PageShell } from "@/components/site/PageShell";
import { listPlayers } from "@/lib/queries/players";
import { st } from "@/lib/i18n/server";
import { PlayersPanel } from "./PlayersPanel";

export default async function PlayersPage() {
  const [players, title] = await Promise.all([listPlayers(), st("players.title")]);
  return (
    <PageShell title={title}>
      <PlayersPanel players={players} />
    </PageShell>
  );
}
