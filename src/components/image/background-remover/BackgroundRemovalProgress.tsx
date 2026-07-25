import React from "react";
import { Loader2, X } from "lucide-react";

interface BackgroundRemovalProgressProps {
  percent: number;
  onCancel?: () => void;
}

export const BackgroundRemovalProgress: React.FC<BackgroundRemovalProgressProps> = ({
  percent,
  onCancel
}) => {
  return (
    <div className="max-w-xl mx-auto space-y-6 py-8">
      <div className="bg-card-main border border-border-main rounded-3xl p-8 text-center space-y-6 shadow-xl">
        <div className="p-4 bg-card-inner border border-border-main rounded-2xl w-fit mx-auto text-green-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-text-main">
            Removendo fundo...
          </h3>
        </div>

        {/* Simple Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-card-inner rounded-full h-3 border border-border-main overflow-hidden p-0.5">
            <div
              className="bg-green-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-text-sec block">
            {percent}%
          </span>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-sec hover:text-red-400 transition-colors cursor-pointer pt-2"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancelar</span>
          </button>
        )}
      </div>
    </div>
  );
};
