import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, getDoc } from "firebase/firestore";
import { SeoConfig, PageSeoItem, FaqItem } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

// Default seed SEO configuration
export const DEFAULT_SEO_CONFIG: SeoConfig = {
  siteName: "MultiConverte",
  defaultTitle: "MultiConverte - Ferramentas de Áudio, Vídeo, Imagem e PDF Online Grátis",
  defaultDescription: "Converta arquivos de áudio para MP3, WAV, AAC, OGG e FLAC, otimize imagens e gerencie documentos PDF com ferramentas gratuitas online: juntar, comprimir, imagem para PDF e organizar páginas.",
  canonicalUrl: "https://multiconverte.com.br",
  language: "pt-BR",
  author: "MultiConverte",
  theme: "#10b981",

  keywords: [
    "conversor de audio",
    "converter mp3",
    "juntar pdf",
    "comprimir pdf",
    "imagem para pdf",
    "multiconverte",
    "converter audio online",
    "ferramentas de pdf gratis",
    "conversor de mp3 para wav",
    "organizar paginas de pdf"
  ],

  openGraph: {
    title: "MultiConverte - Ferramentas de Áudio, Vídeo, Imagem e PDF Grátis",
    description: "Converta áudios em alta qualidade, otimize imagens e gerencie PDFs com total privacidade e velocidade. 100% gratuito e direto no seu navegador.",
    image: "https://multiconverte.com.br/multiconverte-og-image.png",
    url: "https://multiconverte.com.br",
    type: "website",
    siteName: "MultiConverte",
    locale: "pt_BR"
  },

  twitter: {
    card: "summary_large_image",
    title: "MultiConverte - Ferramentas de Áudio, Vídeo, Imagem e PDF Grátis",
    description: "Converta áudios em alta qualidade, otimize imagens e gerencie PDFs com total privacidade e velocidade. 100% gratuito e direto no seu navegador.",
    image: "https://multiconverte.com.br/multiconverte-og-image.png"
  },

  robotsConfig: {
    allowIndexing: true,
    allowFollow: true,
    sitemapUrl: "https://multiconverte.com.br/sitemap.xml",
    canonicalUrl: "https://multiconverte.com.br",
    blockAdmin: true,
    blockPrivateRoutes: true,
    blockApi: true
  },

  structuredData: {
    webSiteName: "MultiConverte",
    appName: "MultiConverte & PDF Tools",
    appCategory: "MultimediaApplication",
    operatingSystem: "Web/Browser",
    price: "0",
    priceCurrency: "BRL",
    browserRequirements: "Navegador Web com suporte a HTML5 e WebAssembly",
    description: "Ferramenta online gratuita para conversão rápida de áudios e edição de arquivos PDF sem limites."
  },

  pages: {
    home: {
      title: "MultiConverte - Ferramentas de Áudio, Vídeo, Imagem e PDF Online Grátis",
      description: "Converta arquivos de áudio e edite PDFs gratuitamente online. Rápido, seguro e sem instalação.",
      keywords: ["conversor de audio", "ferramentas pdf", "multiconverte", "conversor mp3"],
      canonicalUrl: "https://multiconverte.com.br",
      allowIndexing: true,
      allowFollow: true
    },
    audio: {
      title: "Conversor de Áudio Online Grátis - MP3, WAV, AAC, OGG | MultiConverte",
      description: "Converta qualquer arquivo de áudio para MP3, WAV, AAC, OGG, M4A ou FLAC em alta fidelidade diretamente no seu navegador.",
      keywords: ["conversor mp3", "converter audio", "mp3 para wav", "audio converter"],
      canonicalUrl: "https://multiconverte.com.br/audio",
      allowIndexing: true,
      allowFollow: true
    },
    pdf: {
      title: "Ferramentas PDF Online Grátis - Juntar, Comprimir, Converter | MultiConverte",
      description: "Edite seus arquivos PDF gratuitamente: junte múltiplos PDFs, reduza o tamanho mantendo a qualidade, converta imagens JPG/PNG para PDF e reordene páginas.",
      keywords: ["juntar pdf", "comprimir pdf", "imagem para pdf", "organizar pdf"],
      canonicalUrl: "https://multiconverte.com.br/pdf",
      allowIndexing: true,
      allowFollow: true
    },
    howItWorks: {
      title: "Como Funciona | MultiConverte & PDF Tools",
      description: "Saiba como utilizar o MultiConverte para converter áudios e editar arquivos PDF com máxima privacidade e processamento instantâneo.",
      keywords: ["como funciona multiconverte", "privacidade conversor audio", "tutorial pdf"],
      canonicalUrl: "https://multiconverte.com.br/como-funciona",
      allowIndexing: true,
      allowFollow: true
    },
    videoToAudio: {
      title: "Extrair Áudio de Vídeo para MP3 ou WAV | MultiConverte",
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
        "conversor MultiConverte"
      ],
      canonicalUrl: "https://multiconverte.com.br/video-para-audio",
      allowIndexing: true,
      allowFollow: true
    },
    imagesToPdf: {
      title: "Imagens para PDF Grátis: JPG, PNG e WEBP | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/pdf/imagens-para-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    pdfToImages: {
      title: "PDF para JPG ou PNG Grátis | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/pdf/pdf-para-imagens",
      allowIndexing: true,
      allowFollow: true
    },
    imageConverter: {
      title: "Conversor de Imagens Grátis: JPG, PNG, WEBP e AVIF | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/imagem/converter",
      allowIndexing: true,
      allowFollow: true
    },
    imageCompressor: {
      title: "Comprimir Imagem Grátis: JPG, PNG e WEBP | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/imagem/comprimir",
      allowIndexing: true,
      allowFollow: true
    },
    imageResizer: {
      title: "Redimensionar Imagem Grátis em Pixels e Porcentagem | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/imagem/redimensionar",
      allowIndexing: true,
      allowFollow: true
    },
    imageCropper: {
      title: "Cortar Imagem Grátis e Criar Tamanhos para Redes Sociais | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/imagem/cortar",
      allowIndexing: true,
      allowFollow: true
    },
    imageRotateFlip: {
      title: "Girar e Espelhar Imagem Grátis Online | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/imagem/girar-espelhar",
      allowIndexing: true,
      allowFollow: true
    },
    image_watermark: {
      title: "Adicionar Marca d’Água em Fotos e Imagens Grátis | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/imagem/marca-dagua",
      allowIndexing: true,
      allowFollow: true
    },
    image_background_removal: {
      title: "Remover Fundo de Imagem Grátis e Manualmente | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/imagem/remover-fundo",
      allowIndexing: false,
      allowFollow: false
    },
    pdf_extract_text: {
      title: "Extrair Texto de PDF Grátis e Converter PDF para TXT | MultiConverte",
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
      canonicalUrl: "https://multiconverte.com.br/pdf/extrair-texto",
      allowIndexing: true,
      allowFollow: true
    },
    excelToPdf: {
      title: "Excel para PDF Grátis - Converter XLSX, XLS e CSV em PDF | MultiConverte",
      description: "Converta planilhas Excel (XLSX, XLS) e arquivos CSV para PDF gratuitamente. Selecione abas, ajuste a orientação da página e gere documentos prontos para impressão.",
      keywords: [
        "Excel para PDF",
        "converter XLSX para PDF",
        "XLSX em PDF",
        "converter XLS para PDF",
        "planilha para PDF",
        "converter Excel em PDF grátis",
        "Excel para PDF sem desfigurar",
        "planilha Excel para PDF online",
        "converter CSV para PDF",
        "salvar Excel como PDF",
        "converter tabela para PDF"
      ],
      canonicalUrl: "https://multiconverte.com.br/documento/excel-para-pdf",
      allowIndexing: true,
      allowFollow: true
    },
    documentHub: {
      title: "Ferramentas de Documentos Online Grátis | MultiConverte",
      description: "Suíte de ferramentas para conversão e manipulação de documentos de escritório: Excel para PDF, Extrair Texto e mais de forma rápida e segura.",
      keywords: [
        "ferramentas de documentos",
        "conversor de documentos",
        "Excel para PDF",
        "extrair texto de PDF",
        "documentos online grátis"
      ],
      canonicalUrl: "https://multiconverte.com.br/documento",
      allowIndexing: true,
      allowFollow: true
    }
  },

  faqList: [
    {
      id: "faq-1",
      question: "O MultiConverte é 100% gratuito?",
      answer: "Sim! Todas as nossas ferramentas de áudio e PDF são completamente gratuitas e ilimitadas, sem necessidade de cadastro."
    },
    {
      id: "faq-2",
      question: "Meus arquivos são salvos ou mantidos no servidor?",
      answer: "Não. Garantimos sua total privacidade. O processamento dos seus arquivos é feito de forma segura e temporária, e seus documentos são descartados após a conclusão."
    },
    {
      id: "faq-3",
      question: "Quais formatos de áudio são suportados?",
      answer: "Aceitamos os principais formatos de áudio incluindo MP3, WAV, AAC, OGG, M4A, FLAC, WMA, OPUS e AIFF para conversão em alta definição."
    },
    {
      id: "faq-4",
      question: "Como juntar vários arquivos PDF em um único documento?",
      answer: "Acesse a seção 'Ferramentas PDF', escolha 'Juntar PDFs', envie os arquivos desejados, organize a ordem das páginas e clique em 'Juntar PDFs' para baixar o documento final."
    }
  ]
};

// Singleton DB instance
function getFirestoreDb() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
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
          setSeoConfig({
            ...DEFAULT_SEO_CONFIG,
            ...data,
            openGraph: { ...DEFAULT_SEO_CONFIG.openGraph, ...(data.openGraph || {}) },
            twitter: { ...DEFAULT_SEO_CONFIG.twitter, ...(data.twitter || {}) },
            robotsConfig: { ...DEFAULT_SEO_CONFIG.robotsConfig, ...(data.robotsConfig || {}) },
            structuredData: { ...DEFAULT_SEO_CONFIG.structuredData, ...(data.structuredData || {}) },
            pages: { ...DEFAULT_SEO_CONFIG.pages, ...(data.pages || {}) },
            faqList: data.faqList || DEFAULT_SEO_CONFIG.faqList,
            keywords: data.keywords || DEFAULT_SEO_CONFIG.keywords
          });
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

  }, [seoConfig, routeKey, customTitle, customDescription]);

  return seoConfig;
}

export default useSeoHead;
