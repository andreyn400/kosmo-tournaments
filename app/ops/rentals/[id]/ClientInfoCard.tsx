"use client";

import { useTranslation } from "@/components/i18n/useTranslation";
import type { RentalContract } from "@/lib/types";

export function ClientInfoCard({ contract }: { contract: RentalContract }) {
  const { t } = useTranslation();
  const isLegal = contract.client_type === "legal_entity";
  return (
    <section className="rounded-card border border-border bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-black">
          {t("contract.client.title")}
        </h2>
        <span className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-semibold uppercase tracking-wider bg-subtle text-secondary">
          {isLegal
            ? t("contract.client.type.legal_short")
            : t("contract.client.type.individual_short")}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("contract.client.field.contact_person")}
          value={contract.contact_person}
        />
        <Field
          label={t("contract.client.field.phone")}
          value={contract.contact_phone}
        />
        <Field
          label={t("contract.client.field.email")}
          value={contract.contact_email}
        />
        {isLegal && (
          <>
            <Field
              label={t("contract.client.field.legal_name")}
              value={contract.legal_entity_name}
            />
            <Field
              label={t("contract.client.field.inn")}
              value={contract.inn}
            />
          </>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="text-sm text-black truncate">
        {value || <span className="text-fade">—</span>}
      </span>
    </div>
  );
}
