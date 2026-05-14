import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/site/PageShell";
import { getServerDict } from "@/lib/i18n/server";

export default async function AnalyticsPage() {
  const dict = await getServerDict();
  return (
    <PageShell title={dict["analytics.title"]}>
      <div className="max-w-2xl">
        <Card className="flex flex-col items-center text-center gap-3 py-14">
          <div className="h-14 w-14 rounded-full bg-subtle border border-border flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-xl font-semibold text-black">
            {dict["analytics.coming_soon_title"]}
          </h2>
          <p className="text-sm text-muted max-w-sm">
            {dict["analytics.coming_soon_copy"]}
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
