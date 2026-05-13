import { FORMAT_LABEL_RU } from "./constants";
import { programTypeColor } from "./program-colors";
import type { CalendarEvent, EventKind } from "./queries/calendar";

export interface EventBlockStyle {
  background: string;
  ink: string;
  stripe: boolean;
  badge: string | null;
  /** True for tournament/league_session — caller uses its own status-driven
   * styling (white/green/blue card variants) instead of background/ink. */
  useStatusStyle: boolean;
}

export interface EventLink {
  label: string;
  href: string;
  primary: boolean;
}

export function eventTitle(e: CalendarEvent): string {
  switch (e.kind) {
    case "tournament":
    case "league_session":
      return e.tournamentName;
    case "rental":
      return e.clientName;
    case "schedule_session":
      return e.programName ?? "Сессия";
  }
}

export function eventSubtitle(e: CalendarEvent): string | null {
  switch (e.kind) {
    case "tournament":
    case "league_session":
      return FORMAT_LABEL_RU[e.format] ?? null;
    case "rental":
      return e.contractNumber;
    case "schedule_session":
      return e.coachNames.length > 0 ? e.coachNames.join(", ") : null;
  }
}

export function eventDetailLines(e: CalendarEvent): string[] {
  switch (e.kind) {
    case "tournament":
    case "league_session":
      return [];
    case "rental": {
      const lines: string[] = [];
      if (e.contractNumber) lines.push(`Договор № ${e.contractNumber}`);
      if (e.slotNotes) lines.push(e.slotNotes);
      return lines;
    }
    case "schedule_session": {
      const lines: string[] = [];
      if (e.programType) lines.push(e.programType);
      if (e.coachNames.length > 0)
        lines.push(`Тренеры: ${e.coachNames.join(", ")}`);
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
        badge: null,
        useStatusStyle: true,
      };
    case "rental":
      return {
        background: "#0d9488",
        ink: "#ffffff",
        stripe: true,
        badge: "АРЕНДА",
        useStatusStyle: false,
      };
    case "schedule_session": {
      const c = programTypeColor(e.programType);
      return {
        background: c.block,
        ink: c.ink,
        stripe: false,
        badge: "ОПС",
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
          label: "Открыть турнир",
          href: `/tournament/${e.tournamentId}`,
          primary: true,
        },
      ];
    case "rental":
      return [
        {
          label: "Открыть в расписании",
          href: `/ops/schedule?view=day&date=${e.date}`,
          primary: false,
        },
        {
          label: "Открыть контракт",
          href: `/ops/rentals/${e.contractId}`,
          primary: true,
        },
      ];
    case "schedule_session":
      return [
        {
          label: "Открыть в расписании",
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
