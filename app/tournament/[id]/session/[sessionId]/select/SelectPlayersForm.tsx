"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/components/i18n/useTranslation";
import type { Player } from "@/lib/types";
import { generateTimeSlots } from "@/lib/time-slots";
import {
  startSessionAction,
  type StartSessionState,
} from "./start-session-action";

const TIME_SLOTS = generateTimeSlots();

const initial: StartSessionState = {};

export function SelectPlayersForm({
  tournamentId,
  sessionId,
  candidates,
  defaultStartTime,
}: {
  tournamentId: string;
  sessionId: string;
  candidates: Player[];
  defaultStartTime: string | null;
}) {
  const { t } = useTranslation();
  const [state, formAction, pending] = useActionState(
    startSessionAction,
    initial,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (playerId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const count = selected.size;
  const isMultipleOfFour = count > 0 && count % 4 === 0;
  const allSelected = candidates.length > 0 && count === candidates.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((p) => p.id)));
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="tournament_id" value={tournamentId} />
      <input type="hidden" name="session_id" value={sessionId} />
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="player_ids" value={id} />
      ))}

      <Card className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-black">
            {t("create.field.start_time")}
          </span>
          <Select
            name="start_time"
            defaultValue={defaultStartTime?.slice(0, 5) ?? ""}
          >
            <option value="">{t("create.start_time_unset")}</option>
            {TIME_SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-black">
              {t("session_select.select_players")}
            </h2>
            <p className="text-xs text-muted">
              {t("session_select.help_count")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {candidates.length > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={toggleAll}
              >
                {allSelected
                  ? t("session_select.clear_all")
                  : t("session_select.select_all")}
              </Button>
            ) : null}
            <div className="text-sm tabular-nums">
              <span className="text-muted">
                {t("session_select.players_count", { n: "" }).replace(
                  /\s*$/,
                  " ",
                )}
              </span>
              <span
                className={
                  isMultipleOfFour || count === 0
                    ? "text-black font-semibold"
                    : "text-[var(--color-danger)] font-semibold"
                }
              >
                {count}
              </span>
            </div>
          </div>
        </div>

        {candidates.length === 0 ? (
          <p className="text-sm text-muted">
            {t("session_select.empty_no_players")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
            {candidates.map((p) => {
              const on = selected.has(p.id);
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-surface hover:bg-hover transition-colors"
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="text-black truncate">{p.name}</span>
                    <span className="text-xs text-muted flex-shrink-0 ml-auto">
                      {p.level} · {p.elo_rating}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {state.error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-4 py-3 text-sm"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !isMultipleOfFour}>
          {pending
            ? t("session_select.starting")
            : t("session_select.start_with_count", { n: count })}
        </Button>
        <Link href={`/tournament/${tournamentId}`}>
          <Button type="button" variant="secondary" disabled={pending}>
            {t("btn.cancel")}
          </Button>
        </Link>
      </div>
    </form>
  );
}
