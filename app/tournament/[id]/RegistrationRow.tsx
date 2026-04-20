"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Player } from "@/lib/types";
import { removePlayerAction } from "./remove-player-action";

export function RegistrationRow({
  tournamentId,
  registrationId,
  player,
  partnerName,
  canRemove,
  index,
}: {
  tournamentId: string;
  registrationId: string;
  player: Player;
  partnerName?: string | null;
  canRemove: boolean;
  index: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const res = await removePlayerAction({
        tournamentId,
        registrationId,
      });
      if (!res.error) router.refresh();
    });
  };

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-semibold text-muted w-5 flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex flex-col min-w-0 gap-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-black truncate">{player.name}</span>
            <Badge tone="level">{player.level}</Badge>
            <span className="text-xs text-muted flex-shrink-0">
              {player.elo_rating}
            </span>
          </div>
          {partnerName ? (
            <span className="text-xs text-muted truncate">
              в паре с {partnerName}
            </span>
          ) : null}
        </div>
      </div>
      {canRemove ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={remove}
          aria-label={`Удалить ${player.name}`}
        >
          Удалить
        </Button>
      ) : null}
    </li>
  );
}
