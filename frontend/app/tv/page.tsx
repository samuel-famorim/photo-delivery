"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { resolveTheme, applyTheme, buildGradientCSS } from "@/lib/theme";
import type { ThemeConfig } from "@/types";
import { Camera, MonitorPlay, ChevronRight, Play, Pause } from "lucide-react";
import { apiFetch, API_BASE_URL, resolveLogoUrl } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

interface TvEvent {
  id: string; name: string; slug: string; event_date: string; primary_color: string; theme_config?: ThemeConfig | null;
}

interface PhotoItem {
  id: string; download_url: string; visitor_name: string; session_code: string; created_at: string;
}

export default function TvPage() {
  const router = useRouter();
  const [events, setEvents] = useState<TvEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TvEvent | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [mode, setMode] = useState<"select" | "live">("select");
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [interval, setIntervalSecs] = useState(4);
  const [showUi, setShowUi] = useState(true);
  const timerRef = useRef<number | null>(null);
  const hideUiRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<any>("/events?limit=100").then((d) => setEvents(d.items?.filter((e: any) => e.is_active) || [])).catch(() => {});
  }, []);

  const loadPhotos = useCallback(async (slug: string) => {
    try {
      const data = await apiFetch<any>(`/public/event/${slug}/photos`);
      setPhotos(data.photos || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (mode !== "live" || !selectedEvent) return;
    const poll = window.setInterval(() => loadPhotos(selectedEvent.slug), 5000);
    return () => window.clearInterval(poll);
  }, [mode, selectedEvent, loadPhotos]);

  // Slideshow
  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (!isPlaying || photos.length === 0) return;
    const id = window.setInterval(() => { setCurrent((prev) => (prev + 1) % photos.length); }, interval * 1000);
    timerRef.current = id;
    return () => { window.clearInterval(id); };
  }, [isPlaying, interval, photos.length]);

  // Auto-scroll gallery
  useEffect(() => {
    if (!galleryRef.current || photos.length === 0) return;
    const thumbEl = galleryRef.current.children[current % photos.length] as HTMLElement;
    if (thumbEl) thumbEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [current, photos.length]);

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (photos.length === 0 || mode !== "live") return;
      switch (e.key) {
        case "ArrowUp": case "ArrowLeft": setCurrent((c) => (c - 1 + photos.length) % photos.length); setIsPlaying(false); break;
        case "ArrowDown": case "ArrowRight": setCurrent((c) => (c + 1) % photos.length); setIsPlaying(false); break;
        case " ": e.preventDefault(); setIsPlaying((p) => !p); break;
        case "1": setIntervalSecs(1); break; case "2": setIntervalSecs(2); break;
        case "3": setIntervalSecs(3); break; case "4": setIntervalSecs(4); break; case "5": setIntervalSecs(5); break;
        case "f": containerRef.current?.requestFullscreen(); break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photos.length, mode]);

  function startLive(event: TvEvent) {
    setSelectedEvent(event); loadPhotos(event.slug);
    if (event.theme_config) applyTheme(resolveTheme(event.theme_config));
    setMode("live");
  }
  function resetUiTimer() {
    setShowUi(true);
    if (hideUiRef.current) clearTimeout(hideUiRef.current);
    hideUiRef.current = setTimeout(() => setShowUi(false), 5000);
  }

  const themeConfig = selectedEvent?.theme_config || null;
  const theme = resolveTheme(themeConfig, selectedEvent?.primary_color);
  const pos = photos.length > 0 ? current % photos.length : 0;

  // ─── SELECT EVENT SCREEN ───
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
        <div className="max-w-lg w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <MonitorPlay className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">TV do Estande</h1>
            <p className="text-gray-400 mt-2">Selecione um evento para exibir as fotos em tempo real</p>
          </div>
          {events.length === 0 ? (
            <EmptyState icon={MonitorPlay} title="Nenhum evento ativo" description="Crie um evento primeiro no painel admin." action={{ label: "Ir para o painel", onClick: () => router.push("/dashboard") }} />
          ) : (
            <div className="grid gap-3">
              {events.map((e) => {
                const evTheme = resolveTheme(e.theme_config || null, e.primary_color);
                return (
                  <button key={e.id} onClick={() => startLive(e)} className="p-5 rounded-xl border-2 border-gray-800 hover:border-blue-500/50 transition-all text-left flex items-center gap-4 group hover:bg-white/5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${evTheme.colors.primary}, ${evTheme.colors.accent})` }}>
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0"><p className="font-medium text-lg">{e.name}</p><p className="text-sm text-gray-500">{e.event_date}</p></div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── LIVE TV MODE ───
  return (
    <div ref={containerRef} className="min-h-screen text-white overflow-hidden relative bg-black" onMouseMove={resetUiTimer} onTouchStart={resetUiTimer}>
      {/* Background */}
      {theme && (
        <>
          {theme.background.type === "gradient" && (<div className="absolute inset-0 opacity-30" style={{ background: buildGradientCSS(theme.background.gradient) }} />)}
          {theme.background.type === "image" && theme.background.imageUrl && (<div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${theme.background.imageUrl})` }} />)}
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 50%, ${theme.colors.primary}15 0%, transparent 60%)` }} />
        </>
      )}

      {/* Header */}
      <header className={`absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between transition-opacity duration-500 ${showUi ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <h1 className="font-semibold">{selectedEvent?.name}</h1>
        </div>
        <button onClick={() => { setMode("select"); setPhotos([]); setIsPlaying(true); setCurrent(0); }} className="text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
          Trocar evento
        </button>
      </header>

      {/* Live indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
        <span className="text-[10px] text-white/40 uppercase tracking-widest">Ao Vivo</span>
        {photos.length > 0 && (<span className="text-[10px] text-white/20">{photos.length} fotos</span>)}
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="absolute inset-0 flex pt-16 pb-20">
        {/* LEFT — Mini Gallery */}
        <div ref={galleryRef} className="w-28 lg:w-36 flex-shrink-0 overflow-y-auto overflow-x-hidden px-3 py-4 flex flex-col gap-2" style={{ scrollBehavior: "smooth" }}>
          {photos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center"><Camera className="w-6 h-6 text-white/10" /></div>
          ) : (
            photos.map((photo, i) => (
              <button key={photo.id} onClick={() => { setCurrent(i); setIsPlaying(false); }} className="flex-shrink-0 w-full aspect-[3/4] rounded-lg overflow-hidden transition-all hover:scale-105 focus:outline-none"
                style={{
                  border: i === pos ? `2px solid ${theme?.colors.primary || "#3B82F6"}` : "2px solid transparent",
                  opacity: i === pos ? 1 : 0.45,
                  boxShadow: i === pos ? `0 0 16px ${theme?.colors.primary || "#3B82F6"}40` : "none",
                }}>
                <img src={photo.download_url?.startsWith("http") ? photo.download_url : `${API_BASE_URL}${photo.download_url}`} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </button>
            ))
          )}
        </div>

        {/* RIGHT — Large Photo */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          {photos.length === 0 ? (
            <div className="text-center animate-pulse">
              <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mx-auto mb-4"><Camera className="w-8 h-8 text-white/20" /></div>
              <p className="text-white/30 text-lg">Aguardando fotos...</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {photos.map((photo, index) => {
                const isActive = index === pos;
                return (
                  <img key={photo.id}
                    src={photo.download_url?.startsWith("http") ? photo.download_url : `${API_BASE_URL}${photo.download_url}`}
                    alt={photo.visitor_name}
                    className="absolute max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                    style={{ opacity: isActive ? 1 : 0, transform: isActive ? "scale(1)" : "scale(0.95)", zIndex: isActive ? 10 : 1, transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)", pointerEvents: isActive ? "auto" : "none" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM BAR ─── */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-500 ${showUi ? "opacity-100" : "opacity-0"}`}>
        {/* Scrolling text */}
        <div className="bg-gradient-to-r from-black/80 via-black/60 to-black/80 backdrop-blur border-t border-white/5 py-2.5 overflow-hidden">
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
            <span className="text-white/80 font-bold text-sm lg:text-base tracking-wide">TIRE SUA FOTO PROFISSIONAL AGORA!</span>
            <span className="text-white/40 text-xs">✦</span>
            <span className="text-white/80 font-bold text-sm lg:text-base tracking-wide">TIRE SUA FOTO PROFISSIONAL AGORA!</span>
            <span className="text-white/40 text-xs">✦</span>
            <span className="text-white/80 font-bold text-sm lg:text-base tracking-wide">TIRE SUA FOTO PROFISSIONAL AGORA!</span>
            <span className="text-white/40 text-xs">✦</span>
            <span className="text-white/80 font-bold text-sm lg:text-base tracking-wide">TIRE SUA FOTO PROFISSIONAL AGORA!</span>
          </div>
        </div>

        {/* Controls + Logos */}
        <div className="bg-black/90 backdrop-blur border-t border-white/5 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsPlaying((p) => !p)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            {photos.length > 0 && (<span className="text-sm text-white/40 font-mono">{pos + 1} / {photos.length}</span>)}
          </div>
          <div className="flex items-center gap-6">
            {theme?.logos?.eventLogo && (
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/10">
                <img src={resolveLogoUrl(theme.logos.eventLogo)} alt="Evento" className="h-12 lg:h-14 object-contain" />
              </div>
            )}
            {theme?.logos?.standLogo && (
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/10">
                <img src={resolveLogoUrl(theme.logos.standLogo)} alt="Stand" className="h-12 lg:h-14 object-contain" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-white/25 font-medium tracking-wide">SA.Company</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}</style>
    </div>
  );
}
