import type { DisplayEvent } from "@/lib/queries/display";
import { Avatar, OverflowPill } from "@/components/ui/Avatar";

const MAX_VISIBLE = 8;

type LiveBodyProps = {
  event: DisplayEvent;
};

export function LiveBody({ event }: LiveBodyProps) {
  const visible = event.registeredPlayers.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, event.registeredPlayers.length - MAX_VISIBLE);

  const board =
    event.leaderboard.length === 0 ? (
      <p className="text-muted text-base italic">
        Ожидаем первые результаты...
      </p>
    ) : (
      <div className="flex flex-col gap-2">
        <h3 className="text-[0.75rem] font-semibold tracking-[0.2em] text-muted uppercase">
          Лидеры
        </h3>
        <ol className="flex flex-col">
          {event.leaderboard.map((row, idx) => (
            <li
              key={row.playerId}
              className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-2 py-2.5 border-b border-border last:border-b-0"
            >
              <span className="text-lg font-bold text-muted tabular-nums text-center">
                {idx + 1}
              </span>
              <span className="text-lg font-medium text-black truncate">
                {row.name}
              </span>
              <span className="text-xl font-bold tabular-nums text-accent">
                {row.points}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {board}
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
      ) : null}
    </div>
  );
}
