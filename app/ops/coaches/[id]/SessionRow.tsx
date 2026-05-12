"use client";

import { Fragment, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Coach,
  Court,
  Program,
  ScheduleSessionWithMeta,
} from "@/lib/types";
import { computeEarnings } from "@/lib/coach-earnings";
import { formatDateRu, formatRub } from "../format";
import { LogSessionForm } from "./LogSessionForm";
import { updateSessionAction } from "./update-session-action";
import { deleteSessionAction } from "./delete-session-action";
import type { RawSessionInput } from "./session-input";

interface SessionRowProps {
  coach: Coach;
  session: ScheduleSessionWithMeta;
  programs: Program[];
  courts: Court[];
  courtsById: Map<string, Court>;
  expanded: boolean;
  onToggle: () => void;
  zebra: boolean;
}

export function SessionRow({
  coach,
  session,
  programs,
  courts,
  courtsById,
  expanded,
  onToggle,
  zebra,
}: SessionRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const payout = computeEarnings(coach, session);

  function handleSave(
    input: RawSessionInput,
  ): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateSessionAction(coach.id, session.id, input);
        if (!res.error) {
          onToggle();
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  function handleDelete() {
    if (!confirm("Удалить эту сессию из лога?")) return;
    startTransition(async () => {
      const res = await deleteSessionAction(coach.id, session.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  const courtLabels = session.court_ids
    .map((id) => courtsById.get(id)?.name ?? `?`)
    .join(", ");

  const isCancelled = session.status === "cancelled";
  const rowBg = expanded
    ? "bg-accent-soft/50"
    : zebra
      ? "bg-subtle/40 hover:bg-subtle"
      : "hover:bg-subtle";
  const textCls = isCancelled ? "text-fade line-through" : "text-black";

  return (
    <Fragment>
      <tr
        onClick={onToggle}
        aria-expanded={expanded}
        className={`cursor-pointer transition-colors ${rowBg}`}
        style={{ height: "44px" }}
      >
        <td className={`pl-4 pr-2 align-middle text-xs tabular-nums whitespace-nowrap ${textCls}`}>
          {formatDateRu(session.date)}
        </td>
        <td className={`px-2 align-middle text-xs tabular-nums whitespace-nowrap ${textCls}`}>
          {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}
        </td>
        <td className="px-2 align-middle text-xs min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`truncate ${textCls}`} title={session.program_name ?? "Без программы"}>
              {session.program_name ?? <span className="text-fade italic">Без программы</span>}
            </span>
            {session.is_peak && (
              <span className="inline-flex items-center px-1 h-4 rounded text-[9px] font-bold tracking-wider uppercase bg-[var(--color-warning-soft)] text-[var(--color-warning)] flex-shrink-0">
                Пик
              </span>
            )}
          </div>
        </td>
        <td className="px-2 align-middle text-xs text-secondary text-right whitespace-nowrap">
          {courtLabels || "—"}
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right">
          {session.attendee_count || "—"}
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
          {session.revenue_rub > 0 ? formatRub(session.revenue_rub) : "—"}
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
          {session.court_revenue_rub > 0 ? formatRub(session.court_revenue_rub) : "—"}
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
          {session.coaching_fee_rub > 0 ? formatRub(session.coaching_fee_rub) : "—"}
        </td>
        <td className="pl-2 pr-4 align-middle text-xs text-accent font-semibold tabular-nums text-right whitespace-nowrap">
          {payout > 0 ? formatRub(payout) : "—"}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-subtle/30">
          <td colSpan={9} className="p-2 border-y border-border">
            <LogSessionForm
              key={session.id}
              mode="edit"
              coach={coach}
              programs={programs}
              courts={courts}
              session={session}
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
