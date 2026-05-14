import { PageShell } from "@/components/site/PageShell";
import { listPrograms } from "@/lib/queries/programs";
import { st } from "@/lib/i18n/server";
import { ProgramsPanel } from "./ProgramsPanel";

export const dynamic = "force-dynamic";

export default async function OpsProgramsPage() {
  const [programs, title] = await Promise.all([
    listPrograms(),
    st("programs.title"),
  ]);
  return (
    <PageShell title={title}>
      <ProgramsPanel programs={programs} />
    </PageShell>
  );
}
