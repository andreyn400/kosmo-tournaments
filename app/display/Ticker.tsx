import { FORMAT_LABEL_RU } from "@/lib/constants";
import type { TickerEvent } from "@/lib/queries/display";

const WEEKDAY_SHORT_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_GEN_RU = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

function relativeDateLabel(iso: string, todayIso: string): string {
  if (iso === addDays(todayIso, 1)) return "Завтра";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WEEKDAY_SHORT_RU[dt.getDay()]} ${d} ${MONTH_GEN_RU[m - 1]}`;
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function courtsSummary(nums: number[]): string {
  if (nums.length === 0) return "";
  if (nums.length === 1) return `К${nums[0]}`;
  return `К${nums[0]}–К${nums[nums.length - 1]}`;
}

type TickerProps = {
  events: TickerEvent[];
  todayIso?: string;
};

function Dot() {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
    />
  );
}

export function Ticker({ events, todayIso: today }: TickerProps) {
  const anchor = today ?? new Date().toISOString().slice(0, 10);

  return (
    <div
      className="flex-shrink-0 bg-surface border-t border-border flex items-center overflow-hidden"
      style={{ height: "44px" }}
    >
      {events.length === 0 ? (
        <div className="px-8 text-sm text-muted">
          Ближайших событий на неделе нет
        </div>
      ) : (
        <div className="flex gap-8 whitespace-nowrap px-8 animate-[ticker_90s_linear_infinite]">
          {[...events, ...events].map((e, i) => (
            <span
              key={`${e.key}:${i}`}
              className="inline-flex items-center gap-3 text-sm text-muted"
            >
              <span className="font-semibold text-secondary">
                {relativeDateLabel(e.date, anchor)}:
              </span>
              <span className="text-black">{e.name}</span>
              <Dot />
              <span>{FORMAT_LABEL_RU[e.format]}</span>
              {e.startTime && (
                <>
                  <Dot />
                  <span className="tabular-nums">{e.startTime.slice(0, 5)}</span>
                </>
              )}
              {e.courtNumbers.length > 0 && (
                <>
                  <Dot />
                  <span>{courtsSummary(e.courtNumbers)}</span>
                </>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
