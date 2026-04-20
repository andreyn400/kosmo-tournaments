"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { openRegistrationAction } from "./open-registration-action";

export function OpenRegistrationButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const open = () => {
    startTransition(async () => {
      await openRegistrationAction(tournamentId);
      router.refresh();
    });
  };

  return (
    <Button size="lg" disabled={pending} onClick={open}>
      {pending ? "Открытие…" : "Открыть регистрацию"}
    </Button>
  );
}
