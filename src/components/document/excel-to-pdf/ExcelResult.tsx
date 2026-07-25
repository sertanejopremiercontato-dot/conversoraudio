import React, { useState } from "react";
import { Download, CheckCircle2, FileText, RefreshCw, Edit2 } from "lucide-react";
import { trackEvent } from "../../../lib/gtag";

interface ExcelResultProps {
  pdfBlobUrl: string;
  defaultFilename: string;
  pdfSize: number;
  pageCount: number;
  sheetCount: number;
  onReset: () => void;
}

export default function ExcelResult({
  pdfBlobUrl,
  defaultFilename,
  pdfSize,
  pageCount,
  sheetCount,
  onReset
}: ExcelResultProps) {
  const [filename, setFilename] = useState(defaultFilename);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    trackEvent("excel_to_pdf_download_clicked", {
      filename,
      page_count: pageCount,
      sheet_count: sheetCount
    });

    const a = document.createElement("a");
    a.href = pdfBlobUrl;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-8 shadow-2xl">
      <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 inline-block">
        <CheckCircle2 className="h-12 w-12 mx-auto" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-extrabold text-xl md:text-2xl text-slate-100">
          Conversão Concluída com Sucesso!
        </h3>
        <p className="text-xs md:text-sm text-slate-400">
          Seu PDF foi gerado e está pronto para download.
        </p>
      </div>

      {/* Editable Filename Card */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-left">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Nome do Arquivo PDF
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-slate-900 font-bold text-sm text-slate-100 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 w-full focus:outline-none"
              />
              <Edit2 className="h-4 w-4 text-slate-500 shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-900 font-medium">
          <span>Tamanho: <strong className="text-slate-200">{formatSize(pdfSize)}</strong></span>
          <span>Páginas: <strong className="text-slate-200">{pageCount}</strong></span>
          <span>Abas convertidas: <strong className="text-slate-200">{sheetCount}</strong></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Download className="h-5 w-5" />
          <span>Baixar PDF</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Converter Outro Excel</span>
        </button>
      </div>
    </div>
  );
}
