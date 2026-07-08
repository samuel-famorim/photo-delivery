"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Users, Image, Download, HardDrive, Camera, BarChart3, Key, Copy, Check } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventToken, setEventToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/dashboard/stats");
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function generateEventToken() {
    setTokenLoading(true);
    try {
      const data: any = await apiFetch("/auth/event-token", { method: "POST" });
      setEventToken(data.access_token);
    } catch (err: any) {
      alert(err.message || "Erro ao gerar token");
    } finally {
      setTokenLoading(false);
    }
  }

  async function copyToken() {
    if (!eventToken) return;
    await navigator.clipboard.writeText(eventToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => { load(); }, []);

  const metricCards = [
    { label: "Sessões", value: stats?.total_sessions, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Fotos", value: stats?.total_photos, icon: Image, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Downloads", value: stats?.total_downloads, icon: Download, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Armazenamento", value: stats ? formatBytes(stats.total_size_bytes) : null, icon: HardDrive, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", bg)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              {loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <p className="text-3xl font-bold tracking-tight">{value ?? "--"}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="w-5 h-5" />
            Token do Fotógrafo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gere um token valido por 12h para o uploader do fotografo. Cole no arquivo .env do PC do fotografo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventToken ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-3 rounded-lg text-xs break-all font-mono">{eventToken}</code>
                <Button size="icon" variant="outline" onClick={copyToken} title="Copiar token">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Valido por 12 horas. Guarde em local seguro — nao sera exibido novamente.
              </p>
            </div>
          ) : (
            <Button onClick={generateEventToken} disabled={tokenLoading}>
              {tokenLoading ? "Gerando..." : "Gerar Token do Evento"}
            </Button>
          )}
        </CardContent>
      </Card>

      {stats?.active_event && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg shadow-purple-500/20">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Evento Ativo em Destaque</p>
              <p className="text-xl font-bold">{stats.active_event.name}</p>
              <p className="text-xs opacity-60">{stats.active_event.slug}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {stats?.sessions_per_day?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              Sessões por Dia (últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32" role="img" aria-label="Gráfico de sessões por dia">
              {stats.sessions_per_day.map((day: any, i: number) => {
                const max = Math.max(...stats.sessions_per_day.map((d: any) => d.count), 1);
                const height = (day.count / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </span>
                    <div
                      className="w-full rounded-t-sm bg-primary/60 hover:bg-primary transition-colors"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.day}: ${day.count} sessões`}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {stats?.top_sessions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Sessões com Mais Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_sessions.map((s: any, i: number) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                      i === 0 ? "bg-yellow-500 text-white" :
                      i === 1 ? "bg-gray-400 text-white" :
                      i === 2 ? "bg-orange-600 text-white" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{s.visitor_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{s.code}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{s.download_count} downloads</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "--";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
