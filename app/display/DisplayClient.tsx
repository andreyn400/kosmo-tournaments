"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DisplayEvent, TickerEvent } from "@/lib/queries/display";
import { TopBar } from "./TopBar";
import { EventGrid } from "./EventGrid";
import { Ticker } from "./Ticker";

type DisplayClientProps = {
  events: DisplayEvent[];
  ticker: TickerEvent[];
  todayIso: string;
};

export function DisplayClient({ events, ticker, todayIso }: DisplayClientProps) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, 30_000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="fixed inset-0 flex flex-col bg-page text-black overflow-hidden">
      <TopBar todayIso={todayIso} />
      <main className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
        <EventGrid events={events} />
      </main>
      <Ticker events={ticker} todayIso={todayIso} />
    </div>
  );
}
