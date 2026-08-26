import React from "react";
import { SeoRouteKeyV2, PageSeoMetadata } from "./seoPages";
import { useSeoV2 } from "./useSeoV2";

export interface SeoHeadProps {
  routeKey?: SeoRouteKeyV2;
  customData?: Partial<PageSeoMetadata>;
}

/**
 * Componente declarativo para SEO da V2.
 * Não renderiza elementos visuais na árvore de UI.
 */
export const SeoHead: React.FC<SeoHeadProps> = ({ routeKey = "home", customData }) => {
  useSeoV2(routeKey, customData);
  return null;
};
