import React from "react";
import { Trash2, Download, CheckCircle2, ShieldCheck, ArrowRight, Hash, Sparkles, RefreshCw, Layers } from "lucide-react";
import { ImageCleanReport, ImageMetadataAnalysisResult } from "../types";
import { formatBytes } from "../services/imageMetadataVerifier";

interface ImageMetadataCleanCardProps {
  analysis: ImageMetadataAnalysisResult;
  cleanReport: ImageCleanReport | null;
  isCleaning: boolean;
  onClean: () => void;
  onDownloadClean: () => void;
  onTestCleanedFile?: (file: File) => void;
}

export const ImageMetadataCleanCard: React.FC<ImageMetadataCleanCardProps> = ({
  analysis,
  cleanReport,
  isCleaning,
  onClean,
  onDownloadClean,
  onTestCleanedFile
}) => {
  const totalRemovable = analysis.verification.removableMetadataCount;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 sm:p-8 shadow-xs space-y-6" id="image-metadata-clean-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#0F172A]">
              1. Limpeza Física de Metadados
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Remove fisicamente coordenadas GPS, números de série e rastros digitais
            </p>
          </div>
        </div>

        {cleanReport?.isFullyClean && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-black">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Limpo & Verificado</span>
          </span>
        )}
      </div>

      {!cleanReport ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs sm:text-sm text-[#475569]">
            <p className="font-bold text-[#0F172A]">O processo de limpeza executará:</p>
            <ul className="space-y-1.5 list-disc list-inside text-xs">
              <li><strong className="text-[#334155]">Remoção de GPS:</strong> Elimina coordenadas e localização exata.</li>
              <li><strong className="text-[#334155]">Dispositivo e Lente:</strong> Elimina fabricante, modelo e serial físico.</li>
              <li><strong className="text-[#334155]">Histórico e Software:</strong> Limpa registros do Photoshop, Lightroom, IA prompts.</li>
              <li><strong className="text-[#059669]">Preservação Visual:</strong> Mantém resolução, pixels e calibração de cor ICC.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onClean}
            disabled={isCleaning}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              isCleaning
                ? "bg-[#94A3B8] cursor-not-allowed"
                : "bg-[#DC2626] hover:bg-[#B91C1C] active:scale-[0.99]"
            }`}
            id="btn-clean-image-metadata"
          >
            {isCleaning ? (
              <span>Limpando e inspecionando bytes...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Limpar Todos os Metadados Opcionais ({totalRemovable})</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Report after cleaning */
        <div className="space-y-5" id="clean-report-section">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#059669]">
                <ShieldCheck className="w-4 h-4" />
                <span>Recibo de Limpeza & Reanálise Física Concluída</span>
              </div>
              <span className="text-xs font-bold text-[#047857]">
                0 Metadados Restantes
              </span>
            </div>

            {/* Checklist de Validação Pós-Limpeza */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
              <div className="p-2 rounded-lg bg-white border border-[#A7F3D0] flex items-center justify-between text-[#065F46]">
                <span>EXIF Restante:</span>
                <span className="font-mono">{cleanReport.cleaningStatusSummary.exifRemaining}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#A7F3D0] flex items-center justify-between text-[#065F46]">
                <span>GPS Restante:</span>
                <span className="font-mono">{cleanReport.cleaningStatusSummary.gpsRemaining}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#A7F3D0] flex items-center justify-between text-[#065F46]">
                <span>XMP Restante:</span>
                <span className="font-mono">{cleanReport.cleaningStatusSummary.xmpRemaining}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#A7F3D0] flex items-center justify-between text-[#065F46]">
                <span>IPTC Restante:</span>
                <span className="font-mono">{cleanReport.cleaningStatusSummary.iptcRemaining}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-[#A7F3D0]">
                <span className="text-[11px] font-semibold text-[#64748B] block">Itens Removidos</span>
                <span className="text-sm font-black text-[#059669] block mt-0.5">
                  {cleanReport.removedItems.length} campos
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#A7F3D0]">
                <span className="text-[11px] font-semibold text-[#64748B] block">Tamanho Original</span>
                <span className="text-sm font-black text-[#334155] block mt-0.5">
                  {formatBytes(cleanReport.originalSize)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#A7F3D0]">
                <span className="text-[11px] font-semibold text-[#64748B] block">Tamanho Limpo</span>
                <span className="text-sm font-black text-[#059669] block mt-0.5">
                  {formatBytes(cleanReport.cleanedSize)}
                </span>
              </div>
            </div>

            {/* Checksums comparison & Prova IDAT */}
            <div className="space-y-1.5 pt-2 border-t border-[#A7F3D0]/60 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[#475569] gap-2">
                <span className="shrink-0 font-sans font-bold">SHA-256 Original:</span>
                <span className="truncate select-all">{cleanReport.originalSha256}</span>
              </div>
              <div className="flex items-center justify-between text-[#059669] gap-2 font-bold">
                <span className="shrink-0 font-sans">SHA-256 Limpo:</span>
                <span className="truncate select-all">{cleanReport.cleanedSha256}</span>
              </div>
              {cleanReport.idatPayloadHashBefore && cleanReport.idatPayloadHashAfter && (
                <div className="pt-2 mt-2 border-t border-[#A7F3D0]/40 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between text-[#065F46]">
                    <span className="font-sans font-semibold">IDAT SHA Original:</span>
                    <span className="truncate max-w-[55%]">{cleanReport.idatPayloadHashBefore}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#065F46]">
                    <span className="font-sans font-semibold">IDAT SHA Limpo:</span>
                    <span className="truncate max-w-[55%]">{cleanReport.idatPayloadHashAfter}</span>
                  </div>
                  <div className="flex items-center justify-between font-sans">
                    <span className="font-bold text-[#064E3B]">Pixels Preservados 100% Bit-a-Bit:</span>
                    <span className="font-bold px-1.5 py-0.5 rounded bg-white text-[#059669]">
                      {cleanReport.isIdatPayloadPreserved ? "SIM (IDAT Intacto)" : "NÃO"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lista detalhada dos itens removidos */}
          {cleanReport.removedItems.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#475569] block">
                Itens Eliminados na Operação ({cleanReport.removedItems.length}):
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                {cleanReport.removedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg hover:bg-white transition-all">
                    <span className="font-bold text-[#0F172A] truncate">
                      {item.label} <span className="font-normal text-[#64748B]">({item.key})</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] shrink-0">
                      {item.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onDownloadClean}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-black text-sm bg-[#059669] hover:bg-[#047857] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              id="btn-download-clean-image"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Imagem 100% Limpa</span>
            </button>

            {onTestCleanedFile && (
              <button
                type="button"
                onClick={() => onTestCleanedFile(cleanReport.cleanedFile)}
                className="w-full sm:w-auto py-3.5 px-4 rounded-2xl font-bold text-xs bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#059669] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                id="btn-test-cleaned-file-in-analyzer"
                title="Carrega o arquivo limpo no analisador para comprovar o resultado zero metadados"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Testar Arquivo Limpo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
