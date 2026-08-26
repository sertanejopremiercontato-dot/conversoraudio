/**
 * Configuração Central do Domínio e Defaults de SEO
 * 
 * Source of Truth global para URLs canônicas, imagens sociais e metadados base.
 * Altere SITE_URL caso o domínio mude — todas as tags canônicas e sitemaps acompanharão automaticamente.
 */

export const SITE_URL = "https://www.conversoraudio.com.br";

export const SEO_DEFAULTS = {
  siteName: "Conversor de Áudio Online",
  defaultTitle: "Conversor de Áudio Online | MP3, WAV, Imagens, PDF e Documentos",
  defaultDescription: "Converta, edite e organize arquivos de áudio, imagens, PDFs e documentos online. Ferramentas rápidas, privadas e executadas diretamente no seu navegador.",
  defaultOgImage: `${SITE_URL}/og-cover.png`,
  twitterHandle: "@conversoraudio",
  defaultRobots: "index, follow",
  noindexRobots: "noindex, nofollow",
  locale: "pt_BR",
  themeColor: "#1D68F2"
};
