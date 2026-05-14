import type { TranslationKey } from "@/lib/i18n";
import type { EventKind } from "@/lib/queries/calendar";
import type { CalendarView } from "@/app/calendar/view";
import type { TournamentType } from "@/lib/types";

export const CALENDAR_VIEW_LABEL_KEY: Record<CalendarView, TranslationKey> = {
  day: "calendar.view.day",
  week: "calendar.view.week",
  month: "calendar.view.month",
};

export const EVENT_KIND_LABEL_KEY: Record<EventKind, TranslationKey> = {
  tournament: "event.kind.tournament",
  league_session: "event.kind.league_session",
  rental: "event.kind.rental",
  schedule_session: "event.kind.schedule_session",
};

export const SESSION_STATUS_LABEL_KEY: Record<string, TranslationKey> = {
  scheduled: "event.session.status.scheduled",
  in_progress: "event.session.status.in_progress",
  completed: "event.session.status.completed",
};

export const TOURNAMENT_TYPE_KEY: Record<TournamentType, TranslationKey> = {
  one_day: "tournament.type.one_day",
  league_season: "tournament.type.league_season",
};
