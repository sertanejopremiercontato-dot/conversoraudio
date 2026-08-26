/**
 * Gerador de Dados Estruturados Schema.org (JSON-LD)
 * 
 * Totalmente em conformidade com as diretrizes do Google:
 * - Sem avaliações falsas (no fake ratings/reviews)
 * - Sem contagens falsas de usuários
 * - Apenas dados reais da aplicação WebSite e WebApplication
 */

import { SITE_URL } from "./seoConfig";

export interface SchemaGeneratorOptions {
  path: string;
  name: string;
  description: string;
  type?: "WebSite" | "WebApplication" | "Organization";
  applicationCategory?: string;
}

export function generateStructuredData({
  path,
  name,
  description,
  type = "WebApplication",
  applicationCategory = "MultimediaApplication"
}: SchemaGeneratorOptions): Record<string, any> {
  const fullUrl = path === "/" ? SITE_URL : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (type === "WebSite") {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": name,
      "url": SITE_URL,
      "description": description,
      "inLanguage": "pt-BR",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": name,
    "url": fullUrl,
    "description": description,
    "applicationCategory": applicationCategory,
    "operatingSystem": "All modern browsers (Web / Cloud)",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "inLanguage": "pt-BR",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    }
  };
}
