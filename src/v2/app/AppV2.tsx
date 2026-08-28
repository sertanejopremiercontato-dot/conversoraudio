import React, { useState, useEffect } from "react";
import { AppRouteV2 } from "../routes";
import { MainLayoutV2 } from "../layout/MainLayoutV2";
import { HomeV2 } from "../pages/HomeV2";
import { ComoFuncionaPageV2 } from "../pages/ComoFuncionaPageV2";
import { AudioConverterV2 } from "../tools/audio/AudioConverterV2";
import { AudioMetadataV2 } from "../tools/metadata/AudioMetadataV2";
import { VideoToAudioV2 } from "../tools/video/VideoToAudioV2";
import { PdfHubV2 } from "../tools/pdf/PdfHubV2";
import { ImageHubV2 } from "../tools/image/ImageHubV2";
import { DocumentHubV2 } from "../tools/document/DocumentHubV2";
import { AdminPanelV2 } from "../admin/AdminPanelV2";
import { useSeoV2 } from "../seo/useSeoV2";
import { SeoRouteKeyV2 } from "../seo/types";
import { trackPageViewV2 } from "../integrations/analytics";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";

interface AppV2Props {
  initialRoute?: AppRouteV2;
  onNavigateToV1?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateUnmigrated?: (path: string) => void;
}

export const AppV2: React.FC<AppV2Props> = ({
  initialRoute,
  onNavigateToV1,
  onNavigateToAdmin,
  onNavigateUnmigrated
}) => {
  const [currentRoute, setCurrentRoute] = useState<AppRouteV2>(() => {
    if (initialRoute) return initialRoute;
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/admin" || path.startsWith("/admin/") || path === "/v2/admin" || path.startsWith("/v2/admin/")) return "admin";
      if (path === "/como-funciona" || path === "/v2/como-funciona" || hash === "#como-funciona" || hash === "#contato") return "comoFunciona";
      if (path === "/audio" || path === "/v2/audio" || path === "/converter-audio" || path === "/v2/converter-audio") return "audio";
      if (path === "/audio/editor-metadados" || path === "/v2/audio/editor-metadados" || path === "/v2/metadados") return "audioMetadata";
      if (path === "/video-para-audio" || path === "/v2/video-para-audio") return "videoToAudio";
      if (path.startsWith("/pdf") || path === "/v2/pdf") return "pdf";
      if (path.startsWith("/imagem") || path === "/v2/imagem") return "image";
      if (path.startsWith("/documento") || path === "/v2/documento" || path.startsWith("/documentos") || path === "/v2/documentos") return "document";
    }
    return "home";
  });

  // Sincroniza se initialRoute mudar
  useEffect(() => {
    if (initialRoute && initialRoute !== currentRoute) {
      setCurrentRoute(initialRoute);
    }
  }, [initialRoute]);

  // Listener para histórico do navegador (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/admin" || path.startsWith("/admin/") || path === "/v2/admin" || path.startsWith("/v2/admin/")) setCurrentRoute("admin");
      else if (path === "/como-funciona" || path === "/v2/como-funciona" || hash === "#como-funciona" || hash === "#contato") setCurrentRoute("comoFunciona");
      else if (path === "/audio" || path === "/v2/audio" || path === "/converter-audio" || path === "/v2/converter-audio") setCurrentRoute("audio");
      else if (path === "/audio/editor-metadados" || path === "/v2/audio/editor-metadados" || path === "/v2/metadados") setCurrentRoute("audioMetadata");
      else if (path === "/video-para-audio" || path === "/v2/video-para-audio") setCurrentRoute("videoToAudio");
      else if (path.startsWith("/pdf") || path === "/v2/pdf") setCurrentRoute("pdf");
      else if (path.startsWith("/imagem") || path === "/v2/imagem") setCurrentRoute("image");
      else if (path.startsWith("/documento") || path === "/v2/documento" || path.startsWith("/documentos") || path === "/v2/documentos") setCurrentRoute("document");
      else if (path === "/" || path.startsWith("/v2")) setCurrentRoute("home");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Mapeia rota da V2 para o hook de SEO estático
  const seoKey: SeoRouteKeyV2 = 
    currentRoute === "admin" ? "admin"
    : currentRoute === "audio" ? "audio"
    : currentRoute === "audioMetadata" ? "audioMetadata"
    : currentRoute === "videoToAudio" ? "videoToAudio"
    : currentRoute === "pdf" ? "pdf"
    : currentRoute === "image" ? "image"
    : currentRoute === "document" ? "document"
    : currentRoute === "comoFunciona" ? "comoFunciona"
    : "home";

  useSeoV2(seoKey);

  // Tracking de Pageviews
  useEffect(() => {
    if (currentRoute === "home") {
      trackPageViewV2("/", "Conversor de Áudio & Mídia Online");
    } else if (currentRoute === "comoFunciona") {
      trackPageViewV2("/como-funciona", "Como Funciona & Contato");
    } else if (currentRoute === "audio") {
      trackPageViewV2("/audio", "Conversor de Áudio Online");
    } else if (currentRoute === "audioMetadata") {
      trackPageViewV2("/audio/editor-metadados", "Editor de Metadados de Áudio");
    } else if (currentRoute === "videoToAudio") {
      trackPageViewV2("/video-para-audio", "Converter Vídeo para Áudio");
    } else if (currentRoute === "pdf") {
      trackPageViewV2("/pdf", "Ferramentas de PDF Online");
    } else if (currentRoute === "image") {
      trackPageViewV2("/imagem", "Ferramentas de Imagem Online");
    } else if (currentRoute === "document") {
      trackPageViewV2("/documento", "Ferramentas de Documentos Online");
    }
  }, [currentRoute]);

  const handleNavigate = (route: AppRouteV2) => {
    // Redirecionamento de ponte caso haja alguma ferramenta legada
    const unmigratedPaths: Partial<Record<AppRouteV2, string>> = {};

    if (unmigratedPaths[route] && onNavigateUnmigrated) {
      onNavigateUnmigrated(unmigratedPaths[route]!);
      return;
    }

    setCurrentRoute(route);
    
    // Atualiza URL no navegador
    const routePaths: Record<AppRouteV2, string> = {
      home: "/",
      audio: "/audio",
      audioMetadata: "/audio/editor-metadados",
      videoToAudio: "/video-para-audio",
      pdf: "/pdf",
      image: "/imagem",
      document: "/documento",
      comoFunciona: "/como-funciona",
      admin: "/admin"
    };

    const targetPath = routePaths[route] || "/";
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }

    if (route === "comoFunciona") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Se a rota for admin, renderiza o AdminPanelV2 diretamente
  if (currentRoute === "admin") {
    return (
      <AdminPanelV2
        onNavigateSite={(path) => handleNavigate("home")}
      />
    );
  }

  const renderContent = () => {
    if (currentRoute === "home") {
      return <HomeV2 onNavigate={handleNavigate} />;
    }

    if (currentRoute === "comoFunciona") {
      return <ComoFuncionaPageV2 onNavigate={handleNavigate} />;
    }

    if (currentRoute === "audio") {
      return <AudioConverterV2 onBack={() => handleNavigate("home")} />;
    }

    if (currentRoute === "audioMetadata") {
      return <AudioMetadataV2 onBack={() => handleNavigate("home")} />;
    }

    if (currentRoute === "videoToAudio") {
      return (
        <VideoToAudioV2 
          onBack={() => handleNavigate("home")}
          onNavigateTab={(tab) => handleNavigate(tab === "audio" ? "audio" : "videoToAudio")}
        />
      );
    }

    if (currentRoute === "pdf") {
      return <PdfHubV2 />;
    }

    if (currentRoute === "image") {
      return <ImageHubV2 />;
    }

    if (currentRoute === "document") {
      return (
        <DocumentHubV2 
          onNavigate={(routeOrPath) => {
            if (typeof routeOrPath === "string") {
              if (routeOrPath.startsWith("/pdf")) {
                handleNavigate("pdf");
              } else if (routeOrPath.startsWith("/imagem")) {
                handleNavigate("image");
              } else if (routeOrPath.startsWith("/audio")) {
                handleNavigate("audio");
              } else {
                handleNavigate("home");
              }
            } else {
              handleNavigate(routeOrPath);
            }
          }}
          onBack={() => handleNavigate("home")}
        />
      );
    }

    // Placeholder organizado para as ferramentas da V2 que serão reconstruídas nas próximas fases (Fase 8, 9...)
    const routeTitles: Record<AppRouteV2, { title: string; phase: string; desc: string }> = {
      home: { title: "Início", phase: "Fase 3", desc: "" },
      audio: { title: "Conversor de Áudio V2", phase: "Fase 4", desc: "Módulo de conversão com seletor de bitrate, MP3/WAV/FLAC e fila de download." },
      audioMetadata: { title: "Editor de Metadados de Áudio V2", phase: "Fase 5", desc: "Leitura de tags reais, visualização de capa, edição de ISRC/BPM e limpeza completa." },
      videoToAudio: { title: "Vídeo para Áudio V2", phase: "Fase 6", desc: "Extração direta de áudio de vídeos MP4, WebM e MOV." },
      pdf: { title: "Ferramentas PDF V2", phase: "Fase 7", desc: "Juntar, comprimir, organizar e converter imagens para PDF." },
      image: { title: "Ferramentas de Imagem V2", phase: "Fase 8", desc: "Converter, comprimir, redimensionar e cortar imagens." },
      document: { title: "Conversor de Documentos V2", phase: "Fase 9", desc: "Conversão de arquivos Excel (XLSX) e documentos para PDF." },
      comoFunciona: { title: "Como Funciona", phase: "Fase 3", desc: "" },
      admin: { title: "Painel Administrativo V2", phase: "Fase 5", desc: "Gerenciamento de anúncios, branding e configurações da V2." }
    };

    const currentInfo = (routeTitles as Record<string, { title: string; phase: string; desc: string }>)[currentRoute] || {
      title: "Módulo V2",
      phase: "Fase V2",
      desc: "Ferramenta em execução."
    };

    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8 text-center" id="v2-tool-placeholder">
        <button
          onClick={() => handleNavigate("home")}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Início V2</span>
        </button>

        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 space-y-6 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] text-[#0284C7] mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-[#F1F5F9] text-[#475569] text-xs font-bold rounded-full inline-block">
              {currentInfo.phase} do Plano Mestre
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">
              {currentInfo.title}
            </h2>
            <p className="text-xs md:text-sm text-[#64748B] max-w-lg mx-auto">
              {currentInfo.desc}
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#475569] flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-[#94A3B8]" />
            <span>Estrutura base da V2 pronta. Este módulo será construído na etapa correspondente.</span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleNavigate("home")}
              className="px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Explorar outras seções da V2
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayoutV2
      currentRoute={currentRoute}
      onNavigate={handleNavigate}
      onNavigateToV1={onNavigateToV1}
      onNavigateToAdmin={() => handleNavigate("admin")}
    >
      {renderContent()}
    </MainLayoutV2>
  );
};
