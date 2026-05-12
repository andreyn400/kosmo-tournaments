"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Organizer } from "@/lib/types";
import { OrganizerForm } from "../OrganizerForm";
import { updateOrganizerAction } from "../update-organizer-action";
import { deleteOrganizerAction } from "../delete-organizer-action";
import type { RawOrganizerInput } from "../organizer-input";

export function OrganizerProfileCard({ organizer }: { organizer: Organizer }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave(input: RawOrganizerInput): Promise<{ error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await updateOrganizerAction(organizer.id, input);
        if (!res.error) {
          setEditing(false);
          router.refresh();
        }
        resolve(res);
      });
    });
  }

  function handleDelete() {
    const msg = `Удалить организатора «${organizer.name}»? Все записи ленты будут также удалены.`;
    if (!confirm(msg)) return;
    startTransition(async () => {
      const res = await deleteOrganizerAction(organizer.id);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.push("/ops/organizers");
    });
  }

  if (editing) {
    return (
      <OrganizerForm
        mode="edit"
        organizer={organizer}
        onCancel={() => setEditing(false)}
        onSubmit={handleSave}
        onDelete={handleDelete}
        pending={pending}
      />
    );
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-black">{organizer.name}</h1>
          {organizer.contact_name && (
            <p className="text-sm text-secondary mt-0.5">
              {organizer.contact_name}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditing(true)}
        >
          Изменить
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <Field label="Телефон" value={organizer.phone} />
        <Field label="Email" value={organizer.email} />
      </div>

      {organizer.notes && (
        <div className="mt-4">
          <Label>Заметки</Label>
          <p className="text-sm text-secondary whitespace-pre-wrap">
            {organizer.notes}
          </p>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label>{label}</Label>
      <span className="text-sm text-black">
        {value || <span className="text-fade">—</span>}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}
