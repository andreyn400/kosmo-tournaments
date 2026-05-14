"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/components/i18n/useTranslation";
import { PADEL_LEVELS } from "@/lib/constants";
import {
  DOMINANT_HAND_KEY,
  GENDER_KEY,
  MEMBERSHIP_KEY,
} from "@/lib/i18n/player-keys";
import type {
  DominantHand,
  Gender,
  MembershipStatus,
} from "@/lib/types";

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

const MEMBERSHIP_VALUES: MembershipStatus[] = ["member", "non_member", "guest"];
const GENDER_VALUES: Gender[] = ["male", "female", "other"];
const HAND_VALUES: DominantHand[] = ["right", "left"];

export function PlayerFields({
  values,
  onChange,
  disabled,
  showName = true,
  showLevel = true,
  showPhone = true,
}: PlayerFieldsProps) {
  const { t } = useTranslation();
  const set =
    (field: keyof PlayerFormValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      onChange(field, e.target.value);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showName && (
        <Label label={t("players.field.name")} wide>
          <Input
            placeholder={t("players.placeholder_player_name")}
            value={values.name}
            onChange={set("name")}
            disabled={disabled}
          />
        </Label>
      )}

      {showLevel && (
        <Label label={t("players.field.level")}>
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

      <Label label={t("players.field.membership")}>
        <Select
          value={values.membership_status}
          onChange={set("membership_status")}
          disabled={disabled}
        >
          {MEMBERSHIP_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(MEMBERSHIP_KEY[value])}
            </option>
          ))}
        </Select>
      </Label>

      {showPhone && (
        <Label label={t("players.field.phone")}>
          <Input
            placeholder="+7 ..."
            value={values.phone}
            onChange={set("phone")}
            disabled={disabled}
          />
        </Label>
      )}

      <Label label={t("players.field.email")}>
        <Input
          type="email"
          placeholder="name@example.com"
          value={values.email}
          onChange={set("email")}
          disabled={disabled}
        />
      </Label>

      <Label label={t("players.field.gender")}>
        <Select
          value={values.gender}
          onChange={set("gender")}
          disabled={disabled}
        >
          <option value="">{t("players.gender_unspecified")}</option>
          {GENDER_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(GENDER_KEY[value])}
            </option>
          ))}
        </Select>
      </Label>

      <Label label={t("players.field.date_of_birth")}>
        <Input
          type="date"
          value={values.date_of_birth}
          onChange={set("date_of_birth")}
          disabled={disabled}
        />
      </Label>

      <Label label={t("players.field.nationality")}>
        <Input
          placeholder={t("players.placeholder_nationality")}
          value={values.nationality}
          onChange={set("nationality")}
          disabled={disabled}
        />
      </Label>

      <Label label={t("players.field.dominant_hand")}>
        <Select
          value={values.dominant_hand}
          onChange={set("dominant_hand")}
          disabled={disabled}
        >
          <option value="">{t("players.hand_unspecified")}</option>
          {HAND_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(DOMINANT_HAND_KEY[value])}
            </option>
          ))}
        </Select>
      </Label>

      <Label label={t("players.field.photo_url")} wide>
        <Input
          type="url"
          placeholder="https://..."
          value={values.photo_url}
          onChange={set("photo_url")}
          disabled={disabled}
        />
      </Label>

      <Label label={t("players.field.notes")} wide>
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
