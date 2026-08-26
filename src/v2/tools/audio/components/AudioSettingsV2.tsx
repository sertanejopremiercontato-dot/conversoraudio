import React from "react";
import { 
  AudioOutputFormatV2, 
  AudioSettingsStateV2, 
  Mp3BitrateV2, 
  WavChannelsV2, 
  WavSampleRateV2,
  WavBitDepthV2,
  AacBitrateV2,
  FlacSampleRateV2,
  FlacBitDepthV2,
  OggBitrateV2
} from "../types";
import { 
  Sliders, 
  Sparkles, 
  Volume2, 
  Activity, 
  Check, 
  Layers, 
  Radio, 
  Info,
  ShieldCheck,
  Music2,
  FileAudio
} from "lucide-react";

interface AudioSettingsV2Props {
  settings: AudioSettingsStateV2;
  onChange: (newSettings: AudioSettingsStateV2) => void;
  disabled?: boolean;
}

export const AudioSettingsV2: React.FC<AudioSettingsV2Props> = ({
  settings,
  onChange,
  disabled = false
}) => {
  const formats: {
    id: AudioOutputFormatV2;
    label: string;
    badge: string;
    badgeColor: string;
    description: string;
  }[] = [
    { 
      id: "mp3", 
      label: "MP3", 
      badge: "Padrão", 
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      description: "Compatível com todos" 
    },
    { 
      id: "wav", 
      label: "WAV", 
      badge: "Sem perdas", 
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      description: "Áudio linear não comprimido" 
    },
    { 
      id: "flac", 
      label: "FLAC", 
      badge: "Lossless", 
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      description: "Compactação sem perdas" 
    },
    { 
      id: "aac", 
      label: "AAC", 
      badge: "Alta", 
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      description: "Excelente clareza" 
    },
    { 
      id: "ogg", 
      label: "OGG", 
      badge: "Opus", 
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      description: "Codec aberto" 
    }
  ];

  const mp3Bitrates: { value: Mp3BitrateV2; label: string; tag: string }[] = [
    { value: 64, label: "64 kbps", tag: "Compacto" },
    { value: 96, label: "96 kbps", tag: "Econômico" },
    { value: 112, label: "112 kbps", tag: "Equilibrado" },
    { value: 128, label: "128 kbps", tag: "Padrão" },
    { value: 160, label: "160 kbps", tag: "Superior" },
    { value: 192, label: "192 kbps", tag: "Alta Qualidade" },
    { value: 256, label: "256 kbps", tag: "Muito Alta" },
    { value: 320, label: "320 kbps", tag: "Máxima (Estúdio)" },
  ];

  const aacBitrates: { value: AacBitrateV2; label: string; tag: string }[] = [
    { value: 96, label: "96 kbps", tag: "Econômico" },
    { value: 112, label: "112 kbps", tag: "Equilibrado" },
    { value: 128, label: "128 kbps", tag: "Padrão" },
    { value: 160, label: "160 kbps", tag: "Superior" },
    { value: 192, label: "192 kbps", tag: "Alta Fidelidade" },
    { value: 256, label: "256 kbps", tag: "Profissional" },
    { value: 320, label: "320 kbps", tag: "Máxima" },
  ];

  const oggBitrates: { value: OggBitrateV2; label: string; tag: string }[] = [
    { value: 64, label: "64 kbps", tag: "Compacto" },
    { value: 96, label: "96 kbps", tag: "Econômico" },
    { value: 112, label: "112 kbps", tag: "Equilibrado" },
    { value: 128, label: "128 kbps", tag: "Padrão" },
    { value: 160, label: "160 kbps", tag: "Superior" },
    { value: 192, label: "192 kbps", tag: "Alta" },
    { value: 256, label: "256 kbps", tag: "Muito Alta" },
    { value: 320, label: "320 kbps", tag: "Máxima" },
  ];

  const wavSampleRates: { value: WavSampleRateV2; label: string; note: string }[] = [
    { value: "original", label: "Original do Arquivo", note: "Preserva a taxa nativa" },
    { value: "44100", label: "44.1 kHz (44.100 Hz)", note: "Padrão CD / Música" },
    { value: "48000", label: "48.0 kHz (48.000 Hz)", note: "Padrão Vídeo / TV" },
    { value: "96000", label: "96.0 kHz (96.000 Hz)", note: "Áudio Hi-Res Estúdio" },
  ];

  const wavBitDepths: { value: WavBitDepthV2; label: string; tag: string }[] = [
    { value: 16, label: "16-bit PCM", tag: "Padrão CD / 96dB" },
    { value: 24, label: "24-bit PCM", tag: "Estúdio / 144dB" },
    { value: 32, label: "32-bit Float", tag: "Alta Dinâmica" },
  ];

  const wavChannelsList: { value: WavChannelsV2; label: string }[] = [
    { value: "original", label: "Original do Áudio" },
    { value: "stereo", label: "Estéreo (2 canais L/R)" },
    { value: "mono", label: "Mono (1 canal misturado)" }
  ];

  const handleFormatSelect = (format: AudioOutputFormatV2) => {
    onChange({ ...settings, format });
  };

  // Cálculo de taxa PCM estimada para WAV
  const getEstimatedWavBitrate = () => {
    const sr = settings.wavSampleRate === "original" ? 44100 : parseInt(settings.wavSampleRate, 10);
    const bits = settings.wavBitDepth || 16;
    const ch = settings.wavChannels === "mono" ? 1 : 2;
    const kbps = Math.round((sr * bits * ch) / 1000);
    return `${kbps} kbps (${bits}-bit PCM, ${ch === 1 ? "Mono" : "Estéreo"})`;
  };

  return (
    <div className="bg-white border border-[#E4ECF7] rounded-[24px] p-5 md:p-6 space-y-6 shadow-[0_2px_12px_rgba(11,31,68,0.03)]" id="v2-audio-settings">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D68F2]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#0B1F44] text-sm md:text-base">
              Converter Para (Formato de Saída)
            </h3>
            <p className="text-xs text-[#64748B]">
              Selecione o formato e ajuste as especificações de áudio
            </p>
          </div>
        </div>
        <span className="text-xs font-black text-[#1D68F2] bg-[#EFF6FF] px-3 py-1 rounded-full border border-[#BFDBFE] uppercase">
          {settings.format}
        </span>
      </div>

      {/* Grid de Formatos em Destaque (Cards Grandes) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0B1F44] block">
          1. Escolha o formato desejado:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {formats.map((fmt) => {
            const isSelected = settings.format === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={disabled}
                onClick={() => handleFormatSelect(fmt.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isSelected
                    ? "bg-[#1D68F2] border-[#1D68F2] text-white shadow-[0_4px_14px_rgba(29,104,242,0.25)] ring-2 ring-[#1D68F2]/30"
                    : "bg-[#F8FAFD] border-[#E4ECF7] text-[#0B1F44] hover:bg-white hover:border-[#1D68F2]/60"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                id={`v2-format-card-${fmt.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black tracking-tight">{fmt.label}</span>
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${fmt.badgeColor}`}>
                      {fmt.badge.split(" ")[0]}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] leading-tight line-clamp-2 ${isSelected ? "text-white/90" : "text-[#64748B]"}`}>
                  {fmt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel Dinâmico de Configurações do Formato Escolhido */}
      <div className="space-y-4 pt-1 border-t border-[#F1F5F9]">
        {/* ======================= CONFIGURAÇÕES MP3 ======================= */}
        {settings.format === "mp3" && (
          <div className="space-y-3" id="v2-settings-mp3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0B1F44] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#1D68F2]" />
                Taxa de Bits MP3 (Bitrate):
              </label>
              <span className="text-xs font-black text-[#1D68F2] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]">
                {settings.mp3Kbps} kbps
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mp3Bitrates.map((b) => {
                const isSelected = settings.mp3Kbps === b.value;
                const is112 = b.value === 112;
                return (
                  <button
                    key={b.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ ...settings, mp3Kbps: b.value })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#0B1F44] border-[#0B1F44] text-white shadow-xs"
                        : is112
                        ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#1D68F2] hover:bg-[#DBEAFE]"
                        : "bg-[#F8FAFD] border-[#E4ECF7] text-[#0B1F44] hover:bg-white hover:border-[#CBD5E1]"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    id={`v2-btn-mp3-${b.value}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{b.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-[10px] ${isSelected ? "text-white/80" : is112 ? "text-[#1D68F2] font-bold" : "text-[#64748B]"}`}>
                      {b.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-[#F8FAFD] border border-[#E4ECF7] rounded-xl flex items-start gap-2.5 text-xs text-[#64748B]">
              <Info className="w-4 h-4 text-[#1D68F2] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>112 kbps</strong> e <strong>128 kbps</strong> são ideais para tamanho reduzido com alta nitidez vocal. <strong>320 kbps</strong> entrega a máxima densidade acústica suportada pelo padrão MPEG Audio Layer III.
              </p>
            </div>
          </div>
        )}

        {/* ======================= CONFIGURAÇÕES WAV ======================= */}
        {settings.format === "wav" && (
          <div className="space-y-4" id="v2-settings-wav">
            <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-start gap-2.5 text-xs text-[#065F46]">
              <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Áudio Linear PCM Puro:</strong> O formato WAV preserva 100% das ondas sonoras sem perdas por compressão psicoacústica. Ajuste a amostragem e profundidade abaixo:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Taxa de Amostragem */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0B1F44] block">
                  Taxa de Amostragem (Sample Rate)
                </label>
                <select
                  value={settings.wavSampleRate}
                  disabled={disabled}
                  onChange={(e) => onChange({ ...settings, wavSampleRate: e.target.value as any })}
                  className="w-full p-2.5 bg-[#F8FAFD] border border-[#E4ECF7] rounded-xl text-xs font-semibold text-[#0B1F44] focus:outline-none focus:border-[#1D68F2]"
                  id="v2-select-wav-samplerate"
                >
                  {wavSampleRates.map((sr) => (
                    <option key={sr.value} value={sr.value}>
                      {sr.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Profundidade de Bits */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0B1F44] block">
                  Profundidade de Bits (Bit Depth)
                </label>
                <select
                  value={settings.wavBitDepth || 16}
                  disabled={disabled}
                  onChange={(e) => onChange({ ...settings, wavBitDepth: parseInt(e.target.value, 10) as any })}
                  className="w-full p-2.5 bg-[#F8FAFD] border border-[#E4ECF7] rounded-xl text-xs font-semibold text-[#0B1F44] focus:outline-none focus:border-[#1D68F2]"
                  id="v2-select-wav-bitdepth"
                >
                  {wavBitDepths.map((bd) => (
                    <option key={bd.value} value={bd.value}>
                      {bd.label} ({bd.tag})
                    </option>
                  ))}
                </select>
              </div>

              {/* Canais */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0B1F44] block">
                  Canais de Áudio
                </label>
                <select
                  value={settings.wavChannels}
                  disabled={disabled}
                  onChange={(e) => onChange({ ...settings, wavChannels: e.target.value as any })}
                  className="w-full p-2.5 bg-[#F8FAFD] border border-[#E4ECF7] rounded-xl text-xs font-semibold text-[#0B1F44] focus:outline-none focus:border-[#1D68F2]"
                  id="v2-select-wav-channels"
                >
                  {wavChannelsList.map((ch) => (
                    <option key={ch.value} value={ch.value}>
                      {ch.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-2.5 bg-[#F1F5F9] rounded-xl text-[11px] text-[#475569] flex items-center justify-between font-mono">
              <span>Taxa de Dados PCM Estimada:</span>
              <strong className="text-[#0B1F44]">{getEstimatedWavBitrate()}</strong>
            </div>
          </div>
        )}

        {/* ======================= CONFIGURAÇÕES FLAC ======================= */}
        {settings.format === "flac" && (
          <div className="space-y-3" id="v2-settings-flac">
            <div className="p-3 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl flex items-start gap-2.5 text-xs text-[#5B21B6]">
              <Sparkles className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Lossless de Estúdio (FLAC):</strong> Reduz o tamanho do arquivo em até 50% em relação ao WAV sem descartar absolutamente nenhum bit sonoro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0B1F44] block">
                  Taxa de Amostragem (FLAC)
                </label>
                <select
                  value={settings.flacSampleRate || "original"}
                  disabled={disabled}
                  onChange={(e) => onChange({ ...settings, flacSampleRate: e.target.value as any })}
                  className="w-full p-2.5 bg-[#F8FAFD] border border-[#E4ECF7] rounded-xl text-xs font-semibold text-[#0B1F44] focus:outline-none focus:border-[#1D68F2]"
                  id="v2-select-flac-samplerate"
                >
                  <option value="original">Original do Arquivo</option>
                  <option value="44100">44.1 kHz (CD Lossless)</option>
                  <option value="48000">48.0 kHz (Estúdio)</option>
                  <option value="96000">96.0 kHz (Hi-Res Audio)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0B1F44] block">
                  Profundidade de Bits
                </label>
                <select
                  value={settings.flacBitDepth || "original"}
                  disabled={disabled}
                  onChange={(e) => onChange({ ...settings, flacBitDepth: e.target.value === "original" ? "original" : parseInt(e.target.value, 10) as any })}
                  className="w-full p-2.5 bg-[#F8FAFD] border border-[#E4ECF7] rounded-xl text-xs font-semibold text-[#0B1F44] focus:outline-none focus:border-[#1D68F2]"
                  id="v2-select-flac-bitdepth"
                >
                  <option value="original">Original do Arquivo</option>
                  <option value="16">16-bit Lossless</option>
                  <option value="24">24-bit Hi-Res Lossless</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ======================= CONFIGURAÇÕES AAC ======================= */}
        {settings.format === "aac" && (
          <div className="space-y-3" id="v2-settings-aac">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0B1F44] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#1D68F2]" />
                Taxa de Bits AAC / M4A:
              </label>
              <span className="text-xs font-black text-[#1D68F2] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]">
                {settings.aacKbps} kbps
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {aacBitrates.map((b) => {
                const isSelected = settings.aacKbps === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ ...settings, aacKbps: b.value })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#0B1F44] border-[#0B1F44] text-white shadow-xs"
                        : "bg-[#F8FAFD] border-[#E4ECF7] text-[#0B1F44] hover:bg-white hover:border-[#CBD5E1]"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    id={`v2-btn-aac-${b.value}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{b.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-[#64748B]"}`}>
                      {b.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= CONFIGURAÇÕES OGG ======================= */}
        {settings.format === "ogg" && (
          <div className="space-y-3" id="v2-settings-ogg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0B1F44] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#1D68F2]" />
                Taxa de Bits OGG / Opus:
              </label>
              <span className="text-xs font-black text-[#1D68F2] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]">
                {settings.oggKbps || 128} kbps
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {oggBitrates.map((b) => {
                const isSelected = (settings.oggKbps || 128) === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ ...settings, oggKbps: b.value })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#0B1F44] border-[#0B1F44] text-white shadow-xs"
                        : "bg-[#F8FAFD] border-[#E4ECF7] text-[#0B1F44] hover:bg-white hover:border-[#CBD5E1]"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    id={`v2-btn-ogg-${b.value}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{b.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-[#64748B]"}`}>
                      {b.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Resumo da Conversão Selecionada */}
      <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1D68F2]" />
          <span className="font-bold text-[#0B1F44]">
            Perfil de Saída Ativo:
          </span>
        </div>
        <span className="font-extrabold text-[#1D68F2]">
          {settings.format.toUpperCase()}
          {settings.format === "mp3" && ` • ${settings.mp3Kbps} kbps`}
          {settings.format === "wav" && ` • PCM ${settings.wavBitDepth || 16}-bit`}
          {settings.format === "flac" && ` • Lossless`}
          {settings.format === "aac" && ` • ${settings.aacKbps} kbps`}
          {settings.format === "ogg" && ` • ${settings.oggKbps || 128} kbps`}
        </span>
      </div>
    </div>
  );
};
