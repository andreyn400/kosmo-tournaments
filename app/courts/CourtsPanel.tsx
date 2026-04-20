"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import {
  COURT_STATUS_LABEL_RU,
  COURT_SURFACE_LABEL_RU,
} from "@/lib/constants";
import type { Court, CourtStatus, CourtSurface } from "@/lib/types";
import { createCourtAction } from "./create-court-action";
import { CourtCard } from "./CourtCard";

const SURFACES = Object.keys(COURT_SURFACE_LABEL_RU) as CourtSurface[];
const STATUSES = Object.keys(COURT_STATUS_LABEL_RU) as CourtStatus[];

export function CourtsPanel({ courts }: { courts: Court[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [surface, setSurface] = useState<CourtSurface>("artificial_grass");
  const [status, setStatus] = useState<CourtStatus>("active");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nextNumber = String(
    courts.reduce((max, c) => Math.max(max, c.number), 0) + 1,
  );

  const submit = () => {
    setError(null);
    const num = Number.parseInt(number || nextNumber, 10);
    startTransition(async () => {
      const res = await createCourtAction({
        name,
        number: num,
        surface,
        status,
        notes,
      });
      if (res.error) setError(res.error);
      else {
        setName("");
        setNumber("");
        setSurface("artificial_grass");
        setStatus("active");
        setNotes("");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold text-black">Новый корт</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_5rem]">
          <Input
            placeholder="Название (например, Корт 1)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            placeholder={nextNumber}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            value={surface}
            onChange={(e) => setSurface(e.target.value as CourtSurface)}
          >
            {SURFACES.map((s) => (
              <option key={s} value={s}>
                {COURT_SURFACE_LABEL_RU[s]}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as CourtStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {COURT_STATUS_LABEL_RU[s]}
              </option>
            ))}
          </Select>
        </div>
        <Textarea
          placeholder="Заметки (необязательно)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div>
          <Button disabled={pending || !name.trim()} onClick={submit}>
            {pending ? "Сохранение…" : "Добавить корт"}
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

      {courts.length === 0 ? (
        <Card className="flex flex-col items-center text-center gap-4 py-12">
          <div className="h-14 w-14 rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center">
            <span className="h-3 w-3 rounded-sm bg-accent" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold text-black">
              Кортов пока нет
            </h2>
            <p className="text-muted text-sm max-w-sm">
              Добавьте первый корт в форме выше. Корты используются при
              создании турниров и распределении матчей по кортам.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courts.map((c) => (
            <CourtCard key={c.id} court={c} />
          ))}
        </div>
      )}
    </div>
  );
}
