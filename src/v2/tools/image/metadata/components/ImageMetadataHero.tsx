import React from "react";
import { ArrowLeft, ShieldCheck, Sparkles, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface ImageMetadataHeroProps {
  onBack?: () => void;
}

export const ImageMetadataHero: React.FC<ImageMetadataHeroProps> = ({ onBack }) => {
  return (
    <div className="relative bg-white border border-[#E2E8F0] rounded-[24px] p-6 sm:p-8 shadow-xs overflow-hidden" id="image-metadata-hero-section">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ECFDF5]/80 via-[#F0FDF4]/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] transition-all cursor-pointer shadow-2xs"
            id="btn-back-image-hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Ferramentas de Imagem</span>
          </button>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacidade & Metadados Reais</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
              Editor e Limpador de Metadados de Imagem
            </h1>

            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              Descubra o que existe escondido dentro de suas imagens, remova dados de localização (GPS), dispositivo, software e autoria antiga e insira somente as informações que deseja manter.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#334155]">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Preserva 100% dos pixels e qualidade</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#334155]">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Preserva perfil ICC de cor</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#334155]">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Compatível com JPG, PNG e WebP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
