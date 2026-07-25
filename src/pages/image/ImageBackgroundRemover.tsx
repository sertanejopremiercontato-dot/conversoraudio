import React from "react";
import useSeoHead from "../../lib/useSeoHead";
import AdBanner from "../../components/AdBanner";
import { ArrowLeft, Wrench } from "lucide-react";

interface ImageBackgroundRemoverProps {
  onNavigate?: (path: string) => void;
}

export default function ImageBackgroundRemover({ onNavigate }: ImageBackgroundRemoverProps) {
  useSeoHead("image_background_removal");

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back Button */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate("/imagem")}
          className="inline-flex items-center gap-2 text-xs font-bold text-text-sec hover:text-green-light transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Ferramentas de Imagem</span>
        </button>
      )}

      {/* Main Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl md:text-4xl font-extrabold text-text-main tracking-tight">
          Remover Fundo de Imagem
        </h1>
      </div>

      <AdBanner positionId="below_bg_remover_top" toolName="Remover Fundo" />

      {/* Status Notice Card */}
      <div className="bg-card-main border border-border-main rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-xl max-w-xl mx-auto">
        <div className="p-4 bg-card-inner border border-border-main rounded-2xl w-fit mx-auto text-green-primary">
          <Wrench className="h-8 w-8" />
        </div>

        <div className="space-y-3">
          <p className="font-bold text-base md:text-lg text-text-main">
            Esta ferramenta está em aprimoramento e voltará em breve.
          </p>
          <p className="text-xs text-text-sec font-medium leading-relaxed max-w-md mx-auto">
            Estamos trabalhando para entregar a melhor experiência e qualidade possível.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("/imagem")}
            className="px-6 py-3 bg-green-primary hover:bg-green-light text-bg-main font-bold text-sm rounded-2xl transition-all shadow-md hover:shadow-green-primary/20 inline-flex items-center gap-2 cursor-pointer uppercase tracking-wide"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ver outras ferramentas</span>
          </button>
        )}
      </div>

      <AdBanner positionId="page_bottom" toolName="Remover Fundo" />
    </div>
  );
}
