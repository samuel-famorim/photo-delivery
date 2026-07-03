"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { resolveTheme, applyTheme, buildGradientCSS } from "@/lib/theme";
import type { ThemeConfig, TVSlideshowConfig, TVOverlayConfig } from "@/types";
import { Camera, Play, Pause, ChevronUp, ChevronDown } from "lucide-react";
import { apiFetch, API_BASE_URL, resolveLogoUrl } from "@/lib/api-client";

interface Photo {
  id: string; filename: string; download_url: string; width?: number | null; height?: number | null;
}

interface SessionData {
  code: string; visitor_name: string; visitor_company: string | null; event_name: string; event_logo_url: string | null; event_primary_color: string;
  event_theme?: ThemeConfig | null; theme_config?: ThemeConfig | null; event_sponsors: { name: string; logo_url?: string }[]; photos: Photo[];
}

export default function TvDisplayPage() {
  const { code } = useParams<{ code: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideshow, setSlideshow] = useState<TVSlideshowConfig>({ isPlaying: true, currentPhotoIndex: 0, interval: 4, transition: "fade" });
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      const data = await apiFetch<any>(`/public/s/${code}`);
      setSession(data);
      const newPhotos = data.photos || [];
      setPhotos((prev) => (prev.length !== newPhotos.length ? newPhotos : prev));
      const themeConfig = data.event_theme || data.event_theme_config || data.theme_config || null;
      applyTheme(resolveTheme(themeConfig, data.event_primary_color));
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { load(); const poll = window.setInterval(load, 5000); return () => window.clearInterval(poll); }, [load]);

  // Slideshow timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!slideshow.isPlaying || photos.length === 0) return;
    timerRef.current = setInterval(() => {
      setSlideshow((prev) => ({ ...prev, currentPhotoIndex: (prev.currentPhotoIndex + 1) % photos.length }));
    }, slideshow.interval * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slideshow.isPlaying, slideshow.interval, photos.length]);

  // Scroll gallery to current photo
  useEffect(() => {
    if (!galleryRef.current || photos.length === 0) return;
    const thumbEl = galleryRef.current.children[slideshow.currentPhotoIndex] as HTMLElement;
    if (thumbEl) {
      thumbEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [slideshow.currentPhotoIndex, photos.length]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (photos.length === 0) return;
      switch (e.key) {
        case "ArrowUp": navigate(-1); break;
        case "ArrowDown": navigate(1); break;
        case "ArrowLeft": navigate(-1); break;
        case "ArrowRight": navigate(1); break;
        case " ": e.preventDefault(); togglePlay(); break;
        case "1": setSlideshow((p) => ({ ...p, interval: 1 })); break;
        case "2": setSlideshow((p) => ({ ...p, interval: 2 })); break;
        case "3": setSlideshow((p) => ({ ...p, interval: 3 })); break;
        case "4": setSlideshow((p) => ({ ...p, interval: 4 })); break;
        case "5": setSlideshow((p) => ({ ...p, interval: 5 })); break;
        case "f": document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen(); break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photos.length]);

  function navigate(dir: number) {
    setSlideshow((prev) => ({
      ...prev, isPlaying: false,
      currentPhotoIndex: ((prev.currentPhotoIndex + dir) % photos.length + photos.length) % photos.length,
    }));
    resetHideControls();
  }
  function selectPhoto(index: number) {
    setSlideshow((prev) => ({ ...prev, isPlaying: false, currentPhotoIndex: index }));
    resetHideControls();
  }
  function togglePlay() {
    setSlideshow((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    resetHideControls();
  }
  function resetHideControls() {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 5000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center mx-auto animate-pulse">
            <Camera className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/30 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Camera className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-xl">Sessão não encontrada</p>
          <p className="text-white/10 text-sm mt-2">Verifique o código da sessão</p>
        </div>
      </div>
    );
  }

  const themeConfig = (session as any).event_theme || (session as any).event_theme_config || (session as any).theme_config || null;
  const theme = resolveTheme(themeConfig, session.event_primary_color);
  const currentPhoto = photos[slideshow.currentPhotoIndex];

  return (
    <div
      ref={containerRef}
      className="min-h-screen text-white overflow-hidden relative bg-black"
      onMouseMove={resetHideControls} onTouchStart={resetHideControls}
    >
      {/* Theme background */}
      {theme.background.type === "gradient" && (
        <div className="absolute inset-0 opacity-30" style={{ background: buildGradientCSS(theme.background.gradient) }} />
      )}
      {theme.background.type === "image" && theme.background.imageUrl && (
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${theme.background.imageUrl})` }} />
      )}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 50%, ${theme.colors.primary}15 0%, transparent 60%)` }} />

      {/* ─── HEADER ─── */}
      <header className={`absolute top-0 left-0 right-0 z-20 px-8 py-5 flex items-center justify-between transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-5">
          {/* EVENT LOGO — grande e destacado */}
          <div className="flex-shrink-0">
            {(theme.logos?.eventLogo || session.event_logo_url) ? (
              <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
                <img src={resolveLogoUrl(theme.logos?.eventLogo || session.event_logo_url)} alt="Logo Evento" className="h-14 lg:h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                <Camera className="w-7 h-7" style={{ color: theme.colors.primaryForeground }} />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest">{session.event_name}</p>
            <p className="text-lg font-bold">{session.visitor_name || "Visitante"}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* STAND LOGO — grande e destacado */}
          {theme.logos?.standLogo && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10 flex-shrink-0">
              <img src={resolveLogoUrl(theme.logos.standLogo)} alt="Logo Stand" className="h-14 lg:h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Sessão</p>
            <p className="text-base font-mono font-bold tracking-widest text-white/50">{session.code}</p>
          </div>
        </div>
      </header>

      {/* ─── LIVE INDICATOR ─── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] text-white/40 uppercase tracking-widest">Ao Vivo</span>
        {photos.length > 0 && (
          <span className="text-[10px] text-white/20 ml-2">{photos.length} fotos</span>
        )}
      </div>

      {/* ─── MAIN LAYOUT: Gallery Left + Photo Right ─── */}
      <div className="absolute inset-0 flex pt-20 pb-20">
        {/* LEFT — Vertical Mini Gallery */}
        <div
          ref={galleryRef}
          className="w-28 lg:w-36 flex-shrink-0 overflow-y-auto overflow-x-hidden px-3 py-4 flex flex-col gap-2 scrollbar-thin"
          style={{ scrollBehavior: "smooth" }}
        >
          {photos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white/10" />
            </div>
          ) : (
            photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => selectPhoto(i)}
                className="flex-shrink-0 w-full aspect-[3/4] rounded-lg overflow-hidden transition-all hover:scale-105 focus:outline-none"
                style={{
                  border: i === slideshow.currentPhotoIndex ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
                  opacity: i === slideshow.currentPhotoIndex ? 1 : 0.45,
                  boxShadow: i === slideshow.currentPhotoIndex ? `0 0 16px ${theme.colors.primary}40` : "none",
                }}
              >
                <img
                  src={photo.download_url?.startsWith("http") ? photo.download_url : `${API_BASE_URL}${photo.download_url}`}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </button>
            ))
          )}
        </div>

        {/* RIGHT — Large Photo Display */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          {photos.length === 0 ? (
            <div className="text-center animate-pulse">
              <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/30 text-lg">Aguardando fotos...</p>
              <p className="text-white/10 text-sm mt-1">As fotos aparecerão aqui</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {photos.map((photo, index) => {
                const isActive = index === slideshow.currentPhotoIndex;
                return (
                  <img
                    key={photo.id}
                    src={photo.download_url?.startsWith("http") ? photo.download_url : `${API_BASE_URL}${photo.download_url}`}
                    alt={`Foto ${index + 1}`}
                    className="absolute max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "scale(1)" : "scale(0.95)",
                      zIndex: isActive ? 10 : 1,
                      transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM BAR: Scrolling text + logos + controls ─── */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Scrolling text */}
        <div className="bg-gradient-to-r from-black/80 via-black/60 to-black/80 backdrop-blur border-t border-white/5 py-2.5 overflow-hidden">
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
            <span className="text-white/80 font-bold text-sm lg:text-base tracking-wide">
              TIRE SUA FOTO PROFISSIONAL AGORA!
            </span>
            <span className="text-white/40 text-xs">✦</span>
            <span className="text-white/80 font-bold text-sm lg:text-base tracking-wide">
              TIRE SUA FOTO PROFISSIONAL AGORA!
            </span>
            <span className="text-white/40 text-xs">✦</span>
            <span className="text-white/80 font-bold text-sm lg:text-base tracking-wide">
              TIRE SUA FOTO PROFISSIONAL AGORA!
            </span>
            <span className="text-white/40 text-xs">✦</span>
            <span className="text-white/80 font-bold text-sm lg:text-base tracking-wide">
              TIRE SUA FOTO PROFISSIONAL AGORA!
            </span>
          </div>
        </div>

        {/* Controls + Logos */}
        <div className="bg-black/90 backdrop-blur border-t border-white/5 px-6 py-3 flex items-center justify-between">
          {/* Left: Play/Pause + Counter */}
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              {slideshow.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            {photos.length > 0 && (
              <span className="text-sm text-white/40 font-mono">{slideshow.currentPhotoIndex + 1} / {photos.length}</span>
            )}
          </div>

          {/* Center: LOGOS EM DESTAQUE */}
          <div className="flex items-center gap-6">
            {theme.logos?.eventLogo && (
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/10 flex items-center gap-3">
                <img src={resolveLogoUrl(theme.logos.eventLogo)} alt="Evento" className="h-12 lg:h-14 object-contain" />
                <span className="text-[10px] text-white/40 uppercase tracking-wider hidden lg:inline">Evento</span>
              </div>
            )}
            {theme.logos?.standLogo && (
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/10 flex items-center gap-3">
                <img src={resolveLogoUrl(theme.logos.standLogo)} alt="Stand" className="h-12 lg:h-14 object-contain" />
                <span className="text-[10px] text-white/40 uppercase tracking-wider hidden lg:inline">Stand</span>
              </div>
            )}
          </div>

          {/* Right: Brand */}
          <p className="text-[11px] text-white/25 font-medium tracking-wide">SA.Company</p>
        </div>
      </div>

      {/* ─── MARQUEE ANIMATION ─── */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
