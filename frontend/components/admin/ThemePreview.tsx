"use client";

import { useMemo } from "react";
import type { ThemeConfig } from "@/types";
import { resolveTheme, buildGradientCSS } from "@/lib/theme";
import { Camera, Download, Share2, Globe, MessageCircle, Video, Briefcase } from "lucide-react";

const FONT_MAP: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  montserrat: "'Montserrat', system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
};

interface ThemePreviewProps {
  theme: ThemeConfig;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const resolved = useMemo(() => resolveTheme(theme), [theme]);

  const bgStyle: React.CSSProperties = useMemo(() => {
    if (resolved.background.type === "gradient" && resolved.background.gradient) {
      return { background: buildGradientCSS(resolved.background.gradient) };
    }
    if (resolved.background.type === "image") {
      return { background: resolved.colors.secondary };
    }
    return { background: resolved.background.solidColor || resolved.colors.secondary };
  }, [resolved]);

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-border shadow-lg">
      {/* Title bar */}
      <div className="text-xs font-semibold text-muted-foreground px-5 py-3 bg-muted/50 border-b flex items-center justify-between">
        <span>Preview — Página do Visitante</span>
        <span className="text-[10px] uppercase tracking-widest opacity-40 font-mono">/s/X8F4D2</span>
      </div>

      {/* Color indicators */}
      <div className="flex h-2">
        <div className="flex-1" style={{ backgroundColor: resolved.colors.primary }} />
        <div className="flex-1" style={{ backgroundColor: resolved.colors.secondary }} />
        <div className="flex-1" style={{ backgroundColor: resolved.colors.accent }} />
      </div>

      {/* Preview window */}
      <div className="relative overflow-hidden" style={{ height: 420, ...bgStyle }}>
        {/* Background image */}
        {resolved.background.type === "image" && resolved.background.imageUrl && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${resolved.background.imageUrl})` }} />
        )}
        {/* Overlay */}
        {(resolved.background.overlayOpacity || 0) > 0 && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: resolved.background.overlayColor || "#000",
              opacity: (resolved.background.overlayOpacity || 0) / 100,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{
              backgroundColor: resolved.header.style === "glass"
                ? "rgba(0,0,0,0.2)"
                : "rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-center gap-2">
              {resolved.logos.eventLogo ? (
                <img src={resolved.logos.eventLogo} alt="" className="h-8 object-contain rounded" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: resolved.colors.primary }}>
                  <Camera className="w-4 h-4" style={{ color: resolved.colors.primaryForeground }} />
                </div>
              )}
              <span className="font-semibold text-sm" style={{ color: resolved.typography.titleColor }}>Evento</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] opacity-40 font-mono" style={{ color: resolved.typography.bodyColor }}>#A8F4D2</span>
              {resolved.logos.standLogo ? (
                <img src={resolved.logos.standLogo} alt="" className="h-8 object-contain rounded" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: resolved.colors.accent }}>
                  <Camera className="w-4 h-4" style={{ color: resolved.colors.accentForeground }} />
                </div>
              )}
            </div>
          </div>

          {/* Hero */}
          <div className="text-center py-5 px-4">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-medium mb-3"
              style={{ backgroundColor: `${resolved.colors.accent}20`, color: resolved.colors.accent }}>
              15 de Julho de 2026
            </span>
            <h1 className="text-base font-bold mb-1" style={{ color: resolved.typography.titleColor, fontFamily: FONT_MAP[resolved.typography.headingFont] || FONT_MAP.inter }}>
              Suas fotos estão prontas, <span style={{ color: resolved.colors.accent }}>Visitante</span>!
            </h1>
            <p className="text-[11px] opacity-70" style={{ color: resolved.typography.bodyColor }}>
              Obrigado por visitar o estande no Evento
            </p>
          </div>

          {/* Photo Grid */}
          <div className="flex-1 px-4 pb-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden"
                  style={{
                    borderRadius: resolved.photoCards.borderRadius,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="aspect-square bg-white/5 flex items-center justify-center">
                    <Camera className="w-5 h-5 opacity-15" style={{ color: resolved.typography.bodyColor }} />
                  </div>
                  <div className="p-1.5 flex justify-end">
                    <span className="text-[9px] px-2 py-0.5 rounded font-medium"
                      style={{ backgroundColor: `${resolved.colors.accent}20`, color: resolved.colors.accent }}>
                      Baixar
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex gap-2 justify-center mb-3">
              <div className="h-7 px-4 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                style={{ background: `linear-gradient(135deg, ${resolved.colors.primary}, ${resolved.colors.accent})`, color: resolved.colors.primaryForeground }}>
                <Download className="w-3 h-3" /> Baixar Todas (.zip)
              </div>
              <div className="h-7 px-4 rounded-lg text-[10px] font-medium flex items-center gap-1.5 border"
                style={{ borderColor: `${resolved.typography.bodyColor}30`, color: resolved.typography.bodyColor }}>
                <Share2 className="w-3 h-3" /> Compartilhar
              </div>
            </div>

            {/* Footer with social icons */}
            <div className="flex justify-center gap-3 pt-2 border-t" style={{ borderColor: `${resolved.typography.bodyColor}12` }}>
              <Camera className="w-3.5 h-3.5 opacity-30" style={{ color: resolved.typography.bodyColor }} />
              <MessageCircle className="w-3.5 h-3.5 opacity-30" style={{ color: resolved.typography.bodyColor }} />
              <Briefcase className="w-3.5 h-3.5 opacity-30" style={{ color: resolved.typography.bodyColor }} />
              <Globe className="w-3.5 h-3.5 opacity-30" style={{ color: resolved.typography.bodyColor }} />
            </div>
            <p className="text-center text-[8px] opacity-20 mt-2" style={{ color: resolved.typography.bodyColor }}>
              PhotoDelivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
