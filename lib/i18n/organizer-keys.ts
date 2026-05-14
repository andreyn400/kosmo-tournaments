import type { TranslationKey } from "@/lib/i18n";
import type { OrganizerPaymentType } from "@/lib/types";

export const ORGANIZER_PAYMENT_TYPE_KEY: Record<
  OrganizerPaymentType,
  TranslationKey
> = {
  payment: "organizer.payment.type.payment",
  deposit: "organizer.payment.type.deposit",
  refund: "organizer.payment.type.refund",
};

export const ORGANIZER_PAYMENT_DESC_KEY: Record<
  OrganizerPaymentType,
  TranslationKey
> = {
  payment: "organizer.payment.desc.payment",
  deposit: "organizer.payment.desc.deposit",
  refund: "organizer.payment.desc.refund",
};
