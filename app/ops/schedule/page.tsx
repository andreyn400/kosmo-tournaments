import { PageShell } from "@/components/site/PageShell";

export default function OpsSchedulePage() {
  return (
    <PageShell title="Расписание">
      <Placeholder />
    </PageShell>
  );
}

function Placeholder() {
  return (
    <div className="rounded-card border border-border bg-surface p-8 text-center">
      <p className="text-sm text-muted">
        Недельная сетка кортов появится в 10.5.
      </p>
    </div>
  );
}
