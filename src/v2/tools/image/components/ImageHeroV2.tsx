import React from "react";
import { Zap, Eye, Shield, Sparkles, Sliders, Crop } from "lucide-react";

interface ImageHeroV2Props {
  onBack?: () => void;
}

export const ImageHeroV2: React.FC<ImageHeroV2Props> = () => {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#F0FDFA] via-[#F0FDF4] to-[#F8FAFC] border border-[#CCFBF1] rounded-[24px] md:rounded-[28px] px-8 sm:px-12 lg:px-16 xl:px-20 py-10 sm:py-12 lg:py-14 shadow-[0_8px_30px_rgba(13,148,136,0.05)] min-h-[380px] lg:min-h-[410px] flex items-center"
      id="v2-image-hero"
    >
      {/* Background Subtle Ambient Lighting & Glows */}
      <div className="absolute top-0 right-1/4 w-[550px] h-[550px] rounded-full bg-[#14B8A6]/15 blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] rounded-full bg-[#06B6D4]/15 blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-[#10B981]/10 blur-3xl pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 w-full">
        {/* Left Column: Pill, Big Title, Description, 3 Chips (48% width on lg) */}
        <div className="space-y-6 max-w-xl text-center lg:text-left w-full lg:w-[48%]">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6FFFA] border border-[#99F6E4] text-[#0D9488] text-[11px] font-black tracking-wider uppercase shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>SUÍTE COMPLETA DE EDIÇÃO DE IMAGENS</span>
          </div>

          {/* Big Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black tracking-tight leading-[1.08] text-[#0F172A]">
            Ferramentas de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] via-[#0284C7] to-[#2563EB]">
              Imagem
            </span>
            <br />
            Rápidas e Seguras
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-[15.5px] text-[#475569] leading-relaxed max-w-[560px] mx-auto lg:mx-0 font-normal">
            Converta, comprima, redimensione, corte e proteja suas fotos e artes em JPG, PNG e WebP com processamento 100% no seu navegador.
          </p>

          {/* 3 Chips in a row */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
            {/* Chip 1: Processamento Local */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <Zap className="w-3.5 h-3.5 text-[#0D9488] fill-[#0D9488]" />
              <span>Processamento Local</span>
            </div>

            {/* Chip 2: Sem Perda Visual */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <Eye className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Sem Perda Visual</span>
            </div>

            {/* Chip 3: Privacidade Absoluta */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Privacidade Absoluta</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic Composition (52% width on lg) */}
        <div className="w-full lg:w-[52%] max-w-[620px] xl:max-w-[660px] select-none shrink-0">
          <div className="relative flex items-center justify-center py-6">
            
            {/* 3D Floating Format Badges */}
            {/* JPG badge top-left */}
            <div className="absolute -top-3 left-[15%] z-30 px-4 py-1.5 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white text-xs font-black shadow-[0_8px_20px_rgba(16,185,129,0.4)] border border-white/30 transform -rotate-6">
              JPG
            </div>

            {/* PNG badge top-right */}
            <div className="absolute -top-2 right-[12%] z-30 px-4 py-1.5 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#0284C7] text-white text-xs font-black shadow-[0_8px_20px_rgba(6,182,212,0.4)] border border-white/30 transform rotate-8">
              PNG
            </div>

            {/* WEBP badge on the bottom-right corner of photo */}
            <div className="absolute bottom-12 right-[18%] z-30 px-3.5 py-1 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white text-[11px] font-black shadow-[0_8px_20px_rgba(37,99,235,0.4)] border border-white/30">
              WEBP
            </div>

            {/* 3D Concentric Oval Pedestal Underneath */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-28 border-2 border-[#99F6E4]/40 rounded-[100%] pointer-events-none -z-0 bg-gradient-to-t from-[#CCFBF1]/60 to-transparent shadow-[0_12px_30px_rgba(13,148,136,0.12)]" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-72 sm:w-84 h-20 border border-[#5EEAD4]/50 rounded-[100%] pointer-events-none -z-0" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-60 sm:w-72 h-14 border border-[#2DD4BF]/60 rounded-[100%] pointer-events-none -z-0 bg-[#F0FDFA]/40" />

            {/* Main Picture Frame on Pedestal */}
            <div className="relative w-[340px] sm:w-[410px] bg-white p-3 rounded-[24px] shadow-[0_25px_50px_rgba(13,148,136,0.15),0_8px_20px_rgba(0,0,0,0.06)] border border-white/80 z-10 transform -rotate-[1deg]">
              
              {/* Photo Area: Mountain Lake Landscape SVG artwork */}
              <div className="relative h-48 sm:h-56 rounded-[18px] overflow-hidden bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] to-[#BAE6FD]">
                {/* Sky & Clouds */}
                <div className="absolute top-3 left-6 w-16 h-5 rounded-full bg-white/70 blur-[1px]" />
                <div className="absolute top-5 right-10 w-24 h-6 rounded-full bg-white/60 blur-[1px]" />
                
                {/* Sun */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-[#FEF08A] to-[#FDE047] blur-xs opacity-90" />

                {/* Mountains SVG */}
                <svg className="absolute bottom-12 left-0 right-0 w-full h-36" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Far mountains with snow */}
                  <polygon points="0,150 70,40 140,110 220,30 300,95 360,45 400,90 400,150" fill="#0F766E" opacity="0.6" />
                  <polygon points="200,50 220,30 240,50 230,60 210,60" fill="#FFFFFF" opacity="0.9" />
                  <polygon points="55,60 70,40 85,60 78,68 62,68" fill="#FFFFFF" opacity="0.9" />

                  {/* Mid green mountains */}
                  <polygon points="0,150 40,70 100,120 180,60 260,115 340,65 400,120 400,150" fill="#0D9488" opacity="0.8" />
                  
                  {/* Foreground lush green hills */}
                  <polygon points="0,150 80,95 160,125 240,90 320,110 400,85 400,150" fill="#047857" />
                </svg>

                {/* Crystal Lake with reflections */}
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#0284C7] via-[#0EA5E9]/90 to-[#38BDF8]/80">
                  {/* Water reflections lines */}
                  <div className="w-3/4 mx-auto h-[1px] bg-white/40 mt-2" />
                  <div className="w-1/2 mx-auto h-[1px] bg-white/30 mt-2" />
                  <div className="w-2/3 mx-auto h-[1px] bg-white/25 mt-2" />
                </div>
              </div>

              {/* Floating Quality Controller Card (Left side of the photo) */}
              <div className="absolute top-1/3 -left-6 sm:-left-8 z-30 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl p-2.5 sm:p-3 shadow-[0_12px_28px_rgba(0,0,0,0.12)] w-36 sm:w-40 space-y-1.5 transform -rotate-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#334155]">
                  <span className="flex items-center gap-1 text-[#0D9488]">
                    <Sliders className="w-3 h-3" />
                    Qualidade
                  </span>
                  <span className="text-[#0D9488] font-black">95%</span>
                </div>
                {/* Slider track simulation */}
                <div className="relative w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="w-[95%] h-full bg-gradient-to-r from-[#0D9488] to-[#06B6D4] rounded-full" />
                </div>
              </div>

              {/* Floating Crop / Selection Box (Right side of the photo) */}
              <div className="absolute -top-4 -right-6 sm:-right-8 z-30 w-20 sm:w-24 h-20 sm:h-24 border-2 border-dashed border-[#06B6D4] bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-[0_12px_28px_rgba(6,182,212,0.25)] transform rotate-6">
                <Crop className="w-6 sm:w-7 h-6 sm:h-7 text-[#0891B2]" />
                {/* 4 Corner handles */}
                <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#0891B2] rounded-xs" />
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#0891B2] rounded-xs" />
                <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#0891B2] rounded-xs" />
                <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#0891B2] rounded-xs" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
