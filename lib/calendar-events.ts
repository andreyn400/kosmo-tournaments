import type { TranslationKey } from "@/lib/i18n";
import { TOURNAMENT_FORMAT_KEY } from "@/lib/i18n/tournament-keys";
import { programTypeColor } from "./program-colors";
import type { CalendarEvent, EventKind } from "./queries/calendar";

export interface EventBlockStyle {
  background: string;
  ink: string;
  stripe: boolean;
  badgeKey: TranslationKey | null;
  /** True for tournament/league_session — caller uses its own status-driven
   * styling (white/green/blue card variants) instead of background/ink. */
  useStatusStyle: boolean;
}

export interface EventLink {
  labelKey: TranslationKey;
  href: string;
  primary: boolean;
}

export interface EventDetailLine {
  /** When set, render translate(key, vars). Falls back to `text` when null. */
  key: TranslationKey | null;
  vars?: Record<string, string | number>;
  /** Plain literal line (e.g. user-entered notes or data fields). */
  text?: string;
}

type Translator = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function eventTitle(e: CalendarEvent, t: Translator): string {
  switch (e.kind) {
    case "tournament":
    case "league_session":
      return e.tournamentName;
    case "rental":
      return e.clientName;
    case "schedule_session":
      return e.programName ?? t("event.fallback.session_name");
  }
}

export function eventSubtitle(e: CalendarEvent, t: Translator): string | null {
  switch (e.kind) {
    case "tournament":
    case "league_session":
      return t(TOURNAMENT_FORMAT_KEY[e.format]);
    case "rental":
      return e.contractNumber;
    case "schedule_session":
      return e.coachNames.length > 0 ? e.coachNames.join(", ") : null;
  }
}

export function eventDetailLines(e: CalendarEvent): EventDetailLine[] {
  switch (e.kind) {
    case "tournament":
    case "league_session":
      return [];
    case "rental": {
      const lines: EventDetailLine[] = [];
      if (e.contractNumber)
        lines.push({
          key: "event.detail.contract_no",
          vars: { number: e.contractNumber },
        });
      if (e.slotNotes) lines.push({ key: null, text: e.slotNotes });
      return lines;
    }
    case "schedule_session": {
      const lines: EventDetailLine[] = [];
      if (e.programType) lines.push({ key: null, text: e.programType });
      if (e.coachNames.length > 0)
        lines.push({
          key: "event.detail.coaches",
          vars: { names: e.coachNames.join(", ") },
        });
      return lines;
    }
  }
}

export function eventBlockStyle(e: CalendarEvent): EventBlockStyle {
  switch (e.kind) {
    case "tournament":
    case "league_session":
      return {
        background: "",
        ink: "",
        stripe: false,
        badgeKey: null,
        useStatusStyle: true,
      };
    case "rental":
      return {
        background: "#0d9488",
        ink: "#ffffff",
        stripe: true,
        badgeKey: "event.badge.rental",
        useStatusStyle: false,
      };
    case "schedule_session": {
      const c = programTypeColor(e.programType);
      return {
        background: c.block,
        ink: c.ink,
        stripe: false,
        badgeKey: "event.badge.session_short",
        useStatusStyle: false,
      };
    }
  }
}

export function eventLinks(e: CalendarEvent): EventLink[] {
  switch (e.kind) {
    case "tournament":
    case "league_session":
      return [
        {
          labelKey: "event.action.open_tournament",
          href: `/tournament/${e.tournamentId}`,
          primary: true,
        },
      ];
    case "rental":
      return [
        {
          labelKey: "event.action.open_in_schedule",
          href: `/ops/schedule?view=day&date=${e.date}`,
          primary: false,
        },
        {
          labelKey: "event.action.open_contract",
          href: `/ops/rentals/${e.contractId}`,
          primary: true,
        },
      ];
    case "schedule_session":
      return [
        {
          labelKey: "event.action.open_in_schedule",
          href: `/ops/schedule?view=day&date=${e.date}`,
          primary: true,
        },
      ];
  }
}

export const MINI_CALENDAR_KIND_ORDER: readonly EventKind[] = [
  "tournament",
  "league_session",
  "rental",
  "schedule_session",
] as const;

export const MINI_CALENDAR_KIND_COLOR: Record<EventKind, string> = {
  tournament: "#e11d48",
  league_session: "var(--color-accent)",
  rental: "#0d9488",
  schedule_session: "#d97706",
};
