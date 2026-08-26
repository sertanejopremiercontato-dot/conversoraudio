import React from "react";
import { Image as ImageIcon, ShieldAlert, ShieldCheck, RefreshCw, FileText, CheckCircle2, Hash } from "lucide-react";
import { ImageMetadataAnalysisResult } from "../types";
import { formatBytes } from "../services/imageMetadataVerifier";

interface ImageMetadataPreviewCardProps {
  file: File;
  previewUrl: string;
  analysis: ImageMetadataAnalysisResult;
  onReset: () => void;
  isCleanState?: boolean;
}

export const ImageMetadataPreviewCard: React.FC<ImageMetadataPreviewCardProps> = ({
  file,
  previewUrl,
  analysis,
  onReset,
  isCleanState
}) => {
  const { technical, verification, privacyItems, metadataItems } = analysis;

  const hasPrivacyIssues = privacyItems.length > 0;
  const totalRemovable = verification.removableMetadataCount;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-5 sm:p-6 shadow-xs space-y-6" id="image-metadata-preview-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#0F172A] truncate max-w-xs sm:max-w-md">
              {file.name}
            </h2>
            <p className="text-xs text-[#64748B]">
              {technical.format} • {technical.width} × {technical.height} px • {formatBytes(technical.fileSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {hasPrivacyIssues ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-black">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{privacyItems.length} alerta{privacyItems.length > 1 ? "s" : ""} de privacidade</span>
            </span>
          ) : totalRemovable > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] text-xs font-black">
              <span>{totalRemovable} metadado{totalRemovable > 1 ? "s" : ""} opcional{totalRemovable > 1 ? "is" : ""}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Imagem 100% Limpa</span>
            </span>
          )}

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] transition-all cursor-pointer shadow-2xs"
            id="btn-change-image"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Trocar Imagem</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Preview Thumbnail */}
        <div className="relative aspect-video sm:aspect-4/3 rounded-2xl bg-[#0F172A]/5 border border-[#E2E8F0] overflow-hidden flex items-center justify-center p-2 group">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
            id="image-preview-element"
          />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
            {technical.format}
          </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] block">Dimensões Reais</span>
            <span className="text-xs sm:text-sm font-black text-[#0F172A] block mt-0.5">
              {technical.width > 0 ? `${technical.width} × ${technical.height} px` : "Lendo..."}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] block">Tamanho do Arquivo</span>
            <span className="text-xs sm:text-sm font-black text-[#0F172A] block mt-0.5">
              {formatBytes(technical.fileSize)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] block">Perfil de Cor</span>
            <span className="text-xs sm:text-sm font-black text-[#0F172A] block mt-0.5 truncate" title={technical.colorProfile}>
              {technical.colorProfile || "sRGB"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] block">Profundidade / Alpha</span>
            <span className="text-xs sm:text-sm font-black text-[#0F172A] block mt-0.5">
              {technical.colorDepth}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] block">Orientação Visual</span>
            <span className="text-xs sm:text-sm font-black text-[#0F172A] block mt-0.5 truncate">
              {String(technical.orientation || "Normal (1)")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] block">Magic Bytes</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-[#0F172A] block mt-0.5">
              {technical.magicBytes}
            </span>
          </div>

          {/* SHA-256 Checksum Full Width */}
          <div className="col-span-2 sm:col-span-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#64748B] shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">
                Checksum SHA-256 do Arquivo
              </span>
              <span className="text-xs font-mono text-[#334155] block truncate select-all">
                {verification.fileSha256}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
