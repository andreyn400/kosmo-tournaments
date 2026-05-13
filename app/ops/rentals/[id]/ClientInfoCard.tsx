"use client";

import type { RentalContract } from "@/lib/types";

export function ClientInfoCard({ contract }: { contract: RentalContract }) {
  const isLegal = contract.client_type === "legal_entity";
  return (
    <section className="rounded-card border border-border bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-black">Клиент</h2>
        <span className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-semibold uppercase tracking-wider bg-subtle text-secondary">
          {isLegal ? "Юр. лицо" : "Физ. лицо"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Контактное лицо" value={contract.contact_person} />
        <Field label="Телефон" value={contract.contact_phone} />
        <Field label="Email" value={contract.contact_email} />
        {isLegal && (
          <>
            <Field
              label="Юр. наименование"
              value={contract.legal_entity_name}
            />
            <Field label="ИНН" value={contract.inn} />
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
