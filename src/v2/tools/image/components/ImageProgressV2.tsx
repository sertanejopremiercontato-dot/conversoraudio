import React from "react";
import { Loader2, Zap } from "lucide-react";

interface ImageProgressV2Props {
  progress: number;
  currentStepText: string;
  subText?: string;
}

export const ImageProgressV2: React.FC<ImageProgressV2Props> = ({
  progress,
  currentStepText,
  subText = "Processando no seu navegador com aceleração gráfica..."
}) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-6 shadow-xs max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto animate-pulse">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-[#0F172A]">{currentStepText}</h3>
        <p className="text-xs text-[#64748B] max-w-xs mx-auto">{subText}</p>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#0284C7] to-[#2563EB] h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-bold text-[#94A3B8]">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#0284C7]" />
            Local Seguro
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};
