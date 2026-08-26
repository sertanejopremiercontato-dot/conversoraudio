import React from "react";
import { Sparkles, ShieldCheck, CheckCircle2, Activity, Play, Music, Check, ChevronRight } from "lucide-react";

interface AudioHeroV2Props {
  onBack?: () => void;
}

export const AudioHeroV2: React.FC<AudioHeroV2Props> = ({ onBack }) => {
  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-r from-[#EBF3FE] via-[#F4F9FF] to-[#E9F3FE] border border-[#E0ECFA] rounded-[24px] md:rounded-[28px] p-6 md:p-8 lg:p-10 shadow-[0_4px_24px_rgba(29,104,242,0.03)]"
      id="v2-audio-hero"
    >
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-white/60 blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 rounded-full bg-[#38BDF8]/10 blur-2xl pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">
        {/* Left Column: Breadcrumb, Badge, Title, Subtitle, 3 Badges */}
        <div className="space-y-4 max-w-2xl text-center lg:text-left flex-1">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-center lg:justify-start gap-1.5 text-xs text-[#5C6F84]">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-[#1D68F2] font-medium transition-colors cursor-pointer"
            >
              Início
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            <button
              type="button"
              onClick={onBack}
              className="hover:text-[#1D68F2] font-medium transition-colors cursor-pointer"
            >
              Ferramentas
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="text-[#1D68F2] font-bold">
              Conversor de Áudio
            </span>
          </nav>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D68F2]/10 border border-[#1D68F2]/20 text-[#1D68F2] text-[11px] font-bold tracking-wide">
            <Activity className="w-3.5 h-3.5 text-[#1D68F2]" />
            <span>Conversor de Áudio</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-[#0B1F44] tracking-tight leading-[1.12]">
            Conversor de <span className="text-[#1D68F2]">Áudio</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-[14.5px] text-[#5C6F84] leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
            Converta seus arquivos de áudio para o formato que você precisa. Leitura real de tags ID3/Vorbis/RIFF, edição completa e limpeza sem reencodar o áudio.
          </p>

          {/* 3 Compact Benefit Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            {/* Card 1: Processamento Local */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 border border-[#E0ECFA] shadow-2xs text-left">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0 text-[#059669]">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-[#0B1F44] block truncate">Processamento Local</span>
                <span className="text-[11px] text-[#5C6F84] block truncate font-medium">Privado e seguro</span>
              </div>
            </div>

            {/* Card 2: Sem Limites Abusivos */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 border border-[#E0ECFA] shadow-2xs text-left">
              <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center shrink-0 text-[#7C3AED]">
                <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-[#0B1F44] block truncate">Sem Limites Abusivos</span>
                <span className="text-[11px] text-[#5C6F84] block truncate font-medium">Sem restrições</span>
              </div>
            </div>

            {/* Card 3: Alta Fidelidade de Saída */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 border border-[#E0ECFA] shadow-2xs text-left">
              <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center shrink-0 text-[#D97706]">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-[#0B1F44] block truncate">Alta Fidelidade de Saída</span>
                <span className="text-[11px] text-[#5C6F84] block truncate font-medium">Qualidade preservada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audio 3D Player Art */}
        <div className="shrink-0 flex items-center justify-center">
          <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[400px] h-[260px] sm:h-[290px] md:h-[310px] flex items-center justify-center select-none" id="hero-3d-scene-audio">
            {/* Background Soft Glows */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#38BDF8]/25 via-[#1D68F2]/15 to-transparent blur-3xl -z-10 pointer-events-none" />
            <div className="absolute w-48 h-48 rounded-full bg-[#60A5FA]/20 blur-2xl -z-10 pointer-events-none -top-4" />

            {/* 3D Scene Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              
              {/* 1. Base Pedestal: Layered Concentric Glowing Ellipses */}
              <div className="absolute bottom-1 sm:bottom-2 w-64 sm:w-76 md:w-84 h-16 sm:h-20 flex items-center justify-center pointer-events-none">
                <div className="absolute -bottom-2 w-56 sm:w-68 h-10 bg-[#1D68F2]/15 rounded-full blur-lg" />
                <div className="w-64 sm:w-76 md:w-84 h-16 sm:h-20 rounded-[100%] bg-gradient-to-b from-[#93C5FD] via-[#60A5FA] to-[#1D68F2] shadow-[0_16px_32px_rgba(29,104,242,0.25)] border-t border-white/70 flex items-center justify-center p-1.5" />
                <div className="absolute top-1.5 sm:top-2 w-60 sm:w-72 md:w-80 h-13 sm:h-16 rounded-[100%] bg-gradient-to-tr from-[#BFDBFE] via-[#DBEAFE] to-[#EFF6FF] border border-white/90 shadow-inner flex items-center justify-center" />
                <div className="absolute top-3 sm:top-4 w-52 sm:w-64 md:w-72 h-10 sm:h-12 rounded-[100%] bg-gradient-to-b from-white via-[#F0F9FF] to-[#DBEAFE] border border-white shadow-xs" />
              </div>

              {/* 2. Main 3D Player Window / Card */}
              <div className="relative z-10 w-60 sm:w-68 md:w-74 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-white shadow-[0_20px_48px_rgba(29,104,242,0.18),0_4px_16px_rgba(11,31,68,0.06)] transform hover:scale-[1.02] transition-transform duration-300">
                {/* Top Window Dots */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  </div>
                  <span className="text-[10px] text-[#94A3B8] font-bold">•••</span>
                </div>

                {/* Middle: Play Button + Waveform */}
                <div className="py-3 sm:py-4 flex items-center justify-between gap-3 px-1">
                  {/* Blue Circular Play Button */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#1D68F2] via-[#2563EB] to-[#38BDF8] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(29,104,242,0.4)] border-2 border-white shrink-0 hover:scale-105 transition-transform cursor-pointer">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white ml-0.5" />
                  </div>

                  {/* Sound Waveform Bars */}
                  <div className="flex items-center gap-1 sm:gap-1.5 h-10 sm:h-12 flex-1 justify-center px-1">
                    <span className="w-1 sm:w-1.5 h-3 bg-[#93C5FD] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-6 bg-[#60A5FA] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-9 bg-[#1D68F2] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-5 bg-[#3B82F6] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-8 bg-[#1D68F2] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-11 bg-[#2563EB] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-7 bg-[#1D68F2] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-10 bg-[#3B82F6] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-8 bg-[#60A5FA] rounded-full" />
                    <span className="w-1 sm:w-1.5 h-4 bg-[#93C5FD] rounded-full" />
                  </div>
                </div>

                {/* Progress Time & Slider */}
                <div className="space-y-1.5 mb-2.5">
                  <div className="flex items-center justify-between text-[10px] text-[#64748B] font-bold">
                    <span>00:00</span>
                    <span>03:45</span>
                  </div>
                  <div className="relative w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-visible">
                    <div className="absolute top-0 left-0 h-full w-[45%] bg-gradient-to-r from-[#1D68F2] to-[#38BDF8] rounded-full" />
                    <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#1D68F2] border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform" />
                  </div>
                </div>

                {/* Status Row: Alta Fidelidade + 320 kbps HD */}
                <div className="pt-1 flex items-center justify-between text-[10.5px] sm:text-xs font-extrabold">
                  <span className="flex items-center gap-1 text-[#059669]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Alta Fidelidade</span>
                  </span>
                  <span className="text-[#1D68F2] font-black">320 kbps HD</span>
                </div>
              </div>

              {/* 3. Floating 3D Format Pills Around Card */}
              {/* Top-Left: Purple MP3 */}
              <div className="absolute -top-2 -left-2 sm:-left-6 z-20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] text-white text-xs sm:text-sm font-black tracking-wide shadow-[0_10px_22px_rgba(109,40,217,0.35)] border border-white/40 transform -rotate-6 hover:scale-110 transition-transform cursor-default flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 fill-white" />
                <span>MP3</span>
              </div>

              {/* Top-Right: Green WAV */}
              <div className="absolute -top-1 -right-2 sm:-right-6 z-20 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white text-xs sm:text-sm font-black tracking-wide shadow-[0_10px_22px_rgba(5,150,105,0.35)] border border-white/40 transform rotate-6 hover:scale-110 transition-transform cursor-default flex items-center gap-1.5">
                <span>WAV</span>
              </div>

              {/* Bottom-Left: Orange M4A */}
              <div className="absolute bottom-8 -left-3 sm:-left-8 z-20 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white text-xs sm:text-sm font-black tracking-wide shadow-[0_10px_22px_rgba(234,88,12,0.35)] border border-white/40 transform 3 hover:scale-110 transition-transform cursor-default flex items-center gap-1.5">
                <span>M4A</span>
              </div>

              {/* Bottom-Right: Blue FLAC */}
              <div className="absolute bottom-6 -right-3 sm:-right-8 z-20 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#2563EB] text-white text-xs sm:text-sm font-black tracking-wide shadow-[0_10px_22px_rgba(29,78,216,0.35)] border border-white/40 transform -rotate-3 hover:scale-110 transition-transform cursor-default flex items-center gap-1.5">
                <span>FLAC</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
