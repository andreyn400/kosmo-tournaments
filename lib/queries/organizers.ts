import { createClient } from "../supabase/server";
import type {
  Organizer,
  OrganizerInput,
  OrganizerPayment,
  OrganizerPaymentInput,
  OrganizerWithBalance,
} from "../types";

export async function listOrganizers(): Promise<Organizer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizers")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Organizer[];
}

export async function getOrganizer(id: string): Promise<Organizer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Organizer | null) ?? null;
}

export async function createOrganizer(
  input: OrganizerInput,
): Promise<Organizer> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizers")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Organizer;
}

export async function updateOrganizer(
  id: string,
  input: OrganizerInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizers")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteOrganizer(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("organizers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listPaymentsForOrganizer(
  organizerId: string,
): Promise<OrganizerPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizer_payments")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrganizerPayment[];
}

export async function createPayment(
  input: OrganizerPaymentInput,
): Promise<OrganizerPayment> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizer_payments")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as OrganizerPayment;
}

export async function updatePayment(
  id: string,
  input: OrganizerPaymentInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizer_payments")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePayment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizer_payments")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

interface PaymentAggRow {
  organizer_id: string;
  date: string;
  amount_rub: number;
  type: "payment" | "deposit" | "refund";
}

/**
 * Single batched query: fetch all organizers plus all ledger entries, then
 * fold balances client-side. Avoids N+1 and lets SQL stay simple.
 *
 * Balance = SUM(payment) − SUM(deposit) − SUM(refund). Positive = organizer
 * owes the club.
 */
export async function listOrganizersWithBalance(): Promise<
  OrganizerWithBalance[]
> {
  const supabase = await createClient();

  const orgRes = await supabase
    .from("organizers")
    .select("*")
    .order("name", { ascending: true });
  if (orgRes.error) throw new Error(orgRes.error.message);
  const organizers = (orgRes.data ?? []) as Organizer[];

  const payRes = await supabase
    .from("organizer_payments")
    .select("organizer_id, date, amount_rub, type");
  if (payRes.error) throw new Error(payRes.error.message);

  const aggByOrg = new Map<
    string,
    {
      charges: number;
      deposits: number;
      refunds: number;
      entries: number;
      lastDate: string | null;
    }
  >();

  for (const row of (payRes.data ?? []) as PaymentAggRow[]) {
    const cur = aggByOrg.get(row.organizer_id) ?? {
      charges: 0,
      deposits: 0,
      refunds: 0,
      entries: 0,
      lastDate: null,
    };
    if (row.type === "payment") cur.charges += row.amount_rub;
    else if (row.type === "deposit") cur.deposits += row.amount_rub;
    else if (row.type === "refund") cur.refunds += row.amount_rub;
    cur.entries += 1;
    if (cur.lastDate === null || row.date > cur.lastDate) {
      cur.lastDate = row.date;
    }
    aggByOrg.set(row.organizer_id, cur);
  }

  return organizers.map((o) => {
    const a = aggByOrg.get(o.id);
    const charges = a?.charges ?? 0;
    const deposits = a?.deposits ?? 0;
    const refunds = a?.refunds ?? 0;
    return {
      ...o,
      balance_rub: charges - deposits - refunds,
      charges_total: charges,
      deposits_total: deposits,
      refunds_total: refunds,
      entries_count: a?.entries ?? 0,
      last_activity: a?.lastDate ?? null,
    };
  });
}
