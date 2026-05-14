"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";

export function ShareButton() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled share, ignore
    }
  };

  return (
    <Button variant="secondary" size="md" onClick={share}>
      {copied ? t("results.share_copied") : t("results.share_cta")}
    </Button>
  );
}
