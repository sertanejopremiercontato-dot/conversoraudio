import React from "react";
import { Loader2, XCircle, Cpu, Zap } from "lucide-react";

interface VideoProgressV2Props {
  stage: string;
  percent: number;
  onCancel: () => void;
}

export const VideoProgressV2: React.FC<VideoProgressV2Props> = ({
  stage,
  percent,
  onCancel
}) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 md:p-8 shadow-xs space-y-6" id="v2-video-progress-panel">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-[#0F172A]">
              Extraindo e Processando Áudio
            </h4>
            <p className="text-xs text-[#64748B] font-medium">
              {stage || "Processando faixas no navegador..."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:text-[#DC2626] hover:border-[#FCA5A5] hover:bg-[#FEF2F2] text-xs font-bold transition-all cursor-pointer"
          id="v2-btn-cancel-extraction"
        >
          <XCircle className="w-4 h-4" />
          <span>Cancelar</span>
        </button>
      </div>

      {/* Barra de Progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#4F46E5] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-[#4F46E5]" />
            <span>Processando no dispositivo</span>
          </span>
          <span className="text-[#0F172A] font-black text-sm">
            {percent}%
          </span>
        </div>

        <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden p-0.5 border border-[#E2E8F0]">
          <div
            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] rounded-full transition-all duration-300 ease-out shadow-xs"
            style={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
          />
        </div>
      </div>

      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9] flex items-center gap-2.5 text-xs text-[#64748B]">
        <Cpu className="w-4 h-4 text-[#6366F1] shrink-0" />
        <span>Thread de áudio isolada via Web Workers para máxima performance sem travar a tela.</span>
      </div>
    </div>
  );
};
