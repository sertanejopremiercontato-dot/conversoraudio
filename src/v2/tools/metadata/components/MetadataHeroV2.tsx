import React from "react";
import { Sparkles, ShieldCheck, Search, Hash, Music, Check, ChevronRight } from "lucide-react";

interface MetadataHeroV2Props {
  onBack?: () => void;
}

export const MetadataHeroV2: React.FC<MetadataHeroV2Props> = ({ onBack }) => {
  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-br from-[#0B132B] via-[#0D1B3E] to-[#120D2E] border border-[#1E294B] rounded-[28px] md:rounded-[36px] p-6 md:p-10 lg:p-12 shadow-[0_12px_40px_rgba(3,7,18,0.4)] text-white"
      id="v2-metadata-hero"
    >
      {/* Glow Effects & Subtle Background Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#EC4899]/10 blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-10 w-80 h-80 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#3B82F6]/10 blur-3xl pointer-events-none -z-0" />

      {/* Decorative Wave Lines / Subtle Grid Effect */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none -z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12">
        {/* Left Column: Breadcrumb, Badge, Big Title, Subtext, 4 Chips */}
        <div className="space-y-5 max-w-2xl text-center lg:text-left flex-1">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-center lg:justify-start gap-1.5 text-xs text-[#94A3B8]">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-white font-medium transition-colors cursor-pointer"
            >
              Início
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
            <button
              type="button"
              onClick={onBack}
              className="hover:text-white font-medium transition-colors cursor-pointer"
            >
              Ferramentas
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-[#F472B6] font-bold">
              Editor de Metadados
            </span>
          </nav>

          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#EC4899]/20 to-[#8B5CF6]/20 border border-[#EC4899]/30 text-[#F472B6] text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
            <span>FERRAMENTA PREMIUM</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-black tracking-tight leading-[1.12] text-white">
            Editor e Limpador de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EC4899] via-[#C084FC] to-[#818CF8]">
              Metadados
            </span>{" "}
            de Áudio
          </h1>

          {/* Subtext */}
          <p className="text-xs sm:text-sm md:text-[14.5px] text-[#CBD5E1] leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
            Remova de verdade informações ocultas e dados sensíveis que outras ferramentas não conseguem alcançar. Eliminamos metadados escondidos, tags invisíveis, rastros de origem, capa embutida, créditos, campos ID3/RIFF/Vorbis e qualquer informação sensível incorporada ao áudio — preservando 100% do seu conteúdo sonoro.
          </p>

          {/* 4 Chips */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
            {/* Chip 1: Limpeza Profunda */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EC4899]/10 border border-[#EC4899]/30 text-[#F472B6] text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
              <span>Limpeza Profunda</span>
            </div>

            {/* Chip 2: Privacidade Total */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#C084FC] text-xs font-bold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>Privacidade Total</span>
            </div>

            {/* Chip 3: Análise Forense */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-bold shadow-xs">
              <Search className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Análise Forense</span>
            </div>

            {/* Chip 4: Hash de Integridade */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#FBBF24] text-xs font-bold shadow-xs">
              <Hash className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Hash de Integridade</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Forensic Art / Simulation Panel */}
        <div className="shrink-0 w-full max-w-[500px] lg:max-w-[540px]">
          <div className="relative bg-[#0F1D40]/90 backdrop-blur-xl border border-[#253764] rounded-[24px] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none">
            
            {/* Top Row: File Card + Shield Center + Detected Metadata list + Right pills */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              
              {/* Left File Preview Sub-Card */}
              <div className="flex-1 bg-[#162752]/90 border border-[#2B4075] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-3">
                  {/* Pink gradient album square with music icon */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#EC4899] to-[#F43F5E] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(236,72,153,0.4)] shrink-0">
                    <Music className="w-6 h-6 fill-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                      minha-musica.wav
                    </h4>
                    <p className="text-[10.5px] text-[#94A3B8] truncate">
                      24.6 MB • WAV • 44.1 kHz • 16-bit
                    </p>
                  </div>
                </div>

                {/* Pink/Magenta Waveform Graphic */}
                <div className="flex items-center gap-1 h-8 px-1 justify-center">
                  <span className="w-1 h-2 bg-[#F472B6]/40 rounded-full" />
                  <span className="w-1 h-4 bg-[#F472B6]/60 rounded-full" />
                  <span className="w-1 h-6 bg-[#EC4899] rounded-full" />
                  <span className="w-1 h-3 bg-[#F472B6]/70 rounded-full" />
                  <span className="w-1 h-7 bg-[#F43F5E] rounded-full" />
                  <span className="w-1 h-5 bg-[#EC4899] rounded-full" />
                  <span className="w-1 h-8 bg-[#F43F5E] rounded-full" />
                  <span className="w-1 h-4 bg-[#F472B6] rounded-full" />
                  <span className="w-1 h-7 bg-[#EC4899] rounded-full" />
                  <span className="w-1 h-5 bg-[#F472B6] rounded-full" />
                  <span className="w-1 h-3 bg-[#F472B6]/60 rounded-full" />
                  <span className="w-1 h-6 bg-[#F43F5E] rounded-full" />
                  <span className="w-1 h-2 bg-[#F472B6]/40 rounded-full" />
                </div>

                {/* Badge: Análise Forense Completa */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#34D399] font-bold">
                  <Check className="w-3.5 h-3.5 text-[#34D399] stroke-[3]" />
                  <span>Análise Forense Completa</span>
                </div>
              </div>

              {/* Center Glowing Shield */}
              <div className="hidden sm:flex items-center justify-center shrink-0">
                <div className="relative w-12 h-14 rounded-2xl bg-gradient-to-b from-[#2A1845] to-[#1D183B] border border-[#EC4899]/40 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                  <Sparkles className="w-5 h-5 text-[#F472B6] fill-[#F472B6]/30 animate-pulse" />
                </div>
              </div>

              {/* Right: Metadados Detectados & Badges */}
              <div className="flex items-start justify-between gap-3 bg-[#132247]/70 border border-[#243765] rounded-2xl p-3.5 shrink-0">
                {/* List of Detected Items */}
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-[#F1F5F9] block pb-0.5">
                    Metadados Detectados
                  </span>
                  <ul className="text-[10px] text-[#94A3B8] space-y-0.5">
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#EC4899]" />
                      <span>Título</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#EC4899]" />
                      <span>Artista</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#EC4899]" />
                      <span>Álbum</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#EC4899]" />
                      <span>Capa embutida</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#EC4899]" />
                      <span>Créditos</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#EC4899]" />
                      <span>Software de origem</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#EC4899]" />
                      <span>ID do dispositivo</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#EC4899]" />
                      <span>Localização</span>
                    </li>
                  </ul>
                </div>

                {/* Right Stacked Pills */}
                <div className="flex flex-col gap-1.5 shrink-0 justify-center">
                  <span className="px-2.5 py-0.5 text-[9.5px] font-black rounded-lg bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/40 text-center">
                    ID3
                  </span>
                  <span className="px-2.5 py-0.5 text-[9.5px] font-black rounded-lg bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/40 text-center">
                    RIFF
                  </span>
                  <span className="px-2.5 py-0.5 text-[9.5px] font-black rounded-lg bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40 text-center">
                    VORBIS
                  </span>
                  <span className="px-2.5 py-0.5 text-[9.5px] font-black rounded-lg bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40 text-center">
                    HASH
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Pipeline Bar */}
            <div className="mt-5 pt-4 border-t border-[#1F3360] flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Pipeline Nodes Flow */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]/60" />
                  <span className="w-6 h-0.5 bg-[#334D80]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]/60" />
                  <span className="w-6 h-0.5 bg-[#334D80]" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#EC4899] shadow-[0_0_10px_#EC4899] animate-pulse" />
                  <span className="w-6 h-0.5 bg-[#EC4899]" />
                </div>
                {/* Final Clean Badge */}
                <div className="px-3 py-1 rounded-full bg-[#059669]/30 border border-[#10B981]/50 text-[#34D399] text-[11px] font-black flex items-center gap-1 shadow-sm">
                  <span>CLEAN</span>
                  <Check className="w-3 h-3 text-[#34D399] stroke-[3]" />
                </div>
              </div>

              {/* Subtitle */}
              <span className="text-[11px] text-[#94A3B8] font-medium text-center sm:text-right">
                Informações ocultas removidas com segurança
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
