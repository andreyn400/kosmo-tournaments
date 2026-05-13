import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import {
  getContract,
  listExceptionsForContract,
  listPaymentsForContract,
  listScheduleForContract,
  listSlotsForContract,
} from "@/lib/queries/rentals";
import { listCourts } from "@/lib/queries/courts";
import { ContractDetailShell } from "./ContractDetailShell";

export const dynamic = "force-dynamic";

export default async function RentalContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contract = await getContract(id);
  if (!contract) notFound();

  const [slots, exceptions, schedule, payments, courts] = await Promise.all([
    listSlotsForContract(id),
    listExceptionsForContract(id),
    listScheduleForContract(id),
    listPaymentsForContract(id),
    listCourts(),
  ]);

  return (
    <PageShell title={contract.client_name}>
      <ContractDetailShell
        contract={contract}
        slots={slots}
        exceptions={exceptions}
        schedule={schedule}
        payments={payments}
        courts={courts}
      />
    </PageShell>
  );
}
