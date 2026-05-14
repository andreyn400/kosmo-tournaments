"use client";

import { Fragment, useTransition } from "react";
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

interface ProgramRowProps {
  program: Program;
  expanded: boolean;
  onToggle: () => void;
  zebra: boolean;
}

export function ProgramRow({
  program,
  expanded,
  onToggle,
  zebra,
}: ProgramRowProps) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [pending, startTransition] = useTransition();
  const group = groupForType(program.type);

  function handleSave(
    input: RawProgramInput,
  ): Promise<{ error?: string }> {
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

  const ppPeak = perPlayer(program.price_peak_rub, program.max_players, lang);
  const ppOff = perPlayer(
    program.price_offpeak_rub,
    program.max_players,
    lang,
  );

  const rowBg = expanded
    ? "bg-accent-soft/50"
    : zebra
      ? "bg-subtle/40 hover:bg-subtle"
      : "hover:bg-subtle";

  return (
    <Fragment>
      <tr
        onClick={onToggle}
        aria-expanded={expanded}
        className={`cursor-pointer transition-colors ${rowBg}`}
        style={{ height: "44px" }}
      >
        <td className="pl-4 pr-2 align-middle">
          <span
            aria-hidden
            title={program.type}
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: group.color }}
          />
        </td>
        <td className="px-2 align-middle min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={[
                "text-sm font-medium truncate",
                program.is_active
                  ? "text-black"
                  : "text-fade line-through",
              ].join(" ")}
              title={program.name}
            >
              {program.name}
            </span>
            {!program.is_active && (
              <span className="text-[10px] uppercase tracking-wider text-muted flex-shrink-0">
                {t("programs.inactive_lower")}
              </span>
            )}
          </div>
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
          {formatDuration(program.duration_minutes, lang)}
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right">
          {program.courts_needed}
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right">
          {program.max_players ?? "—"}
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
          {formatRub(program.price_offpeak_rub, lang)}
        </td>
        <td className="px-2 align-middle text-xs text-black font-semibold tabular-nums text-right whitespace-nowrap">
          {formatRub(program.price_peak_rub, lang)}
        </td>
        <td className="pl-2 pr-4 align-middle text-[11px] text-fade tabular-nums text-right whitespace-nowrap">
          {ppPeak && ppOff ? `${ppPeak} / ${ppOff}` : "—"}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-subtle/30">
          <td colSpan={8} className="p-2 border-y border-border">
            <ProgramForm
              mode="edit"
              program={program}
              onCancel={onToggle}
              onSubmit={handleSave}
              onDelete={handleDelete}
              pending={pending}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
