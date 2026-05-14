"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n/useTranslation";

type LogoProps = {
  onNavigate?: () => void;
};

export function Logo({ onNavigate }: LogoProps) {
  const { t } = useTranslation();
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-2.5"
      aria-label={t("logo.aria_home")}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white font-bold text-sm">
        {t("brand.icon_letter")}
      </span>
      <span className="text-[13px] font-bold tracking-[0.14em] text-black leading-none">
        KOSMO
      </span>
    </Link>
  );
}
