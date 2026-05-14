"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import type { Player } from "@/lib/types";
import { addPairAction } from "./add-pair-action";

export function AddPairPanel({
  tournamentId,
  allPlayers,
  registeredIds,
  divisionId,
}: {
  tournamentId: string;
  allPlayers: Player[];
  registeredIds: Set<string>;
  divisionId?: string | null;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [selectedA, setSelectedA] = useState<Player | null>(null);
  const [selectedB, setSelectedB] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const available = useMemo(
    () => allPlayers.filter((p) => !registeredIds.has(p.id)),
    [allPlayers, registeredIds],
  );

  const filteredA = useMemo(() => {
    const q = queryA.trim().toLowerCase();
    const pool = available.filter((p) => p.id !== selectedB?.id);
    if (!q) return pool.slice(0, 8);
    return pool.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [available, queryA, selectedB]);

  const filteredB = useMemo(() => {
    const q = queryB.trim().toLowerCase();
    const pool = available.filter((p) => p.id !== selectedA?.id);
    if (!q) return pool.slice(0, 8);
    return pool.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [available, queryB, selectedA]);

  const canAdd = selectedA && selectedB && !pending;

  const submit = () => {
    if (!selectedA || !selectedB) return;
    setError(null);
    startTransition(async () => {
      const res = await addPairAction({
        tournamentId,
        playerAId: selectedA.id,
        playerBId: selectedB.id,
        divisionId: divisionId ?? null,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSelectedA(null);
        setSelectedB(null);
        setQueryA("");
        setQueryB("");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <PickerColumn
          title={t("add_pair.player1")}
          query={queryA}
          onQueryChange={setQueryA}
          selected={selectedA}
          onClear={() => setSelectedA(null)}
          candidates={filteredA}
          onPick={(p) => {
            setSelectedA(p);
            setQueryA("");
          }}
        />
        <PickerColumn
          title={t("add_pair.partner")}
          query={queryB}
          onQueryChange={setQueryB}
          selected={selectedB}
          onClear={() => setSelectedB(null)}
          candidates={filteredB}
          onPick={(p) => {
            setSelectedB(p);
            setQueryB("");
          }}
          disabled={!selectedA}
        />
      </div>

      <div>
        <Button disabled={!canAdd} onClick={submit}>
          {pending ? t("add_pair.adding") : t("add_pair.add_cta")}
        </Button>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3.5 py-2.5 text-sm"
        >
          {error}
        </div>
      ) : null}

      <p className="text-xs text-muted">{t("add_pair.create_hint")}</p>
    </div>
  );
}

function PickerColumn({
  title,
  query,
  onQueryChange,
  selected,
  onClear,
  candidates,
  onPick,
  disabled,
}: {
  title: string;
  query: string;
  onQueryChange: (v: string) => void;
  selected: Player | null;
  onClear: () => void;
  candidates: Player[];
  onPick: (p: Player) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted uppercase tracking-wider">
        {title}
      </span>
      {selected ? (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-border rounded-[var(--radius-button)]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-black truncate">{selected.name}</span>
            <span className="text-xs text-muted flex-shrink-0">
              {selected.level} · {selected.elo_rating}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={onClear}>
            {t("add_pair.change_cta")}
          </Button>
        </div>
      ) : (
        <>
          <Input
            placeholder={
              disabled
                ? t("add_pair.pick_player1_first")
                : t("add_pair.search_placeholder")
            }
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            disabled={disabled}
          />
          {!disabled && candidates.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
              {candidates.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2 bg-white"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-black truncate text-sm">
                      {p.name}
                    </span>
                    <span className="text-xs text-muted flex-shrink-0">
                      {p.level} · {p.elo_rating}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onPick(p)}>
                    {t("add_pair.pick_cta")}
                  </Button>
                </li>
              ))}
            </ul>
          ) : !disabled ? (
            <p className="text-xs text-muted">
              {query.trim()
                ? t("add_pair.no_results")
                : t("add_pair.start_typing")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
