"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PADEL_LEVELS } from "@/lib/constants";
import type { Player } from "@/lib/types";
import { addPlayerAction } from "./add-player-action";
import { createAndAddPlayerAction } from "./create-and-add-player-action";

export function AddPlayerPanel({
  tournamentId,
  allPlayers,
  registeredIds,
}: {
  tournamentId: string;
  allPlayers: Player[];
  registeredIds: Set<string>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState("C");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = allPlayers.filter((p) => !registeredIds.has(p.id));
    if (!q) return available.slice(0, 8);
    return available
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allPlayers, registeredIds, query]);

  const add = (playerId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await addPlayerAction({ tournamentId, playerId });
      if (res.error) setError(res.error);
      else {
        setQuery("");
        router.refresh();
      }
    });
  };

  const createAndAdd = () => {
    setError(null);
    startTransition(async () => {
      const res = await createAndAddPlayerAction({
        tournamentId,
        name: newName,
        level: newLevel,
      });
      if (res.error) setError(res.error);
      else {
        setNewName("");
        setNewLevel("C");
        setQuery("");
        router.refresh();
      }
    });
  };

  const trimmedQuery = query.trim();
  const showCreatePrompt =
    trimmedQuery.length > 0 &&
    !allPlayers.some(
      (p) => p.name.toLowerCase() === trimmedQuery.toLowerCase(),
    );

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Поиск игрока по имени…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-black truncate">{p.name}</span>
                <span className="text-xs text-muted flex-shrink-0">
                  {p.level} · {p.elo_rating}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => add(p.id)}
              >
                Добавить
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {trimmedQuery
            ? "Игроки не найдены."
            : "Начните вводить имя или добавьте нового игрока ниже."}
        </p>
      )}

      <div className="mt-2 pt-4 border-t border-border flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-black">Новый игрок</h3>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input
            placeholder={showCreatePrompt ? trimmedQuery : "Имя"}
            value={newName || (showCreatePrompt ? trimmedQuery : "")}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Select
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value)}
            className="sm:w-28"
          >
            {PADEL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Button
            disabled={pending || !(newName.trim() || showCreatePrompt)}
            onClick={createAndAdd}
          >
            Создать и добавить
          </Button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
