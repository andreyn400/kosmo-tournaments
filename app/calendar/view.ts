export type CalendarView = "day" | "week" | "month";

export const CALENDAR_VIEWS: CalendarView[] = ["day", "week", "month"];

export const CALENDAR_VIEW_LABEL_RU: Record<CalendarView, string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
};
