import { createClient } from "../supabase/server";
import type { Program, ProgramInput } from "../types";

export async function listPrograms(): Promise<Program[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Program[];
}

export async function listActivePrograms(): Promise<Program[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("is_active", true)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Program[];
}

export async function getProgram(id: string): Promise<Program | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Program | null) ?? null;
}

export async function createProgram(input: ProgramInput): Promise<Program> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Program;
}

export async function updateProgram(
  id: string,
  input: ProgramInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("programs").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProgram(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function bulkInsertPrograms(
  rows: ProgramInput[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .insert(rows)
    .select("id");
  if (error) throw new Error(error.message);
  return (data ?? []).length;
}

export async function countPrograms(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("programs")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}
