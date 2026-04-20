import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/site/PageShell";

export default function AnalyticsPage() {
  return (
    <PageShell title="Аналитика">
      <div className="max-w-2xl">
        <Card className="flex flex-col items-center text-center gap-3 py-14">
          <div className="h-14 w-14 rounded-full bg-subtle border border-border flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-xl font-semibold text-black">Скоро</h2>
          <p className="text-sm text-muted max-w-sm">
            Сводная аналитика по клубу появится в следующей фазе: активность,
            турниры по месяцам, рейтинги, участие.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
