"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Download, Trash2, ChevronLeft, ChevronRight, X, Image } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, getDownloadUrl, extractErrorMessage } from "@/lib/api-client";

export default function PhotosPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionFilter, setSessionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lightbox, setLightbox] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; photo: any }>({ open: false, photo: null });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "24" });
      if (sessionFilter !== "all") qs.set("session_id", sessionFilter);
      const data = await apiFetch<any>(`/photos?${qs}`);
      setPhotos(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar fotos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, sessionFilter]);

  useEffect(() => {
    apiFetch<any>("/sessions?limit=200").then((d) => setSessions(d.items || [])).catch(() => {});
  }, []);

  function confirmDelete(photo: any) {
    setDeleteDialog({ open: true, photo });
  }

  async function handleDelete() {
    const photo = deleteDialog.photo;
    if (!photo) return;
    try {
      await apiFetch(`/photos/${photo.id}`, { method: "DELETE" });
      toast.success("Foto excluída!");
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteDialog({ open: false, photo: null });
    }
  }

  const idx = lightbox ? photos.findIndex((p) => p.id === lightbox.id) : -1;

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fotos</h1>
          <p className="text-muted-foreground mt-1">Visualize e gerencie as fotos capturadas</p>
        </div>
        <Select value={sessionFilter} onValueChange={(v) => { if (v) { setSessionFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="Filtrar por sessão" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as sessões</SelectItem>
            {sessions.map((s) => (<SelectItem key={s.id} value={s.id}>{s.visitor_name} ({s.code})</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (<Card key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState icon={Image} title="Nenhuma foto encontrada" description={sessionFilter !== "all" ? "Esta sessão ainda não tem fotos." : "As fotos aparecerão aqui após a captura."} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] border-0" onClick={() => setLightbox(photo)}>
              <div className="aspect-square bg-muted relative">
                <img src={getDownloadUrl(`/api/v1/photos/${photo.id}/download`)} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23f3f4f6' width='100' height='100'/></svg>"; }} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <a href={getDownloadUrl(`/api/v1/photos/${photo.id}/download`)} target="_blank" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="secondary" className="h-8 w-8"><Download className="w-3 h-3" /></Button>
                    </a>
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); confirmDelete(photo); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {total > 24 && (
        <div className="flex justify-center items-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {Math.ceil(total / 24)}</span>
          <Button variant="outline" size="sm" disabled={page * 24 >= total} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0">
          <div className="relative flex items-center justify-center min-h-[70vh]">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setLightbox(null)}><X className="w-5 h-5" /></Button>
            {idx > 0 && (<Button variant="ghost" size="icon" className="absolute left-4 text-white/80 hover:text-white z-10" onClick={() => setLightbox(photos[idx - 1])}><ChevronLeft className="w-8 h-8" /></Button>)}
            {lightbox && (<img src={getDownloadUrl(`/api/v1/photos/${lightbox.id}/download`)} alt="" className="max-h-[80vh] object-contain rounded" />)}
            {idx < photos.length - 1 && (<Button variant="ghost" size="icon" className="absolute right-4 text-white/80 hover:text-white z-10" onClick={() => setLightbox(photos[idx + 1])}><ChevronRight className="w-8 h-8" /></Button>)}
            {lightbox && (<div className="absolute bottom-4 left-4 text-white/50 text-xs">{lightbox.width}x{lightbox.height} · {(lightbox.file_size / 1024).toFixed(1)} KB</div>)}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, photo: open ? deleteDialog.photo : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogContent className="sm:max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Excluir Foto</h2>
            <p className="text-sm text-muted-foreground mb-6">Tem certeza que deseja excluir esta foto permanentemente?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, photo: null })}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Excluir Foto</Button>
            </div>
          </DialogContent>
        </DialogContent>
      </Dialog>
    </div>
  );
}
