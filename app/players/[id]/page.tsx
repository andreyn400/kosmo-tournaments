import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getPlayer } from "@/lib/queries/players";
import { listRatingHistoryByPlayer } from "@/lib/queries/rating-history";
import { formatDateRu } from "@/lib/format-date";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const history = await listRatingHistoryByPlayer(id);

  return (
    <PageShell
      title={player.name}
      action={
        <Link href="/players">
          <Button variant="secondary" size="md">
            К списку
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Badge tone="level">{player.level}</Badge>
            <span className="text-2xl font-bold tabular-nums text-black">
              {player.elo_rating}
            </span>
            <span className="text-xs text-muted uppercase tracking-wider">
              ELO
            </span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Row label="Телефон" value={player.phone ?? "—"} />
            <Row label="Email" value={player.email ?? "—"} />
            {player.notes ? (
              <Row label="Заметки" value={player.notes} wide />
            ) : null}
          </dl>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-black">
            История рейтинга · {history.length}
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted">
              Игрок ещё не участвовал в завершённых турнирах.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-button)] overflow-hidden">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-2.5 bg-white text-sm"
                >
                  <span className="text-muted text-xs tabular-nums">
                    {formatDateRu(h.recorded_at.slice(0, 10))}
                  </span>
                  <span className="text-xs text-muted tabular-nums">
                    {h.elo_before}
                  </span>
                  <span className="text-xs text-muted tabular-nums">
                    → {h.elo_after}
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      h.change > 0
                        ? "text-black"
                        : h.change < 0
                          ? "text-muted"
                          : "text-muted"
                    }`}
                  >
                    {h.change > 0 ? `+${h.change}` : h.change}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

function Row({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={
        wide ? "sm:col-span-2 flex flex-col gap-0.5" : "flex flex-col gap-0.5"
      }
    >
      <dt className="text-xs text-muted uppercase tracking-wider">{label}</dt>
      <dd className="text-black">{value}</dd>
    </div>
  );
}
