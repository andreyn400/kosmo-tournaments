import { PageShell } from "@/components/site/PageShell";
import { listCourts } from "@/lib/queries/courts";
import { CourtsPanel } from "./CourtsPanel";

export default async function CourtsPage() {
  const courts = await listCourts();
  return (
    <PageShell title="Корты">
      <CourtsPanel courts={courts} />
    </PageShell>
  );
}
