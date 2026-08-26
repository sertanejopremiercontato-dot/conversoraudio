/**
 * Base Central de SEO por Rota (seoPages.ts)
 * 
 * Source of Truth única para meta tags, títulos, descrições, canonicals, 
 * Open Graph e dados estruturados da plataforma.
 */

import { SITE_URL, SEO_DEFAULTS } from "./seoConfig";
import { generateStructuredData } from "./structuredData";

export interface PageSeoMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  h1: string;
  keywords: string[];
  robots: string; // e.g. "index, follow" ou "noindex, nofollow"
  ogType: "website" | "article";
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: "summary_large_image" | "summary";
  jsonLd?: Record<string, any>;
}

export type SeoRouteKeyV2 =
  | "home"
  | "audio"
  | "audioMetadata"
  | "videoToAudio"
  | "pdf"
  | "pdfMerge"
  | "pdfCompress"
  | "image"
  | "imageConvert"
  | "imageCompress"
  | "imageResize"
  | "imageCrop"
  | "imageMetadata"
  | "document"
  | "comoFunciona"
  | "admin";

export const SEO_PAGES_REGISTRY: Record<SeoRouteKeyV2, PageSeoMetadata> = {
  home: {
    title: "Conversor de Áudio Online | MP3, WAV, Imagens, PDF e Documentos",
    description: "Converta, edite e organize arquivos de áudio, imagens, PDFs e documentos online. Ferramentas rápidas, privadas e executadas diretamente no navegador.",
    canonicalPath: "/",
    h1: "Converta, edite e organize seus arquivos de áudio e mídia",
    keywords: [
      "conversor de audio",
      "converter audio online",
      "converter mp3",
      "mp3 para wav",
      "wav para mp3",
      "video para audio",
      "extrair audio de video",
      "juntar pdf",
      "comprimir imagem",
      "converter arquivo online"
    ],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    ogTitle: "Conversor de Áudio Online | MP3, WAV, Imagens, PDF e Documentos",
    ogDescription: "Converta, edite e organize arquivos de áudio, imagens, PDFs e documentos online. Rápido, privado e 100% no navegador.",
    ogImage: SEO_DEFAULTS.defaultOgImage,
    twitterCard: "summary_large_image",
    jsonLd: generateStructuredData({
      path: "/",
      name: "Conversor de Áudio Online",
      description: "Plataforma web para conversão de áudio, extração de som de vídeos, edição de metadados, manipulação de PDFs e processamento de imagens.",
      type: "WebSite"
    })
  },

  audio: {
    title: "Conversor de Áudio Online | MP3, WAV, FLAC, M4A e Mais",
    description: "Converta arquivos de áudio online para MP3, WAV, FLAC, M4A, OGG e AAC com alta qualidade diretamente no seu navegador.",
    canonicalPath: "/audio",
    h1: "Conversor de Áudio Online de Alta Fidelidade",
    keywords: [
      "conversor de audio",
      "converter audio online",
      "converter mp3",
      "mp3 para wav",
      "wav para mp3",
      "converter flac",
      "converter m4a",
      "converter ogg",
      "converter aac",
      "converter audio gratis",
      "converter musica",
      "converter arquivo de audio"
    ],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    ogTitle: "Conversor de Áudio Online | MP3, WAV, FLAC, M4A e Mais",
    ogDescription: "Converta suas músicas e faixas de áudio com qualidade de estúdio (até 320kbps) de forma rápida e 100% privada no seu dispositivo.",
    ogImage: SEO_DEFAULTS.defaultOgImage,
    twitterCard: "summary_large_image",
    jsonLd: generateStructuredData({
      path: "/audio",
      name: "Conversor de Áudio Online",
      description: "Conversão profissional de formatos de áudio com controle de bitrate e taxa de amostragem no navegador.",
      applicationCategory: "AudioApplication"
    })
  },

  audioMetadata: {
    title: "Editor e Removedor de Metadados de Áudio Online",
    description: "Edite e remova metadados ID3, tags e informações ocultas de arquivos de áudio MP3, WAV e FLAC com privacidade total.",
    canonicalPath: "/audio/editor-metadados",
    h1: "Editor e Removedor de Metadados de Áudio",
    keywords: [
      "editor de metadados",
      "editar metadados mp3",
      "editar ID3",
      "remover metadados de audio",
      "limpar metadados",
      "editar tags mp3",
      "metadata wav",
      "remover ID3"
    ],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    ogTitle: "Editor e Removedor de Metadados de Áudio Online",
    ogDescription: "Edite tags ID3, adicione capas de álbum ou limpe todos os metadados de áudio para proteger sua privacidade.",
    ogImage: SEO_DEFAULTS.defaultOgImage,
    twitterCard: "summary_large_image",
    jsonLd: generateStructuredData({
      path: "/audio/editor-metadados",
      name: "Editor e Removedor de Metadados de Áudio Online",
      description: "Edição e remoção de metadados ID3v1 e ID3v2 de arquivos de áudio no navegador.",
      applicationCategory: "AudioApplication"
    })
  },

  videoToAudio: {
    title: "Vídeo para Áudio | Extraia MP3 de MP4, MOV e MKV",
    description: "Extraia o áudio de vídeos nos formatos MP4, MOV, MKV e WEBM para MP3 ou WAV de forma rápida e segura.",
    canonicalPath: "/video-para-audio",
    h1: "Extrair Áudio de Vídeo Online",
    keywords: [
      "video para audio",
      "video para mp3",
      "mp4 para mp3",
      "mov para mp3",
      "mkv para mp3",
      "extrair audio de video",
      "converter video em audio"
    ],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    ogTitle: "Vídeo para Áudio | Extraia MP3 de MP4, MOV e MKV",
    ogDescription: "Transforme qualquer vídeo em arquivo de áudio MP3 cristalino sem perda de qualidade.",
    ogImage: SEO_DEFAULTS.defaultOgImage,
    twitterCard: "summary_large_image",
    jsonLd: generateStructuredData({
      path: "/video-para-audio",
      name: "Vídeo para Áudio | Extraia MP3 de MP4, MOV e MKV",
      description: "Extração de faixas sonoras de arquivos de vídeo MP4, MOV e MKV para MP3 e WAV.",
      applicationCategory: "VideoApplication"
    })
  },

  pdf: {
    title: "Ferramentas PDF Online | Comprimir, Juntar e Converter PDF",
    description: "Comprima, junte, divida, organize e extraia texto de arquivos PDF online com processamento rápido e privado.",
    canonicalPath: "/pdf",
    h1: "Ferramentas de PDF Rápidas e Seguras",
    keywords: [
      "comprimir pdf",
      "reduzir pdf",
      "juntar pdf",
      "dividir pdf",
      "organizar pdf",
      "pdf para imagem",
      "imagem para pdf",
      "extrair texto pdf"
    ],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    ogTitle: "Ferramentas PDF Online | Comprimir, Juntar e Converter PDF",
    ogDescription: "Manipule seus arquivos PDF com segurança e velocidade diretamente no seu computador sem fila de espera.",
    ogImage: SEO_DEFAULTS.defaultOgImage,
    twitterCard: "summary_large_image",
    jsonLd: generateStructuredData({
      path: "/pdf",
      name: "Ferramentas PDF Online | Comprimir, Juntar e Converter PDF",
      description: "União, compressão e gerenciamento de arquivos PDF no navegador.",
      applicationCategory: "OfficeApplication"
    })
  },

  pdfMerge: {
    title: "Juntar PDF Online — Combinar Vários Documentos em Um Único PDF",
    description: "Junte múltiplos arquivos PDF em um único documento organizado. Reordene páginas, arraste e solte com total privacidade.",
    canonicalPath: "/pdf/juntar",
    h1: "Juntar e Combinar Arquivos PDF",
    keywords: ["juntar pdf", "combinar pdf", "mesclar pdf", "unir arquivos pdf online"],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    jsonLd: generateStructuredData({
      path: "/pdf/juntar",
      name: "Juntar PDF Online",
      description: "Mesclagem de arquivos PDF no navegador.",
      applicationCategory: "OfficeApplication"
    })
  },

  pdfCompress: {
    title: "Comprimir PDF Online — Reduzir Tamanho do Arquivo PDF",
    description: "Comprima documentos PDF e reduza o peso do arquivo sem perder nitidez de texto e imagens para envio por e-mail ou upload.",
    canonicalPath: "/pdf/comprimir",
    h1: "Comprimir Arquivo PDF Online",
    keywords: ["comprimir pdf", "reduzir tamanho pdf", "diminuir peso do pdf"],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    jsonLd: generateStructuredData({
      path: "/pdf/comprimir",
      name: "Comprimir PDF Online",
      description: "Compressão e otimização de arquivos PDF no navegador.",
      applicationCategory: "OfficeApplication"
    })
  },

  image: {
    title: "Ferramentas de Imagem Online | Converter, Comprimir e Redimensionar",
    description: "Converta, comprima, redimensione, corte e edite metadados de imagens JPG, PNG e WebP online diretamente no navegador.",
    canonicalPath: "/imagem",
    h1: "Ferramentas de Imagem Profissionais no Navegador",
    keywords: [
      "converter imagem",
      "comprimir imagem",
      "reduzir tamanho de imagem",
      "redimensionar imagem",
      "cortar imagem",
      "marca d'água",
      "jpg para png",
      "png para jpg",
      "webp",
      "editar metadados de imagem",
      "remover metadados de imagem"
    ],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    ogTitle: "Ferramentas de Imagem Online | Converter, Comprimir e Redimensionar",
    ogDescription: "Edição, conversão e compressão de imagens em massa sem upload para servidores.",
    ogImage: SEO_DEFAULTS.defaultOgImage,
    twitterCard: "summary_large_image",
    jsonLd: generateStructuredData({
      path: "/imagem",
      name: "Ferramentas de Imagem Online | Converter, Comprimir e Redimensionar",
      description: "Processamento de imagens PNG, JPG, WebP e AVIF diretamente no cliente.",
      applicationCategory: "ImageApplication"
    })
  },

  imageConvert: {
    title: "Converter Imagem Online — PNG, JPG, WebP, AVIF, BMP | Conversor Audio",
    description: "Converta imagens entre diversos formatos preservando transparência e qualidade de cor.",
    canonicalPath: "/imagem/converter",
    h1: "Conversor de Formatos de Imagem",
    keywords: ["converter imagem", "png para jpg", "jpg para png", "converter webp", "converter avif"],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    jsonLd: generateStructuredData({
      path: "/imagem/converter",
      name: "Conversor de Imagens",
      description: "Conversão entre formatos de imagens no navegador.",
      applicationCategory: "ImageApplication"
    })
  },

  imageCompress: {
    title: "Comprimir Imagem Online — Reduzir Tamanho de PNG, JPG e WebP",
    description: "Reduza os megabytes das suas imagens mantendo alta resolução visual para sites, redes sociais e e-mails.",
    canonicalPath: "/imagem/comprimir",
    h1: "Compressor de Imagens Inteligente",
    keywords: ["comprimir imagem", "reduzir tamanho foto", "otimizar png jpg webp"],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    jsonLd: generateStructuredData({
      path: "/imagem/comprimir",
      name: "Compressor de Imagens",
      description: "Compressão de fotos e imagens no navegador.",
      applicationCategory: "ImageApplication"
    })
  },

  imageResize: {
    title: "Redimensionar Imagem Online — Alterar Largura, Altura e DPI",
    description: "Ajuste dimensões em pixels ou porcentagem com preservação da proporção original e reamostragem suave.",
    canonicalPath: "/imagem/redimensionar",
    h1: "Redimensionar Imagens em Pixels",
    keywords: ["redimensionar imagem", "mudar tamanho foto", "alterar resolucao imagem"],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    jsonLd: generateStructuredData({
      path: "/imagem/redimensionar",
      name: "Redimensionar Imagem",
      description: "Ajuste de dimensões e resolução de imagens.",
      applicationCategory: "ImageApplication"
    })
  },

  imageCrop: {
    title: "Cortar Imagem Online — Proporções para Redes Sociais e Formatos Livres",
    description: "Corte imagens para 1:1, 16:9, 4:3, 9:16 ou formatos livres para Instagram, Stories e banners.",
    canonicalPath: "/imagem/cortar",
    h1: "Cortador de Fotos e Imagens",
    keywords: ["cortar imagem", "crop foto online", "enquadrar imagem"],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    jsonLd: generateStructuredData({
      path: "/imagem/cortar",
      name: "Cortador de Imagem",
      description: "Corte e enquadramento de fotos.",
      applicationCategory: "ImageApplication"
    })
  },

  imageMetadata: {
    title: "Editor e Limpador de Metadados de Imagem (EXIF) Online",
    description: "Inspecione e remova dados EXIF, localização GPS, modelo de câmera e dados pessoais de fotos.",
    canonicalPath: "/imagem/metadados",
    h1: "Editor e Limpador de Metadados EXIF",
    keywords: ["remover exif", "limpar metadados foto", "remover gps imagem", "editar tags exif"],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    jsonLd: generateStructuredData({
      path: "/imagem/metadados",
      name: "Editor EXIF de Imagens",
      description: "Inspeção e remoção de dados EXIF e localização de fotos.",
      applicationCategory: "ImageApplication"
    })
  },

  document: {
    title: "Ferramentas de Documentos Online",
    description: "Ferramentas online para conversão, visualização e extração de texto de documentos com total privacidade no navegador.",
    canonicalPath: "/documento",
    h1: "Utilitários e Conversores de Documentos",
    keywords: [
      "converter documentos",
      "ferramentas de documentos",
      "extrair texto",
      "pdf para txt",
      "documentos online"
    ],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "website",
    ogTitle: "Ferramentas de Documentos Online",
    ogDescription: "Ferramentas online para conversão, visualização e extração de texto de documentos com total privacidade no navegador.",
    ogImage: SEO_DEFAULTS.defaultOgImage,
    twitterCard: "summary_large_image",
    jsonLd: generateStructuredData({
      path: "/documento",
      name: "Ferramentas de Documentos Online",
      description: "Ferramentas online para conversão, visualização e extração de texto de documentos com total privacidade no navegador.",
      applicationCategory: "OfficeApplication"
    })
  },

  comoFunciona: {
    title: "Como Funciona | Conversor de Áudio & Mídia 100% no Navegador",
    description: "Entenda como a tecnologia de processamento local no navegador garante privacidade total e máxima velocidade na conversão dos seus arquivos.",
    canonicalPath: "/como-funciona",
    h1: "Processamento Seguro e Local no Seu Dispositivo",
    keywords: ["como converter audio", "processamento local navegador", "privacidade conversao arquivos"],
    robots: SEO_DEFAULTS.defaultRobots,
    ogType: "article",
    ogTitle: "Como Funciona o Conversor de Áudio & Mídia",
    ogDescription: "Seus arquivos não saem do seu computador ou celular. Tecnologia moderna em WebAssembly e Web Audio API.",
    ogImage: SEO_DEFAULTS.defaultOgImage,
    twitterCard: "summary_large_image"
  },

  admin: {
    title: "Painel de Administração | Conversor de Áudio",
    description: "Área restrita de gerenciamento e configurações.",
    canonicalPath: "/admin",
    h1: "Painel Administrativo",
    keywords: [],
    robots: SEO_DEFAULTS.noindexRobots,
    ogType: "website"
  }
};
