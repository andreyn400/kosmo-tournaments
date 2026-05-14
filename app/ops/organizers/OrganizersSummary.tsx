"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";
import type { OrganizerWithBalance } from "@/lib/types";

interface OrganizersSummaryProps {
  organizers: OrganizerWithBalance[];
}

export function OrganizersSummary({ organizers }: OrganizersSummaryProps) {
  const { t, tPlural, lang } = useTranslation();
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

  const organizerWord = tPlural(total, {
    one: "organizers.organizers.one",
    few: "organizers.organizers.few",
    many: "organizers.organizers.many",
  });

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
      <Stat
        label={t("organizers.summary.total")}
        value={String(total)}
        suffix={organizerWord}
      />
      <Sep />
      <Stat
        label={t("organizers.summary.owing_to_club")}
        value={`${owingCount} · ${outstanding > 0 ? formatRub(outstanding, lang) : "—"}`}
        tone={outstanding > 0 ? "danger" : "muted"}
      />
      <Sep />
      <Stat
        label={t("organizers.summary.with_credit")}
        value={`${creditCount} · ${credit > 0 ? formatRub(credit, lang) : "—"}`}
        tone={credit > 0 ? "success" : "muted"}
      />
      <Sep />
      <Stat
        label={t("organizers.summary.deposits_total")}
        value={depositsTotal > 0 ? formatRub(depositsTotal, lang) : "—"}
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
