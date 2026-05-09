import { Card, CardContent } from "@/components/ui/card";

interface Stat {
  label: string;
  value: number | string;
}

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
