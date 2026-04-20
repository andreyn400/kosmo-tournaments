"use server";

import { revalidatePath } from "next/cache";
import { createPlayer } from "@/lib/queries/players";
import { PADEL_LEVELS } from "@/lib/constants";
import type { PadelLevel } from "@/lib/types";

export async function createPlayerAction(input: {
  name: string;
  level: string;
  phone: string;
}): Promise<{ error?: string }> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (!name) return { error: "Введите имя игрока" };
  if (!(PADEL_LEVELS as string[]).includes(input.level))
    return { error: "Неизвестный уровень" };

  try {
    await createPlayer({
      name,
      level: input.level as PadelLevel,
      phone: phone || null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { error: `Не удалось создать игрока: ${msg}` };
  }

  revalidatePath("/players");
  return {};
}
