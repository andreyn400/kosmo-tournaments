import { PageShell } from "@/components/site/PageShell";
import { listContractsWithSummary } from "@/lib/queries/rentals";
import { listActiveCourts } from "@/lib/queries/courts";
import { RentalsPanel } from "./RentalsPanel";

export const dynamic = "force-dynamic";

export default async function OpsRentalsPage() {
  const [contracts, courts] = await Promise.all([
    listContractsWithSummary(),
    listActiveCourts(),
  ]);
  return (
    <PageShell title="Аренда">
      <RentalsPanel contracts={contracts} courts={courts} />
    </PageShell>
  );
}
