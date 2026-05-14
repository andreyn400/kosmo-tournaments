import type { TranslationKey } from "@/lib/i18n";
import type {
  RentalContractStatus,
  RentalPaymentMethod,
  RentalPaymentScheduleType,
  RentalPaymentType,
} from "@/lib/types";

export const RENTAL_STATUS_KEY: Record<RentalContractStatus, TranslationKey> = {
  draft: "rentals.status.draft",
  active: "rentals.status.active",
  paused: "rentals.status.paused",
  ended: "rentals.status.ended",
  cancelled: "rentals.status.cancelled",
};

export const RENTAL_SCHEDULE_TYPE_KEY: Record<
  RentalPaymentScheduleType,
  TranslationKey
> = {
  one_time: "rentals.schedule_type.one_time",
  monthly: "rentals.schedule_type.monthly",
  quarterly: "rentals.schedule_type.quarterly",
  custom: "rentals.schedule_type.custom",
};

export const RENTAL_PAYMENT_TYPE_KEY: Record<
  RentalPaymentType,
  TranslationKey
> = {
  payment: "ledger.payment.type.payment",
  deposit: "ledger.payment.type.deposit",
  penalty: "ledger.payment.type.penalty",
  refund: "ledger.payment.type.refund",
};

export const RENTAL_PAYMENT_METHOD_KEY: Record<
  RentalPaymentMethod,
  TranslationKey
> = {
  cash: "ledger.payment.method.cash",
  card: "ledger.payment.method.card",
  transfer: "ledger.payment.method.transfer",
};
