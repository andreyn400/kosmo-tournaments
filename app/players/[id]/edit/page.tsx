import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/Button";
import { getPlayer } from "@/lib/queries/players";
import { st } from "@/lib/i18n/server";
import { PlayerEditForm } from "./PlayerEditForm";

export default async function PlayerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const [title, toProfile] = await Promise.all([
    st("players.edit_title", { name: player.name }),
    st("players.to_profile"),
  ]);

  return (
    <PageShell
      title={title}
      action={
        <Link href={`/players/${player.id}`}>
          <Button variant="secondary" size="md">
            {toProfile}
          </Button>
        </Link>
      }
    >
      <PlayerEditForm player={player} />
    </PageShell>
  );
}
