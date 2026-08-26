import React, { useState, useRef, useEffect } from "react";
import { AudioQueueItemV2 } from "../types";
import { trackEventV2 } from "../../../integrations/analytics";
import { 
  Play, 
  Pause,
  Download, 
  Trash2, 
  XCircle, 
  CheckCircle2, 
  AlertCircle,
  Archive,
  RefreshCw,
  Clock,
  Music,
  Plus,
  Zap,
  GripVertical,
  Volume2
} from "lucide-react";

interface AudioQueueV2Props {
  queue: AudioQueueItemV2[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isProcessing: boolean;
  isGeneratingZip: boolean;
  globalError: string | null;
  onConvertSelected: () => void;
  onConvertAll: () => void;
  onDownloadAllZip: () => void;
  onCancelQueue: () => void;
  onClearQueue: () => void;
  onRemoveItem: (id: string) => void;
  onAddMoreFiles: () => void;
}

export const AudioQueueV2: React.FC<AudioQueueV2Props> = ({
  queue,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isProcessing,
  isGeneratingZip,
  globalError,
  onConvertSelected,
  onConvertAll,
  onDownloadAllZip,
  onCancelQueue,
  onClearQueue,
  onRemoveItem,
  onAddMoreFiles
}) => {
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Audio playback handler
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  if (queue.length === 0) return null;

  const completedCount = queue.filter((item) => item.status === "concluido").length;
  const pendingCount = queue.filter((item) => item.status === "aguardando" || item.status === "cancelado" || item.status === "erro").length;
  const totalSize = queue.reduce((sum, item) => sum + item.originalSize, 0);

  // Selected items metrics
  const selectedItems = queue.filter((item) => selectedIds.includes(item.id));
  const selectedCount = selectedItems.length;
  const selectedSize = selectedItems.reduce((sum, item) => sum + item.originalSize, 0);
  const selectedPendingCount = selectedItems.filter((item) => item.status === "aguardando" || item.status === "cancelado" || item.status === "erro").length;

  const isAllSelected = queue.length > 0 && queue.every((item) => selectedIds.includes(item.id));
  const isPartiallySelected = selectedCount > 0 && !isAllSelected;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || isNaN(seconds) || seconds <= 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getFormatBadgeStyle = (format?: string) => {
    const fmt = (format || "MP3").toUpperCase();
    switch (fmt) {
      case "MP3":
        return "bg-[#F5F3FF] text-[#8B5CF6] border-[#DDD6FE]";
      case "WAV":
        return "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]";
      case "FLAC":
        return "bg-[#EFF6FF] text-[#1D68F2] border-[#BFDBFE]";
      case "AAC":
      case "M4A":
        return "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]";
      case "OGG":
      case "OPUS":
        return "bg-[#ECFEFF] text-[#0891B2] border-[#A5F3FC]";
      default:
        return "bg-[#F8FAFD] text-[#5C6F84] border-[#E4ECF7]";
    }
  };

  const getIconColorByIndex = (index: number) => {
    const colors = [
      "bg-[#F5F3FF] text-[#8B5CF6] border-[#DDD6FE]",
      "bg-[#EFF6FF] text-[#1D68F2] border-[#BFDBFE]",
      "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
      "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
      "bg-[#FDF2F8] text-[#DB2777] border-[#FBCFE8]",
      "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
    ];
    return colors[index % colors.length];
  };

  const handleTogglePlay = (item: AudioQueueItemV2) => {
    const audioUrl = item.convertedBlobUrl || item.originalBlobUrl;
    if (!audioUrl) return;

    if (playingItemId === item.id && isPlaying) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.play().then(() => {
        setPlayingItemId(item.id);
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Falha ao reproduzir áudio:", err);
      });
      audio.onended = () => {
        setIsPlaying(false);
        setPlayingItemId(null);
      };
    }
  };

  const handleDownloadItem = (item: AudioQueueItemV2) => {
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

  return (
    <div 
      className="bg-white border border-[#E4ECF7] rounded-[24px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(11,31,68,0.04)] flex flex-col justify-between space-y-4 w-full" 
      id="v2-audio-queue-container"
    >
      {/* Top Header: Title, Completed Count, Total Size, Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
        <div className="space-y-0.5">
          <h3 className="font-extrabold text-[#0B1F44] text-lg tracking-tight flex items-center gap-2">
            <span>Fila de Arquivos ({queue.length}/15)</span>
          </h3>
          <p className="text-xs text-[#5C6F84]">
            {completedCount > 0 && (
              <span className="text-[#059669] font-bold">{completedCount} concluídos • </span>
            )}
            Tamanho total: <strong className="text-[#0B1F44] font-bold">{formatBytes(totalSize)}</strong>
          </p>
        </div>

        {/* Action buttons on top right */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {completedCount > 0 && (
            <button
              type="button"
              onClick={onDownloadAllZip}
              disabled={isGeneratingZip}
              className="px-4 py-2.5 rounded-xl bg-[#1D68F2] hover:bg-[#1554C7] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_2px_10px_rgba(29,104,242,0.25)] cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              title="Baixar todos os arquivos convertidos compactados em .ZIP"
              id="v2-btn-download-all-zip"
            >
              {isGeneratingZip ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>{isGeneratingZip ? "Compactando..." : "Baixar Todos (.ZIP)"}</span>
            </button>
          )}

          {isProcessing ? (
            <button
              type="button"
              onClick={onCancelQueue}
              className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Cancelar processamento"
              id="v2-btn-cancel-queue"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClearQueue}
              className="px-3 py-2.5 rounded-xl border border-[#E4ECF7] hover:bg-rose-50 text-[#5C6F84] hover:text-rose-600 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Limpar todos os arquivos da fila"
              id="v2-btn-clear-queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar fila</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-0.5">
            <p className="font-bold">Aviso:</p>
            <p className="leading-relaxed">{globalError}</p>
          </div>
        </div>
      )}

      {/* ======================= DESKTOP / TABLET COMPACT TABLE ======================= */}
      <div className="w-full">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[36px_minmax(220px,1fr)_90px_90px_80px_130px_90px] items-center gap-3 px-3 py-2 bg-[#F8FAFD] border border-[#E4ECF7] rounded-xl text-[11px] font-bold text-[#5C6F84] uppercase tracking-wider select-none">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isPartiallySelected;
              }}
              onChange={onToggleSelectAll}
              aria-label="Selecionar todos os arquivos da fila"
              className="w-4 h-4 rounded border-[#CBD5E1] text-[#1D68F2] focus:ring-[#1D68F2] cursor-pointer accent-[#1D68F2]"
            />
          </div>
          <div>Arquivo</div>
          <div className="text-center">Duração</div>
          <div className="text-center">Tamanho</div>
          <div className="text-center">Formato</div>
          <div className="text-center">Status</div>
          <div className="text-right pr-1">Ações</div>
        </div>

        {/* Table Body / Scrollable Rows List (Max height 520px) */}
        <div className="max-h-[520px] overflow-y-auto divide-y divide-[#F1F5F9] my-1 pr-0.5 custom-scrollbar">
          {queue.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            const isItemPlaying = playingItemId === item.id && isPlaying;
            const fileExt = item.name.split(".").pop()?.toUpperCase() || item.formatDetected || "MP3";

            return (
              <div
                key={item.id}
                className={`group transition-all duration-150 rounded-xl px-2.5 sm:px-3 py-2.5 sm:py-3 ${
                  isSelected ? "bg-[#F4F8FD]/80" : "hover:bg-[#F8FAFD]"
                } ${item.status === "erro" ? "bg-rose-50/40" : ""}`}
                id={`v2-audio-row-${item.id}`}
              >
                {/* Desktop Grid Layout (Height 54px - 64px) */}
                <div className="hidden md:grid grid-cols-[36px_minmax(220px,1fr)_90px_90px_80px_130px_90px] items-center gap-3">
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      aria-label={`Selecionar arquivo ${item.name}`}
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#1D68F2] focus:ring-[#1D68F2] cursor-pointer accent-[#1D68F2]"
                    />
                  </div>

                  {/* Arquivo: Grip dots + Music icon + File name */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <GripVertical className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                    
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getIconColorByIndex(index)}`}>
                      <Music className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p 
                        className="font-bold text-[13px] text-[#0B1F44] truncate select-text cursor-default"
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      {item.errorMessage && (
                        <p className="text-[10px] text-rose-600 truncate">{item.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  {/* Duração */}
                  <div className="text-center text-[12.5px] font-semibold text-[#475569]">
                    {formatDuration(item.duration)}
                  </div>

                  {/* Tamanho */}
                  <div className="text-center text-[12.5px] font-semibold text-[#475569]">
                    {formatBytes(item.originalSize)}
                  </div>

                  {/* Formato */}
                  <div className="text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getFormatBadgeStyle(fileExt)}`}>
                      {fileExt}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center">
                    {item.status === "concluido" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Concluído</span>
                      </span>
                    )}

                    {item.status === "aguardando" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                        <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Aguardando</span>
                      </span>
                    )}

                    {(item.status === "convertendo" || item.status === "preparando") && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#1D68F2] border border-[#BFDBFE]">
                        <RefreshCw className="w-3.5 h-3.5 text-[#1D68F2] animate-spin" />
                        <span>{item.status === "preparando" ? "Preparando" : `${item.progress}%`}</span>
                      </span>
                    )}

                    {item.status === "erro" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Erro</span>
                      </span>
                    )}

                    {item.status === "cancelado" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                        <span>Cancelado</span>
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Play / Preview Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(item)}
                      aria-label={isItemPlaying ? "Pausar áudio" : "Ouvir áudio"}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isItemPlaying 
                          ? "bg-[#1D68F2] text-white" 
                          : "text-[#475569] hover:text-[#0B1F44] hover:bg-[#E4ECF7]"
                      }`}
                      title={isItemPlaying ? "Pausar" : "Ouvir"}
                    >
                      {isItemPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>

                    {/* Download Button if converted */}
                    {item.status === "concluido" && item.convertedBlobUrl && (
                      <button
                        type="button"
                        onClick={() => handleDownloadItem(item)}
                        aria-label="Baixar este arquivo convertido"
                        className="p-1.5 rounded-lg text-[#059669] hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Baixar arquivo convertido"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      disabled={isProcessing && (item.status === "convertendo" || item.status === "preparando")}
                      aria-label={`Remover ${item.name} da fila`}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remover da fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile / Small Screen Compact 2-Level Row */}
                <div className="md:hidden space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        aria-label={`Selecionar arquivo ${item.name}`}
                        className="w-4 h-4 rounded border-[#CBD5E1] text-[#1D68F2] focus:ring-[#1D68F2] cursor-pointer accent-[#1D68F2]"
                      />
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${getIconColorByIndex(index)}`}>
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <p className="font-bold text-xs text-[#0B1F44] truncate" title={item.name}>
                        {item.name}
                      </p>
                    </div>

                    {/* Status Pill Compact */}
                    <div className="shrink-0">
                      {item.status === "concluido" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                          <span>Concluído</span>
                        </span>
                      )}
                      {item.status === "aguardando" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                          <Clock className="w-3 h-3 text-[#D97706]" />
                          <span>Aguardando</span>
                        </span>
                      )}
                      {(item.status === "convertendo" || item.status === "preparando") && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1D68F2] border border-[#BFDBFE]">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>{item.progress}%</span>
                        </span>
                      )}
                      {item.status === "erro" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Erro</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Row 2: Specs & Actions */}
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pl-6">
                    <div className="flex items-center gap-2">
                      <span>{formatDuration(item.duration)}</span>
                      <span>•</span>
                      <span>{formatBytes(item.originalSize)}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.2 rounded font-extrabold uppercase border ${getFormatBadgeStyle(fileExt)}`}>
                        {fileExt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(item)}
                        aria-label="Ouvir áudio"
                        className="p-1 text-[#475569] hover:text-[#0B1F44]"
                      >
                        {isItemPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>

                      {item.status === "concluido" && item.convertedBlobUrl && (
                        <button
                          type="button"
                          onClick={() => handleDownloadItem(item)}
                          aria-label="Baixar arquivo convertido"
                          className="p-1 text-[#059669]"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label="Remover da fila"
                        className="p-1 text-[#94A3B8] hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================= QUEUE FOOTER / BOTTOM ACTION BAR ======================= */}
      <div 
        className="pt-4 border-t border-[#E4ECF7] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        id="v2-audio-queue-footer"
      >
        {/* Left: Selected count & total selected size */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E4ECF7] text-xs font-bold text-[#0B1F44] shadow-2xs">
            {selectedCount} selecionados
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFD] border border-[#E4ECF7] text-xs font-bold text-[#0B1F44] shadow-2xs">
            {formatBytes(selectedSize)}
          </div>
        </div>

        {/* Right: Convert Selected (X) & Add More Files */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onConvertSelected}
            disabled={isProcessing || (selectedCount > 0 && selectedPendingCount === 0) || (selectedCount === 0 && pendingCount === 0)}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#1D68F2] hover:bg-[#1554C7] text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(29,104,242,0.25)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            id="v2-btn-convert-selected"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-white text-white" />
            )}
            <span>
              {isProcessing
                ? "Processando Áudios..."
                : selectedCount > 0
                ? `Converter Selecionados (${selectedCount})`
                : `Converter Todos (${pendingCount})`}
            </span>
          </button>

          <button
            type="button"
            onClick={onAddMoreFiles}
            disabled={isProcessing || queue.length >= 15}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFD] border border-[#E4ECF7] text-[#0B1F44] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Adicionar mais arquivos à fila de conversão"
            id="v2-btn-add-more-files"
          >
            <Plus className="w-4 h-4 text-[#1D68F2] stroke-[2.5]" />
            <span>Adicionar Mais Arquivos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
