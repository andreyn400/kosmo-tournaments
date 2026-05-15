"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";

type Props = {
  shortCode: string;
  tournamentName: string;
};

const COPIED_RESET_MS = 2000;

function resolveBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function SharePanel({ shortCode, tournamentName }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const base = resolveBaseUrl();
    return `${base}/t/${shortCode}`;
  }, [shortCode]);

  const message = t("share.message_template", { name: tournamentName, url });

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      /* clipboard blocked — silently ignore */
    }
  }

  if (!open) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black">
              {t("share.title")}
            </p>
            <p className="text-xs text-muted">{t("share.subtitle")}</p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setOpen(true)}
          >
            {t("share.title")}
          </Button>
        </div>
      </div>
    );
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(
    url,
  )}&text=${encodeURIComponent(tournamentName)}`;
  const qrAlt = t("share.qr_alt", { name: tournamentName });

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black">{t("share.title")}</p>
          <p className="text-xs text-muted">{t("share.subtitle")}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          aria-label={t("share.close")}
        >
          {t("share.close")}
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="shrink-0 self-center rounded-md border border-border bg-white p-2"
          aria-label={qrAlt}
          title={qrAlt}
        >
          <QRCodeSVG value={url} size={148} bgColor="#ffffff" fgColor="#000000" />
        </div>

        <div className="flex w-full flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 flex-1 rounded-[var(--radius-button)] border border-border bg-[var(--bg-page)] px-3 text-sm text-black font-mono focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <Button
              variant={copied ? "secondary" : "primary"}
              size="md"
              onClick={onCopy}
            >
              {copied ? t("share.copied") : t("share.copy_link")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-[var(--radius-button)] border border-border bg-surface px-3 text-sm font-medium text-secondary hover:bg-subtle hover:border-border-strong"
            >
              {t("share.whatsapp")}
            </a>
            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-[var(--radius-button)] border border-border bg-surface px-3 text-sm font-medium text-secondary hover:bg-subtle hover:border-border-strong"
            >
              {t("share.telegram")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
