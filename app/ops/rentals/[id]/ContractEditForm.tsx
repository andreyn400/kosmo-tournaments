"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import {
  RENTAL_SCHEDULE_TYPE_KEY,
  RENTAL_STATUS_KEY,
} from "@/lib/i18n/rental-keys";
import type {
  RentalClientType,
  RentalContract,
  RentalContractStatus,
  RentalPaymentScheduleType,
} from "@/lib/types";
import type { RawContractInput } from "./contract-input";

interface ContractEditFormProps {
  contract: RentalContract;
  onCancel: () => void;
  onSubmit: (raw: RawContractInput) => Promise<{ error?: string }>;
  onDelete: () => Promise<void>;
  pending: boolean;
}

const STATUS_OPTIONS: RentalContractStatus[] = [
  "draft",
  "active",
  "paused",
  "ended",
  "cancelled",
];

const SCHEDULE_OPTIONS: RentalPaymentScheduleType[] = [
  "one_time",
  "monthly",
  "quarterly",
  "custom",
];

function makeInitial(c: RentalContract): RawContractInput {
  return {
    client_name: c.client_name,
    client_type: c.client_type,
    contact_person: c.contact_person ?? "",
    contact_phone: c.contact_phone ?? "",
    contact_email: c.contact_email ?? "",
    legal_entity_name: c.legal_entity_name ?? "",
    inn: c.inn ?? "",
    contract_number: c.contract_number ?? "",
    start_date: c.start_date,
    end_date: c.end_date,
    total_value_rub: String(c.total_value_rub),
    deposit_rub: String(c.deposit_rub),
    payment_schedule_type: c.payment_schedule_type,
    document_url: c.document_url ?? "",
    status: c.status,
    notes: c.notes ?? "",
    internal_notes: c.internal_notes ?? "",
  };
}

export function ContractEditForm({
  contract,
  onCancel,
  onSubmit,
  onDelete,
  pending,
}: ContractEditFormProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<RawContractInput>(() =>
    makeInitial(contract),
  );
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RawContractInput>(
    key: K,
    value: RawContractInput[K],
  ) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await onSubmit(state);
    if (res.error) setError(res.error);
  }

  const isLegal = state.client_type === "legal_entity";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-border bg-surface p-5 flex flex-col gap-4"
    >
      <h2 className="text-sm font-semibold text-black">
        {t("contract.edit.title")}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("contract.edit.field.client_name")}>
          <Input
            value={state.client_name}
            onChange={(e) => set("client_name", e.target.value)}
            placeholder={t("contract.edit.placeholder.client_name")}
            autoFocus
          />
        </Field>
        <Field label={t("contract.edit.field.client_type")}>
          <Select
            value={state.client_type}
            onChange={(e) =>
              set("client_type", e.target.value as RentalClientType)
            }
          >
            <option value="individual">
              {t("rentals.wizard.client.type.individual")}
            </option>
            <option value="legal_entity">
              {t("rentals.wizard.client.type.legal_entity")}
            </option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("contract.edit.field.contact_person")}>
          <Input
            value={state.contact_person}
            onChange={(e) => set("contact_person", e.target.value)}
            placeholder={t("rentals.wizard.client.placeholder.contact_person")}
          />
        </Field>
        <Field label={t("contract.edit.field.phone")}>
          <Input
            value={state.contact_phone}
            onChange={(e) => set("contact_phone", e.target.value)}
            placeholder="+7 ..."
          />
        </Field>
        <Field label={t("contract.edit.field.email")}>
          <Input
            type="email"
            value={state.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            placeholder="org@example.com"
          />
        </Field>
      </div>

      {isLegal && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("contract.edit.field.legal_name")}>
            <Input
              value={state.legal_entity_name}
              onChange={(e) => set("legal_entity_name", e.target.value)}
              placeholder={t("rentals.wizard.client.placeholder.legal_name")}
            />
          </Field>
          <Field label={t("contract.edit.field.inn")}>
            <Input
              value={state.inn}
              onChange={(e) => set("inn", e.target.value)}
              placeholder={t("rentals.wizard.client.placeholder.inn")}
              inputMode="numeric"
            />
          </Field>
        </div>
      )}

      <hr className="border-border" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("contract.edit.field.contract_number")}>
          <Input
            value={state.contract_number}
            onChange={(e) => set("contract_number", e.target.value)}
            placeholder="RC-2026-001"
          />
        </Field>
        <Field label={t("contract.edit.field.status")}>
          <Select
            value={state.status}
            onChange={(e) =>
              set("status", e.target.value as RentalContractStatus)
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(RENTAL_STATUS_KEY[s])}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("contract.edit.field.start_date")}>
          <Input
            type="date"
            value={state.start_date}
            onChange={(e) => set("start_date", e.target.value)}
          />
        </Field>
        <Field label={t("contract.edit.field.end_date")}>
          <Input
            type="date"
            value={state.end_date}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("contract.edit.field.total_value")}>
          <Input
            type="number"
            min={0}
            value={state.total_value_rub}
            onChange={(e) => set("total_value_rub", e.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field label={t("contract.edit.field.deposit")}>
          <Input
            type="number"
            min={0}
            value={state.deposit_rub}
            onChange={(e) => set("deposit_rub", e.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field label={t("contract.edit.field.payment_schedule")}>
          <Select
            value={state.payment_schedule_type}
            onChange={(e) =>
              set(
                "payment_schedule_type",
                e.target.value as RentalPaymentScheduleType,
              )
            }
          >
            {SCHEDULE_OPTIONS.map((sch) => (
              <option key={sch} value={sch}>
                {t(RENTAL_SCHEDULE_TYPE_KEY[sch])}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t("contract.edit.field.document_url")}>
        <Input
          type="url"
          value={state.document_url}
          onChange={(e) => set("document_url", e.target.value)}
          placeholder="https://drive.google.com/..."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("contract.edit.field.notes")}>
          <Textarea
            rows={3}
            value={state.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
        <Field label={t("contract.edit.field.internal_notes")}>
          <Textarea
            rows={3}
            value={state.internal_notes}
            onChange={(e) => set("internal_notes", e.target.value)}
          />
        </Field>
      </div>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 justify-end pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={pending}
          className="!text-[var(--color-danger)] hover:!bg-[var(--color-danger-soft)] mr-auto"
        >
          {t("contract.edit.delete_cta")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          {t("btn.cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t("btn.saving") : t("btn.save")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
