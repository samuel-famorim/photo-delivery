"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Search, Trash2, QrCode, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { apiFetch, extractErrorMessage } from "@/lib/api-client";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [qrModal, setQrModal] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; session: any }>({ open: false, session: null });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) qs.set("search", search);
      const data = await apiFetch<any>(`/sessions?${qs}`);
      setSessions(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar sessões");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  function confirmDelete(session: any) {
    setDeleteDialog({ open: true, session });
  }

  async function handleDelete() {
    const s = deleteDialog.session;
    if (!s) return;
    try {
      await apiFetch(`/sessions/${s.id}`, { method: "DELETE" });
      toast.success("Sessão excluída!");
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteDialog({ open: false, session: null });
    }
  }

  const totalPages = Math.ceil(total / 20);

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sessões</h1>
          <p className="text-muted-foreground mt-1">Gerencie as sessões de captura</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome do visitante..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())} />
        </div>
        <Button onClick={() => { setPage(1); load(); }}>Buscar</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />))}
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState icon={Users} title="Nenhuma sessão encontrada" description={search ? "Tente outro termo de busca." : "As sessões aparecerão aqui após serem criadas pelo operador."} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead><TableHead>Visitante</TableHead><TableHead>Empresa</TableHead><TableHead>Fotos</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-bold">{s.code}</TableCell>
                    <TableCell className="font-medium">{s.visitor_name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.visitor_company || "—"}</TableCell>
                    <TableCell>{s.photo_count}</TableCell>
                    <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status === "active" ? "Ativa" : "Finalizada"}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setQrModal(s)} title="QR Code"><QrCode className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(s)} title="Excluir"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      )}

      <Dialog open={!!qrModal} onOpenChange={() => setQrModal(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader><DialogTitle>QR Code — {qrModal?.visitor_name}</DialogTitle></DialogHeader>
          <div className="flex justify-center py-4">
            {qrModal && <QRCodeSVG value={`${window.location.origin}/s/${qrModal.code}`} size={256} level="H" />}
          </div>
          <p className="text-sm text-muted-foreground font-mono">Código: {qrModal?.code}</p>
          <p className="text-xs text-muted-foreground">{window.location.origin}/s/{qrModal?.code}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, session: open ? deleteDialog.session : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir Sessão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir a sessão <strong>{deleteDialog.session?.code}</strong> de <strong>{deleteDialog.session?.visitor_name}</strong>? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, session: null })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir Sessão</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
