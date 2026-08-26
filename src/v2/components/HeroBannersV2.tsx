import React from "react";
import { AppRouteV2 } from "../routes";
import { 
  Zap, 
  LayoutGrid,
  ShieldCheck
} from "lucide-react";
import { HeroIllustration3D } from "./HeroIllustration3D";

interface HeroBannersV2Props {
  onNavigate: (route: AppRouteV2) => void;
}

export const HeroBannersV2: React.FC<HeroBannersV2Props> = ({ onNavigate }) => {
  const handleExploreClick = () => {
    const el = document.getElementById("ferramentas-principais");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      onNavigate("audio");
    }
  };

  const supportedFormats = [
    "MP3", "WAV", "AAC", "FLAC", "M4A", "OGG", "OPUS", "M4B", "AIFF", "+50"
  ];

  return (
    <section 
      className="relative overflow-hidden w-full bg-gradient-to-tr from-[#F8FAFD] via-[#F1F6FF] to-[#FAF5FF] border border-[#E2EBF8] rounded-[28px] md:rounded-[36px] p-6 sm:p-8 md:p-12 lg:p-14 shadow-[0_4px_30px_rgba(29,104,242,0.04)]"
      id="v2-hero-section"
    >
      {/* Background Decorative Ambient Radial Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#1D68F2]/5 blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-10 right-10 w-80 h-80 rounded-full bg-[#8B5CF6]/5 blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/80 blur-2xl pointer-events-none -z-0" />

      {/* 2-Column Responsive Layout (As seen in Reference top.png) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* ========================================================
            COLUNA 1 (ESQUERDA): Badge, Headline, Subtitle, CTAs, Formatos
            lg:col-span-7
           ======================================================== */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left flex flex-col justify-center">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-2xs w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1D68F2]" />
            <span>RÁPIDO • SEGURO • 100% ONLINE</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] xl:text-[52px] font-black text-[#0B1F44] tracking-tight leading-[1.12]">
            Converta, edite e{" "}
            <span className="text-[#1D68F2]">
              organize
            </span>
            <br />
            seus arquivos de áudio
          </h1>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-[15px] md:text-base text-[#5C6F84] font-normal leading-relaxed max-w-xl">
            Ferramentas profissionais para áudio, vídeo, imagens, PDFs e documentos. Tudo online, sem instalação e com total privacidade.
          </p>

          {/* CTA Buttons: [Converter Agora] and [Explorar Ferramentas] */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1 sm:pt-2">
            <button
              type="button"
              onClick={() => onNavigate("audio")}
              className="px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#1D68F2] via-[#2563EB] to-[#1D4ED8] hover:from-[#1554C7] hover:to-[#1E40AF] text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_6px_20px_rgba(29,104,242,0.35)] hover:shadow-[0_8px_24px_rgba(29,104,242,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Converter Agora</span>
            </button>

            <button
              type="button"
              onClick={handleExploreClick}
              className="px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#0B1F44] text-xs sm:text-sm font-black flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-[#5C6F84]" />
              <span>Explorar Ferramentas</span>
            </button>
          </div>

          {/* Formatos Suportados Mini Badges */}
          <div className="pt-4 border-t border-[#E2EBF8] flex flex-wrap items-center gap-2 text-xs text-[#64748B] font-semibold">
            <span className="text-xs text-[#475569] font-bold mr-1">Formatos suportados:</span>
            {supportedFormats.map((fmt, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[11px] font-extrabold text-[#475569] shadow-2xs hover:border-[#1D68F2]/40 transition-colors"
              >
                {fmt}
              </span>
            ))}
          </div>

        </div>

        {/* ========================================================
            COLUNA 2 (DIREITA): Grande Arte / Ilustração 3D Central
            lg:col-span-5
           ======================================================== */}
        <div className="lg:col-span-5 flex items-center justify-center py-4 lg:py-2">
          <HeroIllustration3D type="home" />
        </div>

      </div>
    </section>
  );
};

