"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  DOMINANT_HAND_LABEL_RU,
  GENDER_LABEL_RU,
  MEMBERSHIP_LABEL_RU,
  PADEL_LEVELS,
} from "@/lib/constants";

export type PlayerFormValues = {
  name: string;
  level: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  photo_url: string;
  membership_status: string;
  dominant_hand: string;
  notes: string;
};

export const emptyPlayerFormValues: PlayerFormValues = {
  name: "",
  level: "C",
  phone: "",
  email: "",
  gender: "",
  date_of_birth: "",
  nationality: "",
  photo_url: "",
  membership_status: "guest",
  dominant_hand: "",
  notes: "",
};

type PlayerFieldsProps = {
  values: PlayerFormValues;
  onChange: (field: keyof PlayerFormValues, value: string) => void;
  disabled?: boolean;
  showName?: boolean;
  showLevel?: boolean;
  showPhone?: boolean;
};

function Label({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={[
        "flex flex-col gap-1 text-xs text-muted uppercase tracking-wider",
        wide ? "sm:col-span-2" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>{label}</span>
      <span className="normal-case tracking-normal text-black">{children}</span>
    </label>
  );
}

export function PlayerFields({
  values,
  onChange,
  disabled,
  showName = true,
  showLevel = true,
  showPhone = true,
}: PlayerFieldsProps) {
  const set = (field: keyof PlayerFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange(field, e.target.value);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showName && (
        <Label label="Имя" wide>
          <Input
            placeholder="Имя игрока"
            value={values.name}
            onChange={set("name")}
            disabled={disabled}
          />
        </Label>
      )}

      {showLevel && (
        <Label label="Уровень">
          <Select
            value={values.level}
            onChange={set("level")}
            disabled={disabled}
          >
            {PADEL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Label>
      )}

      <Label label="Членство">
        <Select
          value={values.membership_status}
          onChange={set("membership_status")}
          disabled={disabled}
        >
          {Object.entries(MEMBERSHIP_LABEL_RU).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </Label>

      {showPhone && (
        <Label label="Телефон">
          <Input
            placeholder="+7 ..."
            value={values.phone}
            onChange={set("phone")}
            disabled={disabled}
          />
        </Label>
      )}

      <Label label="Email">
        <Input
          type="email"
          placeholder="name@example.com"
          value={values.email}
          onChange={set("email")}
          disabled={disabled}
        />
      </Label>

      <Label label="Пол">
        <Select
          value={values.gender}
          onChange={set("gender")}
          disabled={disabled}
        >
          <option value="">— не указан —</option>
          {Object.entries(GENDER_LABEL_RU).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </Label>

      <Label label="Дата рождения">
        <Input
          type="date"
          value={values.date_of_birth}
          onChange={set("date_of_birth")}
          disabled={disabled}
        />
      </Label>

      <Label label="Гражданство">
        <Input
          placeholder="Например, Россия"
          value={values.nationality}
          onChange={set("nationality")}
          disabled={disabled}
        />
      </Label>

      <Label label="Рабочая рука">
        <Select
          value={values.dominant_hand}
          onChange={set("dominant_hand")}
          disabled={disabled}
        >
          <option value="">— не указана —</option>
          {Object.entries(DOMINANT_HAND_LABEL_RU).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </Label>

      <Label label="Фото (URL)" wide>
        <Input
          type="url"
          placeholder="https://..."
          value={values.photo_url}
          onChange={set("photo_url")}
          disabled={disabled}
        />
      </Label>

      <Label label="Заметки" wide>
        <textarea
          rows={3}
          value={values.notes}
          onChange={set("notes")}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 rounded-[var(--radius-button)] bg-subtle border border-border text-black placeholder:text-fade focus:outline-none focus:bg-surface focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors disabled:opacity-50"
        />
      </Label>
    </div>
  );
}
