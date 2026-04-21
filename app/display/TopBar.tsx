"use client";

import { useEffect, useState } from "react";

const WEEKDAYS_RU = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const MONTHS_GENITIVE_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = WEEKDAYS_RU[new Date(y, m - 1, d).getDay()];
  return `${weekday}, ${d} ${MONTHS_GENITIVE_RU[m - 1]} ${y}`;
}

function formatClock(now: Date): string {
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

type TopBarProps = {
  todayIso: string;
};

export function TopBar({ todayIso }: TopBarProps) {
  const [clock, setClock] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="grid grid-cols-3 items-center px-8 bg-surface border-b border-border flex-shrink-0"
      style={{ height: "120px", boxShadow: "var(--shadow-md)" }}
    >
      <div aria-hidden />

      <div className="flex justify-center">
        <span className="text-[5rem] font-bold leading-none tabular-nums text-black select-none">
          {clock}
        </span>
      </div>

      <div className="flex justify-end">
        <span className="text-[1.1rem] font-medium text-secondary">
          {formatLongDate(todayIso)}
        </span>
      </div>
    </header>
  );
}
