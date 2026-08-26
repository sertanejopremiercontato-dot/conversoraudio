import React from "react";
import { VideoResultV2 as VideoResultDataV2 } from "../types";
import { CheckCircle2, Download, RefreshCw, Music, HardDrive, Clock, Sparkles } from "lucide-react";

interface VideoResultV2Props {
  result: VideoResultDataV2;
  onDownload: () => void;
  onReset: () => void;
}

export const VideoResultV2: React.FC<VideoResultV2Props> = ({
  result,
  onDownload,
  onReset
}) => {
  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const savedSize = Math.max(0, result.originalSize - result.finalSize);
  const reductionPercent = result.originalSize > 0 
    ? Math.round((savedSize / result.originalSize) * 100)
    : 0;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 md:p-8 shadow-xs space-y-6" id="v2-video-result-panel">
      {/* Top Banner de Sucesso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-[#166534]">
              Áudio Extraído com Sucesso!
            </h4>
            <p className="text-xs text-[#15803D] font-medium">
              Pronto para download imediato em alta fidelidade
            </p>
          </div>
        </div>

        {reductionPercent > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DCFCE7] text-xs font-bold text-[#166534] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Arquivo {reductionPercent}% mais leve que o vídeo</span>
          </div>
        )}
      </div>

      {/* Detalhes do Áudio Extraído */}
      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#64748B] font-medium">Nome do Arquivo Gerado</p>
              <h5 className="text-sm font-extrabold text-[#0F172A] truncate" title={result.outputFileName}>
                {result.outputFileName}
              </h5>
            </div>
          </div>

          <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white text-xs font-black uppercase shrink-0 shadow-2xs">
            {result.format}
          </span>
        </div>

        {/* Reprodutor de Áudio Integrado */}
        <div className="pt-1">
          <audio
            controls
            src={result.outputBlobUrl}
            className="w-full h-10 rounded-lg focus:outline-none"
            id="v2-audio-preview-player"
          />
        </div>

        {/* Métricas de Tamanho e Duração */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E2E8F0]">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#64748B] font-medium">Vídeo Original</span>
            <p className="text-xs font-bold text-[#0F172A]">{formatSize(result.originalSize)}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#64748B] font-medium">Áudio Final</span>
            <p className="text-xs font-bold text-[#4F46E5]">{formatSize(result.finalSize)}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#64748B] font-medium">Duração</span>
            <p className="text-xs font-bold text-[#0F172A]">{formatDuration(result.duration)}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#64748B] font-medium">Qualidade</span>
            <p className="text-xs font-bold text-[#0F172A]">{result.qualityChosen}</p>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onDownload}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          id="v2-btn-download-audio"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Áudio ({result.format.toUpperCase()})</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto py-3.5 px-5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          id="v2-btn-convert-another-video"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Converter Outro Vídeo</span>
        </button>
      </div>
    </div>
  );
};
