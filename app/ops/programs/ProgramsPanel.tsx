"use client";

import { useMemo, useState } from "react";
import type { Program } from "@/lib/types";
import {
  PROGRAM_GROUPS,
  type ProgramGroupKey,
  groupForType,
} from "@/lib/program-groups";
import { ProgramsToolbar } from "./ProgramsToolbar";
import { ProgramGroupSection } from "./ProgramGroup";
import { SeedPanel } from "./SeedPanel";
import { SummaryStrip } from "./SummaryStrip";
import { SeedSuccessBanner } from "./SeedSuccessBanner";
import { usePersistedState } from "./use-persisted-state";
import type { ViewMode } from "./view-mode";

const VIEW_KEY = "kosmo_ops_programs_view";
const COLLAPSED_KEY = "kosmo_ops_programs_collapsed";

type CollapsedMap = Partial<Record<ProgramGroupKey, boolean>>;

export function ProgramsPanel({ programs }: { programs: Program[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState<ProgramGroupKey | null>(
    null,
  );

  const [view, setView] = usePersistedState<ViewMode>(VIEW_KEY, "table");
  const [collapsed, setCollapsed] = usePersistedState<CollapsedMap>(
    COLLAPSED_KEY,
    {},
  );

  const [seedSuccess, setSeedSuccess] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (!showInactive && !p.is_active) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (q) {
        const hay = [
          p.name.toLowerCase(),
          p.type.toLowerCase(),
          (p.description ?? "").toLowerCase(),
        ].join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [programs, search, typeFilter, showInactive]);

  const grouped = useMemo(() => {
    const buckets = new Map<ProgramGroupKey, Program[]>();
    for (const g of PROGRAM_GROUPS) buckets.set(g.key, []);
    for (const p of filtered) {
      const g = groupForType(p.type);
      buckets.get(g.key)?.push(p);
    }
    for (const [, arr] of buckets) {
      arr.sort((a, b) =>
        a.name.localeCompare(b.name, "ru", { sensitivity: "base" }),
      );
    }
    return buckets;
  }, [filtered]);

  if (programs.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {seedSuccess !== null && (
          <SeedSuccessBanner
            count={seedSuccess}
            onDismiss={() => setSeedSuccess(null)}
          />
        )}
        <SeedPanel onSeeded={(n) => setSeedSuccess(n)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {seedSuccess !== null && (
        <SeedSuccessBanner
          count={seedSuccess}
          onDismiss={() => setSeedSuccess(null)}
        />
      )}

      <SummaryStrip programs={programs} />

      <ProgramsToolbar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        view={view}
        onViewChange={setView}
        total={programs.length}
        visible={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            Ничего не найдено. Снимите фильтры или измените запрос.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {PROGRAM_GROUPS.map((group) => {
            const inGroup = grouped.get(group.key) ?? [];
            const isFiltering = !!search || !!typeFilter || !showInactive;
            if (
              inGroup.length === 0 &&
              creatingGroup !== group.key &&
              isFiltering
            ) {
              return null;
            }
            return (
              <ProgramGroupSection
                key={group.key}
                group={group}
                programs={inGroup}
                view={view}
                collapsed={collapsed[group.key] === true}
                onToggleCollapse={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [group.key]: !prev[group.key],
                  }))
                }
                expandedId={expandedId}
                onToggleExpand={setExpandedId}
                isCreating={creatingGroup === group.key}
                onStartCreate={() => {
                  setCreatingGroup(group.key);
                  setExpandedId(null);
                  // Make sure the group is visible when creating in it.
                  setCollapsed((prev) => ({ ...prev, [group.key]: false }));
                }}
                onCancelCreate={() => setCreatingGroup(null)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
