import { PADEL_LEVELS } from "@/lib/constants";
import type {
  DominantHand,
  Gender,
  MembershipStatus,
  PadelLevel,
} from "@/lib/types";
import { fieldErr, type FieldError } from "@/lib/i18n/error-helpers";
import type { PlayerFormValues } from "./PlayerFields";

export type ParsedPlayer = {
  name: string;
  level: PadelLevel;
  phone: string | null;
  email: string | null;
  notes: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  nationality: string | null;
  photo_url: string | null;
  membership_status: MembershipStatus;
  dominant_hand: DominantHand | null;
};

const GENDERS: Gender[] = ["male", "female", "other"];
const MEMBERSHIPS: MembershipStatus[] = ["member", "non_member", "guest"];
const HANDS: DominantHand[] = ["right", "left"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function trimOrNull(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

export function parsePlayerForm(
  input: PlayerFormValues,
): { value: ParsedPlayer } | { error: FieldError } {
  const name = input.name.trim();
  if (!name) return { error: fieldErr("error.required.player_name") };
  if (!(PADEL_LEVELS as string[]).includes(input.level))
    return { error: fieldErr("error.invalid.level_unknown") };

  const gender = input.gender.trim();
  if (gender && !(GENDERS as string[]).includes(gender))
    return { error: fieldErr("error.invalid.gender_unknown") };

  if (!(MEMBERSHIPS as string[]).includes(input.membership_status))
    return { error: fieldErr("error.invalid.membership_unknown") };

  const hand = input.dominant_hand.trim();
  if (hand && !(HANDS as string[]).includes(hand))
    return { error: fieldErr("error.invalid.handedness_unknown") };

  const dob = input.date_of_birth.trim();
  if (dob && !DATE_RE.test(dob))
    return { error: fieldErr("error.invalid.date_of_birth_format") };

  return {
    value: {
      name,
      level: input.level as PadelLevel,
      phone: trimOrNull(input.phone),
      email: trimOrNull(input.email),
      notes: trimOrNull(input.notes),
      gender: (gender || null) as Gender | null,
      date_of_birth: dob || null,
      nationality: trimOrNull(input.nationality),
      photo_url: trimOrNull(input.photo_url),
      membership_status: input.membership_status as MembershipStatus,
      dominant_hand: (hand || null) as DominantHand | null,
    },
  };
}
