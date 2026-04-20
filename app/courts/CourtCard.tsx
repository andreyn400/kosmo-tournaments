"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  COURT_STATUS_LABEL_RU,
  COURT_SURFACE_LABEL_RU,
} from "@/lib/constants";
import type { Court, CourtStatus, CourtSurface } from "@/lib/types";
import { updateCourtAction } from "./update-court-action";
import { deleteCourtAction } from "./delete-court-action";

const SURFACES = Object.keys(COURT_SURFACE_LABEL_RU) as CourtSurface[];
const STATUSES = Object.keys(COURT_STATUS_LABEL_RU) as CourtStatus[];

type Mode = "view" | "edit" | "confirm-delete";

export function CourtCard({ court }: { court: Court }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");
  const [name, setName] = useState(court.name);
  const [number, setNumber] = useState(String(court.number));
  const [surface, setSurface] = useState<CourtSurface>(court.surface);
  const [status, setStatus] = useState<CourtStatus>(court.status);
  const [notes, setNotes] = useState(court.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setName(court.name);
    setNumber(String(court.number));
    setSurface(court.surface);
    setStatus(court.status);
    setNotes(court.notes ?? "");
    setError(null);
  };

  const save = () => {
    setError(null);
    const num = Number.parseInt(number, 10);
    startTransition(async () => {
      const res = await updateCourtAction(court.id, {
        name,
        number: num,
        surface,
        status,
        notes,
      });
      if (res.error) setError(res.error);
      else {
        setMode("view");
        router.refresh();
      }
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteCourtAction(court.id);
      if (res.error) {
        setError(res.error);
        setMode("view");
      } else router.refresh();
    });
  };

  if (mode === "edit") {
    return (
      <Card className="flex flex-col gap-3">
        <div className="grid gap-2 grid-cols-[1fr_5rem]">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
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
          placeholder="Заметки"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {error ? (
          <div
            role="alert"
            className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3 py-2 text-xs"
          >
            {error}
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={save} disabled={pending || !name.trim()}>
            {pending ? "Сохранение…" : "Сохранить"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              reset();
              setMode("view");
            }}
            disabled={pending}
          >
            Отмена
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-black truncate">
              {court.name}
            </span>
            <span className="text-xs text-muted tabular-nums">
              №{court.number}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="format">{COURT_SURFACE_LABEL_RU[court.surface]}</Badge>
            <Badge
              tone={
                court.status === "active"
                  ? "status-completed"
                  : "status-progress"
              }
            >
              {COURT_STATUS_LABEL_RU[court.status]}
            </Badge>
          </div>
        </div>
      </div>

      {court.notes ? (
        <p className="text-sm text-muted">{court.notes}</p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-3 py-2 text-xs"
        >
          {error}
        </div>
      ) : null}

      {mode === "confirm-delete" ? (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <p className="text-sm text-black">Удалить корт «{court.name}»?</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="danger"
              onClick={remove}
              disabled={pending}
            >
              {pending ? "Удаление…" : "Удалить"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setMode("view")}
              disabled={pending}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="secondary" onClick={() => setMode("edit")}>
            Изменить
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode("confirm-delete")}
          >
            Удалить
          </Button>
        </div>
      )}
    </Card>
  );
}
