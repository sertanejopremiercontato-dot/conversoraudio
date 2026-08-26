import React from "react";
import { Sparkles, Shield } from "lucide-react";

export const MetadataHighlightBannerV2: React.FC = () => {
  return (
    <div 
      className="bg-gradient-to-r from-[#0F1B38] via-[#1E1B4B] to-[#3B0764] border border-[#2E285F] rounded-2xl md:rounded-[22px] px-5 sm:px-7 py-4 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-[0_4px_20px_rgba(15,23,42,0.15)]"
      id="v2-metadata-highlight-banner"
    >
      {/* Left: Highlight message */}
      <div className="flex items-center gap-3 text-center md:text-left">
        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-[#F472B6]">
          <Sparkles className="w-4 h-4 text-[#F472B6]" />
        </div>
        <p className="text-xs sm:text-[13.5px] font-semibold text-[#F1F5F9] leading-snug">
          Limpeza real de metadados — <span className="text-[#E2E8F0] font-normal">encontre e remova informações escondidas que outras ferramentas deixam passar.</span>
        </p>
      </div>

      {/* Right: Slogan Pill */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-[#F8FAFC] shrink-0 shadow-2xs">
        <Shield className="w-4 h-4 text-[#C084FC]" />
        <span>Sua privacidade. Seu áudio. Seu controle.</span>
      </div>
    </div>
  );
};
