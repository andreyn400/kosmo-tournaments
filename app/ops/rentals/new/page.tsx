import { PageShell } from "@/components/site/PageShell";
import { listActiveCourts } from "@/lib/queries/courts";
import { WizardShell } from "./WizardShell";

export const dynamic = "force-dynamic";

export default async function NewRentalContractPage() {
  const courts = await listActiveCourts();
  return (
    <PageShell title="Новый контракт">
      <WizardShell courts={courts} />
    </PageShell>
  );
}
