import { PageShell } from "@/components/site/PageShell";
import { listOrganizersWithBalance } from "@/lib/queries/organizers";
import { st } from "@/lib/i18n/server";
import { OrganizersPanel } from "./OrganizersPanel";

export const dynamic = "force-dynamic";

export default async function OpsOrganizersPage() {
  const [organizers, title] = await Promise.all([
    listOrganizersWithBalance(),
    st("organizers.title"),
  ]);
  return (
    <PageShell title={title}>
      <OrganizersPanel organizers={organizers} />
    </PageShell>
  );
}
