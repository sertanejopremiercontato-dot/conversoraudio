import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Layers,
  RotateCw,
  Image as ImageIcon,
  Type,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { PdfSubTool } from "./types";
import { PdfMergeV2 } from "./tools/PdfMergeV2";
import { PdfCompressV2 } from "./tools/PdfCompressV2";
import { PdfOrganizeV2 } from "./tools/PdfOrganizeV2";
import { PdfDeleteRotateV2 } from "./tools/PdfDeleteRotateV2";
import { ImagesToPdfV2 } from "./tools/ImagesToPdfV2";
import { PdfToImagesV2 } from "./tools/PdfToImagesV2";
import { PdfExtractTextV2 } from "./tools/PdfExtractTextV2";
import { PdfHeroV2 } from "./components/PdfHeroV2";
import { PdfBenefitsV2 } from "./components/PdfBenefitsV2";

interface PdfHubV2Props {
  initialSubTool?: PdfSubTool;
}

export const PdfHubV2: React.FC<PdfHubV2Props> = ({ initialSubTool = "hub" }) => {
  const [activeSubTool, setActiveSubTool] = useState<PdfSubTool>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/pdf/juntar" || path === "/v2/pdf/juntar") return "merge";
      if (path === "/pdf/comprimir" || path === "/v2/pdf/comprimir") return "compress";
      if (path === "/pdf/organizar" || path === "/v2/pdf/organizar") return "organize";
      if (path === "/pdf/excluir-girar" || path === "/pdf/girar" || path === "/pdf/excluir-paginas" || path === "/v2/pdf/excluir-girar") return "deleteRotate";
      if (path === "/pdf/imagens-para-pdf" || path === "/v2/pdf/imagens-para-pdf") return "imagesToPdf";
      if (path === "/pdf/pdf-para-imagens" || path === "/v2/pdf/pdf-para-imagens") return "pdfToImages";
      if (path === "/pdf/extrair-texto" || path === "/v2/pdf/extrair-texto") return "extractText";
    }
    return initialSubTool;
  });

  useEffect(() => {
    if (initialSubTool && initialSubTool !== "hub") {
      setActiveSubTool(initialSubTool);
    }
  }, [initialSubTool]);

  const handleSelectTool = (tool: PdfSubTool, path?: string) => {
    setActiveSubTool(tool);
    if (path && typeof window !== "undefined") {
      window.history.pushState({}, "", path);
    }
  };

  const handleBackToHub = () => {
    setActiveSubTool("hub");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/pdf");
    }
  };

  // Render Sub-tools
  if (activeSubTool === "merge") {
    return <PdfMergeV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "compress") {
    return <PdfCompressV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "organize") {
    return <PdfOrganizeV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "deleteRotate") {
    return <PdfDeleteRotateV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "imagesToPdf") {
    return <ImagesToPdfV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "pdfToImages") {
    return <PdfToImagesV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "extractText") {
    return <PdfExtractTextV2 onBack={handleBackToHub} />;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-8 md:space-y-10 font-sans" id="v2-pdf-hub-view">
      {/* 1. Unified Hero Section */}
      <PdfHeroV2 onBack={handleBackToHub} />

      {/* 2. Section Header with Icon */}
      <section className="space-y-6" id="v2-pdf-tools-grid">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#EF4444] shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-[#0F172A] tracking-tight">
              Escolha uma ferramenta de PDF
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Soluções completas para manipular seus documentos com facilidade e privacidade.
            </p>
          </div>
        </div>

        {/* 3. 4 + 3 Grid: Row 1 (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Juntar PDFs */}
          <div
            onClick={() => handleSelectTool("merge", "/pdf/juntar")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#EF4444]/40 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(239,68,68,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-2 min-h-[185px] sm:min-h-[195px] overflow-hidden"
            id="v2-pdf-card-merge"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#EF4444] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF1F2] text-[#EF4444] border border-[#FECDD3] uppercase tracking-wider">
                    Popular
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#EF4444] transition-colors leading-snug">
                    Juntar PDFs
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Mescle múltiplos documentos PDF em uma ordem personalizada com rapidez.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#EF4444]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Mini Graphic */}
            <div className="w-20 sm:w-24 shrink-0 relative flex items-center justify-center select-none">
              {/* Dot Pattern Background */}
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#EF4444 1.5px, transparent 1.5px)", backgroundSize: "8px 8px" }} />
              {/* Stacked Sheet Graphic */}
              <div className="relative w-12 h-14 bg-gradient-to-br from-[#FECDD3] to-[#FFF1F2] rounded-lg border border-[#FDA4AF] shadow-xs transform rotate-6" />
              <div className="absolute w-12 h-14 bg-white rounded-lg border border-[#FECDD3] shadow-sm transform -rotate-3 flex flex-col items-center justify-center gap-1 p-1">
                <div className="w-6 h-1 bg-[#EF4444]/60 rounded-full" />
                <div className="w-4 h-1 bg-[#EF4444]/40 rounded-full" />
              </div>
            </div>
          </div>

          {/* Card 2: Comprimir PDF */}
          <div
            onClick={() => handleSelectTool("compress", "/pdf/comprimir")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#10B981]/40 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(16,185,129,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-2 min-h-[185px] sm:min-h-[195px] overflow-hidden"
            id="v2-pdf-card-compress"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF1F2] text-[#EF4444] border border-[#FECDD3] uppercase tracking-wider">
                    Otimização
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#10B981] transition-colors leading-snug">
                    Comprimir PDF
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Reduza o tamanho dos seus arquivos PDF sem perder qualidade visual.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#EF4444]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Mini Graphic */}
            <div className="w-20 sm:w-24 shrink-0 relative flex items-center justify-center select-none">
              {/* Dot Pattern Background */}
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#10B981 1.5px, transparent 1.5px)", backgroundSize: "8px 8px" }} />
              {/* Download Graphic */}
              <div className="relative w-12 h-14 bg-white rounded-lg border border-[#A7F3D0] shadow-sm flex flex-col items-center justify-center gap-1 p-1">
                <div className="w-7 h-7 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div className="w-6 h-1 bg-[#10B981]/40 rounded-full" />
              </div>
            </div>
          </div>

          {/* Card 3: Organizar Páginas */}
          <div
            onClick={() => handleSelectTool("organize", "/pdf/organizar")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#F97316]/40 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(249,115,22,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-2 min-h-[185px] sm:min-h-[195px] overflow-hidden"
            id="v2-pdf-card-organize"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-[#F97316] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#F97316] transition-colors leading-snug">
                    Organizar Páginas
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Reordene, exclua ou gire páginas de um PDF em qualquer ordem com miniaturas.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#EF4444]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Mini Graphic */}
            <div className="w-20 sm:w-24 shrink-0 relative flex items-center justify-center select-none">
              {/* Dot Pattern Background */}
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#F97316 1.5px, transparent 1.5px)", backgroundSize: "8px 8px" }} />
              {/* Layers Graphic */}
              <div className="relative w-12 h-14 bg-[#FFF7ED] rounded-lg border border-[#FFEDD5] shadow-xs transform rotate-6" />
              <div className="absolute w-12 h-14 bg-white rounded-lg border border-[#FFEDD5] shadow-sm flex items-center justify-center">
                <Layers className="w-6 h-6 text-[#F97316]" />
              </div>
            </div>
          </div>

          {/* Card 4: Excluir e Girar */}
          <div
            onClick={() => handleSelectTool("deleteRotate", "/pdf/excluir-girar")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#8B5CF6]/40 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(139,92,246,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-2 min-h-[185px] sm:min-h-[195px] overflow-hidden"
            id="v2-pdf-card-delete-rotate"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <RotateCw className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#8B5CF6] transition-colors leading-snug">
                    Excluir e Girar
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Remova páginas indesejadas e gire páginas invertidas com facilidade.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#EF4444]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Mini Graphic */}
            <div className="w-20 sm:w-24 shrink-0 relative flex items-center justify-center select-none">
              {/* Dot Pattern Background */}
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#8B5CF6 1.5px, transparent 1.5px)", backgroundSize: "8px 8px" }} />
              {/* Rotate Graphic */}
              <div className="relative w-12 h-14 bg-white rounded-lg border border-[#DDD6FE] shadow-sm flex items-center justify-center">
                <RotateCw className="w-6 h-6 text-[#8B5CF6]" />
              </div>
            </div>
          </div>

        </div>

        {/* 4. 4 + 3 Grid: Row 2 (3 Cards spanning equally across the full width) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 5: Imagens para PDF */}
          <div
            onClick={() => handleSelectTool("imagesToPdf", "/pdf/imagens-para-pdf")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#F59E0B]/40 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(245,158,11,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[185px] sm:min-h-[195px] overflow-hidden"
            id="v2-pdf-card-images-to-pdf"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug">
                    Imagens para PDF
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Converta JPG, PNG e WebP em um único PDF com alta qualidade e organização.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#EF4444]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Mini Graphic */}
            <div className="w-24 sm:w-28 shrink-0 relative flex items-center justify-center select-none">
              {/* Dot Pattern Background */}
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#F59E0B 1.5px, transparent 1.5px)", backgroundSize: "8px 8px" }} />
              {/* Image to PDF Graphic */}
              <div className="relative w-16 h-14 bg-gradient-to-tr from-[#FEF3C7] to-[#FDE68A] rounded-xl border border-[#FCD34D] shadow-sm flex items-center justify-center p-1 overflow-hidden">
                <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#D97706]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: PDF para Imagens */}
          <div
            onClick={() => handleSelectTool("pdfToImages", "/pdf/pdf-para-imagens")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#06B6D4]/40 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(6,182,212,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[185px] sm:min-h-[195px] overflow-hidden"
            id="v2-pdf-card-pdf-to-images"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#0891B2] transition-colors leading-snug">
                    PDF para Imagens
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Extraia cada página do PDF como JPG ou PNG em alta definição (com ZIP).
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#EF4444]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Mini Graphic */}
            <div className="w-24 sm:w-28 shrink-0 relative flex items-center justify-center select-none">
              {/* Dot Pattern Background */}
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#06B6D4 1.5px, transparent 1.5px)", backgroundSize: "8px 8px" }} />
              {/* PDF to Image Graphic */}
              <div className="relative w-16 h-14 bg-gradient-to-tr from-[#CFFAFE] to-[#A5F3FC] rounded-xl border border-[#67E8F9] shadow-sm flex items-center justify-center p-1 overflow-hidden">
                <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#0891B2]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 7: Extrair Texto */}
          <div
            onClick={() => handleSelectTool("extractText", "/pdf/extrair-texto")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#6366F1]/40 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[185px] sm:min-h-[195px] overflow-hidden"
            id="v2-pdf-card-extract-text"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Type className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#4F46E5] transition-colors leading-snug">
                    Extrair Texto
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Extraia o texto digital de PDFs de forma precisa para cópia ou transferência.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#EF4444]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Mini Graphic */}
            <div className="w-24 sm:w-28 shrink-0 relative flex items-center justify-center select-none">
              {/* Dot Pattern Background */}
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#6366F1 1.5px, transparent 1.5px)", backgroundSize: "8px 8px" }} />
              {/* Text Extract Graphic */}
              <div className="relative w-14 h-14 border-2 border-dashed border-[#818CF8] bg-[#EEF2FF]/60 rounded-xl flex items-center justify-center shadow-xs">
                <span className="text-xl font-black text-[#4F46E5]">T</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. 5-Benefit Horizontal Bar */}
      <PdfBenefitsV2 />
    </div>
  );
};
