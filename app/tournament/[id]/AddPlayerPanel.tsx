"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { PADEL_LEVELS } from "@/lib/constants";
import type { Player } from "@/lib/types";
import { addPlayerAction } from "./add-player-action";
import { createAndAddPlayerAction } from "./create-and-add-player-action";

function isLevelOutOfRange(
  level: string,
  min: string | null | undefined,
  max: string | null | undefined,
): boolean {
  if (!min && !max) return false;
  const idx = PADEL_LEVELS.indexOf(level as (typeof PADEL_LEVELS)[number]);
  if (idx === -1) return false;
  const minIdx = min
    ? PADEL_LEVELS.indexOf(min as (typeof PADEL_LEVELS)[number])
    : -1;
  const maxIdx = max
    ? PADEL_LEVELS.indexOf(max as (typeof PADEL_LEVELS)[number])
    : -1;
  if (minIdx !== -1 && idx < minIdx) return true;
  if (maxIdx !== -1 && idx > maxIdx) return true;
  return false;
}

export function AddPlayerPanel({
  tournamentId,
  allPlayers,
  registeredIds,
  divisionId,
  levelMin,
  levelMax,
}: {
  tournamentId: string;
  allPlayers: Player[];
  registeredIds: Set<string>;
  divisionId?: string | null;
  levelMin?: string | null;
  levelMax?: string | null;
}) {
  const router = useRouter();
  const { t } = useTranslation();
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
      const res = await addPlayerAction({
        tournamentId,
        playerId,
        divisionId: divisionId ?? null,
      });
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
        divisionId: divisionId ?? null,
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
        placeholder={t("add_player.search_placeholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
          {filtered.map((p) => {
            const outOfRange = isLevelOutOfRange(p.level, levelMin, levelMax);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-black truncate">{p.name}</span>
                  <span className="text-xs text-muted flex-shrink-0">
                    {p.level} · {p.elo_rating}
                  </span>
                  {outOfRange ? (
                    <span className="text-xs text-[var(--color-warning)] flex-shrink-0">
                      {t("add_player.out_of_range")}
                    </span>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => add(p.id)}
                >
                  {t("add_player.add_cta")}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {trimmedQuery
            ? t("add_player.no_results")
            : t("add_player.start_typing")}
        </p>
      )}

      <div className="mt-2 pt-4 border-t border-border flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-black">
          {t("add_player.new_player_title")}
        </h3>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input
            placeholder={
              showCreatePrompt ? trimmedQuery : t("add_player.name_placeholder")
            }
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
            {t("add_player.create_and_add")}
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
