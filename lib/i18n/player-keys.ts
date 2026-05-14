import type { TranslationKey } from "@/lib/i18n";
import type {
  DominantHand,
  Gender,
  MembershipStatus,
} from "@/lib/types";

export const MEMBERSHIP_KEY: Record<MembershipStatus, TranslationKey> = {
  member: "players.membership.member",
  non_member: "players.membership.non_member",
  guest: "players.membership.guest",
};

export const GENDER_KEY: Record<Gender, TranslationKey> = {
  male: "players.gender.male",
  female: "players.gender.female",
  other: "players.gender.other",
};

export const DOMINANT_HAND_KEY: Record<DominantHand, TranslationKey> = {
  right: "players.hand.right",
  left: "players.hand.left",
};
