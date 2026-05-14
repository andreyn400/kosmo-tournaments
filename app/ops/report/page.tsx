import { PageShell } from "@/components/site/PageShell";
import {
  isValidIsoDate,
  startOfWeekMon,
  todayIso,
} from "@/lib/calendar-range";
import { getWeeklyReport } from "@/lib/queries/report";
import { st } from "@/lib/i18n/server";
import { CoachPayoutsTable } from "./CoachPayoutsTable";
import { CourtUtilizationCard } from "./CourtUtilizationCard";
import { ReportWeekHeader } from "./ReportWeekHeader";
import { RevenueSummaryCard } from "./RevenueSummaryCard";
import { SessionsBreakdownByDay } from "./SessionsBreakdownByDay";
import { TopProgramsCard } from "./TopProgramsCard";

export default async function OpsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const requested =
    params.week && isValidIsoDate(params.week) ? params.week : null;
  const weekStart = startOfWeekMon(requested ?? todayIso());
  const [report, title] = await Promise.all([
    getWeeklyReport(weekStart),
    st("report.title"),
  ]);

  return (
    <PageShell title={title}>
      <div className="flex flex-col gap-5">
        <ReportWeekHeader
          weekStartIso={report.weekStartIso}
          weekEndIso={report.weekEndIso}
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RevenueSummaryCard revenue={report.revenue} />
          </div>
          <div className="lg:col-span-2">
            <CourtUtilizationCard utilization={report.courtUtilization} />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <CoachPayoutsTable payouts={report.coachPayouts} />
          <TopProgramsCard programs={report.topPrograms} />
        </div>
        <SessionsBreakdownByDay sessionsByDay={report.sessionsByDay} />
      </div>
    </PageShell>
  );
}
