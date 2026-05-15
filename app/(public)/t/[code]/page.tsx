import { notFound } from "next/navigation";
import { resolvePublicLang } from "@/lib/i18n/public";
import {
  getPublicTournamentView,
  getTournamentByShortCode,
} from "@/lib/queries/public";
import { PublicShell } from "../../PublicShell";
import { UpcomingState } from "./UpcomingState";
import { LiveState } from "./LiveState";
import { CompletedState } from "./CompletedState";

type Params = Promise<{ code: string }>;
type SearchParams = Promise<{ lang?: string | string[] }>;

export default async function PublicTournamentPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const tournament = await getTournamentByShortCode(code);
  if (!tournament) notFound();

  const lang = await resolvePublicLang(sp.lang);
  const view = await getPublicTournamentView(tournament);

  return (
    <PublicShell lang={lang}>
      {tournament.status === "completed" ? (
        <CompletedState view={view} lang={lang} />
      ) : tournament.status === "in_progress" ? (
        <LiveState view={view} lang={lang} />
      ) : (
        <UpcomingState view={view} lang={lang} />
      )}
    </PublicShell>
  );
}
