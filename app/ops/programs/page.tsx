import { PageShell } from "@/components/site/PageShell";
import { listPrograms } from "@/lib/queries/programs";
import { ProgramsPanel } from "./ProgramsPanel";

export const dynamic = "force-dynamic";

export default async function OpsProgramsPage() {
  const programs = await listPrograms();
  return (
    <PageShell title="Программы">
      <ProgramsPanel programs={programs} />
    </PageShell>
  );
}
