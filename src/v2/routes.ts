/**
 * Conversor Audio V2 - Routes Definition
 */

export type AppRouteV2 =
  | "home"
  | "audio"
  | "audioMetadata"
  | "videoToAudio"
  | "pdf"
  | "image"
  | "document"
  | "comoFunciona"
  | "admin";

export interface NavItemV2 {
  id: AppRouteV2;
  label: string;
  path: string;
  description: string;
  badge?: string;
}

export const NAV_ITEMS_V2: NavItemV2[] = [
  {
    id: "home",
    label: "Início",
    path: "/",
    description: "Página inicial com visão geral de todas as ferramentas"
  },
  {
    id: "audio",
    label: "Converter Áudio",
    path: "/audio",
    description: "Conversor de formatos de áudio com ajuste de bitrate"
  },
  {
    id: "audioMetadata",
    label: "Editor de Metadados",
    path: "/audio/editor-metadados",
    description: "Edição, visualização e limpeza de tags e capas de áudio"
  },
  {
    id: "videoToAudio",
    label: "Vídeo para Áudio",
    path: "/video-para-audio",
    description: "Extração rápida de áudio a partir de arquivos de vídeo"
  },
  {
    id: "pdf",
    label: "Ferramentas PDF",
    path: "/pdf",
    description: "Juntar, comprimir, organizar e converter arquivos PDF"
  },
  {
    id: "image",
    label: "Ferramentas de Imagem",
    path: "/imagem",
    description: "Converter, comprimir e redimensionar imagens online"
  },
  {
    id: "document",
    label: "Documentos",
    path: "/documento",
    description: "Conversão de planilhas e documentos com facilidade"
  },
  {
    id: "comoFunciona",
    label: "Como Funciona",
    path: "/como-funciona",
    description: "Entenda o fluxo rápido e seguro de processamento"
  }
];
