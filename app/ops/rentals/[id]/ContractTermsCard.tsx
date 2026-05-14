"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub } from "@/lib/i18n/format";
import {
  RENTAL_SCHEDULE_TYPE_KEY,
} from "@/lib/i18n/rental-keys";
import type { RentalContract } from "@/lib/types";
import {
  formatContractPeriod,
  monthsBetween,
} from "../format";

export function ContractTermsCard({
  contract,
}: {
  contract: RentalContract;
}) {
  const { t, lang } = useTranslation();
  const months = monthsBetween(contract.start_date, contract.end_date);
  return (
    <section className="rounded-card border border-border bg-surface p-5 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-black">
        {t("contract.terms.title")}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("contract.terms.field.contract_number")}
          value={contract.contract_number}
          mono
        />
        <Field
          label={t("contract.terms.field.period")}
          value={t("contract.terms.field.period_value", {
            period: formatContractPeriod(contract.start_date, contract.end_date),
            months,
          })}
        />
        <Field
          label={t("contract.terms.field.total_value")}
          value={
            contract.total_value_rub > 0
              ? formatRub(contract.total_value_rub, lang)
              : "—"
          }
        />
        <Field
          label={t("contract.terms.field.deposit")}
          value={
            contract.deposit_rub > 0 ? formatRub(contract.deposit_rub, lang) : "—"
          }
        />
        <Field
          label={t("contract.terms.field.payment_schedule")}
          value={t(RENTAL_SCHEDULE_TYPE_KEY[contract.payment_schedule_type])}
        />
        <Field
          label={t("contract.terms.field.document")}
          value={
            contract.document_url ? (
              <a
                href={contract.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-1"
              >
                <DocIcon />
                {t("contract.terms.document_open")}
              </a>
            ) : null
          }
        />
      </div>

      {(contract.notes || contract.internal_notes) && (
        <div className="grid gap-3 sm:grid-cols-2 mt-1">
          {contract.notes && (
            <NoteBlock
              label={t("contract.terms.note.public")}
              value={contract.notes}
            />
          )}
          {contract.internal_notes && (
            <NoteBlock
              label={t("contract.terms.note.internal")}
              value={contract.internal_notes}
              tone="internal"
            />
          )}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span
        className={`text-sm text-black ${mono ? "font-mono" : ""} truncate`}
      >
        {value || <span className="text-fade">—</span>}
      </span>
    </div>
  );
}

function NoteBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "internal";
}) {
  const wrapCls =
    tone === "internal"
      ? "bg-[var(--color-warning-soft)] border-[var(--color-warning)]/30"
      : "bg-subtle border-border";
  return (
    <div className={`rounded-md border p-2.5 ${wrapCls}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">
        {label}
      </span>
      <p className="text-xs text-secondary whitespace-pre-wrap leading-snug">
        {value}
      </p>
    </div>
  );
}

function DocIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
