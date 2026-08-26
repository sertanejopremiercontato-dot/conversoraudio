import React, { useState } from "react";
import { AudioQueueItemV2 } from "../types";
import { AudioPlayerV2 } from "./AudioPlayerV2";
import { trackEventV2 } from "../../../integrations/analytics";
import { 
  FileAudio, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Volume2,
  Activity,
  Radio,
  Layers
} from "lucide-react";

interface AudioFileCardV2Props {
  item: AudioQueueItemV2;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const AudioFileCardV2: React.FC<AudioFileCardV2Props> = ({
  item,
  onRemove,
  disabled = false
}) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerType, setPlayerType] = useState<"original" | "converted">("converted");

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || isNaN(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSampleRate = (rate?: number | null) => {
    if (!rate) return "N/D";
    return `${(rate / 1000).toFixed(1)} kHz`;
  };

  const handleDownload = () => {
    if (!item.convertedBlobUrl || !item.convertedFileName) return;
    const link = document.createElement("a");
    link.href = item.convertedBlobUrl;
    link.download = item.convertedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Telemetria isolada da V2: Download individual
    const ext = item.convertedFileName.split(".").pop()?.toLowerCase() || "unknown";
    trackEventV2("audio_download", {
      output_format: ext,
      file_count: 1
    });
  };

  const fileExt = item.name.split(".").pop()?.toUpperCase() || item.formatDetected || "ÁUDIO";

  return (
    <div 
      className="bg-white border border-[#E4ECF7] rounded-[20px] p-4 md:p-5 space-y-4 transition-all duration-150 shadow-[0_2px_10px_rgba(11,31,68,0.02)]"
      id={`v2-audio-card-${item.id}`}
    >
      {/* Top row: File Icon, Name, Format Badge & Remove button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] flex items-center justify-center shrink-0">
            <FileAudio className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-[#0B1F44] text-sm md:text-base truncate" title={item.name}>
                {item.name}
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D68F2] text-[10px] font-black uppercase">
                {fileExt}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Tamanho do arquivo: <strong className="text-[#0B1F44]">{formatBytes(item.originalSize)}</strong>
            </p>
          </div>
        </div>

        {/* Status Badge & Remove button */}
        <div className="flex items-center gap-2 shrink-0">
          {item.status === "aguardando" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
              <Clock className="w-3.5 h-3.5" />
              <span>Aguardando</span>
            </span>
          )}

          {item.status === "preparando" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Preparando</span>
            </span>
          )}

          {item.status === "convertendo" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{item.progress}%</span>
            </span>
          )}

          {item.status === "concluido" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Concluído</span>
            </span>
          )}

          {item.status === "erro" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Erro</span>
            </span>
          )}

          {item.status === "cancelado" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B]">
              <span>Cancelado</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={disabled && (item.status === "convertendo" || item.status === "preparando")}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Remover arquivo da fila"
            id={`v2-btn-remove-queue-${item.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid de Especificações do Arquivo de Origem */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#F8FAFD] border border-[#E4ECF7] text-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#64748B] block font-medium">Duração:</span>
          <strong className="text-[#0B1F44] font-bold">{formatDuration(item.duration)}</strong>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-[#64748B] block font-medium">Taxa Amostragem:</span>
          <strong className="text-[#0B1F44] font-bold">{formatSampleRate(item.sampleRate)}</strong>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-[#64748B] block font-medium">Canais:</span>
          <strong className="text-[#0B1F44] font-bold">
            {item.channels ? (item.channels === 1 ? "Mono (1 canal)" : "Estéreo (2 canais)") : "Detectando..."}
          </strong>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-[#64748B] block font-medium">Bit Depth / Bitrate:</span>
          <strong className="text-[#0B1F44] font-bold">
            {item.bitDepth ? `${item.bitDepth}-bit` : item.bitrateKbps ? `~${item.bitrateKbps} kbps` : "Nativo"}
          </strong>
        </div>
      </div>

      {/* Progress Bar for Active conversion */}
      {(item.status === "convertendo" || item.status === "preparando") && (
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-2.5 bg-[#EFF6FF] rounded-full overflow-hidden border border-[#BFDBFE]">
            <div 
              className="h-full bg-[#1D68F2] transition-all duration-150 rounded-full"
              style={{ width: `${item.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#64748B] font-medium">
            <span>Processando áudio localmente via WebAssembly...</span>
            <span className="font-bold text-[#1D68F2]">{item.progress}%</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {item.status === "erro" && item.errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">Falha na conversão deste arquivo:</p>
            <p className="mt-0.5 leading-relaxed">{item.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Completed Row: Result info & Actions */}
      {item.status === "concluido" && (
        <div className="pt-3 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-[#475569]">
            Convertido para: <strong className="text-[#0B1F44] font-extrabold">{item.convertedFileName}</strong> ({formatBytes(item.convertedSize || 0)})
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {item.convertedBlobUrl && (
              <button
                type="button"
                onClick={() => {
                  setShowPlayer(!showPlayer);
                  setPlayerType("converted");
                }}
                className="px-3.5 py-2 rounded-xl border border-[#E4ECF7] hover:bg-[#F8FAFD] text-xs font-bold text-[#0B1F44] transition-colors flex items-center gap-1.5 cursor-pointer"
                id={`v2-btn-listen-${item.id}`}
              >
                <Volume2 className="w-4 h-4 text-[#1D68F2]" />
                <span>{showPlayer ? "Ocultar Player" : "Ouvir"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#1D68F2] hover:bg-[#1554C7] text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(29,104,242,0.25)] cursor-pointer"
              id={`v2-btn-download-${item.id}`}
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo</span>
            </button>
          </div>
        </div>
      )}

      {/* Audio Player Preview */}
      {showPlayer && (
        <div className="pt-2">
          {playerType === "converted" && item.convertedBlobUrl && (
            <AudioPlayerV2
              src={item.convertedBlobUrl}
              label={item.convertedFileName || "Áudio Convertido"}
            />
          )}
          {playerType === "original" && item.originalBlobUrl && (
            <AudioPlayerV2
              src={item.originalBlobUrl}
              label={item.name || "Áudio Original"}
            />
          )}
        </div>
      )}
    </div>
  );
};
