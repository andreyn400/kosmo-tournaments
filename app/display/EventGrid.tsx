import type { DisplayEvent } from "@/lib/queries/display";
import { EventCard } from "./EventCard";

type EventGridProps = {
  events: DisplayEvent[];
};

export function EventGrid({ events }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
        <span className="inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-accent-soft text-accent font-bold text-5xl">
          К
        </span>
        <p className="text-2xl font-medium text-muted">
          Сегодня нет запланированных мероприятий
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 grid-cols-1 xl:grid-cols-2">
      {events.map((e) => (
        <EventCard key={e.key} event={e} />
      ))}
    </div>
  );
}
