import React from "react";
import { Loader2, XCircle } from "lucide-react";

interface PdfProgressV2Props {
  progress: number;
  stepText: string;
  onCancel?: () => void;
}

export const PdfProgressV2: React.FC<PdfProgressV2Props> = ({
  progress,
  stepText,
  onCancel
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Processando PDF</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stepText || "Aguarde um momento..."}</p>
          </div>
        </div>
        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
          {progress}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {onCancel && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            Cancelar operação
          </button>
        </div>
      )}
    </div>
  );
};
