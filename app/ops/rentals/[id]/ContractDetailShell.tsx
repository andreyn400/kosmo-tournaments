"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/useTranslation";
import { RENTAL_STATUS_KEY } from "@/lib/i18n/rental-keys";
import type {
  Court,
  RentalContract,
  RentalContractStatus,
  RentalPayment,
  RentalPaymentScheduleEntry,
  RentalSlot,
  RentalSlotException,
} from "@/lib/types";
import { HeroBalanceCard } from "./HeroBalanceCard";
import { ClientInfoCard } from "./ClientInfoCard";
import { ContractTermsCard } from "./ContractTermsCard";
import { ContractEditForm } from "./ContractEditForm";
import { SlotsPanel } from "./SlotsPanel";
import { SchedulePanel } from "./SchedulePanel";
import { LedgerPanel } from "./LedgerPanel";
import {
  deleteContractAction,
  updateContractAction,
} from "./contract-actions";
import type { RawContractInput } from "./contract-input";

interface ContractDetailShellProps {
  contract: RentalContract;
  slots: RentalSlot[];
  exceptions: RentalSlotException[];
  schedule: RentalPaymentScheduleEntry[];
  payments: RentalPayment[];
  courts: Court[];
}

export function ContractDetailShell({
  contract,
  slots,
  exceptions,
  schedule,
  payments,
  courts,
}: ContractDetailShellProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const aggregates = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let scheduledDueToday = 0;
    for (const e of schedule) {
      if (e.due_date <= today) scheduledDueToday += e.amount_due_rub;
    }
    let netReceived = 0;
    let penalties = 0;
    let lastPaymentDate: string | null = null;
    for (const p of payments) {
      if (p.payment_type === "payment" || p.payment_type === "deposit") {
        netReceived += p.amount_rub;
      } else if (p.payment_type === "refund") {
        netReceived -= p.amount_rub;
      } else if (p.payment_type === "penalty") {
        penalties += p.amount_rub;
      }
      if (lastPaymentDate === null || p.payment_date > lastPaymentDate) {
        lastPaymentDate = p.payment_date;
      }
    }
    return { scheduledDueToday, netReceived, penalties, lastPaymentDate };
  }, [schedule, payments]);

  function handleSave(raw: RawContractInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateContractAction(contract.id, raw);
        if (!res.error) {
          setEditing(false);
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  async function handleDelete() {
    const ok = confirm(
      t("contract.delete_confirm", { name: contract.client_name }),
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteContractAction(contract.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.push("/ops/rentals");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/ops/rentals"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-black transition-colors"
        >
          <BackArrow />
          {t("contract.breadcrumb_rentals")}
        </Link>
        <span className="text-fade">/</span>
        <span className="text-xs text-secondary truncate">
          {contract.client_name}
        </span>
        <StatusBadge status={contract.status} />
        <div className="ml-auto">
          {!editing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
            >
              {t("contract.edit_cta")}
            </Button>
          )}
        </div>
      </div>

      <HeroBalanceCard
        totalValueRub={contract.total_value_rub}
        netReceivedRub={aggregates.netReceived}
        penaltiesRub={aggregates.penalties}
        scheduledDueTodayRub={aggregates.scheduledDueToday}
        lastPaymentDate={aggregates.lastPaymentDate}
      />

      {editing ? (
        <ContractEditForm
          contract={contract}
          onCancel={() => setEditing(false)}
          onSubmit={handleSave}
          onDelete={handleDelete}
          pending={pending}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <ClientInfoCard contract={contract} />
          <ContractTermsCard contract={contract} />
        </div>
      )}

      <SlotsPanel
        contractId={contract.id}
        slots={slots}
        exceptions={exceptions}
        courts={courts}
      />

      <SchedulePanel
        contractId={contract.id}
        schedule={schedule}
        payments={payments}
      />

      <LedgerPanel
        contractId={contract.id}
        payments={payments}
        schedule={schedule}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: RentalContractStatus }) {
  const { t } = useTranslation();
  const map: Record<
    RentalContractStatus,
    { bg: string; text: string }
  > = {
    draft: { bg: "bg-subtle", text: "text-muted" },
    active: {
      bg: "bg-[var(--color-success-soft)]",
      text: "text-[var(--color-success)]",
    },
    paused: {
      bg: "bg-[var(--color-warning-soft)]",
      text: "text-[var(--color-warning)]",
    },
    ended: { bg: "bg-subtle", text: "text-secondary" },
    cancelled: {
      bg: "bg-[var(--color-danger-soft)]",
      text: "text-[var(--color-danger)]",
    },
  };
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 h-6 rounded text-[10.5px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
    >
      {t(RENTAL_STATUS_KEY[status])}
    </span>
  );
}

function BackArrow() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
