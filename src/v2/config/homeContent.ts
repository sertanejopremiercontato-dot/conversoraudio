import React from "react";
import { AppRouteV2 } from "../routes";

/**
 * Conversor Audio V2 - Configuração Central do Conteúdo da Home
 * 
 * Permite alterar facilmente textos, CTAs, imagens, banners promocionais,
 * links e badges da homepage sem quebrar o layout visual.
 */

export interface HeroContentConfig {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaRoute: AppRouteV2;
  secondaryCtaText: string;
  secondaryCtaTarget: string; // anchor ou route
  supportedFormats: string[];
  sideCards: Array<{
    id: string;
    title: string;
    description: string;
    ctaText: string;
    targetRoute: AppRouteV2;
    themeColor: "pink" | "blue" | "purple" | "green";
    badgeText?: string;
  }>;
}

export interface BenefitBarItem {
  id: string;
  title: string;
  description: string;
  iconName: "shield" | "zap" | "checkBadge" | "devices" | "cloud";
  iconColor: string;
  iconBg: string;
  iconBorder: string;
}

export interface ToolCardConfig {
  id: string;
  route: AppRouteV2;
  title: string;
  description: string;
  badge?: string;
  themeColor: "blue" | "pink" | "purple" | "red" | "green" | "cyan";
  highlights?: string[];
}

export interface PromoBannerConfig {
  id: string;
  enabled: boolean;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  ctaType: "external" | "route";
  targetRoute?: AppRouteV2;
  coverTitle: string;
  coverSubtitle: string;
  artists?: string[];
  gradientBg: string;
  accentColor: string;
}

export interface StepItemConfig {
  step: number;
  title: string;
  description: string;
  iconName: "upload" | "sliders" | "wand" | "download";
  colorTheme: "blue" | "green" | "purple" | "orange";
}

export interface WhyChooseItemConfig {
  id: string;
  title: string;
  description: string;
  iconName: "shield" | "headset" | "refresh" | "smile" | "users";
  colorTheme: "blue" | "indigo" | "cyan" | "amber" | "emerald";
}

export interface HomeContentConfig {
  hero: HeroContentConfig;
  benefitsBar: BenefitBarItem[];
  toolsGrid: ToolCardConfig[];
  promoBanner: PromoBannerConfig;
  steps: StepItemConfig[];
  whyChoose: WhyChooseItemConfig[];
}

export const DEFAULT_HOME_CONTENT: HomeContentConfig = {
  hero: {
    badge: "RÁPIDO • SEGURO • 100% ONLINE",
    title: "Converta, edite e",
    titleHighlight: "organize",
    subtitle: "Ferramentas profissionais para áudio, vídeo, imagens, PDFs e documentos. Tudo online, sem instalação e com total privacidade.",
    primaryCtaText: "Converter Agora",
    primaryCtaRoute: "audio",
    secondaryCtaText: "Explorar Ferramentas",
    secondaryCtaTarget: "#ferramentas",
    supportedFormats: ["MP3", "WAV", "AAC", "FLAC", "M4A", "MP4", "MKV", "MOV", "+50"],
    sideCards: [
      {
        id: "metadata-editor",
        title: "Editor de Metadados",
        description: "Edite título, artista, álbum, capa e muito mais. Deixe suas músicas organizadas e completas.",
        ctaText: "Abrir editor",
        targetRoute: "audioMetadata",
        themeColor: "pink",
        badgeText: "ANÁLISE GRATUITA"
      },
      {
        id: "video-to-audio",
        title: "Vídeo para Áudio",
        description: "Extraia o áudio de vídeos em MP4, MOV, MKV e vários outros formatos.",
        ctaText: "Abrir ferramenta",
        targetRoute: "videoToAudio",
        themeColor: "blue",
        badgeText: "EXTRAÇÃO SEM PERDA"
      }
    ]
  },
  benefitsBar: [
    {
      id: "secure-private",
      title: "Seguro e Privado",
      description: "Seus arquivos são protegidos e removidos automaticamente.",
      iconName: "shield",
      iconColor: "text-[#1D68F2]",
      iconBg: "bg-[#EFF6FF]",
      iconBorder: "border-[#BFDBFE]"
    },
    {
      id: "fast-efficient",
      title: "Rápido e Eficiente",
      description: "Processamento ultrarrápido direto no seu navegador.",
      iconName: "zap",
      iconColor: "text-[#10B981]",
      iconBg: "bg-[#ECFDF5]",
      iconBorder: "border-[#A7F3D0]"
    },
    {
      id: "guaranteed-quality",
      title: "Qualidade Garantida",
      description: "Conversões com a melhor qualidade de áudio e vídeo.",
      iconName: "checkBadge",
      iconColor: "text-[#8B5CF6]",
      iconBg: "bg-[#F5F3FF]",
      iconBorder: "border-[#DDD6FE]"
    },
    {
      id: "any-device",
      title: "Funciona em Qualquer Dispositivo",
      description: "Acesse de onde estiver, no celular, tablet ou computador.",
      iconName: "devices",
      iconColor: "text-[#F59E0B]",
      iconBg: "bg-[#FFFBEB]",
      iconBorder: "border-[#FDE68A]"
    },
    {
      id: "no-install",
      title: "Sem Instalação",
      description: "Tudo online. Você só precisa de um navegador.",
      iconName: "cloud",
      iconColor: "text-[#0284C7]",
      iconBg: "bg-[#F0F9FF]",
      iconBorder: "border-[#BAE6FD]"
    }
  ],
  toolsGrid: [
    {
      id: "audio-converter",
      route: "audio",
      title: "Conversor de Áudio",
      description: "Converta arquivos de áudio entre diversos formatos com qualidade e rapidez.",
      badge: "MAIS USADO",
      themeColor: "blue",
      highlights: ["MP3, WAV, M4A, AAC, OGG", "Bitrate 64k até 320k", "Conversão rápida no navegador"]
    },
    {
      id: "metadata-editor",
      route: "audioMetadata",
      title: "Editor de Metadados",
      description: "Edite informações de músicas como título, artista, álbum, capa e muito mais. Descubra e remova dados ocultos com limpeza forense.",
      badge: "ANÁLISE GRATUITA",
      themeColor: "pink",
      highlights: ["Detecta metadados ocultos", "Remove proveniência e rastros", "Edita ID3, artista, álbum e capa"]
    },
    {
      id: "video-to-audio",
      route: "videoToAudio",
      title: "Vídeo para Áudio",
      description: "Extraia o áudio de vídeos em MP4, MOV, MKV e vários outros formatos com qualidade.",
      badge: "EXTRAÇÃO SEM PERDA",
      themeColor: "purple",
      highlights: ["MP4, MOV, MKV, WebM", "Extração simples e rápida", "Sem instalação"]
    },
    {
      id: "pdf-tools",
      route: "pdf",
      title: "Ferramentas PDF",
      description: "Converta, junte, divida, comprima e organize seus arquivos PDF com segurança.",
      badge: "MULTIFUNÇÃO",
      themeColor: "red",
      highlights: ["Mesclar e dividir PDFs", "Comprimir arquivos PDF", "Reorganizar e extrair páginas"]
    },
    {
      id: "image-tools",
      route: "image",
      title: "Ferramentas de Imagem",
      description: "Converta, redimensione e edite suas imagens online com praticidade e leveza.",
      badge: "OTIMIZAÇÃO WEB",
      themeColor: "green",
      highlights: ["JPG, PNG, WebP, AVIF", "Compressão inteligente", "Corte e redimensionamento"]
    },
    {
      id: "document-tools",
      route: "document",
      title: "Documentos",
      description: "Converta arquivos entre Word, Excel, TXT e muitos outros formatos com praticidade.",
      badge: "PRODUTIVIDADE",
      themeColor: "cyan",
      highlights: ["Word, Excel, TXT para PDF", "Conversão simplificada", "Processamento seguro"]
    }
  ],
  promoBanner: {
    id: "playlist-brasil",
    enabled: true,
    tag: "MÚSICAS SEM LIMITES",
    title: "Playlist As Melhores do Brasil",
    subtitle: "Os maiores hits do momento em uma playlist atualizada para você!",
    ctaText: "Ouça no Spotify",
    ctaLink: "https://open.spotify.com",
    ctaType: "external",
    coverTitle: "AS MELHORES",
    coverSubtitle: "DO BRASIL",
    artists: ["Henrique & Juliano", "Jorge & Mateus", "Gusttavo Lima", "Ana Castela"],
    gradientBg: "from-[#081B4B] via-[#0D2566] to-[#1E3A8A]",
    accentColor: "#10B981"
  },
  steps: [
    {
      step: 1,
      title: "Envie seu arquivo",
      description: "Arraste e solte ou selecione o arquivo do seu dispositivo.",
      iconName: "upload",
      colorTheme: "blue"
    },
    {
      step: 2,
      title: "Escolha a opção",
      description: "Selecione o formato ou a ação que deseja realizar.",
      iconName: "sliders",
      colorTheme: "green"
    },
    {
      step: 3,
      title: "Processamos para você",
      description: "Nossa ferramenta processa seu arquivo rapidamente.",
      iconName: "wand",
      colorTheme: "purple"
    },
    {
      step: 4,
      title: "Baixe o resultado",
      description: "Faça o download do arquivo pronto para usar.",
      iconName: "download",
      colorTheme: "orange"
    }
  ],
  whyChoose: [
    {
      id: "privacy",
      title: "Privacidade Total",
      description: "Proteção e exclusão automática dos seus arquivos.",
      iconName: "shield",
      colorTheme: "blue"
    },
    {
      id: "support",
      title: "Suporte Completo",
      description: "Equipe pronta para ajudar sempre que precisar.",
      iconName: "headset",
      colorTheme: "indigo"
    },
    {
      id: "updates",
      title: "Atualizações Constantes",
      description: "Novas ferramentas e melhorias com frequência.",
      iconName: "refresh",
      colorTheme: "cyan"
    },
    {
      id: "intuitive",
      title: "Interface Intuitiva",
      description: "Fácil de usar, mesmo para iniciantes.",
      iconName: "smile",
      colorTheme: "amber"
    },
    {
      id: "trusted",
      title: "Confiado por Milhares",
      description: "Milhares de usuários satisfeitos todos os dias.",
      iconName: "users",
      colorTheme: "emerald"
    }
  ]
};
