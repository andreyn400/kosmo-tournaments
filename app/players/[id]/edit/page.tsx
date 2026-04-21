import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/Button";
import { getPlayer } from "@/lib/queries/players";
import { PlayerEditForm } from "./PlayerEditForm";

export default async function PlayerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  return (
    <PageShell
      title={`Редактировать: ${player.name}`}
      action={
        <Link href={`/players/${player.id}`}>
          <Button variant="secondary" size="md">
            К профилю
          </Button>
        </Link>
      }
    >
      <PlayerEditForm player={player} />
    </PageShell>
  );
}
