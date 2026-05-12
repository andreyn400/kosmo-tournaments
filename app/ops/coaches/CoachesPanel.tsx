"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { CoachWithMonthlyStats } from "@/lib/queries/coaches";
import { CoachesSummary } from "./CoachesSummary";
import { CoachCard } from "./CoachCard";
import { CoachForm } from "./CoachForm";
import { createCoachAction } from "./create-coach-action";
import type { RawCoachInput } from "./coach-input";

type FilterMode = "all" | "active" | "inactive";

interface CoachesPanelProps {
  coaches: CoachWithMonthlyStats[];
  month: string;
}

export function CoachesPanel({ coaches, month }: CoachesPanelProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>("active");
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return coaches;
    if (filter === "active") return coaches.filter((c) => c.is_active);
    return coaches.filter((c) => !c.is_active);
  }, [coaches, filter]);

  function handleCreate(input: RawCoachInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createCoachAction(input);
        if (res.id) {
          setCreating(false);
          router.push(`/ops/coaches/${res.id}`);
          resolve({});
          return;
        }
        resolve({ error: res.error });
      });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <CoachesSummary coaches={coaches} month={month} />

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Фильтр"
          className="inline-flex p-0.5 rounded-md bg-subtle border border-border"
        >
          <FilterPill
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Все"
            count={coaches.length}
          />
          <FilterPill
            active={filter === "active"}
            onClick={() => setFilter("active")}
            label="Активные"
            count={coaches.filter((c) => c.is_active).length}
          />
          <FilterPill
            active={filter === "inactive"}
            onClick={() => setFilter("inactive")}
            label="Неактивные"
            count={coaches.filter((c) => !c.is_active).length}
          />
        </div>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          disabled={creating}
          className="ml-auto"
        >
          + Добавить тренера
        </Button>
      </div>

      {creating && (
        <CoachForm
          mode="create"
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
          pending={pending}
        />
      )}

      {filtered.length === 0 && !creating ? (
        <EmptyState
          coachCount={coaches.length}
          onAdd={() => setCreating(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CoachCard key={c.id} coach={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 px-2.5 h-7 rounded text-[11px] font-semibold transition-colors",
        active
          ? "bg-surface text-black shadow-sm"
          : "text-muted hover:text-black",
      ].join(" ")}
    >
      <span>{label}</span>
      <span
        className={[
          "px-1.5 rounded-full text-[10px] tabular-nums",
          active ? "bg-subtle text-secondary" : "bg-surface text-muted",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({
  coachCount,
  onAdd,
}: {
  coachCount: number;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center flex flex-col items-center gap-3">
      <h2 className="text-base font-semibold text-black">
        {coachCount === 0
          ? "Тренеров пока нет"
          : "В этой выборке никого нет"}
      </h2>
      <p className="text-sm text-muted max-w-md">
        {coachCount === 0
          ? "Добавьте первого тренера — модель оплаты, контакты и расписание доступности."
          : "Снимите фильтр или добавьте нового тренера."}
      </p>
      <Button size="sm" onClick={onAdd}>
        + Добавить тренера
      </Button>
    </div>
  );
}
