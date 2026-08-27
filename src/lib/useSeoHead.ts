import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, getDoc } from "firebase/firestore";
import { SeoConfig, PageSeoItem, FaqItem } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

// Default seed SEO configuration
export const DEFAULT_SEO_CONFIG: SeoConfig = {
  siteName: "Conversor Áudio",
  defaultTitle: "Conversor Áudio — Conversor de Áudio Online Grátis",
  defaultDescription: "Converta áudios online com ferramentas simples, rápidas e seguras no Conversor Áudio.",
  canonicalUrl: "https://www.conversoraudio.com.br",
  language: "pt-BR",
  author: "Conversor Áudio",
  theme: "#0284c7",

  keywords: [
    "conversor audio",
    "conversor de audio",
    "converter mp3",
    "conversor mp3",
    "extrair audio de video",
    "cortar audio",
    "juntar audio",
    "comprimir audio",
    "editor de metadados de audio"
  ],

  openGraph: {
    title: "Conversor Áudio — Conversor de Áudio Online Grátis",
    description: "Converta áudios online com ferramentas simples, rápidas e seguras no Conversor Áudio.",
    image: "https://www.conversoraudio.com.br/og-cover.png",
    url: "https://www.conversoraudio.com.br",
    type: "website",
    siteName: "Conversor Áudio",
    locale: "pt_BR"
  },

  twitter: {
    card: "summary_large_image",
    title: "Conversor Áudio — Conversor de Áudio Online Grátis",
    description: "Converta áudios online com ferramentas simples, rápidas e seguras no Conversor Áudio.",
    image: "https://www.conversoraudio.com.br/og-cover.png"
  },

  robotsConfig: {
    allowIndexing: true,
    allowFollow: true,
    sitemapUrl: "https://www.conversoraudio.com.br/sitemap.xml",
    canonicalUrl: "https://www.conversoraudio.com.br",
    blockAdmin: true,
    blockPrivateRoutes: true,
    blockApi: true
  },

  structuredData: {
    webSiteName: "Conversor Áudio",
    appName: "Conversor Áudio",
    appCategory: "MultimediaApplication",
    operatingSystem: "Web/Browser",
    price: "0",
    priceCurrency: "BRL",
    browserRequirements: "Navegador Web com suporte a HTML5 e WebAssembly",
    description: "Ferramenta online gratuita para conversão rápida de áudios sem limites."
  },

  pages: {
    home: {
      title: "Conversor Áudio - Ferramentas de Conversão de Áudio Online Grátis",
      description: "Converta arquivos de áudio gratuitamente online. Rápido, seguro e sem instalação.",
      keywords: ["conversor de audio", "conversor audio", "conversor mp3", "converter audio"],
      canonicalUrl: "https://www.conversoraudio.com.br",
      allowIndexing: true,
      allowFollow: true
    },
    audio: {
      title: "Conversor de Áudio Online Grátis - MP3, WAV, AAC, OGG | Conversor Áudio",
      description: "Converta qualquer arquivo de áudio para MP3, WAV, AAC, OGG, M4A ou FLAC em alta fidelidade diretamente no seu navegador.",
      keywords: ["conversor mp3", "converter audio", "mp3 para wav", "audio converter"],
      canonicalUrl: "https://www.conversoraudio.com.br/audio",
      allowIndexing: true,
      allowFollow: true
    },
    audioMetadataEditor: {
      title: "Editor de Metadados de Áudio Online | MP3, WAV, FLAC e M4A",
      description: "Edite, analise e limpe metadados ID3, RIFF e VorbisComments de arquivos de áudio online sem recompresso ou perda de qualidade. 100% no navegador.",
      keywords: ["editor de metadados de áudio", "editar id3 mp3", "remover metadados audio", "editar capa mp3", "editor id3v2", "limpeza de privacidade audio", "metadata editor mp3 wav flac m4a"],
      canonicalUrl: "https://www.conversoraudio.com.br/audio/editor-metadados",
      allowIndexing: true,
      allowFollow: true
    },
    pdf: {
      title: "Ferramentas PDF Online Grátis - Juntar, Comprimir, Converter | Conversor Áudio",
      description: "Edite seus arquivos PDF gratuitamente: junte múltiplos PDFs, reduza o tamanho mantendo a qualidade, converta imagens JPG/PNG para PDF e reordene páginas.",
      keywords: ["juntar pdf", "comprimir pdf", "imagem para pdf", "organizar pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf",
      allowIndexing: true,
      allowFollow: true
    },
    merge: {
      title: "Juntar PDF Online Grátis — Combine Múltiplos PDFs | Conversor Áudio",
      description: "Combine múltiplos arquivos PDF em um único documento de forma rápida, gratuita e segura. Organize a ordem das páginas e baixe instantaneamente.",
      keywords: ["juntar pdf", "combinar pdf", "mesclar pdf", "unir pdf", "juntar arquivos pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/juntar-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    pdf_merge: {
      title: "Juntar PDF Online Grátis — Combine Múltiplos PDFs | Conversor Áudio",
      description: "Combine múltiplos arquivos PDF em um único documento de forma rápida, gratuita e segura. Organize a ordem das páginas e baixe instantaneamente.",
      keywords: ["juntar pdf", "combinar pdf", "mesclar pdf", "unir pdf", "juntar arquivos pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/juntar-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    compress: {
      title: "Comprimir PDF Online Grátis — Reduzir Tamanho | Conversor Áudio",
      description: "Reduza o tamanho dos seus arquivos PDF mantendo a melhor qualidade visual. Processamento rápido, ilimitado e direto no seu navegador.",
      keywords: ["comprimir pdf", "reduzir tamanho pdf", "diminuir pdf", "otimizar pdf", "compactar pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/comprimir-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    pdf_compress: {
      title: "Comprimir PDF Online Grátis — Reduzir Tamanho | Conversor Áudio",
      description: "Reduza o tamanho dos seus arquivos PDF mantendo a melhor qualidade visual. Processamento rápido, ilimitado e direto no seu navegador.",
      keywords: ["comprimir pdf", "reduzir tamanho pdf", "diminuir pdf", "otimizar pdf", "compactar pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/comprimir-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    organize: {
      title: "Organizar Páginas de PDF Online Grátis | Conversor Áudio",
      description: "Reordene, mova e reorganize as páginas do seu documento PDF com facilidade. Interface simples, rápida e 100% segura.",
      keywords: ["organizar pdf", "reordenar paginas pdf", "mudar ordem paginas pdf", "organizador de pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/organizar-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    pdf_organize: {
      title: "Organizar Páginas de PDF Online Grátis | Conversor Áudio",
      description: "Reordene, mova e reorganize as páginas do seu documento PDF com facilidade. Interface simples, rápida e 100% segura.",
      keywords: ["organizar pdf", "reordenar paginas pdf", "mudar ordem paginas pdf", "organizador de pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/organizar-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    girar: {
      title: "Girar Páginas de PDF Online Grátis | Conversor Áudio",
      description: "Gire a orientação de páginas específicas ou de todo o arquivo PDF para a esquerda ou direita sem perdas de qualidade.",
      keywords: ["girar pdf", "rotacionar pdf", "virar pagina pdf", "girar pdf online"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/girar-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    pdf_girar: {
      title: "Girar Páginas de PDF Online Grátis | Conversor Áudio",
      description: "Gire a orientação de páginas específicas ou de todo o arquivo PDF para a esquerda ou direita sem perdas de qualidade.",
      keywords: ["girar pdf", "rotacionar pdf", "virar pagina pdf", "girar pdf online"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/girar-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    excluir: {
      title: "Excluir Páginas de PDF Online Grátis | Conversor Áudio",
      description: "Remova páginas indesejadas do seu arquivo PDF em poucos cliques e baixe um novo documento limpo e otimizado.",
      keywords: ["excluir paginas pdf", "remover pagina pdf", "deletar pagina pdf", "apagar pagina pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/excluir-paginas",
      allowIndexing: true,
      allowFollow: true
    },
    pdf_excluir: {
      title: "Excluir Páginas de PDF Online Grátis | Conversor Áudio",
      description: "Remova páginas indesejadas do seu arquivo PDF em poucos cliques e baixe um novo documento limpo e otimizado.",
      keywords: ["excluir paginas pdf", "remover pagina pdf", "deletar pagina pdf", "apagar pagina pdf"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/excluir-paginas",
      allowIndexing: true,
      allowFollow: true
    },
    imgToPdf: {
      title: "Imagens para PDF Grátis: JPG, PNG e WEBP | Conversor Áudio",
      description: "Transforme imagens JPG, PNG e WEBP em um único arquivo PDF, organize a ordem das páginas e baixe gratuitamente.",
      keywords: ["imagens para PDF", "JPG para PDF", "PNG para PDF", "WEBP para PDF", "converter imagem em PDF"],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/imagens-para-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    howItWorks: {
      title: "Como Funciona | Conversor Áudio",
      description: "Saiba como utilizar o Conversor Áudio para converter áudios com máxima privacidade e processamento instantâneo.",
      keywords: ["como funciona conversor audio", "privacidade conversor audio", "tutorial conversor"],
      canonicalUrl: "https://www.conversoraudio.com.br/como-funciona",
      allowIndexing: true,
      allowFollow: true
    },
    videoToAudio: {
      title: "Extrair Áudio de Vídeo para MP3 ou WAV | Conversor Áudio",
      description: "Extraia o áudio de vídeos MP4, MOV, M4V e WebM para MP3 ou WAV diretamente no navegador do computador, sem enviar arquivos para servidores.",
      keywords: [
        "extrair áudio de vídeo",
        "vídeo para MP3",
        "vídeo para WAV",
        "converter vídeo para MP3",
        "converter vídeo para WAV",
        "MP4 para MP3",
        "MP4 para WAV",
        "MOV para MP3",
        "MOV para WAV",
        "M4V para MP3",
        "WebM para MP3",
        "extrair som de vídeo",
        "converter vídeo em áudio",
        "conversor de vídeo para áudio",
        "conversor de vídeo no computador",
        "extrair áudio online grátis",
        "conversor audio"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/video-para-audio",
      allowIndexing: true,
      allowFollow: true
    },
    imagesToPdf: {
      title: "Imagens para PDF Grátis: JPG, PNG e WEBP | Conversor Áudio",
      description: "Transforme imagens JPG, PNG e WEBP em um único arquivo PDF, organize a ordem das páginas e baixe gratuitamente.",
      keywords: [
        "imagens para PDF",
        "JPG para PDF",
        "PNG para PDF",
        "WEBP para PDF",
        "converter imagem em PDF",
        "transformar foto em PDF",
        "juntar imagens em PDF",
        "criar PDF com imagens",
        "fotos para PDF",
        "converter JPG para PDF grátis",
        "converter PNG para PDF online"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/imagens-para-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    pdfToImages: {
      title: "PDF para JPG ou PNG Grátis | Conversor Áudio",
      description: "Converta páginas de PDF para imagens JPG ou PNG, escolha a resolução e baixe individualmente ou em arquivo ZIP.",
      keywords: [
        "PDF para JPG",
        "PDF para PNG",
        "converter PDF em imagem",
        "transformar PDF em JPG",
        "PDF em PNG",
        "extrair páginas do PDF como imagem",
        "converter PDF para imagens grátis",
        "baixar páginas do PDF em JPG",
        "PDF para imagem online"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/pdf-para-imagens",
      allowIndexing: true,
      allowFollow: true
    },
    imageConverter: {
      title: "Conversor de Imagens Grátis: JPG, PNG, WEBP e AVIF | Conversor Áudio",
      description: "Converta imagens entre JPG, PNG, WEBP, AVIF e BMP gratuitamente, com qualidade personalizada e download em lote.",
      keywords: [
        "conversor de imagens",
        "converter JPG para PNG",
        "converter PNG para JPG",
        "WEBP para PNG",
        "WEBP para JPG",
        "AVIF para JPG",
        "BMP para PNG",
        "converter foto online",
        "conversor de imagem gratis"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/imagem/converter",
      allowIndexing: true,
      allowFollow: true
    },
    imageCompressor: {
      title: "Comprimir Imagem Grátis: JPG, PNG e WEBP | Conversor Áudio",
      description: "Reduza o tamanho de imagens JPG, PNG, WEBP e AVIF gratuitamente, mantendo uma boa qualidade e baixando individualmente ou em ZIP.",
      keywords: [
        "comprimir imagem",
        "reduzir tamanho de imagem",
        "diminuir imagem",
        "comprimir JPG",
        "comprimir PNG",
        "comprimir WEBP",
        "reduzir MB da foto",
        "diminuir tamanho da foto",
        "otimizar imagem",
        "compactar imagem",
        "compressor de imagem grátis",
        "reduzir peso da imagem",
        "comprimir fotos online",
        "diminuir KB da imagem",
        "reduzir tamanho JPG"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/imagem/comprimir",
      allowIndexing: true,
      allowFollow: true
    },
    imageResizer: {
      title: "Redimensionar Imagem Grátis em Pixels e Porcentagem | Conversor Áudio",
      description: "Redimensione imagens JPG, PNG, WEBP e AVIF em pixels, porcentagem ou tamanhos prontos, com download individual ou em lote.",
      keywords: [
        "redimensionar imagem",
        "alterar tamanho de imagem",
        "diminuir imagem",
        "aumentar imagem",
        "mudar largura e altura da foto",
        "redimensionar JPG",
        "redimensionar PNG",
        "redimensionar WEBP",
        "imagem 1080x1080",
        "imagem 1080x1920",
        "imagem 1280x720",
        "redimensionar foto online",
        "alterar pixels da imagem",
        "redimensionar imagem grátis"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/imagem/redimensionar",
      allowIndexing: true,
      allowFollow: true
    },
    imageCropper: {
      title: "Cortar Imagem Grátis e Criar Tamanhos para Redes Sociais | Conversor Áudio",
      description: "Recorte imagens livremente ou crie vários tamanhos prontos para Instagram, YouTube, Facebook, TikTok e documentos de uma só vez.",
      keywords: [
        "cortar imagem",
        "recortar foto online",
        "cortar foto gratis",
        "cortar imagem instagram",
        "recortar foto 3x4",
        "pacote de cortes",
        "cortar foto 1080x1080",
        "cortar foto para stories",
        "cortar imagem youtube thumbnail"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/imagem/cortar",
      allowIndexing: true,
      allowFollow: true
    },
    imageRotateFlip: {
      title: "Girar e Espelhar Imagem Grátis Online | Conversor Áudio",
      description: "Gire imagens para esquerda ou direita, espelhe fotos e corrija a orientação de várias imagens de uma só vez.",
      keywords: [
        "girar imagem",
        "girar foto",
        "rotacionar imagem",
        "espelhar imagem",
        "inverter imagem",
        "espelhar foto",
        "girar imagem 90 graus",
        "girar foto online",
        "corrigir orientação de foto",
        "foto deitada",
        "imagem invertida",
        "girar várias imagens",
        "espelhar imagens em lote"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/imagem/girar-espelhar",
      allowIndexing: true,
      allowFollow: true
    },
    image_watermark: {
      title: "Adicionar Marca d’Água em Fotos e Imagens Grátis | Conversor Áudio",
      description: "Adicione texto, logotipo ou marca repetida em várias imagens, com prévia, presets e download em lote.",
      keywords: [
        "marca d’água em imagem",
        "colocar marca d’água",
        "adicionar logotipo em foto",
        "colocar nome na imagem",
        "proteger fotos",
        "marca d’água online",
        "marca d’água em lote",
        "colocar marca em várias fotos",
        "adicionar texto em imagem",
        "proteger imagem com marca d’água",
        "marca repetida em foto"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/imagem/marca-dagua",
      allowIndexing: true,
      allowFollow: true
    },
    image_background_removal: {
      title: "Remover Fundo de Imagem Grátis e Manualmente | Conversor Áudio",
      description: "Remova fundo branco, preto, verde ou colorido usando seleção por cor, varinha mágica e pincéis de precisão.",
      keywords: [
        "remover fundo de imagem",
        "tirar fundo branco",
        "remover fundo verde",
        "fundo transparente",
        "varinha mágica imagem",
        "remover fundo manualmente",
        "apagar fundo de foto",
        "tirar fundo de produto",
        "remover chroma key",
        "selecionar fundo por cor",
        "PNG transparente"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/imagem/remover-fundo",
      allowIndexing: false,
      allowFollow: false
    },
    pdf_extract_text: {
      title: "Extrair Texto de PDF Grátis e Converter PDF para TXT | Conversor Áudio",
      description: "Extraia texto de arquivos PDF, copie o conteúdo ou baixe em TXT de forma rápida e gratuita.",
      keywords: [
        "extrair texto de PDF",
        "copiar texto de PDF",
        "PDF para TXT",
        "converter PDF em texto",
        "tirar texto de PDF",
        "extrair conteúdo de PDF",
        "copiar PDF",
        "PDF para texto online",
        "extrair texto grátis",
        "baixar texto de PDF"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/pdf/extrair-texto",
      allowIndexing: true,
      allowFollow: true
    },
    excelToPdf: {
      title: "Excel para PDF Grátis - Converter XLSX, XLS e CSV em PDF | Conversor Áudio",
      description: "Converta planilhas Excel (XLSX, XLS) e arquivos CSV para PDF gratuitamente. Selecione abas, ajuste a orientação da página e gere documentos prontos para impressão.",
      keywords: [
        "Excel para PDF",
        "converter XLSX para PDF",
        "XLSX em PDF",
        "converter XLS para PDF",
        "planilha para PDF",
        "converter Excel em PDF grátis"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/documento/excel-para-pdf",
      allowIndexing: false,
      allowFollow: false
    },
    wordToPdf: {
      title: "Converter Word para PDF Grátis e Online | Conversor Áudio",
      description: "Converta documentos Word DOCX para PDF online, mantendo textos, imagens, listas e tabelas. Processamento local, gratuito e seguro.",
      keywords: [
        "Word para PDF",
        "converter DOCX para PDF",
        "DOCX em PDF",
        "converter Word em PDF"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/document/word-to-pdf",
      allowIndexing: false,
      allowFollow: false
    },
    documentHub: {
      title: "Ferramentas de Documentos Online Grátis | Conversor Áudio",
      description: "Suíte de ferramentas para conversão e manipulação de documentos de escritório: Excel para PDF, Extrair Texto e mais de forma rápida e segura.",
      keywords: [
        "ferramentas de documentos",
        "conversor de documentos",
        "Excel para PDF",
        "extrair texto de PDF",
        "documentos online grátis"
      ],
      canonicalUrl: "https://www.conversoraudio.com.br/documento",
      allowIndexing: true,
      allowFollow: true
    }
  },

  faqList: [
    {
      id: "faq-1",
      question: "O Conversor Áudio é 100% gratuito?",
      answer: "Sim! Todas as nossas ferramentas de áudio são completamente gratuitas e ilimitadas, sem necessidade de cadastro."
    },
    {
      id: "faq-2",
      question: "Meus arquivos são salvos ou mantidos no servidor?",
      answer: "Não. Garantimos sua total privacidade. O processamento dos seus arquivos é feito diretamente no seu navegador, sem envio de áudios a servidores."
    },
    {
      id: "faq-3",
      question: "Quais formatos de áudio são suportados?",
      answer: "Aceitamos os principais formatos de áudio incluindo MP3, WAV, AAC, OGG, M4A, FLAC, WMA, OPUS e AIFF para conversão em alta definição."
    },
    {
      id: "faq-4",
      question: "Como extrair áudio de um vídeo?",
      answer: "Acesse a ferramenta 'Extrair Áudio de Vídeo', selecione o arquivo de vídeo MP4, MOV ou WebM e escolha o formato de saída MP3 ou WAV."
    }
  ]
};

// Singleton DB instance
function getFirestoreDb() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
}

// Helper to sanitize SEO config and purge legacy Multiconvert/SomDrive/Convertauto references
export function sanitizeSeoConfig(input: Partial<SeoConfig> | null | undefined, defaultConfig: SeoConfig = DEFAULT_SEO_CONFIG): SeoConfig {
  if (!input) return defaultConfig;

  const replaceLegacyText = (text: string | undefined, fallback: string): string => {
    if (!text || typeof text !== "string") return fallback;
    let clean = text
      .replace(/conversor\s*somdrive/gi, "Conversor Áudio")
      .replace(/somdrive/gi, "Conversor Áudio")
      .replace(/convertauto/gi, "Conversor Áudio")
      .replace(/multiconverte/gi, "Conversor Áudio")
      .replace(/multiconvert/gi, "Conversor Áudio")
      .replace(/https?:\/\/conversor\.somdrive\.com\.br\/?/gi, "https://www.conversoraudio.com.br/")
      .replace(/https?:\/\/somdrive\.com\.br\/?/gi, "https://www.conversoraudio.com.br/")
      .replace(/https?:\/\/somdrive\.com\/?/gi, "https://www.conversoraudio.com.br/")
      .replace(/https?:\/\/multiconverte\.com\.br\/?/gi, "https://www.conversoraudio.com.br/")
      .replace(/https?:\/\/multiconvert\.com\.br\/?/gi, "https://www.conversoraudio.com.br/")
      .replace(/https?:\/\/convertauto\.com\.br\/?/gi, "https://www.conversoraudio.com.br/");

    return clean.trim();
  };

  const sanitizeKeywords = (kws: string[] | undefined, defaultKws: string[]): string[] => {
    if (!Array.isArray(kws) || kws.length === 0) return defaultKws;
    const cleaned = kws
      .map(k => replaceLegacyText(k, ""))
      .filter(k => k && k.length > 0 && !k.toLowerCase().includes("somdrive") && !k.toLowerCase().includes("convertauto") && !k.toLowerCase().includes("multiconvert"));
    
    if (!cleaned.some(k => k.toLowerCase() === "conversor audio" || k.toLowerCase() === "conversor de audio")) {
      cleaned.unshift("Conversor Áudio");
    }
    return Array.from(new Set(cleaned));
  };

  const siteName = replaceLegacyText(input.siteName, defaultConfig.siteName);
  const defaultTitle = replaceLegacyText(input.defaultTitle, defaultConfig.defaultTitle);
  let defaultDescription = replaceLegacyText(input.defaultDescription, defaultConfig.defaultDescription);

  if (defaultDescription.length > 200 || defaultDescription.includes("converte audio mp3") || defaultDescription.includes("Online Audio Converter")) {
    defaultDescription = defaultConfig.defaultDescription;
  }

  let canonicalUrl = replaceLegacyText(input.canonicalUrl, defaultConfig.canonicalUrl);
  if (!canonicalUrl.startsWith("https://www.conversoraudio.com.br")) {
    canonicalUrl = "https://www.conversoraudio.com.br/";
  }

  const author = replaceLegacyText(input.author, defaultConfig.author);

  const openGraph = {
    ...defaultConfig.openGraph,
    ...(input.openGraph || {}),
    title: replaceLegacyText(input.openGraph?.title, defaultConfig.openGraph.title),
    description: replaceLegacyText(input.openGraph?.description, defaultConfig.openGraph.description),
    image: (input.openGraph?.image?.includes("somdrive") || input.openGraph?.image?.includes("multiconvert")) ? defaultConfig.openGraph.image : (input.openGraph?.image || defaultConfig.openGraph.image),
    url: replaceLegacyText(input.openGraph?.url, defaultConfig.openGraph.url),
    siteName: replaceLegacyText(input.openGraph?.siteName, defaultConfig.openGraph.siteName)
  };

  const twitter = {
    ...defaultConfig.twitter,
    ...(input.twitter || {}),
    title: replaceLegacyText(input.twitter?.title, defaultConfig.twitter.title),
    description: replaceLegacyText(input.twitter?.description, defaultConfig.twitter.description),
    image: (input.twitter?.image?.includes("somdrive") || input.twitter?.image?.includes("multiconvert")) ? defaultConfig.twitter.image : (input.twitter?.image || defaultConfig.twitter.image)
  };

  const robotsConfig = {
    ...defaultConfig.robotsConfig,
    ...(input.robotsConfig || {}),
    canonicalUrl: replaceLegacyText(input.robotsConfig?.canonicalUrl, defaultConfig.robotsConfig.canonicalUrl),
    sitemapUrl: replaceLegacyText(input.robotsConfig?.sitemapUrl, defaultConfig.robotsConfig.sitemapUrl)
  };

  const structuredData = {
    ...defaultConfig.structuredData,
    ...(input.structuredData || {}),
    webSiteName: replaceLegacyText(input.structuredData?.webSiteName, defaultConfig.structuredData.webSiteName),
    appName: replaceLegacyText(input.structuredData?.appName, defaultConfig.structuredData.appName),
    description: replaceLegacyText(input.structuredData?.description, defaultConfig.structuredData.description)
  };

  const rawPages = input.pages || {};
  const sanitizedPages = { ...defaultConfig.pages } as typeof defaultConfig.pages;

  for (const pageKey of Object.keys(defaultConfig.pages)) {
    const rawPage = rawPages[pageKey] || {};
    const defaultPage = defaultConfig.pages[pageKey];

    sanitizedPages[pageKey] = {
      ...defaultPage,
      ...rawPage,
      title: replaceLegacyText(rawPage.title, defaultPage.title),
      description: replaceLegacyText(rawPage.description, defaultPage.description),
      canonicalUrl: replaceLegacyText(rawPage.canonicalUrl, defaultPage.canonicalUrl),
      keywords: sanitizeKeywords(rawPage.keywords, defaultPage.keywords || []),
      ogTitle: rawPage.ogTitle ? replaceLegacyText(rawPage.ogTitle, defaultPage.ogTitle || "") : undefined,
      ogDescription: rawPage.ogDescription ? replaceLegacyText(rawPage.ogDescription, defaultPage.ogDescription || "") : undefined,
      ogImage: rawPage.ogImage && !rawPage.ogImage.includes("somdrive") ? rawPage.ogImage : undefined
    };
  }

  const rawFaq = input.faqList || defaultConfig.faqList;
  const sanitizedFaq = rawFaq.map(item => ({
    ...item,
    question: replaceLegacyText(item.question, item.question),
    answer: replaceLegacyText(item.answer, item.answer)
  }));

  return {
    ...defaultConfig,
    ...input,
    siteName,
    defaultTitle,
    defaultDescription,
    canonicalUrl,
    language: input.language || defaultConfig.language,
    author,
    theme: input.theme || defaultConfig.theme,
    keywords: sanitizeKeywords(input.keywords, defaultConfig.keywords),
    openGraph,
    twitter,
    robotsConfig,
    structuredData,
    pages: sanitizedPages,
    faqList: sanitizedFaq,
    siteLogoUrl: input.siteLogoUrl || defaultConfig.siteLogoUrl
  };
}

// React Hook to inject SEO tags dynamically into DOM <head>
export function useSeoHead(routeKey: string = "home", customTitle?: string, customDescription?: string) {
  const [seoConfig, setSeoConfig] = useState<SeoConfig>(DEFAULT_SEO_CONFIG);

  useEffect(() => {
    try {
      const db = getFirestoreDb();
      const seoRef = doc(db, "site_settings", "seo");

      const unsubscribe = onSnapshot(seoRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<SeoConfig>;
          setSeoConfig(sanitizeSeoConfig(data, DEFAULT_SEO_CONFIG));
        }
      }, (err) => {
        console.warn("[SEO HEAD] Listener on site_settings/seo failed, fallback default:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("[SEO HEAD] Error setting up listener:", e);
    }
  }, []);

  useEffect(() => {
    // Determine active page SEO settings
    const pageItem: PageSeoItem | undefined = seoConfig.pages[routeKey];
    
    const pageTitle = customTitle || pageItem?.title || seoConfig.defaultTitle || DEFAULT_SEO_CONFIG.defaultTitle;
    const pageDescription = customDescription || pageItem?.description || seoConfig.defaultDescription || DEFAULT_SEO_CONFIG.defaultDescription;
    const pageCanonical = pageItem?.canonicalUrl || seoConfig.canonicalUrl || DEFAULT_SEO_CONFIG.canonicalUrl;
    
    const pageKeywords = (pageItem?.keywords && pageItem.keywords.length > 0)
      ? pageItem.keywords.join(", ")
      : (seoConfig.keywords || []).join(", ");

    const ogTitle = pageItem?.ogTitle || seoConfig.openGraph?.title || pageTitle;
    const ogDesc = pageItem?.ogDescription || seoConfig.openGraph?.description || pageDescription;
    const ogImg = pageItem?.ogImage || seoConfig.openGraph?.image || DEFAULT_SEO_CONFIG.openGraph.image;

    const allowIndexing = pageItem?.allowIndexing !== undefined ? pageItem.allowIndexing : seoConfig.robotsConfig.allowIndexing;
    const allowFollow = pageItem?.allowFollow !== undefined ? pageItem.allowFollow : seoConfig.robotsConfig.allowFollow;

    // Is admin route?
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    const robotsStr = (isAdminRoute && seoConfig.robotsConfig.blockAdmin)
      ? "noindex, nofollow"
      : `${allowIndexing ? "index" : "noindex"}, ${allowFollow ? "follow" : "nofollow"}`;

    // 1. Title
    document.title = pageTitle;

    // Helper helper to set or update meta element
    const setMeta = (attrName: string, attrVal: string, contentVal: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute("content", contentVal);
    };

    // Helper to set link canonical
    const setCanonical = (hrefVal: string) => {
      let el = document.querySelector(`link[rel="canonical"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", "canonical");
        document.head.appendChild(el);
      }
      el.setAttribute("href", hrefVal);
    };

    // Helper to inject JSON-LD
    const setJsonLd = (id: string, jsonObj: any) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("script");
        el.setAttribute("id", id);
        el.setAttribute("type", "application/ld+json");
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(jsonObj);
    };

    // Apply Meta Tags
    setMeta("name", "description", pageDescription);
    setMeta("name", "keywords", pageKeywords);
    setMeta("name", "author", seoConfig.author || DEFAULT_SEO_CONFIG.author);
    setMeta("name", "robots", robotsStr);
    setMeta("name", "theme-color", seoConfig.theme || DEFAULT_SEO_CONFIG.theme);

    // Open Graph Tags
    setMeta("property", "og:title", ogTitle);
    setMeta("property", "og:description", ogDesc);
    setMeta("property", "og:image", ogImg);
    setMeta("property", "og:url", pageCanonical);
    setMeta("property", "og:type", seoConfig.openGraph.type || "website");
    setMeta("property", "og:site_name", seoConfig.openGraph.siteName || seoConfig.siteName);
    setMeta("property", "og:locale", seoConfig.openGraph.locale || "pt_BR");

    // Twitter Card Tags
    setMeta("name", "twitter:card", seoConfig.twitter.card || "summary_large_image");
    setMeta("name", "twitter:title", seoConfig.twitter.title || ogTitle);
    setMeta("name", "twitter:description", seoConfig.twitter.description || ogDesc);
    setMeta("name", "twitter:image", seoConfig.twitter.image || ogImg);

    // Canonical link
    setCanonical(pageCanonical);

    // JSON-LD 1: WebSite Schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": seoConfig.structuredData.webSiteName || seoConfig.siteName,
      "url": seoConfig.canonicalUrl,
      "description": seoConfig.defaultDescription,
      "inLanguage": seoConfig.language || "pt-BR",
      "publisher": {
        "@type": "Organization",
        "name": seoConfig.author
      }
    };
    setJsonLd("jsonld-website", websiteSchema);

    // JSON-LD 2: WebApplication / SoftwareApplication Schema
    const appSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": seoConfig.structuredData.appName || seoConfig.siteName,
      "applicationCategory": seoConfig.structuredData.appCategory || "MultimediaApplication",
      "operatingSystem": seoConfig.structuredData.operatingSystem || "Web/Browser",
      "browserRequirements": seoConfig.structuredData.browserRequirements,
      "offers": {
        "@type": "Offer",
        "price": seoConfig.structuredData.price || "0",
        "priceCurrency": seoConfig.structuredData.priceCurrency || "BRL"
      },
      "description": seoConfig.structuredData.description || pageDescription
    };
    setJsonLd("jsonld-app", appSchema);

    // JSON-LD 3: FAQPage Schema
    if (seoConfig.faqList && seoConfig.faqList.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": seoConfig.faqList.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      };
      setJsonLd("jsonld-faq", faqSchema);
    }

    // JSON-LD 4: BreadcrumbList Schema
    if (routeKey !== "home" && routeKey !== "inicio") {
      const cleanName = pageTitle.split("—")[0].split("-")[0].trim() || "Ferramenta";
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Início",
            "item": seoConfig.canonicalUrl || DEFAULT_SEO_CONFIG.canonicalUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": cleanName,
            "item": pageCanonical
          }
        ]
      };
      setJsonLd("jsonld-breadcrumb", breadcrumbSchema);
    } else {
      const el = document.getElementById("jsonld-breadcrumb");
      if (el) el.remove();
    }

  }, [seoConfig, routeKey, customTitle, customDescription]);

  return seoConfig;
}

export default useSeoHead;
