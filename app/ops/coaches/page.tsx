import { PageShell } from "@/components/site/PageShell";
import { listCoachesWithMonthlyStats } from "@/lib/queries/coaches";
import { CoachesPanel } from "./CoachesPanel";
import { currentMonthStr } from "./format";

export const dynamic = "force-dynamic";

export default async function OpsCoachesPage() {
  const month = currentMonthStr();
  const coaches = await listCoachesWithMonthlyStats(month);
  return (
    <PageShell title="Тренеры">
      <CoachesPanel coaches={coaches} month={month} />
    </PageShell>
  );
}
