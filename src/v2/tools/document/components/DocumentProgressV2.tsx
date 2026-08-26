import React from "react";
import { Loader2, Zap } from "lucide-react";

interface DocumentProgressV2Props {
  stageMessage: string;
  percent: number;
  sheetOrPageInfo?: string;
  onCancel?: () => void;
}

export const DocumentProgressV2: React.FC<DocumentProgressV2Props> = ({
  stageMessage,
  percent,
  sheetOrPageInfo,
  onCancel
}) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mx-auto shadow-inner">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
          Processando Documento...
        </h3>
        <p className="text-xs sm:text-sm text-[#475569] font-medium">
          {stageMessage}
        </p>
        {sheetOrPageInfo && (
          <p className="text-[11px] font-semibold text-[#0284C7] bg-[#E0F2FE] px-3 py-1 rounded-full inline-block">
            {sheetOrPageInfo}
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <div className="w-full bg-[#E2E8F0] rounded-full h-3 overflow-hidden border border-[#CBD5E1]">
          <div
            className="bg-[#0284C7] h-3 rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-bold text-[#64748B]">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#0284C7]" />
            Processamento local
          </span>
          <span className="text-[#0284C7]">{Math.round(percent)}%</span>
        </div>
      </div>

      {onCancel && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] px-4 py-2 rounded-lg hover:bg-[#F1F5F9] transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};
