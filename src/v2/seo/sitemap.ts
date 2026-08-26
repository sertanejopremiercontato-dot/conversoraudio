/**
 * Mapa de Rotas Públicas para Sitemap e Indexação
 * 
 * Contém SOMENTE rotas públicas reais da aplicação.
 * Exclui deliberadamente: /admin, /login, /debug, previews e rotas internas.
 */

import { SITE_URL } from "./seoConfig";

export interface SitemapEntry {
  path: string;
  url: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  lastmod: string;
}

export const PUBLIC_SITEMAP_ROUTES: SitemapEntry[] = [
  {
    path: "/",
    url: `${SITE_URL}/`,
    changefreq: "daily",
    priority: 1.0,
    lastmod: "2026-08-25"
  },
  {
    path: "/audio",
    url: `${SITE_URL}/audio`,
    changefreq: "weekly",
    priority: 0.9,
    lastmod: "2026-08-25"
  },
  {
    path: "/audio/editor-metadados",
    url: `${SITE_URL}/audio/editor-metadados`,
    changefreq: "weekly",
    priority: 0.9,
    lastmod: "2026-08-25"
  },
  {
    path: "/video-para-audio",
    url: `${SITE_URL}/video-para-audio`,
    changefreq: "weekly",
    priority: 0.85,
    lastmod: "2026-08-25"
  },
  {
    path: "/pdf",
    url: `${SITE_URL}/pdf`,
    changefreq: "weekly",
    priority: 0.85,
    lastmod: "2026-08-25"
  },
  {
    path: "/pdf/juntar",
    url: `${SITE_URL}/pdf/juntar`,
    changefreq: "weekly",
    priority: 0.8,
    lastmod: "2026-08-25"
  },
  {
    path: "/pdf/comprimir",
    url: `${SITE_URL}/pdf/comprimir`,
    changefreq: "weekly",
    priority: 0.8,
    lastmod: "2026-08-25"
  },
  {
    path: "/imagem",
    url: `${SITE_URL}/imagem`,
    changefreq: "weekly",
    priority: 0.85,
    lastmod: "2026-08-25"
  },
  {
    path: "/imagem/converter",
    url: `${SITE_URL}/imagem/converter`,
    changefreq: "weekly",
    priority: 0.8,
    lastmod: "2026-08-25"
  },
  {
    path: "/imagem/comprimir",
    url: `${SITE_URL}/imagem/comprimir`,
    changefreq: "weekly",
    priority: 0.8,
    lastmod: "2026-08-25"
  },
  {
    path: "/imagem/redimensionar",
    url: `${SITE_URL}/imagem/redimensionar`,
    changefreq: "weekly",
    priority: 0.8,
    lastmod: "2026-08-25"
  },
  {
    path: "/imagem/cortar",
    url: `${SITE_URL}/imagem/cortar`,
    changefreq: "weekly",
    priority: 0.8,
    lastmod: "2026-08-25"
  },
  {
    path: "/imagem/metadados",
    url: `${SITE_URL}/imagem/metadados`,
    changefreq: "weekly",
    priority: 0.8,
    lastmod: "2026-08-25"
  },
  {
    path: "/documento",
    url: `${SITE_URL}/documento`,
    changefreq: "weekly",
    priority: 0.8,
    lastmod: "2026-08-25"
  }
];
