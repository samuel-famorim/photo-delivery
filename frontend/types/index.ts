export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  date: string;
  logo_url: string | null;
  primary_color: string;
  custom_text: string | null;
  banner_url: string | null;
  sponsors_json: { name: string; logo_url: string }[];
  domain: string | null;
  is_active: boolean;
  theme_config?: ThemeConfig | null;
  created_at: string;
  updated_at: string;
  session_count: number;
  photo_count: number;
}

export interface Session {
  id: string;
  event_id: string;
  code: string;
  visitor_name: string;
  visitor_company: string | null;
  visitor_email: string | null;
  status: string;
  qr_code_url: string | null;
  photo_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface Photo {
  id: string;
  session_id: string;
  filename: string;
  original_name: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  file_path: string;
  created_at: string;
}

export interface PublicPhoto {
  id: string;
  filename: string;
  width: number | null;
  height: number | null;
  download_url: string;
}

export interface PublicSession {
  code: string;
  visitor_name: string;
  visitor_company: string | null;
  status: string;
  event_name: string;
  event_slug: string;
  event_date: string;
  event_logo_url: string | null;
  event_banner_url: string | null;
  event_primary_color: string;
  event_custom_text: string | null;
  event_sponsors: { name: string; logo_url: string }[];
  event_theme?: ThemeConfig | null;
  photos: PublicPhoto[];
  qr_code_url: string | null;
}

export interface DashboardStats {
  total_sessions: number;
  total_photos: number;
  total_downloads: number;
  total_size_bytes: number;
  sessions_per_day: { day: string; count: number }[];
  top_sessions: { id: string; visitor_name: string; code: string; download_count: number }[];
  active_event: { id: string; name: string; slug: string } | null;
}

export interface DownloadStats {
  total_downloads: number;
  single_downloads: number;
  zip_downloads: number;
  downloads_by_day: { day: string; count: number }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================
// Theme System Types
// ============================================================

export type ThemeMode = "custom" | "preset";
export type ThemePreset = "light" | "dark" | "ocean" | "forest" | "sunset" | "royal";
export type BackgroundType = "solid" | "gradient" | "image";
export type GradientDirection = "to-r" | "to-br" | "to-b" | "to-bl" | "to-tl";
export type HeaderStyle = "glass" | "solid" | "transparent";
export type HeadingFont = "inter" | "playfair" | "montserrat";
export type CardAspectRatio = "square" | "4/3" | "3/2";
export type CardShadow = "sm" | "md" | "lg" | "xl";
export type SlideshowTransition = "fade" | "slide" | "zoom";

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
}

export interface ThemeGradient {
  from: string;
  via?: string;
  to: string;
  direction: GradientDirection;
}

export interface ThemeBackground {
  type: BackgroundType;
  solidColor?: string;
  gradient?: ThemeGradient;
  imageUrl?: string;
  overlayOpacity?: number;
  overlayColor?: string;
}

export interface Sponsor {
  name: string;
  logoUrl: string;
  website?: string;
}

export interface ThemeLogos {
  eventLogo?: string;
  standLogo?: string;
  eventBanner?: string;
  sponsors: Sponsor[];
}

export interface ThemeSocial {
  instagram?: string;
  whatsapp?: string;
  linkedin?: string;
  website?: string;
  email?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ThemeTypography {
  headingFont: HeadingFont;
  titleColor: string;
  bodyColor: string;
}

export interface ThemePhotoCards {
  borderRadius: number;
  shadow: CardShadow;
  showDownloadButton: boolean;
  aspectRatio: CardAspectRatio;
}

export interface ThemeCustomText {
  titleTemplate: string;
  subtitleTemplate: string;
  footerText: string;
}

export interface TVOverlayConfig {
  showEventLogo: boolean;
  showStandLogo: boolean;
  showPhotoCounter: boolean;
  showVisitorName: boolean;
  showSocialLinks: boolean;
  showSponsors: boolean;
  logoPosition: "top" | "bottom";
  logoSize: "small" | "medium" | "large";
  overlayStyle: "glass" | "solid" | "minimal";
}

export interface TVSlideshowConfig {
  isPlaying: boolean;
  currentPhotoIndex: number;
  interval: number;
  transition: SlideshowTransition;
}

export interface ThemeConfig {
  mode: ThemeMode;
  preset?: ThemePreset;
  colors: ThemeColors;
  background: ThemeBackground;
  header: {
    style: HeaderStyle;
    glassOpacity?: number;
  };
  logos: ThemeLogos;
  social: ThemeSocial;
  typography: ThemeTypography;
  photoCards: ThemePhotoCards;
  customText: ThemeCustomText;
}
