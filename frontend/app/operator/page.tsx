"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, User, Clock, Image, ArrowLeft, CheckCircle, MonitorPlay } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { apiFetch, API_BASE_URL, extractErrorMessage } from "@/lib/api-client";
import { resolveTheme, applyTheme } from "@/lib/theme";
import { toast } from "sonner";

type Step = "event" | "visitor" | "active" | "qrcode";

export default function OperatorPage() {
  const [step, setStep] = useState<Step>("event");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorCompany, setVisitorCompany] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    apiFetch<any>("/events?limit=100")
      .then((d) => setEvents(d.items?.filter((e: any) => e.is_active) || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step === "active") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      const poll = setInterval(async () => {
        if (activeSession) {
          try {
            await apiFetch("/photos/process-incoming", { method: "POST" });
            const d = await apiFetch<any>(`/photos?session_id=${activeSession.id}&limit=50`);
            setPhotos(d.items || []);
          } catch {}
        }
      }, 3000);
      return () => { clearInterval(timerRef.current); clearInterval(poll); };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
  }, [step, activeSession]);

  useEffect(() => {
    if (selectedEvent?.theme_config) {
      applyTheme(resolveTheme(selectedEvent.theme_config));
    }
  }, [selectedEvent]);

  async function handleStartSession() {
    if (!selectedEvent || !visitorName.trim()) return;
    setLoading(true);
    try {
      const session = await apiFetch("/sessions", {
        method: "POST",
        body: JSON.stringify({
          event_id: selectedEvent.id,
          visitor_name: visitorName.trim(),
          visitor_company: visitorCompany.trim() || undefined,
          visitor_email: visitorEmail.trim() || undefined,
        }),
      });
      setActiveSession(session);
      setStep("active");
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function processNow() {
    if (!activeSession) return;
    try {
      const result = await apiFetch<any>("/photos/process-incoming", { method: "POST" });
      const d = await apiFetch<any>(`/photos?session_id=${activeSession.id}&limit=50`);
      setPhotos(d.items || []);
      alert(`Processadas: ${result.processed || 0} fotos`);
    } catch (err: any) {
      alert("Erro: " + extractErrorMessage(err));
    }
  }

  async function handleFinishSession() {
    if (!activeSession) return;
    try {
      await apiFetch(`/sessions/${activeSession.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "completed" }),
      });
      setStep("qrcode");
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    } finally {
      setFinishDialogOpen(false);
    }
  }

  function handleNewSession() {
    setVisitorName(""); setVisitorCompany(""); setVisitorEmail("");
    setActiveSession(null); setPhotos([]);
    setStep("visitor");
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const theme = selectedEvent?.theme_config ? resolveTheme(selectedEvent.theme_config) : null;
  const primaryColor = theme?.colors.primary || selectedEvent?.primary_color || "#3B82F6";
  const accentColor = theme?.colors.accent || "#6366F1";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">PhotoDelivery</h1>
              <p className="text-sm text-gray-400">Painel do Operador</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(["event", "visitor", "active", "qrcode"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full transition-all" style={{ backgroundColor: step === s ? primaryColor : ["event", "visitor", "active", "qrcode"].indexOf(step) > i ? `${primaryColor}60` : "rgba(255,255,255,0.15)" }} />
                {i < 3 && <div className="w-4 h-px bg-white/10" />}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Select Event */}
        {step === "event" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Selecionar Evento</h2>
            <p className="text-gray-400">Escolha o evento para iniciar a captura</p>
            {events.map((event) => (
              <Card key={event.id} className={`cursor-pointer border-2 transition-all bg-gray-900 hover:bg-gray-900/80 ${selectedEvent?.id === event.id ? "border-blue-500 shadow-lg shadow-blue-500/10" : "border-gray-800"}`} onClick={() => setSelectedEvent(event)}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.primary_color }} />
                  <div className="flex-1"><p className="font-medium text-lg">{event.name}</p><p className="text-sm text-gray-400">{event.event_date}</p></div>
                  {selectedEvent?.id === event.id && <CheckCircle className="w-5 h-5" style={{ color: primaryColor }} />}
                </CardContent>
              </Card>
            ))}
            {events.length === 0 && <p className="text-gray-500 text-center py-8">Nenhum evento ativo encontrado</p>}
            <Button size="lg" className="w-full h-14 text-lg font-bold" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} disabled={!selectedEvent} onClick={() => setStep("visitor")}>Continuar</Button>
          </div>
        )}

        {/* STEP 2: Visitor Data */}
        {step === "visitor" && (
          <div className="space-y-6">
            <Button variant="ghost" className="text-gray-400" onClick={() => setStep("event")}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
            <h2 className="text-2xl font-bold">Dados do Visitante</h2>
            <p className="text-gray-400">Evento: <span style={{ color: primaryColor }}>{selectedEvent?.name}</span></p>
            <div className="space-y-2"><Label className="text-gray-300">Nome *</Label><Input className="bg-gray-900 border-gray-700 text-white text-lg h-14 focus:border-blue-500" placeholder="Nome do visitante" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} autoFocus /></div>
            <div className="space-y-2"><Label className="text-gray-300">Empresa</Label><Input className="bg-gray-900 border-gray-700 text-white h-12" placeholder="Empresa (opcional)" value={visitorCompany} onChange={(e) => setVisitorCompany(e.target.value)} /></div>
            <div className="space-y-2"><Label className="text-gray-300">Email</Label><Input className="bg-gray-900 border-gray-700 text-white h-12" placeholder="Email (opcional)" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} /></div>
            <Button size="lg" className="w-full h-14 text-lg font-bold" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} disabled={!visitorName.trim() || loading} onClick={handleStartSession}>{loading ? "Iniciando..." : "Iniciar Sessão"}</Button>
          </div>
        )}

        {/* STEP 3: Active Session */}
        {step === "active" && activeSession && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 mb-2"><span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" /> Capturando</span>
                <h2 className="text-2xl font-bold">{activeSession.visitor_name}</h2>
                <p className="text-gray-400">{activeSession.visitor_company}</p>
              </div>
              <div className="text-right"><p className="text-sm text-gray-400">Código</p><p className="text-2xl font-mono font-bold tracking-wider">{activeSession.code}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-gray-900 border-gray-800"><CardContent className="p-4 text-center"><Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" /><p className="text-2xl font-mono font-bold">{formatTime(elapsed)}</p><p className="text-xs text-gray-500">Duração</p></CardContent></Card>
              <Card className="bg-gray-900 border-gray-800"><CardContent className="p-4 text-center"><Image className="w-5 h-5 text-blue-400 mx-auto mb-1" /><p className="text-2xl font-bold">{photos.length}</p><p className="text-xs text-gray-500">Fotos</p></CardContent></Card>
              <Card className="bg-gray-900 border-gray-800"><CardContent className="p-4 text-center"><User className="w-5 h-5 text-purple-400 mx-auto mb-1" /><p className="text-2xl font-bold font-mono">{activeSession.code}</p><p className="text-xs text-gray-500">Sessão</p></CardContent></Card>
            </div>
            {photos.length > 0 && (
              <div><p className="text-sm text-gray-400 mb-2">Últimas fotos</p><div className="grid grid-cols-4 gap-2">{photos.slice(-4).reverse().map((p: any) => (<div key={p.id} className="aspect-square bg-gray-800 rounded-lg overflow-hidden"><img src={`${API_BASE_URL}/api/v1/photos/${p.id}/download`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /></div>))}</div></div>
            )}
            <Button size="lg" className="w-full h-12 text-lg font-bold mb-2" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} onClick={processNow}>Processar Fotos Agora</Button>
            <p className="text-center text-xs text-gray-500 mb-3">Exporte os JPGs do Lightroom para a pasta _incoming e clique aqui</p>
            <Button size="lg" variant="outline" className="w-full h-14 text-lg font-bold border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => setFinishDialogOpen(true)}>Finalizar Sessão</Button>
          </div>
        )}

        {/* STEP 4: QR Code */}
        {step === "qrcode" && activeSession && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold">Sessão Finalizada!</h2>
            <p className="text-gray-400">Apresente o QR Code para {activeSession.visitor_name}</p>
            <Card className="bg-white p-8 inline-block mx-auto"><QRCodeSVG value={`${window.location.origin}/s/${activeSession.code}`} size={300} level="H" /></Card>
            <div><p className="text-lg font-medium">{activeSession.visitor_name}</p><p className="text-3xl font-mono font-bold tracking-widest mt-1">{activeSession.code}</p><p className="text-sm text-gray-400 mt-1">{window.location.origin}/s/{activeSession.code}</p><p className="text-sm text-gray-400">{photos.length} fotos</p></div>
            <div className="flex gap-3">
              <Button size="lg" className="flex-1 h-14 text-lg font-bold" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} onClick={handleNewSession}>Nova Sessão</Button>
              <a href={`/tv/${activeSession.code}`} target="_blank" className="flex items-center justify-center gap-2 px-4 h-14 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"><MonitorPlay className="w-5 h-5" /><span className="text-sm">TV</span></a>
            </div>
          </div>
        )}

        {/* Finish confirmation dialog */}
        <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Finalizar Sessão</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Tem certeza que deseja finalizar a sessão de <strong>{activeSession?.visitor_name}</strong>?</p>
            {activeSession && (<p className="text-xs text-muted-foreground">{photos.length} fotos capturadas · Duração: {formatTime(elapsed)}</p>)}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleFinishSession}>Finalizar Sessão</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
