import React from "react";
import { Scissors, Sliders, Download, Zap, Gauge } from "lucide-react";

export const VideoStepsBarV2: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch" id="v2-video-steps-bar">
      {/* Left: 3 Steps Workflow Panel (8 columns on lg) */}
      <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        
        {/* Step 1 */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shrink-0 shadow-2xs">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-[#6366F1] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                1
              </span>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#0F172A] tracking-tight truncate">
                Extração de Áudio
              </h4>
            </div>
            <p className="text-[11.5px] text-[#64748B] leading-relaxed">
              O áudio é extraído diretamente do vídeo no seu navegador.
            </p>
          </div>
        </div>

        {/* Connector 1 */}
        <div className="hidden md:flex items-center text-[#CBD5E1] shrink-0">
          <span className="text-xs font-mono tracking-widest text-[#94A3B8]">······▶</span>
        </div>

        {/* Step 2 */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-[#2563EB] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                2
              </span>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#0F172A] tracking-tight truncate">
                Defina a Qualidade
              </h4>
            </div>
            <p className="text-[11.5px] text-[#64748B] leading-relaxed">
              Escolha a qualidade e o formato de saída ideal para você.
            </p>
          </div>
        </div>

        {/* Connector 2 */}
        <div className="hidden md:flex items-center text-[#CBD5E1] shrink-0">
          <span className="text-xs font-mono tracking-widest text-[#94A3B8]">······▶</span>
        </div>

        {/* Step 3 */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
            <Download className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-[#059669] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                3
              </span>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#0F172A] tracking-tight truncate">
                Baixe seu Áudio
              </h4>
            </div>
            <p className="text-[11.5px] text-[#64748B] leading-relaxed">
              Download rápido e seguro, pronto para usar onde quiser.
            </p>
          </div>
        </div>

      </div>

      {/* Right: "Rápido e Eficiente" Card (4 columns on lg) */}
      <div className="lg:col-span-4 bg-gradient-to-r from-[#FAF5FF] via-[#F5F3FF] to-[#EDE9FE]/50 border border-[#EDE9FE] rounded-[24px] p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shrink-0 shadow-2xs">
            <Zap className="w-5 h-5 fill-[#7C3AED]" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold text-[#0F172A] tracking-tight">
              Rápido e Eficiente
            </h4>
            <p className="text-[11.5px] text-[#64748B] leading-relaxed">
              Processamento otimizado diretamente no navegador quando aplicável.
            </p>
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
          <Gauge className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

