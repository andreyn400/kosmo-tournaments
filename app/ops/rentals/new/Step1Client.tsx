"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/components/i18n/useTranslation";
import type { RentalClientType } from "@/lib/types";
import type { WizardState } from "./WizardShell";

interface Step1Props {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}

export function Step1Client({ state, update }: Step1Props) {
  const { t } = useTranslation();
  const isLegal = state.client_type === "legal_entity";
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-black">
          {t("rentals.wizard.client.title")}
        </h2>
        <p className="text-[11.5px] text-muted">
          {t("rentals.wizard.client.help")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("rentals.wizard.client.field.name")}>
          <Input
            value={state.client_name}
            onChange={(e) => update("client_name", e.target.value)}
            placeholder={t("rentals.wizard.client.placeholder.name")}
            autoFocus
          />
        </Field>
        <Field label={t("rentals.wizard.client.field.type")}>
          <Select
            value={state.client_type}
            onChange={(e) =>
              update("client_type", e.target.value as RentalClientType)
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
        <Field label={t("rentals.wizard.client.field.contact_person")}>
          <Input
            value={state.contact_person}
            onChange={(e) => update("contact_person", e.target.value)}
            placeholder={t("rentals.wizard.client.placeholder.contact_person")}
          />
        </Field>
        <Field label={t("rentals.wizard.client.field.phone")}>
          <Input
            value={state.contact_phone}
            onChange={(e) => update("contact_phone", e.target.value)}
            placeholder="+7 ..."
          />
        </Field>
        <Field label={t("rentals.wizard.client.field.email")}>
          <Input
            type="email"
            value={state.contact_email}
            onChange={(e) => update("contact_email", e.target.value)}
            placeholder="org@example.com"
          />
        </Field>
      </div>

      {isLegal && (
        <div className="grid gap-3 sm:grid-cols-2 mt-1 pt-3 border-t border-border">
          <Field label={t("rentals.wizard.client.field.legal_name")}>
            <Input
              value={state.legal_entity_name}
              onChange={(e) => update("legal_entity_name", e.target.value)}
              placeholder={t("rentals.wizard.client.placeholder.legal_name")}
            />
          </Field>
          <Field label={t("rentals.wizard.client.field.inn")}>
            <Input
              value={state.inn}
              onChange={(e) => update("inn", e.target.value)}
              placeholder={t("rentals.wizard.client.placeholder.inn")}
              inputMode="numeric"
            />
          </Field>
        </div>
      )}
    </div>
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
