import React from "react";
import { CheckCircle2, Download, RefreshCw, FileText, ArrowRight, Sparkles } from "lucide-react";
import { PdfResultDataV2 } from "../types";

interface PdfResultV2Props {
  result: PdfResultDataV2;
  onReset: () => void;
  title?: string;
  subtitle?: string;
}

export const PdfResultV2: React.FC<PdfResultV2Props> = ({
  result,
  onReset,
  title = "Seu documento PDF está pronto!",
  subtitle = "O processamento foi concluído 100% no seu dispositivo."
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = result.downloadUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm max-w-xl mx-auto text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 text-left space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={result.fileName}>
              {result.fileName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatSize(result.finalSize)}
              {result.pageCount ? ` • ${result.pageCount} ${result.pageCount === 1 ? "página" : "páginas"}` : ""}
            </p>
          </div>
        </div>

        {result.originalSize && result.originalSize !== result.finalSize && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tamanho Original: {formatSize(result.originalSize)}</span>
            {result.savingsPercent !== undefined && result.savingsPercent > 0 && (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Economia de {result.savingsPercent}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span>Baixar Arquivo</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="py-3.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Fazer Outro</span>
        </button>
      </div>
    </div>
  );
};
