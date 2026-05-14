import { PageShell } from "@/components/site/PageShell";
import { listCourts } from "@/lib/queries/courts";
import { st } from "@/lib/i18n/server";
import { CourtsPanel } from "./CourtsPanel";

export default async function CourtsPage() {
  const [courts, title] = await Promise.all([
    listCourts(),
    st("courts.title"),
  ]);
  return (
    <PageShell title={title}>
      <CourtsPanel courts={courts} />
    </PageShell>
  );
}
