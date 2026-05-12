"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { Coach } from "@/lib/types";
import { CoachForm } from "../CoachForm";
import { updateCoachAction } from "../update-coach-action";
import { deleteCoachAction } from "../delete-coach-action";
import { formatRub } from "../format";
import type { RawCoachInput } from "../coach-input";

export function CoachProfileCard({ coach }: { coach: Coach }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave(input: RawCoachInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateCoachAction(coach.id, input);
        if (!res.error) {
          setEditing(false);
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  function handleDelete() {
    if (!confirm(`Удалить тренера «${coach.name}»? Сессии останутся в базе.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteCoachAction(coach.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.push("/ops/coaches");
    });
  }

  return (
    <section
      className="rounded-card border border-border bg-surface p-5"
      style={{ borderLeft: `4px solid ${coach.color}` }}
    >
      {editing ? (
        <CoachForm
          mode="edit"
          coach={coach}
          onCancel={() => setEditing(false)}
          onSubmit={handleSave}
          onDelete={handleDelete}
          pending={pending}
        />
      ) : (
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-shrink-0 flex sm:flex-col items-center gap-3">
            <Avatar
              name={coach.name}
              photoUrl={coach.photo_url ?? undefined}
              size="lg"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-black">{coach.name}</h1>
                  {coach.level && (
                    <span className="inline-flex items-center px-2 h-6 rounded text-[10.5px] font-semibold tracking-wider uppercase bg-subtle text-secondary border border-border">
                      {coach.level}
                    </span>
                  )}
                  {!coach.is_active && (
                    <span className="inline-flex items-center px-2 h-6 rounded text-[10.5px] font-semibold tracking-wider uppercase bg-subtle text-muted border border-border">
                      Неактивен
                    </span>
                  )}
                </div>
                {coach.specialization && (
                  <p className="text-sm text-secondary mt-0.5">
                    {coach.specialization}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Изменить
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Телефон" value={coach.phone} />
              <Field label="Модель оплаты" value={<RateLine coach={coach} />} />
            </div>

            {coach.bio && (
              <div>
                <Label>О тренере</Label>
                <p className="text-sm text-secondary whitespace-pre-wrap">
                  {coach.bio}
                </p>
              </div>
            )}

            {coach.notes && (
              <div>
                <Label>Заметки</Label>
                <p className="text-sm text-secondary whitespace-pre-wrap">
                  {coach.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label>{label}</Label>
      <span className="text-sm text-black">
        {value || <span className="text-fade">—</span>}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}

function RateLine({ coach }: { coach: Coach }) {
  if (coach.rate_type === "flat") {
    return (
      <span className="tabular-nums">
        Фикс. <strong>{formatRub(coach.flat_rate_rub)}</strong>{" "}
        <span className="text-muted">/ сессия</span>
      </span>
    );
  }
  return (
    <span className="tabular-nums">
      <strong>{coach.rate_court_percent}%</strong>{" "}
      <span className="text-muted">с корта</span>
      <span className="text-fade px-1.5">+</span>
      <strong>{coach.rate_coaching_percent}%</strong>{" "}
      <span className="text-muted">с тренировки</span>
    </span>
  );
}
