/**
 * Conversor Audio V2 - Central Site Configuration
 * 
 * Centraliza as configurações de marca, domínio e metadados base da V2.
 * Preparado para receber o novo domínio oficial assim que definido pelo usuário.
 */

export interface SiteConfigV2 {
  siteName: string;
  siteDomain: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  author: string;
  supportEmail: string;
  isDomainConfirmed: boolean;
}

export const SITE_CONFIG_V2: SiteConfigV2 = {
  siteName: "Conversor Audio",
  // Domínio provisório da V2 (será atualizado quando o usuário informar o domínio final)
  siteDomain: "conversoraudio.com.br",
  siteUrl: "https://www.conversoraudio.com.br",
  defaultTitle: "Conversor Audio — Ferramentas Rápidas para Áudio, Vídeo e Documentos",
  defaultDescription: "Converta e edite áudio, vídeo, imagens, PDF e documentos online diretamente no seu navegador com total privacidade e velocidade.",
  author: "Conversor Audio Team",
  supportEmail: "suporte@conversoraudio.com.br",
  isDomainConfirmed: false
};
