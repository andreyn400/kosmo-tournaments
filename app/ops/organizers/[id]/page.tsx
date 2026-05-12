import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import {
  getOrganizer,
  listPaymentsForOrganizer,
} from "@/lib/queries/organizers";
import { OrganizerProfileCard } from "./OrganizerProfileCard";
import { BalanceStrip } from "./BalanceStrip";
import { LedgerPanel } from "./LedgerPanel";

export const dynamic = "force-dynamic";

export default async function OrganizerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const organizer = await getOrganizer(id);
  if (!organizer) notFound();

  const payments = await listPaymentsForOrganizer(id);

  const charges = payments
    .filter((p) => p.type === "payment")
    .reduce((acc, p) => acc + p.amount_rub, 0);
  const deposits = payments
    .filter((p) => p.type === "deposit")
    .reduce((acc, p) => acc + p.amount_rub, 0);
  const refunds = payments
    .filter((p) => p.type === "refund")
    .reduce((acc, p) => acc + p.amount_rub, 0);
  const balance = charges - deposits - refunds;

  return (
    <PageShell title={organizer.name}>
      <div className="flex flex-col gap-5">
        <OrganizerProfileCard organizer={organizer} />
        <BalanceStrip
          balance={balance}
          charges={charges}
          deposits={deposits}
          refunds={refunds}
          entryCount={payments.length}
        />
        <LedgerPanel organizer={organizer} payments={payments} />
      </div>
    </PageShell>
  );
}
