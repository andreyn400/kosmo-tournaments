"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translate } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n/types";

type ConnectionState = "connecting" | "live" | "reconnecting" | "disconnected";

type Props = {
  matchIds: string[];
  roundIds: string[];
  lang: Lang;
  children: React.ReactNode;
};

const REFRESH_DEBOUNCE_MS = 500;

export function LiveRefreshWrapper({
  matchIds,
  roundIds,
  lang,
  children,
}: Props) {
  const router = useRouter();
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    if (matchIds.length === 0 && roundIds.length === 0) return;
    const matchSet = new Set(matchIds);
    const roundSet = new Set(roundIds);
    const supabase = createClient();

    function triggerRefresh() {
      const now = Date.now();
      if (now - lastRefreshAt.current < REFRESH_DEBOUNCE_MS) return;
      lastRefreshAt.current = now;
      router.refresh();
    }

    const channel = supabase
      .channel(`public-tournament:${matchIds[0] ?? roundIds[0] ?? "x"}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const id = (payload.new as { id?: string }).id;
          if (id && matchSet.has(id)) triggerRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rounds" },
        (payload) => {
          const id = (payload.new as { id?: string }).id;
          if (id && roundSet.has(id)) triggerRefresh();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setConnection("reconnecting");
        else if (status === "CLOSED") setConnection("disconnected");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchIds, roundIds, router]);

  const dotColor =
    connection === "live"
      ? "bg-success"
      : connection === "reconnecting" || connection === "connecting"
        ? "bg-warning"
        : "bg-muted";
  const label =
    connection === "live"
      ? translate(lang, "public.connection.live")
      : connection === "disconnected"
        ? translate(lang, "public.connection.disconnected")
        : translate(lang, "public.connection.reconnecting");

  return (
    <>
      <div className="flex items-center justify-end gap-2 text-xs text-secondary">
        <span
          aria-hidden
          className={`inline-block h-2 w-2 rounded-full ${dotColor}`}
        />
        <span>{label}</span>
      </div>
      {children}
    </>
  );
}
