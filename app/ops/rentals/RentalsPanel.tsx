"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";
import { RENTAL_STATUS_KEY } from "@/lib/i18n/rental-keys";
import type {
  Court,
  RentalContractStatus,
  RentalContractWithSummary,
} from "@/lib/types";
import { RentalsSummary } from "./RentalsSummary";
import {
  formatContractPeriod,
  formatCourtsList,
  formatScheduleSummary,
} from "./format";

type Filter = "all" | "active" | "overdue" | "draft" | "ended";

interface RentalsPanelProps {
  contracts: RentalContractWithSummary[];
  courts: Court[];
}

export function RentalsPanel({ contracts, courts }: RentalsPanelProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    return {
      all: contracts.length,
      active: contracts.filter((c) => c.status === "active").length,
      overdue: contracts.filter((c) => c.overdue_rub > 0).length,
      draft: contracts.filter((c) => c.status === "draft").length,
      ended: contracts.filter(
        (c) => c.status === "ended" || c.status === "cancelled",
      ).length,
    };
  }, [contracts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contracts.filter((c) => {
      if (filter === "active" && c.status !== "active") return false;
      if (filter === "overdue" && c.overdue_rub <= 0) return false;
      if (filter === "draft" && c.status !== "draft") return false;
      if (
        filter === "ended" &&
        c.status !== "ended" &&
        c.status !== "cancelled"
      ) {
        return false;
      }
      if (!q) return true;
      return (
        c.client_name.toLowerCase().includes(q) ||
        (c.contact_person ?? "").toLowerCase().includes(q) ||
        (c.contract_number ?? "").toLowerCase().includes(q) ||
        (c.legal_entity_name ?? "").toLowerCase().includes(q) ||
        (c.inn ?? "").toLowerCase().includes(q)
      );
    });
  }, [contracts, filter, search]);

  return (
    <div className="flex flex-col gap-4">
      <RentalsSummary contracts={contracts} />

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label={t("rentals.aria.filter")}
          className="inline-flex p-0.5 rounded-md bg-subtle border border-border"
        >
          <FilterPill
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={t("rentals.filter.all")}
            count={counts.all}
          />
          <FilterPill
            active={filter === "active"}
            onClick={() => setFilter("active")}
            label={t("rentals.filter.active")}
            count={counts.active}
          />
          <FilterPill
            active={filter === "overdue"}
            onClick={() => setFilter("overdue")}
            label={t("rentals.filter.overdue")}
            count={counts.overdue}
            tone="danger"
          />
          <FilterPill
            active={filter === "draft"}
            onClick={() => setFilter("draft")}
            label={t("rentals.filter.draft")}
            count={counts.draft}
          />
          <FilterPill
            active={filter === "ended"}
            onClick={() => setFilter("ended")}
            label={t("rentals.filter.ended")}
            count={counts.ended}
          />
        </div>

        <div className="w-full sm:w-64">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("rentals.search_placeholder")}
            className="!h-9"
          />
        </div>

        <Link href="/ops/rentals/new" className="ml-auto">
          <Button size="sm">{t("rentals.new_contract_cta")}</Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState total={contracts.length} />
      ) : (
        <ContractsTable rows={filtered} courts={courts} />
      )}
    </div>
  );
}

function ContractsTable({
  rows,
  courts,
}: {
  rows: RentalContractWithSummary[];
  courts: Court[];
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card border border-border bg-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-subtle/30 text-[10.5px] uppercase tracking-wider text-muted font-semibold">
            <th className="pl-4 pr-2 py-2 text-left">{t("rentals.col.client")}</th>
            <th className="px-2 py-2 text-left">{t("rentals.col.contract")}</th>
            <th className="px-2 py-2 text-left">{t("rentals.col.schedule")}</th>
            <th className="px-2 py-2 text-left whitespace-nowrap">
              {t("rentals.col.courts")}
            </th>
            <th className="px-2 py-2 text-right whitespace-nowrap">
              {t("rentals.col.total_value")}
            </th>
            <th className="px-2 py-2 text-right whitespace-nowrap">
              {t("rentals.col.balance")}
            </th>
            <th className="pl-2 pr-4 py-2 text-left whitespace-nowrap">
              {t("rentals.col.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <ContractRow
              key={c.id}
              contract={c}
              courts={courts}
              zebra={i % 2 === 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractRow({
  contract: c,
  courts,
  zebra,
}: {
  contract: RentalContractWithSummary;
  courts: Court[];
  zebra: boolean;
}) {
  const { t, lang } = useTranslation();
  const overdue = c.overdue_rub > 0;
  const ahead = c.ahead_rub > 0 && !overdue;
  const balanceCls = overdue
    ? "text-[var(--color-danger)] font-bold"
    : ahead
      ? "text-[var(--color-success)] font-bold"
      : "text-secondary";
  const balanceText = overdue
    ? `−${formatRub(c.overdue_rub, lang)}`
    : ahead
      ? `+${formatRub(c.ahead_rub, lang)}`
      : "0";

  const rowBg = zebra
    ? "bg-subtle/40 hover:bg-subtle"
    : "hover:bg-subtle";

  return (
    <tr
      className={`transition-colors ${rowBg} ${c.status === "cancelled" ? "opacity-60" : ""}`}
      style={{ height: "52px" }}
    >
      <td className="pl-4 pr-2 align-middle min-w-0">
        <Link
          href={`/ops/rentals/${c.id}`}
          className="flex flex-col leading-tight group"
        >
          <span className="text-sm font-medium text-black group-hover:text-accent transition-colors truncate">
            {c.client_name}
          </span>
          {c.contact_person && (
            <span className="text-[10.5px] text-muted truncate">
              {c.contact_person}
            </span>
          )}
        </Link>
      </td>
      <td className="px-2 align-middle text-xs text-secondary leading-tight">
        <div className="flex flex-col">
          {c.contract_number && (
            <span className="text-black font-medium truncate">
              {c.contract_number}
            </span>
          )}
          <span className="tabular-nums text-muted whitespace-nowrap">
            {formatContractPeriod(c.start_date, c.end_date)}
          </span>
        </div>
      </td>
      <td className="px-2 align-middle text-xs text-secondary min-w-0">
        <span
          className="truncate block max-w-[28ch]"
          title={formatScheduleSummary(c.slots, lang)}
        >
          {formatScheduleSummary(c.slots, lang)}
        </span>
      </td>
      <td className="px-2 align-middle text-xs text-secondary whitespace-nowrap">
        {formatCourtsList(c.slots, courts)}
      </td>
      <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
        {c.total_value_rub > 0 ? formatRub(c.total_value_rub, lang) : "—"}
      </td>
      <td
        className={`px-2 align-middle text-sm tabular-nums text-right whitespace-nowrap ${balanceCls}`}
        title={
          overdue
            ? t("rentals.balance.overdue_tooltip", {
                amount: formatRub(c.overdue_rub, lang),
              })
            : ahead
              ? t("rentals.balance.ahead_tooltip", {
                  amount: formatRub(c.ahead_rub, lang),
                })
              : undefined
        }
      >
        {balanceText}
      </td>
      <td className="pl-2 pr-4 align-middle whitespace-nowrap">
        <StatusBadge status={c.status} />
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: RentalContractStatus }) {
  const { t } = useTranslation();
  const map: Record<
    RentalContractStatus,
    { bg: string; text: string }
  > = {
    draft: { bg: "bg-subtle", text: "text-muted" },
    active: {
      bg: "bg-[var(--color-success-soft)]",
      text: "text-[var(--color-success)]",
    },
    paused: {
      bg: "bg-[var(--color-warning-soft)]",
      text: "text-[var(--color-warning)]",
    },
    ended: { bg: "bg-subtle", text: "text-secondary" },
    cancelled: {
      bg: "bg-[var(--color-danger-soft)]",
      text: "text-[var(--color-danger)]",
    },
  };
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 h-6 rounded text-[10.5px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
    >
      {t(RENTAL_STATUS_KEY[status])}
    </span>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "danger";
}) {
  const countCls = active
    ? tone === "danger"
      ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
      : "bg-subtle text-secondary"
    : "bg-surface text-muted";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 px-2.5 h-7 rounded text-[11px] font-semibold transition-colors",
        active
          ? "bg-surface text-black shadow-sm"
          : "text-muted hover:text-black",
      ].join(" ")}
    >
      <span>{label}</span>
      <span className={`px-1.5 rounded-full text-[10px] tabular-nums ${countCls}`}>
        {count}
      </span>
    </button>
  );
}

function EmptyState({ total }: { total: number }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center flex flex-col items-center gap-3">
      <h2 className="text-base font-semibold text-black">
        {total === 0
          ? t("rentals.empty.zero_title")
          : t("rentals.empty.filter_title")}
      </h2>
      <p className="text-sm text-muted max-w-md">
        {total === 0
          ? t("rentals.empty.zero_copy")
          : t("rentals.empty.filter_copy")}
      </p>
      {total === 0 && (
        <Link href="/ops/rentals/new">
          <Button size="sm">{t("rentals.new_contract_cta")}</Button>
        </Link>
      )}
    </div>
  );
}
