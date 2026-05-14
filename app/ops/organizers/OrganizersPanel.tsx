"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub, formatShortDateWithWeekday } from "@/lib/i18n/format";
import type { OrganizerWithBalance } from "@/lib/types";
import { OrganizersSummary } from "./OrganizersSummary";
import { OrganizerForm } from "./OrganizerForm";
import { createOrganizerAction } from "./create-organizer-action";
import type { RawOrganizerInput } from "./organizer-input";

type Filter = "all" | "owing" | "credit" | "settled";

interface OrganizersPanelProps {
  organizers: OrganizerWithBalance[];
}

export function OrganizersPanel({ organizers }: OrganizersPanelProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    return {
      all: organizers.length,
      owing: organizers.filter((o) => o.balance_rub > 0).length,
      credit: organizers.filter((o) => o.balance_rub < 0).length,
      settled: organizers.filter((o) => o.balance_rub === 0).length,
    };
  }, [organizers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizers.filter((o) => {
      if (filter === "owing" && o.balance_rub <= 0) return false;
      if (filter === "credit" && o.balance_rub >= 0) return false;
      if (filter === "settled" && o.balance_rub !== 0) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        (o.contact_name ?? "").toLowerCase().includes(q) ||
        (o.phone ?? "").toLowerCase().includes(q) ||
        (o.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [organizers, filter, search]);

  function handleCreate(input: RawOrganizerInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await createOrganizerAction(input);
        if (res.id) {
          setCreating(false);
          router.push(`/ops/organizers/${res.id}`);
          resolve({});
          return;
        }
        resolve({ error: res.error });
      });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <OrganizersSummary organizers={organizers} />

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label={t("organizers.aria.filter")}
          className="inline-flex p-0.5 rounded-md bg-subtle border border-border"
        >
          <FilterPill
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={t("organizers.filter.all")}
            count={counts.all}
          />
          <FilterPill
            active={filter === "owing"}
            onClick={() => setFilter("owing")}
            label={t("organizers.filter.owing")}
            count={counts.owing}
            tone="danger"
          />
          <FilterPill
            active={filter === "credit"}
            onClick={() => setFilter("credit")}
            label={t("organizers.filter.credit")}
            count={counts.credit}
            tone="success"
          />
          <FilterPill
            active={filter === "settled"}
            onClick={() => setFilter("settled")}
            label={t("organizers.filter.settled")}
            count={counts.settled}
          />
        </div>

        <div className="w-full sm:w-64">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("organizers.search_placeholder")}
            className="!h-9"
          />
        </div>

        <Button
          size="sm"
          onClick={() => setCreating(true)}
          disabled={creating}
          className="ml-auto"
        >
          {t("organizers.add_cta")}
        </Button>
      </div>

      {creating && (
        <OrganizerForm
          mode="create"
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
          pending={pending}
        />
      )}

      {filtered.length === 0 && !creating ? (
        <EmptyState
          total={organizers.length}
          onAdd={() => setCreating(true)}
        />
      ) : filtered.length > 0 ? (
        <OrganizersTable rows={filtered} />
      ) : null}
    </div>
  );
}

function OrganizersTable({ rows }: { rows: OrganizerWithBalance[] }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card border border-border bg-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-subtle/30 text-[10.5px] uppercase tracking-wider text-muted font-semibold">
            <th className="pl-4 pr-2 py-2 text-left">
              {t("organizers.col.organizer")}
            </th>
            <th className="px-2 py-2 text-left">{t("organizers.col.contact")}</th>
            <th className="px-2 py-2 text-right whitespace-nowrap">
              {t("organizers.col.charges")}
            </th>
            <th className="px-2 py-2 text-right whitespace-nowrap">
              {t("organizers.col.deposits")}
            </th>
            <th className="px-2 py-2 text-right whitespace-nowrap">
              {t("organizers.col.entries")}
            </th>
            <th className="px-2 py-2 text-left whitespace-nowrap">
              {t("organizers.col.activity")}
            </th>
            <th className="pl-2 pr-4 py-2 text-right whitespace-nowrap">
              {t("organizers.col.balance")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o, i) => (
            <OrganizerRow key={o.id} organizer={o} zebra={i % 2 === 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrganizerRow({
  organizer: o,
  zebra,
}: {
  organizer: OrganizerWithBalance;
  zebra: boolean;
}) {
  const { lang } = useTranslation();
  const owes = o.balance_rub > 0;
  const credit = o.balance_rub < 0;
  const balanceCls = owes
    ? "text-[var(--color-danger)] font-bold"
    : credit
      ? "text-[var(--color-success)] font-bold"
      : "text-muted";
  const balanceText = owes
    ? formatRub(o.balance_rub, lang)
    : credit
      ? `−${formatRub(-o.balance_rub, lang)}`
      : "0";

  return (
    <tr
      className={`transition-colors ${
        zebra ? "bg-subtle/40 hover:bg-subtle" : "hover:bg-subtle"
      }`}
      style={{ height: "44px" }}
    >
      <td className="pl-4 pr-2 align-middle">
        <Link
          href={`/ops/organizers/${o.id}`}
          className="text-sm font-medium text-black hover:text-accent transition-colors"
        >
          {o.name}
        </Link>
      </td>
      <td className="px-2 align-middle text-xs text-secondary">
        <div className="flex flex-col leading-tight">
          {o.contact_name && (
            <span className="text-black">{o.contact_name}</span>
          )}
          <span className="text-muted truncate max-w-[18ch]">
            {o.phone || o.email || "—"}
          </span>
        </div>
      </td>
      <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
        {o.charges_total > 0 ? formatRub(o.charges_total, lang) : "—"}
      </td>
      <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right whitespace-nowrap">
        {o.deposits_total > 0 ? formatRub(o.deposits_total, lang) : "—"}
      </td>
      <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right">
        {o.entries_count || "—"}
      </td>
      <td className="px-2 align-middle text-xs text-muted tabular-nums whitespace-nowrap">
        {o.last_activity ? formatShortDateWithWeekday(o.last_activity, lang) : "—"}
      </td>
      <td
        className={`pl-2 pr-4 align-middle text-sm tabular-nums text-right whitespace-nowrap ${balanceCls}`}
      >
        {balanceText}
      </td>
    </tr>
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
  tone?: "danger" | "success";
}) {
  const countCls = active
    ? tone === "danger"
      ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
      : tone === "success"
        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
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

function EmptyState({
  total,
  onAdd,
}: {
  total: number;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center flex flex-col items-center gap-3">
      <h2 className="text-base font-semibold text-black">
        {total === 0
          ? t("organizers.empty.zero_title")
          : t("organizers.empty.filter_title")}
      </h2>
      <p className="text-sm text-muted max-w-md">
        {total === 0
          ? t("organizers.empty.zero_copy")
          : t("organizers.empty.filter_copy")}
      </p>
      <Button size="sm" onClick={onAdd}>
        {t("organizers.add_cta")}
      </Button>
    </div>
  );
}
