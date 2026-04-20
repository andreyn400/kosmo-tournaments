"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PADEL_LEVELS } from "@/lib/constants";
import type { Player } from "@/lib/types";
import { createPlayerAction } from "./create-player-action";

export function PlayersPanel({ players }: { players: Player[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("C");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q),
    );
  }, [players, query]);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createPlayerAction({ name, level, phone });
      if (res.error) setError(res.error);
      else {
        setName("");
        setLevel("C");
        setPhone("");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold text-black">Новый игрок</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_7rem_12rem_auto]">
          <Input
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {PADEL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Телефон (необязательно)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button disabled={pending || !name.trim()} onClick={submit}>
            {pending ? "Сохранение…" : "Добавить"}
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
      </Card>

      {players.length === 0 ? (
        <Card className="flex flex-col items-center text-center gap-4 py-12">
          <div className="h-14 w-14 rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center">
            <span className="h-3 w-3 rounded-sm bg-accent" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold text-black">
              Игроков пока нет
            </h2>
            <p className="text-muted text-sm max-w-sm">
              Добавьте первого игрока в форме выше. Каждый игрок получает
              стартовый ELO по своему уровню и появляется в списке
              регистрации турниров.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-black">
              Все игроки · {players.length}
            </h2>
          </div>
          <Input
            placeholder="Поиск по имени или телефону…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.length === 0 ? (
            <p className="text-sm text-muted">Ничего не найдено.</p>
            ) : (
            <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
              {filtered.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/players/${p.id}`}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 bg-surface hover:bg-hover transition-colors"
                  >
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="text-black truncate">{p.name}</span>
                      {p.phone ? (
                        <span className="text-xs text-muted">{p.phone}</span>
                      ) : null}
                    </div>
                    <Badge tone="level">{p.level}</Badge>
                    <span className="text-sm font-semibold text-black tabular-nums">
                      {p.elo_rating}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
