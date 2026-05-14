import { PageShell } from "@/components/site/PageShell";
import { listCoachesWithMonthlyStats } from "@/lib/queries/coaches";
import { st } from "@/lib/i18n/server";
import { CoachesPanel } from "./CoachesPanel";
import { currentMonthStr } from "./format";

export const dynamic = "force-dynamic";

export default async function OpsCoachesPage() {
  const month = currentMonthStr();
  const [coaches, title] = await Promise.all([
    listCoachesWithMonthlyStats(month),
    st("coaches.title"),
  ]);
  return (
    <PageShell title={title}>
      <CoachesPanel coaches={coaches} month={month} />
    </PageShell>
  );
}
