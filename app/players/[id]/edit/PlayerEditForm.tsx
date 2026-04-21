"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Player } from "@/lib/types";
import {
  PlayerFields,
  type PlayerFormValues,
} from "../../PlayerFields";
import { updatePlayerAction } from "./update-player-action";

function fromPlayer(p: Player): PlayerFormValues {
  return {
    name: p.name,
    level: p.level,
    phone: p.phone ?? "",
    email: p.email ?? "",
    gender: p.gender ?? "",
    date_of_birth: p.date_of_birth ?? "",
    nationality: p.nationality ?? "",
    photo_url: p.photo_url ?? "",
    membership_status: p.membership_status,
    dominant_hand: p.dominant_hand ?? "",
    notes: p.notes ?? "",
  };
}

export function PlayerEditForm({ player }: { player: Player }) {
  const [values, setValues] = useState<PlayerFormValues>(() => fromPlayer(player));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setField = (field: keyof PlayerFormValues, value: string) =>
    setValues((v) => ({ ...v, [field]: value }));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await updatePlayerAction(player.id, values);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <Card className="flex flex-col gap-5 max-w-3xl">
      <PlayerFields values={values} onChange={setField} disabled={pending} />

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm"
        >
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Link href={`/players/${player.id}`}>
          <Button variant="secondary" disabled={pending}>
            Отмена
          </Button>
        </Link>
        <Button onClick={submit} disabled={pending || !values.name.trim()}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </Card>
  );
}
