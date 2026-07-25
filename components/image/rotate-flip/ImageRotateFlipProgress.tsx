import React from "react";
import { X, Loader2, AlertCircle } from "lucide-react";

interface ImageRotateFlipProgressProps {
  currentCount: number;
  totalCount: number;
  currentFileName: string;
  onCancel: () => void;
}

export default function ImageRotateFlipProgress({
  currentCount,
  totalCount,
  currentFileName,
  onCancel
}: ImageRotateFlipProgressProps) {
  const percentage = Math.min(100, Math.round((currentCount / (totalCount || 1)) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card-main border border-border-main rounded-2xl max-w-md w-full p-6 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-green-primary/10 text-green-primary rounded-full flex items-center justify-center mx-auto border border-green-primary/30">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg text-text-main">
            Processando imagem {currentCount} de {totalCount}
          </h3>
          <p className="text-xs text-text-sec font-mono truncate max-w-xs mx-auto">
            {currentFileName || "Ajustando orientação..."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-card-inner rounded-full overflow-hidden border border-border-main p-0.5">
            <div
              className="h-full bg-green-primary rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-text-muted font-bold">
            <span>{percentage}% concluído</span>
            <span>{currentCount}/{totalCount}</span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-extrabold text-xs transition-colors cursor-pointer"
        >
          Cancelar processamento
        </button>
      </div>
    </div>
  );
}
