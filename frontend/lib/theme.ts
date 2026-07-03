import type { ThemeConfig, ThemePreset } from "@/types";

// ============================================================
// Theme Presets
// ============================================================

export const THEME_PRESETS: Record<ThemePreset, Omit<ThemeConfig, "customText" | "logos" | "social">> = {
  light: {
    mode: "preset",
    preset: "light",
    colors: {
      primary: "#0F172A",
      primaryForeground: "#FFFFFF",
      secondary: "#F1F5F9",
      secondaryForeground: "#0F172A",
      accent: "#3B82F6",
      accentForeground: "#FFFFFF",
    },
    background: {
      type: "gradient",
      gradient: { from: "#F8FAFC", to: "#FFFFFF", direction: "to-b" },
    },
    header: { style: "glass", glassOpacity: 70 },
    typography: {
      headingFont: "inter",
      titleColor: "#0F172A",
      bodyColor: "#475569",
    },
    photoCards: {
      borderRadius: 16,
      shadow: "md",
      showDownloadButton: true,
      aspectRatio: "square",
    },
  },

  dark: {
    mode: "preset",
    preset: "dark",
    colors: {
      primary: "#FFFFFF",
      primaryForeground: "#0A0A0A",
      secondary: "#1E293B",
      secondaryForeground: "#F8FAFC",
      accent: "#6366F1",
      accentForeground: "#FFFFFF",
    },
    background: {
      type: "gradient",
      gradient: { from: "#1A1A2E", to: "#0A0A0A", direction: "to-b" },
    },
    header: { style: "glass", glassOpacity: 40 },
    typography: {
      headingFont: "inter",
      titleColor: "#FFFFFF",
      bodyColor: "#CBD5E1",
    },
    photoCards: {
      borderRadius: 16,
      shadow: "lg",
      showDownloadButton: true,
      aspectRatio: "square",
    },
  },

  ocean: {
    mode: "preset",
    preset: "ocean",
    colors: {
      primary: "#38BDF8",
      primaryForeground: "#0F172A",
      secondary: "#1E3A5F",
      secondaryForeground: "#F0F9FF",
      accent: "#06B6D4",
      accentForeground: "#FFFFFF",
    },
    background: {
      type: "gradient",
      gradient: { from: "#0F172A", via: "#1E3A5F", to: "#0EA5E9", direction: "to-br" },
    },
    header: { style: "glass", glassOpacity: 40 },
    typography: {
      headingFont: "inter",
      titleColor: "#FFFFFF",
      bodyColor: "#BAE6FD",
    },
    photoCards: {
      borderRadius: 14,
      shadow: "lg",
      showDownloadButton: true,
      aspectRatio: "square",
    },
  },

  forest: {
    mode: "preset",
    preset: "forest",
    colors: {
      primary: "#34D399",
      primaryForeground: "#022C22",
      secondary: "#064E3B",
      secondaryForeground: "#ECFDF5",
      accent: "#10B981",
      accentForeground: "#FFFFFF",
    },
    background: {
      type: "gradient",
      gradient: { from: "#022C22", via: "#064E3B", to: "#059669", direction: "to-br" },
    },
    header: { style: "glass", glassOpacity: 40 },
    typography: {
      headingFont: "inter",
      titleColor: "#FFFFFF",
      bodyColor: "#A7F3D0",
    },
    photoCards: {
      borderRadius: 14,
      shadow: "lg",
      showDownloadButton: true,
      aspectRatio: "4/3",
    },
  },

  sunset: {
    mode: "preset",
    preset: "sunset",
    colors: {
      primary: "#FB923C",
      primaryForeground: "#1A0A2E",
      secondary: "#4A1942",
      secondaryForeground: "#FFF7ED",
      accent: "#F472B6",
      accentForeground: "#FFFFFF",
    },
    background: {
      type: "gradient",
      gradient: { from: "#1A0A2E", via: "#4A1942", to: "#C02633", direction: "to-br" },
    },
    header: { style: "glass", glassOpacity: 40 },
    typography: {
      headingFont: "montserrat",
      titleColor: "#FFFFFF",
      bodyColor: "#FED7AA",
    },
    photoCards: {
      borderRadius: 16,
      shadow: "lg",
      showDownloadButton: true,
      aspectRatio: "3/2",
    },
  },

  royal: {
    mode: "preset",
    preset: "royal",
    colors: {
      primary: "#A78BFA",
      primaryForeground: "#1A0533",
      secondary: "#3B0764",
      secondaryForeground: "#F5F3FF",
      accent: "#C084FC",
      accentForeground: "#FFFFFF",
    },
    background: {
      type: "gradient",
      gradient: { from: "#1A0533", via: "#3B0764", to: "#7C3AED", direction: "to-b" },
    },
    header: { style: "glass", glassOpacity: 40 },
    typography: {
      headingFont: "playfair",
      titleColor: "#FFFFFF",
      bodyColor: "#DDD6FE",
    },
    photoCards: {
      borderRadius: 12,
      shadow: "lg",
      showDownloadButton: true,
      aspectRatio: "square",
    },
  },
};

// ============================================================
// Default Theme
// ============================================================

export const DEFAULT_THEME: ThemeConfig = {
  ...THEME_PRESETS.dark,
  mode: "preset" as const,
  preset: "dark" as const,
  logos: { sponsors: [] },
  social: {},
  customText: {
    titleTemplate: "Suas fotos estão prontas, {nome}!",
    subtitleTemplate: "Obrigado por visitar o estande {evento}",
    footerText: "",
  },
};

// ============================================================
// Theme Resolution
// ============================================================

export function resolveTheme(themeConfig?: ThemeConfig | null, primaryColor?: string): ThemeConfig {
  // If we have a theme config with colors, use it (even without mode field)
  if (themeConfig && themeConfig.colors) {
    // Preset mode: merge preset base with saved config
    if (themeConfig.mode === "preset" && themeConfig.preset) {
      const preset = THEME_PRESETS[themeConfig.preset];
      if (preset) {
        return {
          ...DEFAULT_THEME,
          ...preset,
          customText: { ...DEFAULT_THEME.customText, ...(themeConfig.customText || {}) },
          logos: { ...DEFAULT_THEME.logos, ...(themeConfig.logos || {}), sponsors: (themeConfig.logos?.sponsors || DEFAULT_THEME.logos.sponsors) },
          social: { ...DEFAULT_THEME.social, ...(themeConfig.social || {}) },
        };
      }
    }
    // Custom mode or no mode specified: deep merge all nested objects
    return {
      ...DEFAULT_THEME,
      ...themeConfig,
      colors: { ...DEFAULT_THEME.colors, ...themeConfig.colors },
      background: { ...DEFAULT_THEME.background, ...themeConfig.background },
      typography: { ...DEFAULT_THEME.typography, ...themeConfig.typography },
      photoCards: { ...DEFAULT_THEME.photoCards, ...themeConfig.photoCards },
      header: { ...DEFAULT_THEME.header, ...themeConfig.header },
      customText: { ...DEFAULT_THEME.customText, ...themeConfig.customText },
      logos: { ...DEFAULT_THEME.logos, ...(themeConfig.logos || {}), sponsors: (themeConfig.logos?.sponsors || DEFAULT_THEME.logos.sponsors) },
      social: { ...DEFAULT_THEME.social, ...themeConfig.social },
    };
  }

  // Fallback: build a basic theme from a primary color
  if (primaryColor) {
    return buildThemeFromColor(primaryColor);
  }

  return DEFAULT_THEME;
}

/** Build a minimal custom theme from a single primary color. */
function buildThemeFromColor(primaryColor: string): ThemeConfig {
  const isDark = !isLightColor(primaryColor);

  return {
    ...DEFAULT_THEME,
    mode: "custom",
    preset: undefined,
    colors: {
      primary: primaryColor,
      primaryForeground: isDark ? "#FFFFFF" : "#0F172A",
      secondary: isDark ? "#1E293B" : "#F1F5F9",
      secondaryForeground: isDark ? "#F8FAFC" : "#0F172A",
      accent: primaryColor,
      accentForeground: isDark ? "#FFFFFF" : "#0F172A",
    },
    background: {
      type: "gradient",
      gradient: {
        from: isDark ? "#0F172A" : "#F8FAFC",
        to: isDark ? "#020617" : "#FFFFFF",
        direction: "to-b",
      },
    },
    typography: {
      headingFont: "inter",
      titleColor: isDark ? "#FFFFFF" : "#0F172A",
      bodyColor: isDark ? "#CBD5E1" : "#475569",
    },
  };
}

/** Check if a hex color is light (for deciding text contrast). */
function isLightColor(hex: string): boolean {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  } catch {
    return false;
  }
}

// ============================================================
// CSS Custom Properties Application
// ============================================================

export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement;

  // Colors
  root.style.setProperty("--theme-primary", theme.colors.primary);
  root.style.setProperty("--theme-primary-fg", theme.colors.primaryForeground);
  root.style.setProperty("--theme-secondary", theme.colors.secondary);
  root.style.setProperty("--theme-secondary-fg", theme.colors.secondaryForeground);
  root.style.setProperty("--theme-accent", theme.colors.accent);
  root.style.setProperty("--theme-accent-fg", theme.colors.accentForeground);

  // Background
  if (theme.background.type === "gradient" && theme.background.gradient) {
    const { from, via, to, direction } = theme.background.gradient;
    const stops = via ? `${from}, ${via}, ${to}` : `${from}, ${to}`;
    root.style.setProperty("--theme-bg", `linear-gradient(${toCssDirection(direction)}, ${stops})`);
    root.style.setProperty("--theme-bg-image", "none");
  } else if (theme.background.type === "image" && theme.background.imageUrl) {
    root.style.setProperty("--theme-bg", "none");
    root.style.setProperty("--theme-bg-image", `url(${theme.background.imageUrl})`);
  } else {
    root.style.setProperty("--theme-bg", theme.background.solidColor || "#FFFFFF");
    root.style.setProperty("--theme-bg-image", "none");
  }

  // Overlay
  root.style.setProperty("--theme-overlay-opacity", String((theme.background.overlayOpacity || 0) / 100));
  root.style.setProperty("--theme-overlay-color", theme.background.overlayColor || "transparent");

  // Cards
  root.style.setProperty("--theme-card-bg", theme.header.style === "glass" ? "rgba(255, 255, 255, 0.08)" : theme.colors.secondary);
  root.style.setProperty("--theme-card-radius", `${theme.photoCards.borderRadius}px`);
  root.style.setProperty("--theme-card-shadow", shadowToCss(theme.photoCards.shadow));

  // Typography
  root.style.setProperty("--theme-title-color", theme.typography.titleColor);
  root.style.setProperty("--theme-body-color", theme.typography.bodyColor);
  root.style.setProperty("--theme-font-heading", fontFamilyMap[theme.typography.headingFont]);
}

// ============================================================
// Helpers
// ============================================================

const fontFamilyMap: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  montserrat: "'Montserrat', system-ui, sans-serif",
};

function toCssDirection(dir: string): string {
  const map: Record<string, string> = {
    "to-r": "to right",
    "to-br": "to bottom right",
    "to-b": "to bottom",
    "to-bl": "to bottom left",
    "to-tl": "to top left",
  };
  return map[dir] || "to bottom";
}

function shadowToCss(shadow: string): string {
  const map: Record<string, string> = {
    sm: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)",
    md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
    lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
    xl: "0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
  };
  return map[shadow] || map.md;
}

// ============================================================
// Gradient Builder (for preview)
// ============================================================

export function buildGradientCSS(gradient?: {
  from: string;
  via?: string;
  to: string;
  direction: string;
}): string {
  if (!gradient) return "";
  const stops = gradient.via
    ? `${gradient.from}, ${gradient.via}, ${gradient.to}`
    : `${gradient.from}, ${gradient.to}`;
  return `linear-gradient(${toCssDirection(gradient.direction)}, ${stops})`;
}

// ============================================================
// Preset Metadata (for UI selector)
// ============================================================

export const PRESET_META: Record<ThemePreset, { label: string; icon: string; description: string }> = {
  light: { label: "Light", icon: "☀️", description: "Clássico branco, limpo e minimalista" },
  dark: { label: "Dark", icon: "🌙", description: "Preto elegante, moderno e premium" },
  ocean: { label: "Ocean", icon: "🌊", description: "Azul profundo, calmo e sofisticado" },
  forest: { label: "Forest", icon: "🌿", description: "Verde natural, fresco e orgânico" },
  sunset: { label: "Sunset", icon: "🌅", description: "Degradê quente, energético e vibrante" },
  royal: { label: "Royal", icon: "👑", description: "Roxo luxuoso, exclusivo e premium" },
};
