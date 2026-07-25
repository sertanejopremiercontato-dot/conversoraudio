import React from "react";
import { Loader2, XCircle, FileSpreadsheet } from "lucide-react";

interface ExcelProgressProps {
  stepMessage: string;
  sheetName: string;
  sheetIdx: number;
  totalSheets: number;
  pageIdx: number;
  totalPages: number;
  percent: number;
  onCancel?: () => void;
}

export default function ExcelProgress({
  stepMessage,
  sheetName,
  sheetIdx,
  totalSheets,
  pageIdx,
  totalPages,
  percent,
  onCancel
}: ExcelProgressProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto space-y-6 shadow-2xl">
      <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 inline-block animate-pulse">
        <Loader2 className="h-10 w-10 mx-auto animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-bold text-lg md:text-xl text-slate-100">
          Gerando seu PDF do Excel...
        </h3>
        <p className="text-xs md:text-sm text-slate-300 font-medium">
          {stepMessage}
        </p>
      </div>

      {/* Real Progress Bar */}
      <div className="space-y-1.5 max-w-md mx-auto">
        <div className="flex justify-between text-xs font-bold text-slate-400">
          <span>
            {sheetName ? `Aba: ${sheetName}` : "Processando..."}
          </span>
          <span className="text-emerald-400 font-mono">{percent}%</span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 p-0.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(3, percent)}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500 font-medium pt-1">
          {totalPages > 0 ? `Página ${pageIdx} de ${totalPages}` : "Analisando estrutura..."}
        </p>
      </div>

      {onCancel && (
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <XCircle className="h-4 w-4 text-slate-400" />
            <span>Cancelar conversão</span>
          </button>
        </div>
      )}
    </div>
  );
}
