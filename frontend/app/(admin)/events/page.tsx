"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Plus, Pencil, Trash2, Palette, Settings, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { ThemeSection } from "@/components/admin/ThemeSection";
import { ThemePreview } from "@/components/admin/ThemePreview";
import { DEFAULT_THEME } from "@/lib/theme";
import { apiFetch, extractErrorMessage } from "@/lib/api-client";
import type { ThemeConfig } from "@/types";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", slug: "", event_date: "", primary_color: "#3B82F6", custom_text: "", is_active: true,
  });
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [dialogTab, setDialogTab] = useState("info");
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; event: any }>({ open: false, event: null });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any>("/events?limit=100");
      setEvents(data.items || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (themeConfig?.colors?.primary) {
      setForm((prev) => ({ ...prev, primary_color: themeConfig.colors.primary }));
    }
  }, [themeConfig.colors.primary]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", slug: "", event_date: "", primary_color: DEFAULT_THEME.colors.primary, custom_text: "", is_active: true });
    setThemeConfig(DEFAULT_THEME);
    setDialogTab("info");
    setDialogOpen(true);
  }

  function openEdit(event: any) {
    setEditing(event);
    const theme = event.theme_config || DEFAULT_THEME;
    setForm({
      name: event.name, slug: event.slug, event_date: event.event_date || "",
      primary_color: theme.colors?.primary || event.primary_color || "#3B82F6",
      custom_text: event.custom_text || "",
      is_active: event.is_active,
    });
    setThemeConfig(theme);
    setDialogTab("info");
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const url = editing ? `/events/${editing.id}` : "/events";
    const method = editing ? "PUT" : "POST";
    const syncedForm = { ...form, primary_color: themeConfig.colors.primary };
    const body = { ...syncedForm, theme_config: themeConfig };
    try {
      await apiFetch(url, { method, body: JSON.stringify(body) });
      toast.success(editing ? "Evento atualizado!" : "Evento criado!");
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(event: any) {
    setDeleteDialog({ open: true, event });
  }

  async function handleDelete() {
    const event = deleteDialog.event;
    if (!event) return;
    try {
      await apiFetch(`/events/${event.id}`, { method: "DELETE" });
      toast.success("Evento excluído!");
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteDialog({ open: false, event: null });
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eventos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os eventos e seus temas visuais</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Novo Evento</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum evento ainda"
              description="Crie seu primeiro evento para começar a capturar fotos."
              action={{ label: "Criar Evento", onClick: openCreate }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Sessões</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.slug}</TableCell>
                    <TableCell>{e.event_date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: e.primary_color || "#3B82F6" }} />
                        {e.theme_config?.mode === "preset" ? (
                          <span className="text-xs text-muted-foreground">{e.theme_config?.preset || "padrão"}</span>
                        ) : e.theme_config?.mode === "custom" ? (
                          <Palette className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <span className="text-xs text-muted-foreground">padrão</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{e.session_count}</TableCell>
                    <TableCell>
                      <Badge variant={e.is_active ? "default" : "secondary"}>
                        {e.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(e)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[92vh] overflow-y-auto p-8 sm:p-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl">{editing ? "Editar" : "Novo"} Evento</DialogTitle>
          </DialogHeader>

          <Tabs value={dialogTab} onValueChange={setDialogTab} className="w-full">
            <TabsList className="w-full h-14 p-2 gap-2 mb-10">
              <TabsTrigger value="info" className="flex-1 h-full text-sm font-medium"><Settings className="w-4 h-4 mr-2" />Informações do Evento</TabsTrigger>
              <TabsTrigger value="theme" className="flex-1 h-full text-sm font-medium"><Palette className="w-4 h-4 mr-2" />Aparência & Tema</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-8">
              <div className="bg-muted/40 rounded-2xl p-8 space-y-6">
                <div>
                  <h4 className="font-semibold text-base mb-1">Dados Básicos</h4>
                  <p className="text-sm text-muted-foreground">Informações principais do evento.</p>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nome do Evento</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} placeholder="Ex: Bonanza Fly In 2026" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Slug (identificador único)</Label>
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="bonanza-fly-in-2026" className="h-12" />
                    <p className="text-xs text-muted-foreground">Usado na URL do evento. Apenas letras minúsculas, números e hífens.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data do Evento</Label>
                      <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cor Principal</Label>
                      <div className="flex items-center gap-4">
                        <Input type="color" value={form.primary_color} className="w-16 h-12 p-1 rounded-xl cursor-pointer border-2" onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
                        <span className="text-sm text-muted-foreground font-mono">{form.primary_color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-muted/40 rounded-2xl p-8 space-y-4">
                <div>
                  <h4 className="font-semibold text-base mb-1">Texto Personalizado</h4>
                  <p className="text-sm text-muted-foreground">Mensagem exibida no rodapé da página pública do visitante.</p>
                </div>
                <textarea className="w-full min-h-[120px] rounded-xl border px-4 py-3.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y" value={form.custom_text} onChange={(e) => setForm({ ...form, custom_text: e.target.value })} placeholder="Ex: Obrigado por visitar nosso estande! Esperamos que tenha gostado das fotos." />
              </div>
            </TabsContent>

            <TabsContent value="theme" className="space-y-8">
              <ThemeSection value={themeConfig} onChange={setThemeConfig} eventId={editing?.id} />
              <div className="border-t pt-8">
                <h4 className="font-semibold text-sm mb-4">Preview do Tema</h4>
                <ThemePreview key={`${themeConfig.mode}-${themeConfig.preset || "custom"}-${themeConfig.colors.primary}`} theme={themeConfig} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 pt-8 mt-6 border-t">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="lg" className="h-12 px-8 text-base" onClick={handleSave} disabled={saving || !form.name || !form.slug}>
              {saving ? "Salvando..." : "Salvar Evento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, event: open ? deleteDialog.event : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Evento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{deleteDialog.event?.name}</strong>? Esta ação não pode ser desfeita. Todas as sessões e fotos deste evento serão removidas.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, event: null })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir Evento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
