import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/site/PageShell";
import { listActiveCourts } from "@/lib/queries/courts";
import { getServerDict } from "@/lib/i18n/server";
import { CreateLeagueForm } from "./CreateLeagueForm";

export default async function NewLeaguePage() {
  const [courts, dict] = await Promise.all([
    listActiveCourts(),
    getServerDict(),
  ]);

  return (
    <PageShell
      title={dict["league.new.title"]}
      action={
        <Link href="/">
          <Button variant="secondary" size="md">
            {dict["btn.cancel"]}
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl">
        {courts.length === 0 ? (
          <Card className="flex flex-col items-center text-center gap-4 py-12">
            <div className="h-14 w-14 rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center">
              <span className="h-3 w-3 rounded-sm bg-accent" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-semibold text-black">
                {dict["league.new.no_courts_title"]}
              </h2>
              <p className="text-muted text-sm max-w-sm">
                {dict["league.new.no_courts_copy"]}
              </p>
            </div>
            <Link href="/courts">
              <Button>{dict["league.new.go_to_courts"]}</Button>
            </Link>
          </Card>
        ) : (
          <CreateLeagueForm courts={courts} />
        )}
      </div>
    </PageShell>
  );
}
