"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/components/i18n/useTranslation";
import type { Program } from "@/lib/types";
import { programTypeColor } from "@/lib/program-colors";

interface ProgramPickerProps {
  programs: Program[];
  selectedId: string | null;
  onSelect: (program: Program | null) => void;
}

export function ProgramPicker({
  programs,
  selectedId,
  onSelect,
}: ProgramPickerProps) {
  const { t, tPlural } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("");

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const p of programs) set.add(p.type);
    return [...set].sort();
  }, [programs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (activeType && p.type !== activeType) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [programs, search, activeType]);

  const selectedProgram = programs.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-wrap items-center gap-1">
        <TypeChip
          label={t("schedule.picker.all")}
          active={activeType === ""}
          color={null}
          onClick={() => setActiveType("")}
        />
        {types.map((tp) => (
          <TypeChip
            key={tp}
            label={tp}
            active={activeType === tp}
            color={programTypeColor(tp).block}
            onClick={() => setActiveType(tp)}
          />
        ))}
      </div>

      <Input
        type="search"
        placeholder={t("schedule.picker.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="!h-9"
      />

      <div className="rounded-md border border-border bg-subtle/30 max-h-40 overflow-y-auto">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={[
            "w-full text-left px-2.5 py-1.5 text-xs transition-colors border-b border-border",
            selectedId === null
              ? "bg-accent-soft text-accent font-semibold"
              : "text-secondary hover:bg-subtle",
          ].join(" ")}
        >
          <span className="italic">{t("schedule.picker.no_program")}</span>
          <span className="text-fade ml-2 text-[10.5px]">
            {t("schedule.picker.no_program_hint")}
          </span>
        </button>
        {filtered.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted">
            {t("schedule.picker.no_results")}
          </div>
        ) : (
          filtered.slice(0, 40).map((p) => (
            <ProgramRow
              key={p.id}
              program={p}
              active={p.id === selectedId}
              onClick={() => onSelect(p)}
            />
          ))
        )}
      </div>

      {selectedProgram && (
        <div className="text-[10.5px] text-muted tabular-nums px-1">
          {selectedProgram.duration_minutes} {t("unit.minutes_short")} ·{" "}
          {selectedProgram.courts_needed}{" "}
          {tPlural(selectedProgram.courts_needed, {
            one: "schedule.picker.courts.one",
            few: "schedule.picker.courts.few",
            many: "schedule.picker.courts.many",
          })}{" "}
          · {t("schedule.picker.up_to")} {selectedProgram.max_players ?? "—"}{" "}
          {t("schedule.picker.players_short")} ·{" "}
          {t("schedule.picker.peak_label")} {selectedProgram.price_peak_rub} ₽ ·{" "}
          {t("schedule.picker.off_peak_label")}{" "}
          {selectedProgram.price_offpeak_rub} ₽
        </div>
      )}
    </div>
  );
}

function TypeChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center px-2 h-6 rounded text-[10px] font-semibold uppercase tracking-wider border transition-colors",
        active
          ? "text-white border-transparent"
          : "bg-surface text-secondary border-border hover:border-border-strong",
      ].join(" ")}
      style={active && color ? { background: color } : undefined}
    >
      {label}
    </button>
  );
}

function ProgramRow({
  program,
  active,
  onClick,
}: {
  program: Program;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const c = programTypeColor(program.type);
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left px-2.5 py-1.5 text-xs transition-colors flex items-center gap-2 border-b border-border last:border-b-0",
        active
          ? "bg-accent-soft text-accent font-semibold"
          : "text-secondary hover:bg-subtle",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: c.block }}
      />
      <span className="flex-1 min-w-0 truncate">{program.name}</span>
      <span className="text-[10px] text-muted tabular-nums flex-shrink-0">
        {program.duration_minutes}
        {t("schedule.picker.row.minutes_suffix")} ·{" "}
        {program.max_players ?? "?"}
        {t("schedule.picker.row.players_suffix")}
      </span>
    </button>
  );
}
