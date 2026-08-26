import React from "react";
import { VideoMetadataV2, AudioTrackInfoV2 } from "../types";
import { 
  Film, 
  Clock, 
  HardDrive, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Layers,
  Radio,
  Cpu,
  Globe,
  Music
} from "lucide-react";

interface VideoInfoCardV2Props {
  metadata: VideoMetadataV2;
  onRemove: () => void;
  onSelectAudioTrack?: (trackIndex: number) => void;
  disabled?: boolean;
}

export const VideoInfoCardV2: React.FC<VideoInfoCardV2Props> = ({
  metadata,
  onRemove,
  onSelectAudioTrack,
  disabled = false
}) => {
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSampleRate = (rate?: number) => {
    if (!rate) return "44.1 kHz";
    return `${(rate / 1000).toFixed(1)} kHz`;
  };

  const selectedTrackIndex = metadata.selectedAudioTrackIndex || 0;
  const currentTrack: AudioTrackInfoV2 | undefined = 
    metadata.audioTracks[selectedTrackIndex] || metadata.audioTracks[0];

  const hasAudio = metadata.audioTracks.length > 0;
  const isSupported = currentTrack?.isSupportedForExtraction ?? false;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-5 md:p-6 shadow-xs space-y-5" id="v2-video-info-card">
      {/* Header do Arquivo */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] flex items-center justify-center shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-extrabold text-[#0F172A] truncate" title={metadata.name}>
                {metadata.name}
              </h4>
              <span className="px-2.5 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-black uppercase border border-[#C7D2FE]">
                {metadata.format}
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Container: <strong className="text-[#0F172A]">{metadata.container}</strong> • Tamanho: <strong className="text-[#0F172A]">{formatSize(metadata.size)}</strong>
            </p>
          </div>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
            title="Remover vídeo"
            id="v2-btn-remove-video"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grid de Metadados de Vídeo */}
      <div className="space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-[#6366F1]" />
          Propriedades do Container de Vídeo
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
              <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Duração</span>
            </div>
            <p className="text-sm font-bold text-[#0F172A]">
              {formatDuration(metadata.duration)}
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
              <Maximize2 className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Resolução</span>
            </div>
            <p className="text-sm font-bold text-[#0F172A]">
              {metadata.width && metadata.height ? `${metadata.width}×${metadata.height}` : "Contêiner N/D"}
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
              <Cpu className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Codec de Vídeo</span>
            </div>
            <p className="text-sm font-bold text-[#0F172A] truncate" title={metadata.videoCodec || "Stream de Vídeo"}>
              {metadata.videoCodec || "Detectado"}
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
              <Layers className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Trilhas de Áudio</span>
            </div>
            <p className="text-sm font-bold text-[#0F172A]">
              {metadata.audioTracks.length > 0 ? `${metadata.audioTracks.length} encontrada(s)` : "0 trilhas"}
            </p>
          </div>
        </div>
      </div>

      {/* Seção Estrutural de Áudio */}
      <div className="space-y-3 pt-2 border-t border-[#F1F5F9]" id="v2-audio-streams-section">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
            Estrutura da Faixa de Áudio
          </span>

          {hasAudio && isSupported && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ÁUDIO DETECTADO • PRONTO P/ EXTRAIR
            </span>
          )}

          {hasAudio && !isSupported && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Codec de Áudio Restrito
            </span>
          )}

          {!hasAudio && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
              <VolumeX className="w-3.5 h-3.5" />
              TRILHA DE ÁUDIO AUSENTE
            </span>
          )}
        </div>

        {/* Seletor de múltiplas trilhas se houver mais de 1 */}
        {metadata.audioTracks.length > 1 && (
          <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl space-y-2">
            <label className="text-xs font-bold text-[#0F172A] block">
              Múltiplas Trilhas de Áudio Detectadas — Selecione para Extração:
            </label>
            <div className="flex flex-wrap gap-2">
              {metadata.audioTracks.map((track, idx) => {
                const isSelected = selectedTrackIndex === idx;
                return (
                  <button
                    key={track.trackId || idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectAudioTrack && onSelectAudioTrack(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#4F46E5] text-white shadow-xs"
                        : "bg-white border border-[#C7D2FE] text-[#0F172A] hover:bg-[#E0E7FF]"
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    <span>Trilha {idx + 1} ({track.codec}) {track.language ? `• ${track.language.toUpperCase()}` : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Detalhes da Trilha Ativa */}
        {hasAudio && currentTrack ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#166534] font-medium">
                <Music className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Codec de Áudio</span>
              </div>
              <p className="text-sm font-bold text-[#14532D]" title={currentTrack.codecLongName}>
                {currentTrack.codec}
              </p>
            </div>

            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#166534] font-medium">
                <Radio className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Amostragem</span>
              </div>
              <p className="text-sm font-bold text-[#14532D]">
                {formatSampleRate(currentTrack.sampleRate)}
              </p>
            </div>

            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#166534] font-medium">
                <Volume2 className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Canais</span>
              </div>
              <p className="text-sm font-bold text-[#14532D]">
                {currentTrack.channelLayout || (currentTrack.channels === 1 ? "Mono" : "Estéreo")}
              </p>
            </div>

            <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#166534] font-medium">
                <Globe className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Idioma / Bitrate</span>
              </div>
              <p className="text-sm font-bold text-[#14532D]">
                {currentTrack.language ? currentTrack.language.toUpperCase() : "Padrão"}
                {currentTrack.bitrate ? ` (${currentTrack.bitrate}k)` : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
            <VolumeX className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">TRILHA DE ÁUDIO AUSENTE:</strong>
              <p className="mt-0.5 leading-relaxed">
                Este arquivo de vídeo não contém uma trilha de áudio detectável.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
