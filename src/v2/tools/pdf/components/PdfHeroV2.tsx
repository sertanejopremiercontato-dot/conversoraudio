import React from "react";
import { FileText, Lock, Cloud, Sparkles, PieChart, Image as ImageIcon, Type } from "lucide-react";

interface PdfHeroV2Props {
  onBack?: () => void;
}

export const PdfHeroV2: React.FC<PdfHeroV2Props> = () => {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#FFF5F5] via-[#FFF1F2] to-[#FFF8F8] border border-[#FECDD3] rounded-[24px] md:rounded-[28px] px-8 sm:px-12 lg:px-16 xl:px-20 py-10 sm:py-12 lg:py-14 shadow-[0_8px_30px_rgba(239,68,68,0.04)] min-h-[380px] lg:min-h-[410px] flex items-center"
      id="v2-pdf-hero"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[550px] h-[550px] rounded-full bg-[#FDA4AF]/20 blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] rounded-full bg-[#FECDD3]/25 blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-[#FFE4E6]/30 blur-3xl pointer-events-none -z-0" />

      {/* Decorative 4-point sparkles */}
      <div className="absolute top-8 right-[42%] text-[#FDA4AF] select-none pointer-events-none">✦</div>
      <div className="absolute bottom-16 right-[48%] text-[#FDA4AF] select-none pointer-events-none text-xs">✦</div>
      <div className="absolute top-12 right-[10%] text-[#FDA4AF] select-none pointer-events-none text-xs">✦</div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 w-full">
        {/* Left Column: Pill, Big Title, Description, 3 Chips (47% width on lg) */}
        <div className="space-y-6 max-w-xl text-center lg:text-left w-full lg:w-[47%]">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-[11px] font-black tracking-wider uppercase shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>FERRAMENTAS DE PDF</span>
          </div>

          {/* Big Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black tracking-tight leading-[1.08] text-[#0F172A]">
            Ferramentas de{" "}
            <span className="text-[#EF4444]">
              PDF
            </span>
            <br />
            Rápidas e Seguras
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-[15.5px] text-[#475569] leading-relaxed max-w-[560px] mx-auto lg:mx-0 font-normal">
            Mescle, comprima, organize, divida e converta seus documentos PDF com total segurança e processamento 100% no seu navegador.
          </p>

          {/* 3 Chips in a row */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
            {/* Chip 1: Processamento Local */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <Lock className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Processamento Local</span>
            </div>

            {/* Chip 2: Sem Upload para Nuvem */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <Cloud className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Sem Upload para Nuvem</span>
            </div>

            {/* Chip 3: Alta Resolução */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-[#1E293B] text-xs font-bold shadow-xs hover:border-[#CBD5E1] transition-all">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Alta Resolução</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic Composition (53% width on lg) */}
        <div className="w-full lg:w-[53%] max-w-[640px] xl:max-w-[680px] select-none shrink-0">
          <div className="relative flex items-center justify-center py-6">
            
            {/* 3D Concentric Oval Pedestal Underneath */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-28 border-2 border-[#FDA4AF]/40 rounded-[100%] pointer-events-none -z-0 bg-gradient-to-t from-[#FFE4E6]/70 to-transparent shadow-[0_14px_35px_rgba(239,68,68,0.12)]" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-72 sm:w-84 h-20 border border-[#FB7185]/50 rounded-[100%] pointer-events-none -z-0" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-60 sm:w-72 h-14 border border-[#F43F5E]/60 rounded-[100%] pointer-events-none -z-0 bg-[#FFF1F2]/60" />

            {/* Behind Documents in Perspective Stack */}
            <div className="absolute -top-3 left-[32%] w-44 sm:w-52 h-56 sm:h-64 bg-white/70 rounded-[20px] border border-white shadow-xs transform rotate-6 pointer-events-none" />
            <div className="absolute -top-1 left-[28%] w-48 sm:w-56 h-58 sm:h-66 bg-white/85 rounded-[22px] border border-white shadow-sm transform -rotate-3 pointer-events-none" />

            {/* Floating Top-Left Mini Card: Donut/Pie Chart */}
            <div className="absolute -top-4 left-[8%] sm:left-[12%] z-30 bg-white/95 backdrop-blur-md border border-[#F1F5F9] rounded-2xl p-3 shadow-[0_12px_28px_rgba(239,68,68,0.12)] w-32 sm:w-36 space-y-1.5 transform -rotate-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF1F2] flex items-center justify-center text-[#EF4444]">
                  <PieChart className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="h-1.5 bg-[#FECDD3] rounded-full w-full" />
                  <div className="h-1.5 bg-[#FFE4E6] rounded-full w-3/4" />
                </div>
              </div>
            </div>

            {/* Floating Bottom-Left Mini Card: Signature Calligraphy "la" */}
            <div className="absolute bottom-6 left-[6%] sm:left-[10%] z-30 bg-white/95 backdrop-blur-md border border-[#F1F5F9] rounded-2xl px-3.5 py-2 shadow-[0_12px_28px_rgba(239,68,68,0.12)] flex items-center justify-center transform -rotate-3">
              <span className="font-serif italic text-base text-[#E11D48] font-bold tracking-wider">
                la
              </span>
            </div>

            {/* Floating Top-Right Mini Card: Picture/Landscape */}
            <div className="absolute -top-2 right-[4%] sm:right-[8%] z-30 bg-white/95 backdrop-blur-md border border-[#F1F5F9] rounded-2xl p-2.5 shadow-[0_12px_28px_rgba(239,68,68,0.12)] w-28 sm:w-32 space-y-1 transform rotate-6">
              <div className="h-12 bg-gradient-to-tr from-[#FDA4AF] to-[#FFE4E6] rounded-xl flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-[#E11D48]/70" />
              </div>
              <div className="h-1.5 bg-[#F1F5F9] rounded-full w-3/4" />
            </div>

            {/* Floating Right Mini Card: Text Symbol "T" */}
            <div className="absolute top-1/2 -translate-y-1/2 right-[2%] sm:right-[6%] z-30 bg-white/95 backdrop-blur-md border border-[#F1F5F9] rounded-2xl w-12 h-12 flex items-center justify-center shadow-[0_12px_28px_rgba(239,68,68,0.12)] transform rotate-3">
              <span className="text-lg font-black text-[#EF4444]">T</span>
            </div>

            {/* Main Center Document Card */}
            <div className="relative w-[260px] sm:w-[300px] bg-white p-5 sm:p-6 rounded-[26px] shadow-[0_25px_50px_rgba(239,68,68,0.15),0_8px_20px_rgba(0,0,0,0.04)] border border-white/90 z-20 space-y-4">
              {/* Window header dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              </div>

              {/* Red 3D PDF Document Icon */}
              <div className="flex justify-center py-1">
                <div className="relative w-20 h-24 bg-gradient-to-br from-[#EF4444] via-[#DC2626] to-[#B91C1C] rounded-2xl shadow-[0_12px_25px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center text-white border border-white/30 transform hover:scale-105 transition-transform duration-300">
                  {/* Folded top-right corner */}
                  <div className="absolute top-0 right-0 w-6 h-6 bg-[#FECDD3]/40 rounded-bl-xl backdrop-blur-xs border-b border-l border-white/20" />
                  
                  <span className="text-[13px] font-black tracking-wider uppercase mt-2">
                    PDF
                  </span>
                  <div className="w-8 h-1 bg-white/40 rounded-full mt-1.5" />
                </div>
              </div>

              {/* Document Info */}
              <div className="text-center space-y-0.5">
                <h3 className="text-sm sm:text-[15px] font-black text-[#0F172A]">
                  Documento.pdf
                </h3>
                <p className="text-[11px] font-semibold text-[#64748B]">
                  2.4 MB • 24 páginas
                </p>
              </div>

              {/* Decorative document horizontal lines */}
              <div className="space-y-1.5 pt-1">
                <div className="h-1.5 bg-[#F1F5F9] rounded-full w-full" />
                <div className="h-1.5 bg-[#F1F5F9] rounded-full w-4/5 mx-auto" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
