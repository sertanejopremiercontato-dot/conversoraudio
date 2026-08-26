/**
 * Conversor Audio V2 - SEO Types
 * 
 * Estrutura limpa, estática e sem acoplamento com Firestore/LocalStorage.
 */

export type { SeoRouteKeyV2, PageSeoMetadata } from "./seoPages";

export interface RouteSeoV2 {
  title: string;
  description: string;
  canonicalPath: string;
  h1: string;
  robots?: string;
  ogType?: "website" | "article";
}
