"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type {
  Coach,
  Court,
  Program,
  ScheduleSessionWithMeta,
} from "@/lib/types";
import { MonthSelector } from "./MonthSelector";
import { MonthlyStrip } from "./MonthlyStrip";
import { LogSessionForm } from "./LogSessionForm";
import { SessionRow } from "./SessionRow";
import { logSessionAction } from "./log-session-action";
import type { RawSessionInput } from "./session-input";

interface SessionLogPanelProps {
  coach: Coach;
  sessions: ScheduleSessionWithMeta[];
  programs: Program[];
  courts: Court[];
  month: string;
}

export function SessionLogPanel({
  coach,
  sessions,
  programs,
  courts,
  month,
}: SessionLogPanelProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const courtsById = useMemo(() => {
    const m = new Map<string, Court>();
    for (const c of courts) m.set(c.id, c);
    return m;
  }, [courts]);

  function handleLog(input: RawSessionInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await logSessionAction(coach.id, input);
        if (res.id) {
          setCreating(false);
          router.refresh();
          resolve({});
          return;
        }
        resolve({ error: res.error });
      });
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-black">Лог сессий</h2>
        <MonthSelector month={month} />
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          disabled={creating}
          className="ml-auto"
        >
          + Записать сессию
        </Button>
      </header>

      <MonthlyStrip coach={coach} sessions={sessions} />

      {creating && (
        <LogSessionForm
          mode="create"
          coach={coach}
          programs={programs}
          courts={courts}
          onCancel={() => setCreating(false)}
          onSubmit={handleLog}
          pending={pending}
        />
      )}

      {sessions.length === 0 && !creating ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            В этом месяце нет сессий. Запишите первую — она появится здесь и в выплатах.
          </p>
        </div>
      ) : sessions.length > 0 ? (
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-subtle/30 text-[10.5px] uppercase tracking-wider text-muted font-semibold">
                <th className="pl-4 pr-2 py-2 text-left whitespace-nowrap">Дата</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Время</th>
                <th className="px-2 py-2 text-left">Программа</th>
                <th className="px-2 py-2 text-right">Корты</th>
                <th className="px-2 py-2 text-right" title="Игроков">И</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Выручка</th>
                <th className="px-2 py-2 text-right">Корт</th>
                <th className="px-2 py-2 text-right">Тренировка</th>
                <th className="pl-2 pr-4 py-2 text-right whitespace-nowrap">Тренеру</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <SessionRow
                  key={s.id}
                  coach={coach}
                  session={s}
                  programs={programs}
                  courts={courts}
                  courtsById={courtsById}
                  expanded={expandedId === s.id}
                  onToggle={() =>
                    setExpandedId(expandedId === s.id ? null : s.id)
                  }
                  zebra={i % 2 === 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
