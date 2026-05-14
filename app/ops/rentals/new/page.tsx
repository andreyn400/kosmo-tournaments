import { PageShell } from "@/components/site/PageShell";
import { listActiveCourts } from "@/lib/queries/courts";
import { st } from "@/lib/i18n/server";
import { WizardShell } from "./WizardShell";

export const dynamic = "force-dynamic";

export default async function NewRentalContractPage() {
  const [courts, title] = await Promise.all([
    listActiveCourts(),
    st("rentals.wizard.title_new"),
  ]);
  return (
    <PageShell title={title}>
      <WizardShell courts={courts} />
    </PageShell>
  );
}
