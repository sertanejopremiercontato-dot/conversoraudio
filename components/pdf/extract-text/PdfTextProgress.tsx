import React from "react";
import { Loader2, XCircle } from "lucide-react";

interface PdfTextProgressProps {
  current: number;
  total: number;
  onCancel: () => void;
}

export const PdfTextProgress: React.FC<PdfTextProgressProps> = ({
  current,
  total,
  onCancel
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="bg-card-main border border-border-main rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-xl max-w-xl mx-auto">
      <div className="p-4 bg-card-inner border border-border-main rounded-2xl w-fit mx-auto text-green-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-base md:text-lg text-text-main">
          Extraindo texto da página {current} de {total}
        </h3>
        <p className="text-xs text-text-sec">
          Aguarde enquanto processamos o documento PDF diretamente no navegador...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 max-w-md mx-auto">
        <div className="w-full h-3 bg-card-inner border border-border-main rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-green-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-bold text-text-sec px-1">
          <span>{percentage}% concluído</span>
          <span>
            {current}/{total} pág.
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
      >
        <XCircle className="h-4 w-4" />
        <span>CANCELAR EXTRAÇÃO</span>
      </button>
    </div>
  );
};
