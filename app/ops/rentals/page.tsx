import { PageShell } from "@/components/site/PageShell";
import { listContractsWithSummary } from "@/lib/queries/rentals";
import { listActiveCourts } from "@/lib/queries/courts";
import { st } from "@/lib/i18n/server";
import { RentalsPanel } from "./RentalsPanel";

export const dynamic = "force-dynamic";

export default async function OpsRentalsPage() {
  const [contracts, courts, title] = await Promise.all([
    listContractsWithSummary(),
    listActiveCourts(),
    st("rentals.title"),
  ]);
  return (
    <PageShell title={title}>
      <RentalsPanel contracts={contracts} courts={courts} />
    </PageShell>
  );
}
