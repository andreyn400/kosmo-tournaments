"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type {
  Court,
  RentalClientType,
  RentalContractStatus,
  RentalPaymentScheduleType,
} from "@/lib/types";
import { generateSchedule } from "@/lib/rental-schedule-gen";
import { StepIndicator } from "./StepIndicator";
import { Step1Client } from "./Step1Client";
import { Step2Contract } from "./Step2Contract";
import { Step3Slots } from "./Step3Slots";
import { Step4Schedule } from "./Step4Schedule";
import { createContractWithBundleAction } from "./create-contract-action";

interface WizardShellProps {
  courts: Court[];
}

export interface WizardSlot {
  _id: string;
  court_ids: string[];
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes: string;
}

export interface WizardScheduleEntry {
  _id: string;
  period_label: string;
  amount_due_rub: string;
  due_date: string;
  notes: string;
}

export interface WizardState {
  // Step 1 — client
  client_name: string;
  client_type: RentalClientType;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  legal_entity_name: string;
  inn: string;
  // Step 2 — contract
  contract_number: string;
  start_date: string;
  end_date: string;
  total_value_rub: string;
  deposit_rub: string;
  payment_schedule_type: RentalPaymentScheduleType;
  document_url: string;
  status: RentalContractStatus;
  notes: string;
  internal_notes: string;
  // Step 3 — slots
  slots: WizardSlot[];
  // Step 4 — schedule
  schedule: WizardScheduleEntry[];
  // Internal: which (start_date, end_date, total, type) the schedule was
  // last auto-generated from. Used to detect when terms changed and prompt
  // a regenerate.
  scheduleStamp: string | null;
}

const STEPS = [
  { key: 1, label: "Клиент" },
  { key: 2, label: "Условия" },
  { key: 3, label: "Слоты" },
  { key: 4, label: "График" },
];

function nextLocalId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function todayIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function yearFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function makeInitial(): WizardState {
  return {
    client_name: "",
    client_type: "legal_entity",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    legal_entity_name: "",
    inn: "",
    contract_number: "",
    start_date: todayIsoLocal(),
    end_date: yearFromNow(),
    total_value_rub: "",
    deposit_rub: "0",
    payment_schedule_type: "monthly",
    document_url: "",
    status: "draft",
    notes: "",
    internal_notes: "",
    slots: [],
    schedule: [],
    scheduleStamp: null,
  };
}

function termsStamp(s: WizardState): string {
  return `${s.start_date}|${s.end_date}|${s.total_value_rub}|${s.payment_schedule_type}`;
}

export function WizardShell({ courts }: WizardShellProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(makeInitial);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
    setStepError(null);
  }, []);

  // Auto-generate the schedule from current terms when entering step 4 if
  // the operator hasn't yet (or if terms changed since the last generation).
  // Implemented as a step-transition side-effect — NOT a useEffect — so
  // setState only runs in response to user input, not on every re-render.
  const ensureScheduleForStep4 = useCallback(() => {
    setState((s) => {
      const stamp = termsStamp(s);
      if (s.scheduleStamp === stamp) return s;
      const total = Number.parseInt(s.total_value_rub, 10) || 0;
      const generated = generateSchedule({
        start_date: s.start_date,
        end_date: s.end_date,
        total_value_rub: total,
        payment_schedule_type: s.payment_schedule_type,
      });
      return {
        ...s,
        scheduleStamp: stamp,
        schedule: generated.map((g) => ({
          _id: nextLocalId(),
          period_label: g.period_label,
          amount_due_rub: String(g.amount_due_rub),
          due_date: g.due_date,
          notes: g.notes ?? "",
        })),
      };
    });
  }, []);

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!state.client_name.trim()) return "Введите название клиента";
      const email = state.contact_email.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Неверный формат email";
      }
      const inn = state.inn.trim();
      if (inn && !/^\d{10}$|^\d{12}$/.test(inn)) {
        return "ИНН: 10 цифр (юрлицо) или 12 (ИП)";
      }
      return null;
    }
    if (n === 2) {
      if (!state.start_date || !state.end_date) {
        return "Укажите даты начала и окончания";
      }
      if (state.end_date < state.start_date) {
        return "Дата окончания должна быть не раньше начала";
      }
      const total = Number.parseInt(state.total_value_rub, 10);
      if (!Number.isFinite(total) || total < 0) {
        return "Стоимость: целое число ≥ 0";
      }
      return null;
    }
    if (n === 3) {
      // Slots optional — operator can add later.
      return null;
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    if (step === 3) ensureScheduleForStep4();
    setStep((n) => Math.min(4, n + 1));
  }

  function goBack() {
    setStepError(null);
    setStep((n) => Math.max(1, n - 1));
  }

  function regenerateSchedule() {
    const total = Number.parseInt(state.total_value_rub, 10) || 0;
    const generated = generateSchedule({
      start_date: state.start_date,
      end_date: state.end_date,
      total_value_rub: total,
      payment_schedule_type: state.payment_schedule_type,
    });
    setState((s) => ({
      ...s,
      scheduleStamp: termsStamp(s),
      schedule: generated.map((g) => ({
        _id: nextLocalId(),
        period_label: g.period_label,
        amount_due_rub: String(g.amount_due_rub),
        due_date: g.due_date,
        notes: g.notes ?? "",
      })),
    }));
  }

  function handleSubmit() {
    // Final cross-step validation already happened on Next clicks; the form
    // can still fail server-side, so capture that error inline.
    setSubmitError(null);
    startTransition(async () => {
      const res = await createContractWithBundleAction({
        contract: {
          client_name: state.client_name,
          client_type: state.client_type,
          contact_person: state.contact_person,
          contact_phone: state.contact_phone,
          contact_email: state.contact_email,
          legal_entity_name: state.legal_entity_name,
          inn: state.inn,
          contract_number: state.contract_number,
          start_date: state.start_date,
          end_date: state.end_date,
          total_value_rub: state.total_value_rub || "0",
          deposit_rub: state.deposit_rub || "0",
          payment_schedule_type: state.payment_schedule_type,
          document_url: state.document_url,
          status: state.status,
          notes: state.notes,
          internal_notes: state.internal_notes,
        },
        slots: state.slots.map((s) => ({
          court_ids: s.court_ids,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          notes: s.notes,
        })),
        schedule: state.schedule.map((e) => ({
          period_label: e.period_label,
          amount_due_rub: e.amount_due_rub,
          due_date: e.due_date,
          notes: e.notes,
        })),
      });
      if (res.error) {
        setSubmitError(res.error);
        return;
      }
      router.push(`/ops/rentals/${res.id}`);
    });
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <Link
          href="/ops/rentals"
          className="hover:text-black transition-colors inline-flex items-center gap-1"
        >
          <BackArrow />
          Аренда
        </Link>
        <span className="text-fade">/</span>
        <span className="text-secondary">Новый контракт</span>
      </div>

      <div className="rounded-card border border-border bg-surface px-5 py-4">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <div className="rounded-card border border-border bg-surface p-6">
        {step === 1 && <Step1Client state={state} update={update} />}
        {step === 2 && <Step2Contract state={state} update={update} />}
        {step === 3 && (
          <Step3Slots state={state} setState={setState} courts={courts} />
        )}
        {step === 4 && (
          <Step4Schedule
            state={state}
            setState={setState}
            onRegenerate={regenerateSchedule}
          />
        )}

        {stepError && (
          <p className="text-[12px] text-[var(--color-danger)] bg-[var(--color-danger-soft)] rounded px-2 py-1.5 mt-4">
            {stepError}
          </p>
        )}
        {submitError && step === 4 && (
          <p className="text-[12px] text-[var(--color-danger)] bg-[var(--color-danger-soft)] rounded px-2 py-1.5 mt-4">
            {submitError}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Link href="/ops/rentals">
          <Button type="button" variant="ghost" size="sm" disabled={pending}>
            Отменить
          </Button>
        </Link>
        {step > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={goBack}
            disabled={pending}
          >
            Назад
          </Button>
        )}
        {step < 4 && (
          <Button type="button" size="sm" onClick={goNext} disabled={pending}>
            Далее
          </Button>
        )}
        {step === 4 && (
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={pending}
          >
            {pending ? "Создание…" : "Создать контракт"}
          </Button>
        )}
      </div>
    </div>
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
