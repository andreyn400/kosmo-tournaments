import type { DisplayEvent } from "@/lib/queries/display";
import { Avatar, OverflowPill } from "@/components/ui/Avatar";

const MAX_VISIBLE = 8;

type UpcomingBodyProps = {
  event: DisplayEvent;
};

export function UpcomingBody({ event }: UpcomingBodyProps) {
  const visible = event.registeredPlayers.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, event.registeredPlayers.length - MAX_VISIBLE);

  return (
    <div className="flex flex-col gap-3">
      {visible.length > 0 ? (
        <div className="flex items-center pl-2">
          {visible.map((p) => (
            <div key={p.id} className="-ml-2">
              <Avatar name={p.name} photoUrl={p.photo_url} size="sm" />
            </div>
          ))}
          {overflow > 0 && (
            <div className="-ml-2">
              <OverflowPill count={overflow} size="sm" />
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted text-sm italic">
          Пока нет зарегистрированных игроков
        </p>
      )}
      <p className="text-secondary text-base font-medium tabular-nums">
        {event.playerCount}
        {event.maxPlayers != null ? ` / ${event.maxPlayers}` : ""} игроков
        зарегистрировано
      </p>
    </div>
  );
}
