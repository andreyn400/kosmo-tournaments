import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/site/PageShell";
import { getPlayer } from "@/lib/queries/players";
import { listRatingHistoryByPlayer } from "@/lib/queries/rating-history";
import { formatDateRu } from "@/lib/format-date";
import {
  DOMINANT_HAND_LABEL_RU,
  GENDER_LABEL_RU,
  MEMBERSHIP_LABEL_RU,
} from "@/lib/constants";
import type { MembershipStatus } from "@/lib/types";
import { PlayerAvatar } from "./PlayerAvatar";

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const by = Number(m[1]);
  const bm = Number(m[2]);
  const bd = Number(m[3]);
  const now = new Date();
  let age = now.getFullYear() - by;
  const beforeBirthday =
    now.getMonth() + 1 < bm ||
    (now.getMonth() + 1 === bm && now.getDate() < bd);
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 150 ? age : null;
}

const MEMBERSHIP_TONE: Record<MembershipStatus, "qualified" | "neutral" | "status-draft"> = {
  member: "qualified",
  non_member: "neutral",
  guest: "status-draft",
};

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const history = await listRatingHistoryByPlayer(id);
  const age = ageFromDob(player.date_of_birth);

  return (
    <PageShell
      title={player.name}
      action={
        <div className="flex items-center gap-2">
          <Link href="/players">
            <Button variant="secondary" size="md">
              К списку
            </Button>
          </Link>
          <Link href={`/players/${player.id}/edit`}>
            <Button size="md">Редактировать</Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <Card className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <PlayerAvatar player={player} />
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="level">{player.level}</Badge>
                <Badge tone={MEMBERSHIP_TONE[player.membership_status]}>
                  {MEMBERSHIP_LABEL_RU[player.membership_status]}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-black">
                  {player.elo_rating}
                </span>
                <span className="text-xs text-muted uppercase tracking-wider">
                  ELO
                </span>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Row label="Телефон" value={player.phone ?? "—"} />
            <Row label="Email" value={player.email ?? "—"} />
            <Row
              label="Пол"
              value={player.gender ? GENDER_LABEL_RU[player.gender] : "—"}
            />
            <Row
              label="Дата рождения"
              value={formatDobWithAge(player.date_of_birth, age)}
            />
            <Row label="Гражданство" value={player.nationality ?? "—"} />
            <Row
              label="Рабочая рука"
              value={
                player.dominant_hand
                  ? DOMINANT_HAND_LABEL_RU[player.dominant_hand]
                  : "—"
              }
            />
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

function formatDobWithAge(dob: string | null, age: number | null): string {
  if (!dob) return "—";
  const base = formatDateRu(dob);
  return age != null ? `${base} · ${age} ${yearsWord(age)}` : base;
}

function yearsWord(age: number): string {
  const mod100 = age % 100;
  const mod10 = age % 10;
  if (mod100 >= 11 && mod100 <= 14) return "лет";
  if (mod10 === 1) return "год";
  if (mod10 >= 2 && mod10 <= 4) return "года";
  return "лет";
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
