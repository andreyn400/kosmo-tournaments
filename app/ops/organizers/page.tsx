import { PageShell } from "@/components/site/PageShell";
import { listOrganizersWithBalance } from "@/lib/queries/organizers";
import { OrganizersPanel } from "./OrganizersPanel";

export const dynamic = "force-dynamic";

export default async function OpsOrganizersPage() {
  const organizers = await listOrganizersWithBalance();
  return (
    <PageShell title="Организаторы">
      <OrganizersPanel organizers={organizers} />
    </PageShell>
  );
}
