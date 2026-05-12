"use client";

import type { OrganizerWithBalance } from "@/lib/types";
import { formatRub } from "../coaches/format";

interface OrganizersSummaryProps {
  organizers: OrganizerWithBalance[];
}

export function OrganizersSummary({ organizers }: OrganizersSummaryProps) {
  const total = organizers.length;
  const owingCount = organizers.filter((o) => o.balance_rub > 0).length;
  const creditCount = organizers.filter((o) => o.balance_rub < 0).length;

  const outstanding = organizers.reduce(
    (acc, o) => acc + Math.max(0, o.balance_rub),
    0,
  );
  const credit = organizers.reduce(
    (acc, o) => acc + Math.max(0, -o.balance_rub),
    0,
  );
  const depositsTotal = organizers.reduce(
    (acc, o) => acc + o.deposits_total,
    0,
  );

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
      <Stat
        label="Всего"
        value={String(total)}
        suffix={pluralOrganizers(total)}
      />
      <Sep />
      <Stat
        label="Должны клубу"
        value={`${owingCount} · ${outstanding > 0 ? formatRub(outstanding) : "—"}`}
        tone={outstanding > 0 ? "danger" : "muted"}
      />
      <Sep />
      <Stat
        label="С предоплатой"
        value={`${creditCount} · ${credit > 0 ? formatRub(credit) : "—"}`}
        tone={credit > 0 ? "success" : "muted"}
      />
      <Sep />
      <Stat
        label="Всего депозитов"
        value={depositsTotal > 0 ? formatRub(depositsTotal) : "—"}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  tone = "black",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "black" | "danger" | "success" | "muted";
}) {
  const valueClass =
    tone === "danger"
      ? "text-[var(--color-danger)] font-semibold"
      : tone === "success"
        ? "text-[var(--color-success)] font-semibold"
        : tone === "muted"
          ? "text-muted font-semibold"
          : "text-black font-semibold";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-muted">{label}:</span>
      <span className={`tabular-nums ${valueClass}`}>{value}</span>
      {suffix && <span className="text-muted">{suffix}</span>}
    </div>
  );
}

function Sep() {
  return (
    <span aria-hidden className="text-fade">
      ·
    </span>
  );
}

function pluralOrganizers(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "организаторов";
  if (mod10 === 1) return "организатор";
  if (mod10 >= 2 && mod10 <= 4) return "организатора";
  return "организаторов";
}
