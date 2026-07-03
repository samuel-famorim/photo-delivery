"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Share2, Camera, Package, Globe } from "lucide-react";
import { resolveTheme, applyTheme, buildGradientCSS } from "@/lib/theme";
import type { PublicSession, ThemeConfig, ThemeSocial } from "@/types";
import { API_BASE_URL, apiFetch, resolveLogoUrl, getDownloadUrl } from "@/lib/api-client";
import { InstagramIcon, LinkedinIcon, YoutubeIcon, TiktokIcon, WhatsappIcon, WebsiteIcon, EmailIcon } from "@/components/ui/social-icons";

export default function PublicSessionPage() {
  const { code } = useParams<{ code: string }>();
  const [session, setSession] = useState<PublicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`${API_BASE_URL}/api/v1/public/s/${code}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        console.log("[PublicPage] Session loaded:", { code, hasPhotos: !!data.photos?.length, eventName: data.event_name });

        // Try every possible field name the backend might use
        const themeConfig = data.event_theme || data.event_theme_config || data.theme_config || null;
        console.log("[PublicPage] Raw theme config from API:", themeConfig);
        console.log("[PublicPage] Event primary_color from API:", data.event_primary_color);

        const theme = resolveTheme(themeConfig, data.event_primary_color);
        console.log("[PublicPage] Resolved theme:", {
          mode: theme.mode, preset: theme.preset,
          primary: theme.colors.primary, accent: theme.colors.accent,
          bgType: theme.background.type,
          bgGradient: theme.background.gradient,
          logos: theme.logos,
        });

        applyTheme(theme);
        console.log("[PublicPage] CSS vars after applyTheme:", {
          "--theme-primary": getComputedStyle(document.documentElement).getPropertyValue("--theme-primary").trim(),
          "--theme-bg": getComputedStyle(document.documentElement).getPropertyValue("--theme-bg").trim().substring(0, 60),
        });

        setSession(data);
      })
      .catch((err) => {
        console.error("[PublicPage] Failed:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [code]);

  async function downloadPhoto(photo: { id: string; download_url: string; filename: string }) {
    setDownloadingId(photo.id);
    try {
      const res = await fetch(`${API_BASE_URL}${photo.download_url}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foto-${photo.filename}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }

  async function downloadAll() {
    if (!session) return;
    setDownloadingAll(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/public/s/${session.code}/download-all`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fotos-${session.code}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`${API_BASE_URL}/api/v1/public/s/${session.code}/download-all`, "_blank");
    } finally {
      setDownloadingAll(false);
    }
  }

  async function shareLink() {
    if (!session) return;
    const url = `${window.location.origin}/s/${session.code}`;
    if (navigator.share) {
      await navigator.share({ title: `Fotos de ${session.visitor_name}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copiado!");
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-white/5 animate-pulse mx-auto" />
          <p className="text-white/30">Carregando suas fotos...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Camera className="w-10 h-10 text-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sessão não encontrada</h1>
          <p className="text-white/40">Verifique o código ou QR Code e tente novamente.</p>
        </div>
      </div>
    );
  }

  // --- Safe theme resolution ---
  const rawTheme = (session as any).event_theme || (session as any).event_theme_config || (session as any).theme_config || null;
  const theme = resolveTheme(rawTheme, session.event_primary_color);

  // --- Safe data extraction ---
  const visitorName = session.visitor_name || "Visitante";
  const visitorFirstName = visitorName.split(" ")[0];
  const eventName = session.event_name || "Evento";
  const titleTemplate = theme.customText?.titleTemplate || "Suas fotos estão prontas, {nome}!";
  const subtitleTemplate = theme.customText?.subtitleTemplate || "Obrigado por visitar o estande {evento}";
  const heroTitle = titleTemplate.replace("{nome}", visitorFirstName);
  const heroSubtitle = subtitleTemplate.replace("{evento}", eventName);
  const headerStyle = theme.header?.style === "glass" ? "glass-dark" : theme.header?.style === "solid" ? "bg-black/40" : "";
  const aspectRatio = theme.photoCards?.aspectRatio || "square";
  const cardAspectClass = aspectRatio === "square" ? "aspect-square" : aspectRatio === "4/3" ? "aspect-[4/3]" : "aspect-[3/2]";
  const photos = session.photos || [];
  const sponsors = session.event_sponsors || [];

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: theme.background?.type === "gradient" && theme.background?.gradient
          ? buildGradientCSS(theme.background.gradient)
          : theme.background?.solidColor || "#0A0A0A",
      }}
    >
      {/* Background image overlay */}
      {theme.background?.type === "image" && theme.background?.imageUrl && (
        <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${theme.background.imageUrl})` }} />
      )}
      {(theme.background?.overlayOpacity || 0) > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: theme.background?.overlayColor || "#000", opacity: (theme.background.overlayOpacity || 0) / 100 }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <header className={`sticky top-0 z-20 ${headerStyle}`}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {theme.logos?.eventLogo ? (
                <img src={resolveLogoUrl(theme.logos.eventLogo)} alt={eventName} className="h-10 object-contain rounded" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                    <Camera className="w-5 h-5" style={{ color: theme.colors.primaryForeground }} />
                  </div>
                  <span className="font-semibold hidden sm:inline" style={{ color: theme.typography.titleColor }}>
                    {eventName}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono opacity-50" style={{ color: theme.typography.bodyColor }}>
                #{session.code}
              </span>
              {theme.logos?.standLogo ? (
                <img src={resolveLogoUrl(theme.logos.standLogo)} alt="Logo Stand" className="h-10 object-contain rounded" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.colors.accent }}>
                  <Camera className="w-5 h-5" style={{ color: theme.colors.accentForeground }} />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            {session.event_date && (
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}
              >
                {formatDate(session.event_date)}
              </span>
            )}
            <h1
              className="text-3xl lg:text-5xl font-bold tracking-tight"
              style={{ color: theme.typography.titleColor, fontFamily: theme.typography.headingFont === "inter" ? undefined : undefined }}
            >
              {heroTitle}
            </h1>
            <p className="text-lg mt-3 max-w-lg mx-auto" style={{ color: theme.typography.bodyColor }}>
              {heroSubtitle}
            </p>
          </div>

          {/* Banner — from theme config or event */}
          {(theme.logos?.eventBanner || session.event_banner_url) && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={resolveLogoUrl(theme.logos?.eventBanner || session.event_banner_url)}
                alt={eventName}
                className="w-full object-cover max-h-72"
              />
            </div>
          )}

          {/* Brand / Stand Section — call to action for the brand */}
          {(theme.logos?.standLogo || theme.social?.whatsapp || theme.social?.instagram || theme.social?.website) && (
            <div className="mb-10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent}18, ${theme.colors.primary}10)`,
                border: `1px solid ${theme.colors.accent}30`,
              }}
            >
              {theme.logos?.standLogo && (
                <div className="flex-shrink-0">
                  <img
                    src={resolveLogoUrl(theme.logos.standLogo)}
                    alt="Logo do Stand"
                    className="h-20 sm:h-24 object-contain rounded-xl bg-white/10 backdrop-blur p-3"
                  />
                </div>
              )}
              <div className="text-center sm:text-left flex-1">
                <p className="text-xs uppercase tracking-widest mb-1 opacity-50" style={{ color: theme.typography.bodyColor }}>
                  Este evento é uma ativação de
                </p>
                <p className="text-xl font-bold" style={{ color: theme.typography.titleColor }}>
                  {theme.customText?.footerText ? theme.customText.footerText.split("\n")[0] : eventName}
                </p>
                <p className="text-sm mt-2 opacity-70" style={{ color: theme.typography.bodyColor }}>
                  Conheça mais sobre a marca e fale direto com a gente:
                </p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {theme.social?.whatsapp && (
                    <a href={theme.social.whatsapp} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shadow-md">
                      <WhatsappIcon className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                  {theme.social?.instagram && (
                    <a href={theme.social.instagram} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity shadow-md"
                      style={{ background: "linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)" }}>
                      <InstagramIcon className="w-4 h-4" /> Instagram
                    </a>
                  )}
                  {theme.social?.website && (
                    <a href={theme.social.website} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-md"
                      style={{ backgroundColor: theme.colors.primary, color: theme.colors.primaryForeground }}>
                      <WebsiteIcon className="w-4 h-4" /> Site
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Photos Grid */}
          {photos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 opacity-20" style={{ color: theme.typography.bodyColor }} />
              </div>
              <p className="text-lg" style={{ color: theme.typography.bodyColor }}>Nenhuma foto disponível ainda.</p>
              <p className="text-sm mt-1 opacity-50" style={{ color: theme.typography.bodyColor }}>
                As fotos aparecerão aqui assim que forem capturadas.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-10">
                {photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                    style={{
                      borderRadius: theme.photoCards.borderRadius,
                      boxShadow: `var(--theme-card-shadow)`,
                      backgroundColor: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    <div className={`${cardAspectClass} bg-white/5 relative overflow-hidden`}>
                      <img
                        src={`${API_BASE_URL}${photo.download_url}`}
                        alt={`Foto ${i + 1} de ${visitorName}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect fill='%231e293b' width='400' height='300'/><text x='200' y='155' text-anchor='middle' fill='%23475569' font-size='16'>Sem imagem</text></svg>";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <button
                          onClick={() => downloadPhoto(photo)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm"
                          style={{ backgroundColor: theme.colors.primary, color: theme.colors.primaryForeground }}
                        >
                          <Download className="w-4 h-4" /> Baixar
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: theme.typography.titleColor }}>Foto {i + 1}</p>
                        <p className="text-xs opacity-50" style={{ color: theme.typography.bodyColor }}>
                          {photo.width && photo.height ? `${photo.width}x${photo.height}` : eventName}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadPhoto(photo)}
                        disabled={downloadingId === photo.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                        style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}
                      >
                        <Download className="w-4 h-4" />
                        {downloadingId === photo.id ? "..." : "Baixar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
                <button
                  onClick={downloadAll}
                  disabled={downloadingAll}
                  className="h-14 px-8 rounded-xl text-lg font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                    color: theme.colors.primaryForeground,
                  }}
                >
                  <Package className="w-5 h-5" />
                  {downloadingAll ? "Preparando ZIP..." : "Baixar Todas as Fotos (.zip)"}
                </button>
                <button
                  onClick={shareLink}
                  className="h-14 px-8 rounded-xl text-lg font-medium border transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{ borderColor: `${theme.typography.bodyColor}40`, color: theme.typography.bodyColor }}
                >
                  <Share2 className="w-5 h-5" />
                  Compartilhar
                </button>
              </div>
            </>
          )}

          {/* Custom Text */}
          {(session.event_custom_text || theme.customText?.footerText) && (
            <div className="text-center mb-10 max-w-lg mx-auto">
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="leading-relaxed" style={{ color: theme.typography.bodyColor }}>
                  {session.event_custom_text || theme.customText?.footerText}
                </p>
              </div>
            </div>
          )}

          {/* Sponsors */}
          {sponsors.length > 0 && (
            <div className="text-center mb-10 py-8 border-t" style={{ borderColor: `${theme.typography.bodyColor}15` }}>
              <p className="text-xs mb-5 uppercase tracking-widest opacity-40" style={{ color: theme.typography.bodyColor }}>
                Patrocinadores
              </p>
              <div className="flex justify-center gap-8 flex-wrap items-center">
                {sponsors.map((sponsor, i) => (
                  <div key={i} className="text-center">
                    {sponsor.logo_url ? (
                      <img src={sponsor.logo_url} alt={sponsor.name} className="h-10 object-contain mx-auto mb-1 opacity-60 hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/5 mx-auto mb-1 flex items-center justify-center">
                        <Globe className="w-4 h-4 opacity-30" style={{ color: theme.typography.bodyColor }} />
                      </div>
                    )}
                    <p className="text-xs opacity-50" style={{ color: theme.typography.bodyColor }}>{sponsor.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {hasSocial(theme.social) && (
            <footer className="text-center py-8 border-t" style={{ borderColor: `${theme.typography.bodyColor}15` }}>
              <p className="text-sm mb-4 opacity-50" style={{ color: theme.typography.bodyColor }}>Siga nossas redes:</p>
              <div className="flex justify-center gap-3">
                <SocialIcons social={theme.social} />
              </div>
              <p className="text-xs mt-6 opacity-30" style={{ color: theme.typography.bodyColor }}>
                Fotos entregues por <span className="font-semibold">SA.Company</span>
              </p>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function hasSocial(social?: ThemeSocial): boolean {
  if (!social) return false;
  return !!(social.instagram || social.whatsapp || social.linkedin || social.website || social.email || social.youtube || social.tiktok);
}

function SocialIcons({ social }: { social?: ThemeSocial }) {
  if (!social) return null;
  const icons = [];
  if (social.instagram) icons.push({ href: social.instagram, icon: InstagramIcon, label: "Instagram" });
  if (social.whatsapp) icons.push({ href: social.whatsapp, icon: WhatsappIcon, label: "WhatsApp" });
  if (social.linkedin) icons.push({ href: social.linkedin, icon: LinkedinIcon, label: "LinkedIn" });
  if (social.website) icons.push({ href: social.website, icon: WebsiteIcon, label: "Site" });
  if (social.email) icons.push({ href: `mailto:${social.email}`, icon: EmailIcon, label: "Email" });
  if (social.youtube) icons.push({ href: social.youtube, icon: YoutubeIcon, label: "YouTube" });
  if (social.tiktok) icons.push({ href: social.tiktok, icon: TiktokIcon, label: "TikTok" });

  return icons.map(({ href, label, icon: Icon }) => (
    <a
      key={label}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center transition-all hover:bg-white/10 hover:scale-110"
    >
      <Icon className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity" />
    </a>
  ));
}
