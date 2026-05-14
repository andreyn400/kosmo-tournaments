"use client";

import { Fragment, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/i18n/useTranslation";
import { formatRub, formatShortDateWithWeekday } from "@/lib/i18n/format";
import { ORGANIZER_PAYMENT_TYPE_KEY } from "@/lib/i18n/organizer-keys";
import type { Organizer, OrganizerPayment } from "@/lib/types";
import { PaymentForm } from "./PaymentForm";
import { updatePaymentAction } from "./update-payment-action";
import { deletePaymentAction } from "./delete-payment-action";
import type { RawPaymentInput } from "./payment-input";

interface LedgerRowProps {
  organizer: Organizer;
  payment: OrganizerPayment;
  expanded: boolean;
  onToggle: () => void;
  zebra: boolean;
}

export function LedgerRow({
  organizer,
  payment,
  expanded,
  onToggle,
  zebra,
}: LedgerRowProps) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [pending, startTransition] = useTransition();

  function handleSave(input: RawPaymentInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updatePaymentAction(
          organizer.id,
          payment.id,
          input,
        );
        if (!res.error) {
          onToggle();
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  function handleDelete() {
    if (!confirm(t("organizer.ledger.delete_confirm"))) return;
    startTransition(async () => {
      const res = await deletePaymentAction(organizer.id, payment.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  const isCharge = payment.type === "payment";
  const isDeposit = payment.type === "deposit";
  const sign = isCharge ? "+" : "−";
  const amountCls = isCharge
    ? "text-[var(--color-danger)]"
    : isDeposit
      ? "text-[var(--color-success)]"
      : "text-[var(--color-warning)]";

  const rowBg = expanded
    ? "bg-accent-soft/50"
    : zebra
      ? "bg-subtle/40 hover:bg-subtle"
      : "hover:bg-subtle";

  return (
    <Fragment>
      <tr
        onClick={onToggle}
        aria-expanded={expanded}
        className={`cursor-pointer transition-colors ${rowBg}`}
        style={{ height: "44px" }}
      >
        <td className="pl-4 pr-2 align-middle text-xs tabular-nums whitespace-nowrap text-black">
          {formatShortDateWithWeekday(payment.date, lang)}
        </td>
        <td className="px-2 align-middle">
          <TypePill type={payment.type} />
        </td>
        <td className="px-2 align-middle text-xs text-secondary min-w-0">
          <span className="truncate block max-w-[40ch]" title={payment.notes ?? ""}>
            {payment.notes || <span className="text-fade italic">—</span>}
          </span>
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right">
          {payment.courts_booked ?? "—"}
        </td>
        <td className="px-2 align-middle text-xs text-secondary tabular-nums text-right">
          {payment.hours_booked != null ? payment.hours_booked.toFixed(1) : "—"}
        </td>
        <td
          className={`pl-2 pr-4 align-middle text-sm font-bold tabular-nums text-right whitespace-nowrap ${amountCls}`}
        >
          {sign}
          {formatRub(payment.amount_rub, lang)}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-subtle/30">
          <td colSpan={6} className="p-2 border-y border-border">
            <PaymentForm
              mode="edit"
              payment={payment}
              onCancel={onToggle}
              onSubmit={handleSave}
              onDelete={handleDelete}
              pending={pending}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function TypePill({ type }: { type: OrganizerPayment["type"] }) {
  const { t } = useTranslation();
  const map = {
    payment: {
      bg: "bg-[var(--color-danger-soft)]",
      text: "text-[var(--color-danger)]",
    },
    deposit: {
      bg: "bg-[var(--color-success-soft)]",
      text: "text-[var(--color-success)]",
    },
    refund: {
      bg: "bg-[var(--color-warning-soft)]",
      text: "text-[var(--color-warning)]",
    },
  } as const;
  const cfg = map[type];
  return (
    <span
      className={`inline-flex items-center px-2 h-6 rounded text-[10.5px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}
    >
      {t(ORGANIZER_PAYMENT_TYPE_KEY[type])}
    </span>
  );
}
