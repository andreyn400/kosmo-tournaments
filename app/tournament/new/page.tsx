import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/site/PageShell";
import { listActiveCourts } from "@/lib/queries/courts";
import { CreateTournamentForm } from "./CreateTournamentForm";

export default async function NewTournamentPage() {
  const courts = await listActiveCourts();

  return (
    <PageShell
      title="Новый турнир"
      action={
        <Link href="/">
          <Button variant="secondary" size="md">
            Назад
          </Button>
        </Link>
      }
    >
      <div className="max-w-2xl">
        {courts.length === 0 ? (
          <Card className="flex flex-col items-center text-center gap-4 py-12">
            <div className="h-14 w-14 rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center">
              <span className="h-3 w-3 rounded-sm bg-accent" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-semibold text-black">
                Сначала добавьте корты
              </h2>
              <p className="text-muted text-sm max-w-sm">
                Турнир не может быть создан без активных кортов. Добавьте хотя
                бы один корт на странице «Корты».
              </p>
            </div>
            <Link href="/courts">
              <Button>Перейти к кортам</Button>
            </Link>
          </Card>
        ) : (
          <CreateTournamentForm courts={courts} />
        )}
      </div>
    </PageShell>
  );
}
