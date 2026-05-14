"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "@/components/i18n/useTranslation";
import type { Player } from "@/lib/types";
import { removePlayerAction } from "./remove-player-action";

export function RegistrationRow({
  tournamentId,
  registrationId,
  player,
  partnerName,
  canRemove,
  index,
  divisionId,
}: {
  tournamentId: string;
  registrationId: string;
  player: Player;
  partnerName?: string | null;
  canRemove: boolean;
  index: number;
  divisionId?: string | null;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const res = await removePlayerAction({
        tournamentId,
        registrationId,
        divisionId: divisionId ?? null,
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
              {t("registration.partner_with", { name: partnerName })}
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
          aria-label={t("registration.delete_aria", { name: player.name })}
        >
          {t("btn.delete")}
        </Button>
      ) : null}
    </li>
  );
}
