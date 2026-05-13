"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { RentalClientType } from "@/lib/types";
import type { WizardState } from "./WizardShell";

interface Step1Props {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}

export function Step1Client({ state, update }: Step1Props) {
  const isLegal = state.client_type === "legal_entity";
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-black">Информация о клиенте</h2>
        <p className="text-[11.5px] text-muted">
          Кто арендует корты. Для юр. лица заполните также юр. наименование и
          ИНН — они потребуются для счетов.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Название клиента *">
          <Input
            value={state.client_name}
            onChange={(e) => update("client_name", e.target.value)}
            placeholder="Газпром / Иван Иванов"
            autoFocus
          />
        </Field>
        <Field label="Тип">
          <Select
            value={state.client_type}
            onChange={(e) =>
              update("client_type", e.target.value as RentalClientType)
            }
          >
            <option value="individual">Физическое лицо</option>
            <option value="legal_entity">Юридическое лицо</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Контактное лицо">
          <Input
            value={state.contact_person}
            onChange={(e) => update("contact_person", e.target.value)}
            placeholder="Иван Иванов"
          />
        </Field>
        <Field label="Телефон">
          <Input
            value={state.contact_phone}
            onChange={(e) => update("contact_phone", e.target.value)}
            placeholder="+7 ..."
          />
        </Field>
        <Field label="Email">
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
          <Field label="Юридическое наименование">
            <Input
              value={state.legal_entity_name}
              onChange={(e) => update("legal_entity_name", e.target.value)}
              placeholder="ПАО Газпром"
            />
          </Field>
          <Field label="ИНН (10 или 12 цифр)">
            <Input
              value={state.inn}
              onChange={(e) => update("inn", e.target.value)}
              placeholder="7708503727"
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
