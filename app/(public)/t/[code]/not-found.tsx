import { headers } from "next/headers";
import { translate } from "@/lib/i18n";
import { DEFAULT_LANG } from "@/lib/i18n/types";
import { PublicShell } from "../../PublicShell";

export default async function NotFound() {
  const accept = (await headers()).get("accept-language") ?? "";
  const lang = accept.trim().toLowerCase().startsWith("en") ? "en" : DEFAULT_LANG;
  return (
    <PublicShell lang={lang}>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-black">
          {translate(lang, "public.not_found_title")}
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          {translate(lang, "public.not_found_body")}
        </p>
      </div>
    </PublicShell>
  );
}
