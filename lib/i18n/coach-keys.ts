import type { TranslationKey } from "@/lib/i18n";
import type { CoachRateType, ScheduleSessionStatus } from "@/lib/types";

export const COACH_RATE_TYPE_LONG_KEY: Record<CoachRateType, TranslationKey> = {
  flat: "coaches.rate.flat_long",
  percent: "coaches.rate.percent_long",
};

export const SCHEDULE_SESSION_STATUS_KEY: Record<
  ScheduleSessionStatus,
  TranslationKey
> = {
  completed: "coach.session.status.completed",
  scheduled: "coach.session.status.scheduled",
  cancelled: "coach.session.status.cancelled",
};
