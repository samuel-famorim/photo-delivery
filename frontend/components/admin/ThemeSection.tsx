"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoUpload } from "@/components/admin/LogoUpload";
import type { ThemeConfig, ThemePreset, BackgroundType, HeadingFont, CardAspectRatio, CardShadow } from "@/types";
import { THEME_PRESETS, PRESET_META } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Check, Palette, Upload, Link2, Type, ImageIcon } from "lucide-react";

interface ThemeSectionProps {
  value: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
  eventId?: string;
}

export function ThemeSection({ value, onChange, eventId }: ThemeSectionProps) {
  const theme = value;
  const [activeTab, setActiveTab] = useState("colors");

  function selectPreset(preset: ThemePreset) {
    const presetData = THEME_PRESETS[preset];
    onChange({
      ...theme,
      mode: "preset",
      preset,
      colors: presetData.colors,
      background: presetData.background,
      header: presetData.header,
      typography: presetData.typography,
      photoCards: presetData.photoCards,
    });
  }

  function setMode(mode: "preset" | "custom") {
    onChange({ ...theme, mode });
  }

  function updateTheme(partial: Partial<ThemeConfig>) {
    onChange({ ...theme, ...partial });
  }

  return (
    <div className="space-y-10">
      {/* Header + Mode toggle */}
      <div className="flex items-start justify-between gap-8">
        <div>
          <h3 className="text-lg font-semibold">Aparência & Tema</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Personalize as cores, fundo, logos e textos que aparecem na página pública e na TV do evento.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-xl p-1.5 flex-shrink-0">
          <button
            onClick={() => setMode("preset")}
            className={cn(
              "px-6 py-2.5 text-sm rounded-lg transition-all font-medium whitespace-nowrap",
              theme.mode === "preset"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Presets
          </button>
          <button
            onClick={() => setMode("custom")}
            className={cn(
              "px-6 py-2.5 text-sm rounded-lg transition-all font-medium whitespace-nowrap",
              theme.mode === "custom"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Personalizado
          </button>
        </div>
      </div>

      {theme.mode === "preset" ? (
        /* ─── PRESETS GRID ─── */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((preset) => {
            const meta = PRESET_META[preset];
            const presetData = THEME_PRESETS[preset];
            const isSelected = theme.preset === preset;
            return (
              <button
                key={preset}
                onClick={() => selectPreset(preset)}
                className={cn(
                  "relative p-8 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : "border-border hover:border-primary/40 hover:shadow-md"
                )}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className="w-full h-28 rounded-xl mb-6 shadow-inner"
                  style={{
                    background: presetData.background.type === "gradient" && presetData.background.gradient
                      ? `linear-gradient(to bottom right, ${presetData.background.gradient.from}, ${presetData.background.gradient.to})`
                      : presetData.background.solidColor || presetData.colors.primary,
                  }}
                />
                <p className="text-3xl mb-3">{meta.icon}</p>
                <p className="font-semibold text-base mb-2">{meta.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
              </button>
            );
          })}
        </div>
      ) : (
        /* ─── CUSTOM MODE ─── */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-14 p-2 gap-2 mb-10">
            <TabsTrigger value="colors" className="flex-1 h-full text-sm font-medium">
              <Palette className="w-4 h-4 mr-2" />Cores & Fundo
            </TabsTrigger>
            <TabsTrigger value="logos" className="flex-1 h-full text-sm font-medium">
              <Upload className="w-4 h-4 mr-2" />Logos & Redes
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1 h-full text-sm font-medium">
              <Type className="w-4 h-4 mr-2" />Textos & Cards
            </TabsTrigger>
          </TabsList>

          {/* TAB: Cores & Fundo */}
          <TabsContent value="colors" className="space-y-8 mt-2">
            {/* Cores */}
            <div className="bg-muted/40 rounded-2xl p-8 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-1">Cores do Tema</h4>
                <p className="text-sm text-muted-foreground">Defina a paleta de cores aplicada em toda a experiência do evento.</p>
              </div>
              <div className="space-y-5">
                <ColorRow label="Cor Primária" color={theme.colors.primary}
                  onChange={(c) => updateTheme({ colors: { ...theme.colors, primary: c } })} />
                <ColorRow label="Texto sobre Primária" color={theme.colors.primaryForeground}
                  onChange={(c) => updateTheme({ colors: { ...theme.colors, primaryForeground: c } })} />
                <ColorRow label="Cor Secundária" color={theme.colors.secondary}
                  onChange={(c) => updateTheme({ colors: { ...theme.colors, secondary: c } })} />
                <ColorRow label="Cor de Destaque (Accent)" color={theme.colors.accent}
                  onChange={(c) => updateTheme({ colors: { ...theme.colors, accent: c } })} />
              </div>
              <div className="border-t pt-6 space-y-5">
                <ColorRow label="Cor dos Títulos" color={theme.typography.titleColor}
                  onChange={(c) => updateTheme({ typography: { ...theme.typography, titleColor: c } })} />
                <ColorRow label="Cor do Texto Corrido" color={theme.typography.bodyColor}
                  onChange={(c) => updateTheme({ typography: { ...theme.typography, bodyColor: c } })} />
              </div>
            </div>

            {/* Background */}
            <div className="bg-muted/40 rounded-2xl p-8 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-1">Fundo da Página</h4>
                <p className="text-sm text-muted-foreground">Configure o background da página pública e da tela da TV.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de Fundo</Label>
                <select
                  value={theme.background.type}
                  onChange={(e) => updateTheme({ background: { ...theme.background, type: e.target.value as BackgroundType } })}
                  className="w-full h-12 rounded-xl border px-4 text-sm bg-background"
                >
                  <option value="solid">Cor Sólida</option>
                  <option value="gradient">Gradiente</option>
                  <option value="image">Imagem</option>
                </select>
              </div>

              {theme.background.type === "solid" && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Cor de Fundo</Label>
                  <div className="flex items-center gap-4">
                    <Input type="color" value={theme.background.solidColor || "#FFFFFF"}
                      className="w-16 h-12 p-1 rounded-xl cursor-pointer border-2"
                      onChange={(e) => updateTheme({ background: { ...theme.background, solidColor: e.target.value } })} />
                    <span className="text-sm text-muted-foreground font-mono">{theme.background.solidColor || "#FFFFFF"}</span>
                  </div>
                </div>
              )}

              {theme.background.type === "gradient" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Cor Inicial</Label>
                      <div className="flex items-center gap-4">
                        <Input type="color" value={theme.background.gradient?.from || "#000000"}
                          className="w-16 h-12 p-1 rounded-xl cursor-pointer border-2"
                          onChange={(e) => updateTheme({ background: { ...theme.background, gradient: { ...theme.background.gradient!, from: e.target.value } } })} />
                        <span className="text-sm text-muted-foreground font-mono">{theme.background.gradient?.from || "#000"}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Cor Final</Label>
                      <div className="flex items-center gap-4">
                        <Input type="color" value={theme.background.gradient?.to || "#000000"}
                          className="w-16 h-12 p-1 rounded-xl cursor-pointer border-2"
                          onChange={(e) => updateTheme({ background: { ...theme.background, gradient: { ...theme.background.gradient!, to: e.target.value } } })} />
                        <span className="text-sm text-muted-foreground font-mono">{theme.background.gradient?.to || "#000"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Cor Intermediária <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                    <div className="flex items-center gap-4">
                      <Input type="color" value={theme.background.gradient?.via || "#000000"}
                        className="w-16 h-12 p-1 rounded-xl cursor-pointer border-2"
                        onChange={(e) => updateTheme({ background: { ...theme.background, gradient: { ...theme.background.gradient!, via: e.target.value || undefined } } })} />
                      <span className="text-sm text-muted-foreground font-mono">{theme.background.gradient?.via || "não definida"}</span>
                    </div>
                  </div>
                  <div
                    className="w-full h-20 rounded-xl border shadow-inner"
                    style={{
                      background: theme.background.gradient
                        ? `linear-gradient(to right, ${theme.background.gradient.from}, ${theme.background.gradient.via ? theme.background.gradient.via + ', ' : ''}${theme.background.gradient.to})`
                        : "#eee",
                    }}
                  />
                </div>
              )}

              {theme.background.type === "image" && (
                <LogoUpload
                  label="Imagem de Fundo"
                  description="Upload ou URL de uma imagem para o background"
                  value={theme.background.imageUrl || ""}
                  onChange={(url) => updateTheme({ background: { ...theme.background, imageUrl: url } })}
                  eventId={eventId}
                />
              )}
            </div>

            {/* Overlay */}
            <div className="bg-muted/40 rounded-2xl p-8 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-1">Camada Overlay</h4>
                <p className="text-sm text-muted-foreground">Uma camada semitransparente sobre o fundo para garantir a legibilidade dos textos.</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Cor do Overlay</Label>
                  <div className="flex items-center gap-4">
                    <Input type="color" value={theme.background.overlayColor || "#000000"}
                      className="w-16 h-12 p-1 rounded-xl cursor-pointer border-2"
                      onChange={(e) => updateTheme({ background: { ...theme.background, overlayColor: e.target.value } })} />
                    <span className="text-sm text-muted-foreground font-mono">{theme.background.overlayColor || "#000"}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Opacidade: <span className="font-mono font-bold">{theme.background.overlayOpacity || 0}%</span></Label>
                  <Input type="range" min="0" max="100" value={theme.background.overlayOpacity || 0}
                    onChange={(e) => updateTheme({ background: { ...theme.background, overlayOpacity: Number(e.target.value) } })} />
                  <div className="flex justify-between text-[11px] text-muted-foreground px-0.5">
                    <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipografia */}
            <div className="bg-muted/40 rounded-2xl p-8 space-y-5">
              <div>
                <h4 className="font-semibold text-base mb-1">Tipografia</h4>
                <p className="text-sm text-muted-foreground">Escolha a fonte usada nos títulos e cabeçalhos.</p>
              </div>
              <select
                value={theme.typography.headingFont}
                onChange={(e) => updateTheme({ typography: { ...theme.typography, headingFont: e.target.value as HeadingFont } })}
                className="w-full h-12 rounded-xl border px-4 text-sm bg-background"
              >
                <option value="inter">Inter — Moderna, limpa e de alta legibilidade</option>
                <option value="montserrat">Montserrat — Geométrica, elegante e com personalidade</option>
                <option value="playfair">Playfair Display — Clássica, sofisticada e com serifa</option>
              </select>
            </div>
          </TabsContent>

          {/* TAB: Logos & Redes */}
          <TabsContent value="logos" className="space-y-8 mt-2">
            <div className="bg-muted/40 rounded-2xl p-8 space-y-8">
              <div>
                <h4 className="font-semibold text-base mb-1">Logos e Imagens do Evento</h4>
                <p className="text-sm text-muted-foreground">Faça upload ou cole a URL das imagens que identificam o evento e o stand.</p>
              </div>
              <LogoUpload
                label="Logo do Evento"
                description="Logomarca principal do evento — aparece no topo da página pública"
                value={theme.logos.eventLogo || ""}
                onChange={(url) => updateTheme({ logos: { ...theme.logos, eventLogo: url } })}
                eventId={eventId}
              />
              <LogoUpload
                label="Logo do Stand / Empresa"
                description="Logomarca da sua empresa ou stand — aparece no canto direito do header"
                value={theme.logos.standLogo || ""}
                onChange={(url) => updateTheme({ logos: { ...theme.logos, standLogo: url } })}
                eventId={eventId}
              />
              <LogoUpload
                label="Banner do Evento"
                description="Imagem horizontal exibida abaixo do header (opcional)"
                value={theme.logos.eventBanner || ""}
                onChange={(url) => updateTheme({ logos: { ...theme.logos, eventBanner: url } })}
                eventId={eventId}
              />
            </div>

            {/* Redes Sociais */}
            <div className="bg-muted/40 rounded-2xl p-8 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-1">Redes Sociais</h4>
                <p className="text-sm text-muted-foreground">Links exibidos como ícones no rodapé. Deixe em branco os que não quiser mostrar.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SocialInput label="Instagram" value={theme.social.instagram || ""} placeholder="https://instagram.com/seuevento"
                  onChange={(v) => updateTheme({ social: { ...theme.social, instagram: v } })} />
                <SocialInput label="WhatsApp" value={theme.social.whatsapp || ""} placeholder="https://wa.me/5511999999999"
                  onChange={(v) => updateTheme({ social: { ...theme.social, whatsapp: v } })} />
                <SocialInput label="LinkedIn" value={theme.social.linkedin || ""} placeholder="https://linkedin.com/company/seuevento"
                  onChange={(v) => updateTheme({ social: { ...theme.social, linkedin: v } })} />
                <SocialInput label="Site" value={theme.social.website || ""} placeholder="https://seuevento.com.br"
                  onChange={(v) => updateTheme({ social: { ...theme.social, website: v } })} />
                <SocialInput label="Email" value={theme.social.email || ""} placeholder="contato@seuevento.com.br"
                  onChange={(v) => updateTheme({ social: { ...theme.social, email: v } })} />
                <SocialInput label="YouTube" value={theme.social.youtube || ""} placeholder="https://youtube.com/@seuevento"
                  onChange={(v) => updateTheme({ social: { ...theme.social, youtube: v } })} />
                <SocialInput label="TikTok" value={theme.social.tiktok || ""} placeholder="https://tiktok.com/@seuevento"
                  onChange={(v) => updateTheme({ social: { ...theme.social, tiktok: v } })} />
              </div>
            </div>
          </TabsContent>

          {/* TAB: Textos & Cards */}
          <TabsContent value="text" className="space-y-8 mt-2">
            <div className="bg-muted/40 rounded-2xl p-8 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-1">Textos da Página do Visitante</h4>
                <p className="text-sm text-muted-foreground">Personalize as mensagens que o visitante vê ao acessar suas fotos.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Título Principal</Label>
                  <Input value={theme.customText.titleTemplate} className="h-12"
                    onChange={(e) => updateTheme({ customText: { ...theme.customText, titleTemplate: e.target.value } })}
                    placeholder="Suas fotos estão prontas, {nome}!" />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{'{nome}'}</code> para o nome do visitante
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Subtítulo</Label>
                  <Input value={theme.customText.subtitleTemplate} className="h-12"
                    onChange={(e) => updateTheme({ customText: { ...theme.customText, subtitleTemplate: e.target.value } })}
                    placeholder="Obrigado por visitar o estande {evento}" />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{'{evento}'}</code> para o nome do evento
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Texto do Rodapé</Label>
                  <textarea
                    className="w-full min-h-[130px] rounded-xl border px-4 py-3.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                    value={theme.customText.footerText}
                    onChange={(e) => updateTheme({ customText: { ...theme.customText, footerText: e.target.value } })}
                    placeholder="Mensagem livre exibida no rodapé da página do visitante. Você pode incluir informações de contato, agradecimentos, etc."
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted/40 rounded-2xl p-8 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-1">Aparência dos Cards de Foto</h4>
                <p className="text-sm text-muted-foreground">Configure o visual dos cards na galeria de fotos do visitante.</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Proporção da Imagem</Label>
                  <select value={theme.photoCards.aspectRatio}
                    onChange={(e) => updateTheme({ photoCards: { ...theme.photoCards, aspectRatio: e.target.value as CardAspectRatio } })}
                    className="w-full h-12 rounded-xl border px-4 text-sm bg-background">
                    <option value="square">Quadrado (1:1)</option>
                    <option value="4/3">Horizontal (4:3)</option>
                    <option value="3/2">Horizontal largo (3:2)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Intensidade da Sombra</Label>
                  <select value={theme.photoCards.shadow}
                    onChange={(e) => updateTheme({ photoCards: { ...theme.photoCards, shadow: e.target.value as CardShadow } })}
                    className="w-full h-12 rounded-xl border px-4 text-sm bg-background">
                    <option value="sm">Sutil</option>
                    <option value="md">Média</option>
                    <option value="lg">Destacada</option>
                    <option value="xl">Extra</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium">Arredondamento das Bordas: <span className="font-mono font-bold text-muted-foreground">{theme.photoCards.borderRadius}px</span></Label>
                <Input type="range" min="0" max="32" value={theme.photoCards.borderRadius}
                  onChange={(e) => updateTheme({ photoCards: { ...theme.photoCards, borderRadius: Number(e.target.value) } })} />
                <div className="flex justify-between text-[11px] text-muted-foreground px-0.5">
                  <span>0px</span><span>8px</span><span>16px</span><span>24px</span><span>32px</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ─── Reusable sub-components ─── */

function ColorRow({ label, color, onChange }: { label: string; color: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center justify-between py-2 gap-6">
      <Label className="text-sm font-medium whitespace-nowrap">{label}</Label>
      <div className="flex items-center gap-4 flex-shrink-0">
        <Input type="color" value={color}
          className="w-14 h-11 p-0.5 rounded-xl cursor-pointer border-2"
          onChange={(e) => onChange(e.target.value)} />
        <Input value={color}
          className="w-36 h-11 font-mono text-sm rounded-lg"
          onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function SocialInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium whitespace-nowrap">{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-11" />
    </div>
  );
}
