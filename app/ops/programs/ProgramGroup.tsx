"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import type { Program } from "@/lib/types";
import type { ProgramGroup as Group } from "@/lib/program-groups";
import { ProgramCard } from "./ProgramCard";
import { ProgramTable } from "./ProgramTable";
import { ProgramForm } from "./ProgramForm";
import { createProgramAction } from "./create-program-action";
import type { RawProgramInput } from "./program-input";
import type { ViewMode } from "./view-mode";

interface ProgramGroupProps {
  group: Group;
  programs: Program[];
  view: ViewMode;
  collapsed: boolean;
  onToggleCollapse: () => void;
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  isCreating: boolean;
  onStartCreate: () => void;
  onCancelCreate: () => void;
}

export function ProgramGroupSection({
  group,
  programs,
  view,
  collapsed,
  onToggleCollapse,
  expandedId,
  onToggleExpand,
  isCreating,
  onStartCreate,
  onCancelCreate,
}: ProgramGroupProps) {
  const router = useRouter();
  const { t, tPlural } = useTranslation();
  const [pending, startTransition] = useTransition();

  function handleCreate(
    input: RawProgramInput,
  ): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createProgramAction(input);
        if (!res.error) {
          onCancelCreate();
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-controls={`group-${group.key}`}
          className="flex-1 flex items-center gap-3 py-1 pr-2 rounded hover:bg-subtle text-left focus-visible:outline-none focus-visible:bg-subtle transition-colors"
        >
          <Chevron expanded={!collapsed} />
          <span
            aria-hidden
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-base flex-shrink-0"
            style={{ background: group.colorSoft, color: group.color }}
          >
            {group.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-black">
              {t(group.labelKey)}
            </h2>
            <p className="text-[11px] text-muted">
              {programs.length}{" "}
              {tPlural(programs.length, {
                one: "programs.progs.one",
                few: "programs.progs.few",
                many: "programs.progs.many",
              })}
            </p>
          </div>
        </button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onStartCreate}
          disabled={isCreating}
        >
          {t("programs.new_cta")}
        </Button>
      </header>

      {!collapsed && (
        <div id={`group-${group.key}`} className="flex flex-col gap-3">
          {isCreating && (
            <ProgramForm
              mode="create"
              defaultType={group.types[0]}
              onCancel={onCancelCreate}
              onSubmit={handleCreate}
              pending={pending}
            />
          )}

          {programs.length === 0 && !isCreating ? (
            <div className="rounded-card border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted">{t("programs.group.empty")}</p>
            </div>
          ) : programs.length > 0 ? (
            view === "table" ? (
              <ProgramTable
                programs={programs}
                expandedId={expandedId}
                onToggleExpand={onToggleExpand}
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {programs.map((p) => (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    expanded={expandedId === p.id}
                    onToggle={() =>
                      onToggleExpand(expandedId === p.id ? null : p.id)
                    }
                  />
                ))}
              </div>
            )
          ) : null}
        </div>
      )}
    </section>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={[
        "text-muted transition-transform flex-shrink-0",
        expanded ? "rotate-90" : "",
      ].join(" ")}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}
