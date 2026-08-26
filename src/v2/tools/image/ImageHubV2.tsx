import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Minimize2,
  Maximize2,
  Crop,
  RotateCw,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Grid2X2
} from "lucide-react";
import { ImageSubTool } from "./types";
import { ImageConverterV2 } from "./tools/ImageConverterV2";
import { ImageCompressV2 } from "./tools/ImageCompressV2";
import { ImageResizeV2 } from "./tools/ImageResizeV2";
import { ImageCropV2 } from "./tools/ImageCropV2";
import { ImageRotateV2 } from "./tools/ImageRotateV2";
import { ImageWatermarkV2 } from "./tools/ImageWatermarkV2";
import { ImageMetadataStudioV2 } from "./metadata/ImageMetadataStudioV2";
import { ImageHeroV2 } from "./components/ImageHeroV2";
import { ImageBenefitsV2 } from "./components/ImageBenefitsV2";

interface ImageHubV2Props {
  initialSubTool?: ImageSubTool;
}

export const ImageHubV2: React.FC<ImageHubV2Props> = ({ initialSubTool = "hub" }) => {
  const [activeSubTool, setActiveSubTool] = useState<ImageSubTool>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/imagem/converter" || path === "/v2/imagem/converter") return "converter";
      if (path === "/imagem/comprimir" || path === "/v2/imagem/comprimir") return "compress";
      if (path === "/imagem/redimensionar" || path === "/v2/imagem/redimensionar") return "resize";
      if (path === "/imagem/cortar" || path === "/v2/imagem/cortar") return "crop";
      if (path === "/imagem/girar" || path === "/imagem/girar-espelhar" || path === "/v2/imagem/girar") return "rotate";
      if (path === "/imagem/marca-dagua" || path === "/v2/imagem/marca-dagua") return "watermark";
      if (path === "/imagem/metadados" || path === "/v2/imagem/metadados" || path === "/imagem/limpar-metadados") return "metadata";
    }
    return initialSubTool;
  });

  useEffect(() => {
    if (initialSubTool && initialSubTool !== "hub") {
      setActiveSubTool(initialSubTool);
    }
  }, [initialSubTool]);

  const handleSelectTool = (tool: ImageSubTool, path?: string) => {
    setActiveSubTool(tool);
    if (path && typeof window !== "undefined") {
      window.history.pushState({}, "", path);
    }
  };

  const handleBackToHub = () => {
    setActiveSubTool("hub");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/imagem");
    }
  };

  // Render Sub-tools
  if (activeSubTool === "converter") {
    return <ImageConverterV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "compress") {
    return <ImageCompressV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "resize") {
    return <ImageResizeV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "crop") {
    return <ImageCropV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "rotate") {
    return <ImageRotateV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "watermark") {
    return <ImageWatermarkV2 onBack={handleBackToHub} />;
  }
  if (activeSubTool === "metadata") {
    return <ImageMetadataStudioV2 onBack={handleBackToHub} />;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-8 md:space-y-10 font-sans" id="v2-image-hub-view">
      {/* 1. Unified Hero Section */}
      <ImageHeroV2 onBack={handleBackToHub} />

      {/* 2. Section Header with Icon */}
      <section className="space-y-6" id="v2-image-tools-grid">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] shadow-2xs">
            <Grid2X2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-[#0F172A] tracking-tight">
              Escolha a ferramenta ideal para sua imagem
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Edição rápida, segura e profissional diretamente no seu dispositivo.
            </p>
          </div>
        </div>

        {/* 3. 3x2 Grid of 6 Cards with Custom Visual Illustrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Converter Imagens */}
          <div
            onClick={() => handleSelectTool("converter", "/imagem/converter")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#10B981]/50 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(16,185,129,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[175px] sm:min-h-[185px] overflow-hidden"
            id="v2-image-card-converter"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] uppercase tracking-wider">
                    Mais Usado
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#059669] transition-colors leading-snug">
                    Converter Imagens
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Converta suas imagens entre JPG, PNG e WebP mantendo a qualidade.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#059669]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Illustration: Format Badges with Circular Flow */}
            <div className="w-28 sm:w-32 shrink-0 relative flex items-center justify-center select-none">
              {/* Circular ambient glow */}
              <div className="absolute inset-0 bg-[#ECFDF5] rounded-full blur-lg opacity-80" />
              
              {/* JPG badge (emerald) */}
              <div className="absolute top-2 left-1 z-20 px-2.5 py-1 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] text-white text-[10px] font-black shadow-xs transform -rotate-6">
                JPG
              </div>
              
              {/* PNG badge (cyan) */}
              <div className="absolute bottom-2 left-3 z-20 px-2.5 py-1 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#0284C7] text-white text-[10px] font-black shadow-xs transform rotate-6">
                PNG
              </div>

              {/* WEBP badge (blue) */}
              <div className="absolute top-5 right-1 z-20 px-2.5 py-1 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white text-[10px] font-black shadow-xs">
                WBP
              </div>

              {/* Dotted Circular Conversion Track */}
              <svg className="w-20 h-20 text-[#A7F3D0]" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M75 50L85 45L80 58" fill="#10B981" />
                <path d="M25 50L15 55L20 42" fill="#06B6D4" />
              </svg>
            </div>
          </div>

          {/* Card 2: Comprimir Imagem */}
          <div
            onClick={() => handleSelectTool("compress", "/imagem/comprimir")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#06B6D4]/50 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(6,182,212,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[175px] sm:min-h-[185px] overflow-hidden"
            id="v2-image-card-compress"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC] uppercase tracking-wider">
                    Otimizado
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#0891B2] transition-colors leading-snug">
                    Comprimir Imagem
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Reduza o tamanho em KB/MB das suas imagens mantendo a nitidez e fidelidade.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#0891B2]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Illustration: Stacked Photos with -75% Pill */}
            <div className="w-28 sm:w-32 shrink-0 relative flex items-center justify-center select-none">
              {/* Back card */}
              <div className="absolute w-16 h-18 rounded-xl bg-[#BAE6FD] border border-white shadow-xs transform rotate-6 opacity-70" />
              
              {/* Front card with mountain art */}
              <div className="relative w-18 h-20 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] p-1 border-2 border-white shadow-md transform -rotate-3 overflow-hidden">
                <div className="w-full h-full bg-[#E0F2FE] rounded-lg relative overflow-hidden">
                  <div className="absolute bottom-0 inset-x-0 h-6 bg-[#0D9488] rounded-t-lg" />
                  <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#FDE047]" />
                </div>
              </div>

              {/* Glowing -75% Badge */}
              <div className="absolute -bottom-1 right-1 z-20 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#06B6D4] text-white text-[11px] font-black shadow-[0_4px_12px_rgba(6,182,212,0.4)] border border-white">
                -75%
              </div>
            </div>
          </div>

          {/* Card 3: Redimensionar */}
          <div
            onClick={() => handleSelectTool("resize", "/imagem/redimensionar")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#8B5CF6]/50 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(139,92,246,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[175px] sm:min-h-[185px] overflow-hidden"
            id="v2-image-card-resize"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#7C3AED] transition-colors leading-snug">
                    Redimensionar
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Ajuste largura e altura por pixels, porcentagem ou predefinições de redes sociais.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#7C3AED]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Illustration: Bounding Box with Resize Handles & Arrows */}
            <div className="w-28 sm:w-32 shrink-0 relative flex items-center justify-center select-none">
              {/* Outer Dashed Box */}
              <div className="relative w-20 h-20 border-2 border-dashed border-[#8B5CF6]/50 rounded-xl flex items-center justify-center p-2 bg-[#FAF5FF]/50">
                {/* 4 Handles */}
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#7C3AED] rounded-xs" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#7C3AED] rounded-xs" />
                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#7C3AED] rounded-xs" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#7C3AED] rounded-xs" />

                {/* Inner Mini Photo */}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DDD6FE] to-[#C4B5FD] p-1 flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-5 h-5 text-[#6D28D9]/70" />
                </div>

                {/* Diagonal expansion arrow on bottom-right */}
                <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
                  <span className="text-[10px] font-black">⤡</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Cortar Imagem */}
          <div
            onClick={() => handleSelectTool("crop", "/imagem/cortar")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#EA580C]/50 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(234,88,12,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[175px] sm:min-h-[185px] overflow-hidden"
            id="v2-image-card-crop"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-[#EA580C] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <Crop className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#EA580C] transition-colors leading-snug">
                    Cortar Imagem
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Recorte fotos livremente ou com proporções fixas (1:1, 16:9, 9:16) com precisão.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#EA580C]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Illustration: Sunset Photo with Crop Frame & Handles */}
            <div className="w-28 sm:w-32 shrink-0 relative flex items-center justify-center select-none">
              {/* Photo Card (Sunset artwork) */}
              <div className="relative w-22 h-18 rounded-xl bg-gradient-to-b from-[#FB923C] via-[#F97316] to-[#C2410C] p-1 shadow-md border-2 border-white overflow-hidden">
                {/* Sun & Sea */}
                <div className="w-full h-full relative overflow-hidden rounded-lg">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FEF08A] blur-[0.5px]" />
                  <div className="absolute bottom-0 inset-x-0 h-4 bg-[#7C2D12]" />
                  {/* Rule of thirds grid lines */}
                  <div className="absolute inset-0 border border-white/40" />
                  <div className="absolute left-1/3 inset-y-0 w-[1px] bg-white/40" />
                  <div className="absolute right-1/3 inset-y-0 w-[1px] bg-white/40" />
                  <div className="absolute top-1/2 inset-x-0 h-[1px] bg-white/40" />
                </div>

                {/* 4 Corner Crop Angles */}
                <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#EA580C]" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#EA580C]" />
                <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#EA580C]" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#EA580C]" />
              </div>

              {/* Crop Icon Badge */}
              <div className="absolute -bottom-2 -right-1 z-20 w-7 h-7 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shadow-md border border-white">
                <Crop className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Card 5: Girar e Inverter */}
          <div
            onClick={() => handleSelectTool("rotate", "/imagem/girar")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#F59E0B]/50 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(245,158,11,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[175px] sm:min-h-[185px] overflow-hidden"
            id="v2-image-card-rotate"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <RotateCw className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#D97706] transition-colors leading-snug">
                    Girar e Inverter
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Gire em 90°, 180° ou 270° e espelhe fotos horizontalmente ou verticalmente.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#D97706]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Illustration: Tilted Card with Rotating Curved Arrow */}
            <div className="w-28 sm:w-32 shrink-0 relative flex items-center justify-center select-none">
              {/* Tilted Photo Card */}
              <div className="relative w-20 h-16 rounded-xl bg-gradient-to-tr from-[#38BDF8] via-[#0284C7] to-[#0F766E] p-1 border-2 border-white shadow-md transform rotate-12 overflow-hidden">
                <div className="w-full h-full bg-[#E0F2FE] rounded-lg relative overflow-hidden">
                  <div className="absolute bottom-0 inset-x-0 h-4 bg-[#0F766E]" />
                  <div className="absolute top-1 right-2 w-3 h-3 rounded-full bg-[#FDE047]" />
                </div>
              </div>

              {/* Sweeping Golden Rotation Arrow */}
              <svg className="absolute -top-1 left-2 w-16 h-16 text-[#F59E0B] pointer-events-none" viewBox="0 0 64 64" fill="none">
                <path d="M12 28 C12 12, 44 10, 52 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
                <polygon points="56,22 52,28 46,24" fill="#F59E0B" />
              </svg>

              {/* Flip indicator badge */}
              <div className="absolute -bottom-1 -right-1 z-20 px-2 py-1 rounded-lg bg-[#F59E0B] text-white text-[9px] font-black shadow-md border border-white flex items-center gap-0.5">
                <span>◀▶</span>
              </div>
            </div>
          </div>

          {/* Card 6: Marca d’Água */}
          <div
            onClick={() => handleSelectTool("watermark", "/imagem/marca-dagua")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#2563EB]/50 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[175px] sm:min-h-[185px] overflow-hidden"
            id="v2-image-card-watermark"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] uppercase tracking-wider">
                    Proteção
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#2563EB] transition-colors leading-snug">
                    Marca d’Água
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Adicione textos com opacidade ou logotipos personalizados para proteção autoral.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#2563EB]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Illustration: Tropical Photo with Watermark Ribbon & Lock */}
            <div className="w-28 sm:w-32 shrink-0 relative flex items-center justify-center select-none">
              {/* Photo Card with Beach/Palm landscape */}
              <div className="relative w-22 h-18 rounded-xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] p-1 border-2 border-white shadow-md overflow-hidden">
                <div className="w-full h-full relative overflow-hidden rounded-lg bg-[#E0F2FE]">
                  {/* Palm tree simulation */}
                  <div className="absolute bottom-0 right-3 w-1.5 h-8 bg-[#78350F] rounded-t-xs" />
                  <div className="absolute bottom-6 right-2 w-6 h-3 rounded-full bg-[#15803D]" />
                  <div className="absolute bottom-0 inset-x-0 h-3 bg-[#FDE047]" />
                  
                  {/* Watermark ribbon across bottom */}
                  <div className="absolute bottom-1 inset-x-0 bg-white/70 backdrop-blur-xs py-0.5 text-center">
                    <span className="text-[8px] font-black text-[#1E293B] tracking-wider">
                      © SUA MARCA
                    </span>
                  </div>
                </div>
              </div>

              {/* Blue Shield/Lock Badge */}
              <div className="absolute -bottom-2 -right-1 z-20 w-7 h-7 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center shadow-md border border-white">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Card 7: Metadados & Privacidade (NOVO) */}
          <div
            onClick={() => handleSelectTool("metadata", "/imagem/metadados")}
            className="group relative bg-white border border-[#E2E8F0] hover:border-[#059669]/50 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-[0_12px_30px_rgba(5,150,105,0.08)] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between gap-3 min-h-[175px] sm:min-h-[185px] overflow-hidden"
            id="v2-image-card-metadata"
          >
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-between z-10 min-w-0 pr-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] uppercase tracking-wider">
                    Privacidade & EXIF
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A] group-hover:text-[#059669] transition-colors leading-snug">
                    Editar e Limpar Metadados
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    Inspecione dados ocultos, elimine coordenadas GPS, dispositivo e grave novas tags autorais.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-[#059669]">
                <span>Abrir Ferramenta</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Illustration: Photo Card with Shield, GPS Pin & EXIF Pill */}
            <div className="w-28 sm:w-32 shrink-0 relative flex items-center justify-center select-none">
              {/* Photo Card */}
              <div className="relative w-22 h-18 rounded-xl bg-gradient-to-b from-[#10B981] via-[#059669] to-[#047857] p-1 border-2 border-white shadow-md overflow-hidden">
                <div className="w-full h-full relative overflow-hidden rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[#059669]/40" />
                  {/* Miniature GPS Crosshair */}
                  <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full border border-[#059669] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#059669]" />
                  </div>
                </div>
              </div>

              {/* Glowing EXIF / Clean Badge */}
              <div className="absolute -bottom-1 -right-1 z-20 px-2 py-1 rounded-lg bg-gradient-to-r from-[#059669] to-[#10B981] text-white text-[9px] font-black shadow-md border border-white flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>EXIF/GPS</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. 5-Benefit Horizontal Bar */}
      <ImageBenefitsV2 />
    </div>
  );
};
