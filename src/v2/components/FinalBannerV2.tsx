import React from "react";
import { AppRouteV2 } from "../routes";
import { ShieldCheck, Layers, Cpu, Lock, ArrowRight } from "lucide-react";

interface FinalBannerV2Props {
  onNavigate: (route: AppRouteV2) => void;
}

export const FinalBannerV2: React.FC<FinalBannerV2Props> = ({ onNavigate }) => {
  const handleExplore = () => {
    const el = document.getElementById("ferramentas-principais");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      onNavigate("audio");
    }
  };

  return (
    <section className="w-full my-4" id="v2-final-banner">
      <div className="bg-white border border-[#E2EBF8] rounded-[24px] md:rounded-[28px] p-5 sm:p-6 md:p-7 shadow-[0_2px_16px_rgba(11,31,68,0.03)] flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Side: Shield Icon + Title + Description */}
        <div className="flex items-center gap-4 text-left w-full lg:w-auto">
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D68F2] shrink-0 shadow-2xs">
            <ShieldCheck className="w-6 h-6 text-[#1D68F2]" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-[17px] font-black text-[#0B1F44] tracking-tight">
              Todas as ferramentas que você precisa, em um só lugar
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5C6F84] font-medium leading-relaxed">
              Solução completa para converter, editar e organizar seus arquivos com máxima eficiência e segurança.
            </p>
          </div>
        </div>

        {/* Right Side: 3 Indicators + CTA Button */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-4 sm:gap-6 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-[#F1F5F9]">
          <div className="hidden sm:flex flex-wrap items-center gap-4 text-xs font-semibold text-[#475569]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#1D68F2]" />
              <span>Suporte a 50+ formatos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#1D68F2]" />
              <span>Processamento 100% no navegador</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#1D68F2]" />
              <span>Privacidade e segurança total</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExplore}
            className="px-5 py-3 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#BFDBFE] hover:border-[#1D68F2] text-[#1D68F2] text-xs sm:text-[13px] font-black flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap ml-auto lg:ml-0"
          >
            <span>Explorar Todas as Ferramentas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

