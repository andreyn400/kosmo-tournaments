"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatDuration, formatRub } from "@/lib/i18n/format";
import type { Program } from "@/lib/types";
import { groupForType } from "@/lib/program-groups";
import { perPlayer } from "./format";
import { ProgramForm } from "./ProgramForm";
import { updateProgramAction } from "./update-program-action";
import { deleteProgramAction } from "./delete-program-action";
import type { RawProgramInput } from "./program-input";

interface ProgramCardProps {
  program: Program;
  expanded: boolean;
  onToggle: () => void;
}

export function ProgramCard({ program, expanded, onToggle }: ProgramCardProps) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [pending, startTransition] = useTransition();
  const group = groupForType(program.type);

  function handleSave(input: RawProgramInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateProgramAction(program.id, input);
        if (!res.error) {
          onToggle();
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  function handleDelete() {
    if (
      !confirm(t("programs.row.delete_confirm", { name: program.name }))
    )
      return;
    startTransition(async () => {
      const res = await deleteProgramAction(program.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  const perPlayerPeak = perPlayer(
    program.price_peak_rub,
    program.max_players,
    lang,
  );
  const perPlayerOff = perPlayer(
    program.price_offpeak_rub,
    program.max_players,
    lang,
  );

  return (
    <article
      className={[
        "rounded-card border border-border bg-surface overflow-hidden",
        "transition-shadow shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        expanded ? "shadow-[0_4px_12px_rgba(0,0,0,0.08)]" : "",
      ].join(" ")}
      style={{ borderLeft: `3px solid ${group.color}` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left p-4 hover:bg-subtle focus-visible:outline-none focus-visible:bg-subtle transition-colors"
      >
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={[
                  "text-sm font-semibold leading-snug truncate",
                  program.is_active ? "text-black" : "text-fade line-through",
                ].join(" ")}
                title={program.name}
              >
                {program.name}
              </h3>
              {!program.is_active && (
                <span className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-semibold tracking-wider uppercase bg-subtle text-muted border border-border">
                  {t("programs.inactive_chip")}
                </span>
              )}
            </div>
            {program.description && (
              <p className="mt-0.5 text-[11px] text-fade font-mono truncate">
                {program.description}
              </p>
            )}
          </div>
          <span
            className="inline-flex items-center px-2 h-6 rounded text-[10.5px] font-semibold uppercase tracking-wider"
            style={{ background: group.colorSoft, color: group.color }}
          >
            {program.type}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Stat
            label={t("programs.card.duration")}
            value={formatDuration(program.duration_minutes, lang)}
          />
          <Stat
            label={t("programs.card.courts")}
            value={String(program.courts_needed)}
          />
          <Stat
            label={t("programs.card.players")}
            value={program.max_players != null ? String(program.max_players) : "—"}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {t("programs.card.price")}
            </span>
            <span className="text-black tabular-nums">
              <span className="font-semibold">
                {formatRub(program.price_peak_rub, lang)}
              </span>{" "}
              <span className="text-fade">{t("programs.card.peak_short")}</span>
            </span>
            <span className="text-secondary tabular-nums">
              <span className="font-semibold">
                {formatRub(program.price_offpeak_rub, lang)}
              </span>{" "}
              <span className="text-fade">
                {t("programs.card.off_peak_short")}
              </span>
            </span>
            {(perPlayerPeak || perPlayerOff) && (
              <span className="text-[11px] text-fade tabular-nums">
                {perPlayerPeak}/{perPlayerOff} {t("programs.card.per_player_suffix")}
              </span>
            )}
          </div>
        </dl>
      </button>

      {expanded && (
        <div className="border-t border-border bg-subtle/40 p-2">
          <ProgramForm
            mode="edit"
            program={program}
            onCancel={onToggle}
            onSubmit={handleSave}
            onDelete={handleDelete}
            pending={pending}
          />
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="text-black font-medium tabular-nums">{value}</span>
    </div>
  );
}
