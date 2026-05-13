import { createClient } from "../supabase/server";
import type {
  RentalBlockForGrid,
  RentalContract,
  RentalContractInput,
  RentalContractWithSummary,
  RentalPayment,
  RentalPaymentInput,
  RentalPaymentScheduleEntry,
  RentalPaymentScheduleInput,
  RentalSlot,
  RentalSlotException,
  RentalSlotExceptionInput,
  RentalSlotInput,
} from "../types";

/**
 * List every rental contract with its slots and aggregated balance state.
 * Single batched read: contracts + slots + schedule + payments fetched in
 * parallel, then folded together client-side so the list page doesn't N+1.
 */
export async function listContractsWithSummary(): Promise<
  RentalContractWithSummary[]
> {
  const supabase = await createClient();

  const [contractsRes, slotsRes, scheduleRes, paymentsRes] = await Promise.all([
    supabase
      .from("rental_contracts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("rental_slots")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("rental_payment_schedule")
      .select("contract_id, amount_due_rub, due_date"),
    supabase
      .from("rental_payments")
      .select("contract_id, payment_date, amount_rub, payment_type"),
  ]);
  if (contractsRes.error) throw new Error(contractsRes.error.message);
  if (slotsRes.error) throw new Error(slotsRes.error.message);
  if (scheduleRes.error) throw new Error(scheduleRes.error.message);
  if (paymentsRes.error) throw new Error(paymentsRes.error.message);

  const contracts = (contractsRes.data ?? []) as RentalContract[];
  const slots = (slotsRes.data ?? []) as RentalSlot[];
  const schedule = (scheduleRes.data ?? []) as Array<
    Pick<RentalPaymentScheduleEntry, "contract_id" | "amount_due_rub" | "due_date">
  >;
  const payments = (paymentsRes.data ?? []) as Array<
    Pick<
      RentalPayment,
      "contract_id" | "payment_date" | "amount_rub" | "payment_type"
    >
  >;

  // Group slots per contract.
  const slotsByContract = new Map<string, RentalSlot[]>();
  for (const s of slots) {
    const arr = slotsByContract.get(s.contract_id) ?? [];
    arr.push(s);
    slotsByContract.set(s.contract_id, arr);
  }

  const today = new Date().toISOString().slice(0, 10);

  return contracts.map((c) => {
    let scheduledDueToday = 0;
    for (const e of schedule) {
      if (e.contract_id !== c.id) continue;
      if (e.due_date <= today) scheduledDueToday += e.amount_due_rub;
    }

    let netReceived = 0;
    let penalties = 0;
    let lastPaymentDate: string | null = null;
    for (const p of payments) {
      if (p.contract_id !== c.id) continue;
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

    const overdue = Math.max(0, scheduledDueToday + penalties - netReceived);
    const ahead = Math.max(0, netReceived - scheduledDueToday - penalties);
    const remainingOutstanding =
      c.total_value_rub + penalties - netReceived;

    return {
      ...c,
      slots: slotsByContract.get(c.id) ?? [],
      net_received_rub: netReceived,
      penalties_total_rub: penalties,
      scheduled_due_today_rub: scheduledDueToday,
      overdue_rub: overdue,
      ahead_rub: ahead,
      remaining_outstanding_rub: remainingOutstanding,
      last_payment_date: lastPaymentDate,
    };
  });
}

export async function getContract(id: string): Promise<RentalContract | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as RentalContract | null) ?? null;
}

export async function listSlotsForContract(
  contractId: string,
): Promise<RentalSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_slots")
    .select("*")
    .eq("contract_id", contractId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RentalSlot[];
}

export async function listPaymentsForContract(
  contractId: string,
): Promise<RentalPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_payments")
    .select("*")
    .eq("contract_id", contractId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RentalPayment[];
}

export async function listScheduleForContract(
  contractId: string,
): Promise<RentalPaymentScheduleEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_payment_schedule")
    .select("*")
    .eq("contract_id", contractId)
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RentalPaymentScheduleEntry[];
}

/** All exceptions for every slot in a contract, in one batched query. */
export async function listExceptionsForContract(
  contractId: string,
): Promise<RentalSlotException[]> {
  const supabase = await createClient();
  const slotsRes = await supabase
    .from("rental_slots")
    .select("id")
    .eq("contract_id", contractId);
  if (slotsRes.error) throw new Error(slotsRes.error.message);
  const slotIds = (slotsRes.data ?? []).map((s) => (s as { id: string }).id);
  if (slotIds.length === 0) return [];

  const { data, error } = await supabase
    .from("rental_slot_exceptions")
    .select("*")
    .in("slot_id", slotIds)
    .order("from_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RentalSlotException[];
}

// ── Write operations ────────────────────────────────────────────────────

export async function createContract(
  input: RentalContractInput,
): Promise<RentalContract> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_contracts")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RentalContract;
}

export async function updateContract(
  id: string,
  input: RentalContractInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_contracts")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteContract(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_contracts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createSlot(input: RentalSlotInput): Promise<RentalSlot> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_slots")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RentalSlot;
}

export async function updateSlot(
  id: string,
  input: RentalSlotInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_slots")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSlot(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_slots")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createException(
  input: RentalSlotExceptionInput,
): Promise<RentalSlotException> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_slot_exceptions")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RentalSlotException;
}

export async function deleteException(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_slot_exceptions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createScheduleEntry(
  input: RentalPaymentScheduleInput,
): Promise<RentalPaymentScheduleEntry> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_payment_schedule")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RentalPaymentScheduleEntry;
}

export async function updateScheduleEntry(
  id: string,
  input: RentalPaymentScheduleInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_payment_schedule")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteScheduleEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_payment_schedule")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Wipe and regenerate the schedule for a contract from a fresh entry list. */
export async function replaceSchedule(
  contractId: string,
  entries: Omit<RentalPaymentScheduleInput, "contract_id">[],
): Promise<void> {
  const supabase = await createClient();
  const del = await supabase
    .from("rental_payment_schedule")
    .delete()
    .eq("contract_id", contractId);
  if (del.error) throw new Error(del.error.message);
  if (entries.length === 0) return;
  const rows = entries.map((e) => ({ ...e, contract_id: contractId }));
  const ins = await supabase.from("rental_payment_schedule").insert(rows);
  if (ins.error) throw new Error(ins.error.message);
}

export async function createPayment(
  input: RentalPaymentInput,
): Promise<RentalPayment> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_payments")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RentalPayment;
}

export async function updatePayment(
  id: string,
  input: RentalPaymentInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_payments")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePayment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rental_payments")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

interface ContractStub {
  id: string;
  client_name: string;
  contract_number: string | null;
  start_date: string;
  end_date: string;
}

interface SlotStub {
  id: string;
  contract_id: string;
  court_ids: string[];
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes: string | null;
}

interface ExceptionStub {
  slot_id: string;
  from_date: string;
  to_date: string;
}

/**
 * Expand active rental contracts × slots × exceptions into one
 * `RentalBlockForGrid` per concrete date instance falling within
 * [fromIso, toIsoInclusive]. Never materialises future weeks — walks the
 * requested range only.
 *
 *  - contract.status must be `'active'`
 *  - the contract date range must overlap the requested range
 *  - the instance date must fall within the contract's own dates
 *  - no slot exception (pause or cancellation) may cover the instance date
 *
 * Internal day-of-week convention: 0 = Mon … 6 = Sun. JavaScript's
 * `Date.getDay()` returns 0 = Sun … 6 = Sat, so we convert with
 * `(getDay() + 6) % 7`.
 */
export async function listRentalBlocksForRange(
  fromIso: string,
  toIsoInclusive: string,
): Promise<RentalBlockForGrid[]> {
  const supabase = await createClient();

  const contractsRes = await supabase
    .from("rental_contracts")
    .select("id, client_name, contract_number, start_date, end_date")
    .eq("status", "active")
    .lte("start_date", toIsoInclusive)
    .gte("end_date", fromIso);
  if (contractsRes.error) throw new Error(contractsRes.error.message);
  const contracts = (contractsRes.data ?? []) as ContractStub[];
  if (contracts.length === 0) return [];

  const contractIds = contracts.map((c) => c.id);

  const slotsRes = await supabase
    .from("rental_slots")
    .select("id, contract_id, court_ids, day_of_week, start_time, end_time, notes")
    .in("contract_id", contractIds);
  if (slotsRes.error) throw new Error(slotsRes.error.message);
  const slots = (slotsRes.data ?? []) as SlotStub[];
  if (slots.length === 0) return [];

  const slotIds = slots.map((s) => s.id);
  const exceptionsRes = await supabase
    .from("rental_slot_exceptions")
    .select("slot_id, from_date, to_date")
    .in("slot_id", slotIds)
    .lte("from_date", toIsoInclusive)
    .gte("to_date", fromIso);
  if (exceptionsRes.error) throw new Error(exceptionsRes.error.message);
  const exceptions = (exceptionsRes.data ?? []) as ExceptionStub[];

  const contractById = new Map(contracts.map((c) => [c.id, c]));
  const exceptionsBySlot = new Map<string, ExceptionStub[]>();
  for (const e of exceptions) {
    const arr = exceptionsBySlot.get(e.slot_id) ?? [];
    arr.push(e);
    exceptionsBySlot.set(e.slot_id, arr);
  }

  const blocks: RentalBlockForGrid[] = [];
  const fromDate = new Date(fromIso + "T00:00:00");
  const toDate = new Date(toIsoInclusive + "T00:00:00");

  for (
    let d = new Date(fromDate.getTime());
    d <= toDate;
    d.setDate(d.getDate() + 1)
  ) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const dow = (d.getDay() + 6) % 7;

    for (const slot of slots) {
      if (slot.day_of_week !== dow) continue;
      const contract = contractById.get(slot.contract_id);
      if (!contract) continue;
      if (iso < contract.start_date || iso > contract.end_date) continue;

      const slotExceptions = exceptionsBySlot.get(slot.id) ?? [];
      const covered = slotExceptions.some(
        (e) => iso >= e.from_date && iso <= e.to_date,
      );
      if (covered) continue;

      blocks.push({
        id: `rental-${slot.id}-${iso}`,
        contract_id: contract.id,
        slot_id: slot.id,
        client_name: contract.client_name,
        contract_number: contract.contract_number,
        date: iso,
        start_time: slot.start_time,
        end_time: slot.end_time,
        court_ids: slot.court_ids,
        slot_notes: slot.notes,
      });
    }
  }

  return blocks;
}
