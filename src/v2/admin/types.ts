/**
 * Conversor Audio V2 - Admin Types & Interfaces
 */

export type AdminTabV2 = 
  | "dashboard"
  | "ads"
  | "branding"
  | "monetization"
  | "analytics"
  | "seo"
  | "settings";

export interface AdminUserV2 {
  uid: string;
  email: string | null;
  role: "superadmin" | "admin";
}

export type AdFormatV2 =
  | "leaderboard" // 728x90
  | "medium_rectangle" // 300x250
  | "large_rectangle" // 336x280
  | "half_page" // 300x600
  | "mobile_banner" // 320x50
  | "responsive";

export type AdPositionV2 =
  | "header_top"
  | "sidebar_top"
  | "sidebar_bottom"
  | "footer_top"
  | "in_content_1"
  | "in_content_2";

export interface AdV2 {
  id: string;
  title: string;
  internalTitle?: string;
  publicTitle?: string;
  description?: string;
  buttonText?: string;
  format: AdFormatV2;
  position: AdPositionV2;
  imageUrl: string;
  storagePath?: string;
  destinationUrl: string;
  altText?: string;
  active: boolean;
  order?: number;
  clickCount?: number;
  lastClickedAt?: string | null;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeBannerV2 {
  id: string;
  name: string; // Nome do banner / título interno
  title?: string;
  imageUrl: string;
  storagePath?: string;
  linkUrl?: string; // Link opcional de destino
  destinationUrl?: string;
  order: number; // Ordem de exibição
  active: boolean; // Ativo / Inativo
  altText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandingConfigV2 {
  logoUrl: string;
  logoStoragePath?: string;
  logoAlt: string;
  siteName: string;
  logoDesktopWidth?: number;
  logoDesktopMaxHeight?: number;
  logoMobileWidth?: number;
  logoMobileMaxHeight?: number;
  updatedAt?: string;
}

export interface MonetizationConfigV2 {
  adsenseEnabled: boolean;
  publisherId: string;
  domain: string;
  mode: string;
  reviewStatus: string;
  notes: string;
  verificationSnippet?: string;
  verificationMetaTag?: string;
  verificationAdsTxtLine?: string;
  updatedAt?: string;
}
