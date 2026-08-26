import React, { useState } from "react";
import { Download, RefreshCw, Eye, EyeOff, CheckCircle2, FileText, Sparkles, Layers } from "lucide-react";
import { DocumentResultDataV2 } from "../types";

interface DocumentResultV2Props {
  result: DocumentResultDataV2;
  onReset: () => void;
  title?: string;
  subtitle?: string;
}

export const DocumentResultV2: React.FC<DocumentResultV2Props> = ({
  result,
  onReset,
  title = "Conversão Concluída com Sucesso!",
  subtitle = "Seu documento PDF foi gerado e está pronto para visualização e download."
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = result.pdfBlobUrl;
    link.download = result.filename.endsWith(".pdf") ? result.filename : `${result.filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1 flex-1">
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#0F172A]">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Tamanho do PDF</span>
            <p className="text-sm font-extrabold text-[#0F172A]">{formatFileSize(result.filesize)}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total de Páginas</span>
            <p className="text-sm font-extrabold text-[#0F172A]">{result.pageCount} {result.pageCount === 1 ? "página" : "páginas"}</p>
          </div>
          {typeof result.sheetCount === "number" && (
            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Abas Convertidas</span>
              <p className="text-sm font-extrabold text-[#0F172A]">{result.sheetCount} {result.sheetCount === 1 ? "aba" : "abas"}</p>
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] hover:text-[#0F172A] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Converter Outro</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-3 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPreview ? "Ocultar Preview" : "Visualizar PDF"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#0284C7]/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PDF</span>
          </button>
        </div>

        {/* Warnings / Notices if any */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
            <span className="font-bold">Observações da conversão:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {result.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Embedded PDF Viewer */}
      {showPreview && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0284C7]" />
              Pré-visualização do Arquivo PDF
            </span>
            <span className="text-[11px] text-[#64748B] font-medium truncate max-w-[200px]">
              {result.filename}
            </span>
          </div>

          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl overflow-hidden h-[550px]">
            <iframe
              src={result.pdfBlobUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};
