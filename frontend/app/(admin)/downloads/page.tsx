"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Download, FileDown, Archive, BarChart3 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function DownloadsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/downloads/stats");
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (error) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    { label: "Total de Downloads", value: stats?.total_downloads, icon: Download, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Downloads Individuais", value: stats?.single_downloads, icon: FileDown, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Downloads ZIP", value: stats?.zip_downloads, icon: Archive, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const maxCount = stats?.downloads_by_day?.[0]?.count || 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Downloads</h1>
        <p className="text-muted-foreground mt-1">Estatísticas e logs de downloads</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold tracking-tight">{value ?? "--"}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="w-5 h-5 text-muted-foreground" />Downloads por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-6 w-full" />))}</div>
          ) : stats?.downloads_by_day?.length ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.downloads_by_day.map((d: any, i: number) => (
                <div key={d.day || i} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{d.day}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min((d.count / maxCount) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={BarChart3} title="Nenhum download registrado" description="Os dados de download aparecerão aqui conforme os visitantes baixarem suas fotos." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
