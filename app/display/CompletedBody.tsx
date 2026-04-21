import type { DisplayEvent } from "@/lib/queries/display";
import { Avatar, OverflowPill } from "@/components/ui/Avatar";

const MAX_VISIBLE = 8;

type CompletedBodyProps = {
  event: DisplayEvent;
};

export function CompletedBody({ event }: CompletedBodyProps) {
  const visible = event.registeredPlayers.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, event.registeredPlayers.length - MAX_VISIBLE);

  const header = event.winner ? (
    <div className="flex items-center gap-4 py-2">
      <span className="text-5xl">🥇</span>
      <div className="flex flex-col">
        <span className="text-[0.75rem] tracking-[0.2em] text-muted uppercase">
          Победитель
        </span>
        <span className="text-2xl font-bold text-black">
          {event.winner.name}
        </span>
      </div>
    </div>
  ) : (
    <p className="text-muted text-base italic">Турнир завершён</p>
  );

  return (
    <div className="flex flex-col gap-4">
      {header}
      {visible.length > 0 ? (
        <div className="flex items-center pl-2 opacity-80">
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
      ) : null}
    </div>
  );
}
