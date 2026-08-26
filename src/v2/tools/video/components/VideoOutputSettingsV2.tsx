import React from "react";
import { 
  VideoOutputConfigV2, 
  VideoOutputFormatV2, 
  VideoMp3BitrateV2, 
  VideoWavSampleRateV2, 
  VideoWavChannelsV2,
  VideoWavBitDepthV2,
  VideoAacBitrateV2,
  VideoFlacBitDepthV2,
  VideoOggBitrateV2
} from "../types";
import { 
  Sliders, 
  Music, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Radio, 
  Layers, 
  Info 
} from "lucide-react";

interface VideoOutputSettingsV2Props {
  config: VideoOutputConfigV2;
  onChange: (newConfig: VideoOutputConfigV2) => void;
  disabled?: boolean;
}

export const VideoOutputSettingsV2: React.FC<VideoOutputSettingsV2Props> = ({
  config,
  onChange,
  disabled = false
}) => {
  const formats: { 
    id: VideoOutputFormatV2; 
    label: string; 
    badge: string; 
    badgeColor: string; 
    desc: string 
  }[] = [
    { 
      id: "mp3", 
      label: "MP3", 
      badge: "Universal", 
      badgeColor: "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]", 
      desc: "Mais compatível com todos os players e celulares" 
    },
    { 
      id: "wav", 
      label: "WAV", 
      badge: "Sem Perdas", 
      badgeColor: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]", 
      desc: "Áudio linear não-comprimido para máxima fidelidade" 
    },
    { 
      id: "flac", 
      label: "FLAC", 
      badge: "Lossless", 
      badgeColor: "bg-[#FAF5FF] text-[#7C3AED] border-[#EDE9FE]", 
      desc: "Compactação perfeita sem perda de bits" 
    },
    { 
      id: "aac", 
      label: "AAC / M4A", 
      badge: "Eficiência", 
      badgeColor: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]", 
      desc: "Áudio nítido otimizado para dispositivos Apple e Web" 
    },
    { 
      id: "ogg", 
      label: "OGG", 
      badge: "Opus Web", 
      badgeColor: "bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]", 
      desc: "Codec moderno livre e leve" 
    }
  ];

  const mp3Bitrates: { value: VideoMp3BitrateV2; label: string; tag: string }[] = [
    { value: 64, label: "64 kbps", tag: "Compacto" },
    { value: 96, label: "96 kbps", tag: "Econômico" },
    { value: 112, label: "112 kbps", tag: "Equilibrado" },
    { value: 128, label: "128 kbps", tag: "Padrão" },
    { value: 160, label: "160 kbps", tag: "Superior" },
    { value: 192, label: "192 kbps", tag: "Alta Qualidade" },
    { value: 256, label: "256 kbps", tag: "Muito Alta" },
    { value: 320, label: "320 kbps", tag: "Máxima (Estúdio)" }
  ];

  const aacBitrates: { value: VideoAacBitrateV2; label: string; tag: string }[] = [
    { value: 96, label: "96 kbps", tag: "Econômico" },
    { value: 112, label: "112 kbps", tag: "Equilibrado" },
    { value: 128, label: "128 kbps", tag: "Padrão" },
    { value: 160, label: "160 kbps", tag: "Superior" },
    { value: 192, label: "192 kbps", tag: "Alta Fidelidade" },
    { value: 256, label: "256 kbps", tag: "Profissional" },
    { value: 320, label: "320 kbps", tag: "Máxima" }
  ];

  const oggBitrates: { value: VideoOggBitrateV2; label: string; tag: string }[] = [
    { value: 64, label: "64 kbps", tag: "Compacto" },
    { value: 96, label: "96 kbps", tag: "Econômico" },
    { value: 112, label: "112 kbps", tag: "Equilibrado" },
    { value: 128, label: "128 kbps", tag: "Padrão" },
    { value: 160, label: "160 kbps", tag: "Superior" },
    { value: 192, label: "192 kbps", tag: "Alta" },
    { value: 256, label: "256 kbps", tag: "Muito Alta" },
    { value: 320, label: "320 kbps", tag: "Máxima" }
  ];

  const wavSampleRates: { value: VideoWavSampleRateV2; label: string }[] = [
    { value: "original", label: "Original do Vídeo" },
    { value: "44100", label: "44.1 kHz (Padrão CD)" },
    { value: "48000", label: "48.0 kHz (Padrão Vídeo/TV)" },
    { value: "96000", label: "96.0 kHz (Hi-Res Audio)" }
  ];

  const wavBitDepths: { value: VideoWavBitDepthV2; label: string; tag: string }[] = [
    { value: 16, label: "16-bit PCM", tag: "Padrão CD / 96dB" },
    { value: 24, label: "24-bit PCM", tag: "Estúdio / 144dB" },
    { value: 32, label: "32-bit Float", tag: "Alta Dinâmica" }
  ];

  const wavChannelsList: { value: VideoWavChannelsV2; label: string }[] = [
    { value: "original", label: "Original do Áudio" },
    { value: "stereo", label: "Estéreo (2 canais L/R)" },
    { value: "mono", label: "Mono (1 canal misturado)" }
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-5 md:p-6 shadow-xs space-y-6" id="v2-video-settings-panel">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-extrabold text-[#0F172A]">
              Configurações de Extração de Áudio
            </h3>
            <p className="text-xs text-[#64748B]">
              Escolha o formato e a qualidade de saída
            </p>
          </div>
        </div>
        <span className="text-xs font-black text-[#4F46E5] bg-[#EEF2FF] px-3 py-1 rounded-full border border-[#C7D2FE] uppercase">
          {config.format}
        </span>
      </div>

      {/* Formato de Saída */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0F172A] block">
          1. Formato de Áudio de Saída:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {formats.map((fmt) => {
            const isSelected = config.format === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...config, format: fmt.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isSelected
                    ? "bg-gradient-to-br from-[#4F46E5] to-[#6366F1] border-[#4F46E5] text-white shadow-[0_4px_14px_rgba(99,102,241,0.3)] ring-2 ring-[#818CF8]/30"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white hover:border-[#CBD5E1]"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                id={`v2-btn-format-${fmt.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black tracking-tight">{fmt.label}</span>
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${fmt.badgeColor}`}>
                      {fmt.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] leading-tight line-clamp-2 ${isSelected ? "text-white/90" : "text-[#64748B]"}`}>
                  {fmt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Opções específicas para MP3 */}
      {config.format === "mp3" && (
        <div className="space-y-3 pt-1 border-t border-[#F1F5F9]" id="v2-video-settings-mp3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#6366F1]" />
              Taxa de Bits MP3 (Bitrate):
            </label>
            <span className="text-xs font-black text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
              {config.mp3Kbps} kbps
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {mp3Bitrates.map((b) => {
              const isSelected = config.mp3Kbps === b.value;
              const is112 = b.value === 112;
              return (
                <button
                  key={b.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...config, mp3Kbps: b.value })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#0F172A] border-[#0F172A] text-white shadow-xs font-bold"
                      : is112
                      ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5] hover:bg-[#E0E7FF]"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white hover:border-[#CBD5E1]"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  id={`v2-btn-bitrate-${b.value}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{b.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-[10px] ${isSelected ? "text-white/80" : is112 ? "text-[#4F46E5] font-bold" : "text-[#64748B]"}`}>
                    {b.tag}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-[#FAF5FF] border border-[#EDE9FE] rounded-xl flex items-start gap-2.5 text-xs text-[#64748B]">
            <Info className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>112 kbps</strong> e <strong>128 kbps</strong> entregam o balanço perfeito de leveza e clareza vocal. <strong>320 kbps</strong> preserva todos os detalhes originais da mixagem de vídeo.
            </p>
          </div>
        </div>
      )}

      {/* Opções específicas para AAC */}
      {config.format === "aac" && (
        <div className="space-y-3 pt-1 border-t border-[#F1F5F9]" id="v2-video-settings-aac">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#6366F1]" />
              Taxa de Bits AAC / M4A:
            </label>
            <span className="text-xs font-black text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
              {config.aacKbps} kbps
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {aacBitrates.map((b) => {
              const isSelected = config.aacKbps === b.value;
              return (
                <button
                  key={b.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...config, aacKbps: b.value })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#0F172A] border-[#0F172A] text-white shadow-xs font-bold"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white hover:border-[#CBD5E1]"
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

      {/* Opções específicas para WAV */}
      {config.format === "wav" && (
        <div className="space-y-4 pt-1 border-t border-[#F1F5F9]" id="v2-video-settings-wav">
          <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-start gap-2.5 text-xs text-[#065F46]">
            <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Áudio Linear PCM Não-Comprimido:</strong> Extrai a onda de áudio diretamente do vídeo sem qualquer compressão psicoacústica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] block">
                Taxa de Amostragem
              </label>
              <select
                value={config.wavSampleRate}
                disabled={disabled}
                onChange={(e) => onChange({ ...config, wavSampleRate: e.target.value as any })}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#6366F1]"
                id="v2-select-sample-rate"
              >
                {wavSampleRates.map((sr) => (
                  <option key={sr.value} value={sr.value}>
                    {sr.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] block">
                Profundidade de Bits
              </label>
              <select
                value={config.wavBitDepth || 16}
                disabled={disabled}
                onChange={(e) => onChange({ ...config, wavBitDepth: parseInt(e.target.value, 10) as any })}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#6366F1]"
                id="v2-select-bit-depth"
              >
                {wavBitDepths.map((bd) => (
                  <option key={bd.value} value={bd.value}>
                    {bd.label} ({bd.tag})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] block">
                Canais de Áudio
              </label>
              <select
                value={config.wavChannels}
                disabled={disabled}
                onChange={(e) => onChange({ ...config, wavChannels: e.target.value as any })}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#6366F1]"
                id="v2-select-channels"
              >
                {wavChannelsList.map((ch) => (
                  <option key={ch.value} value={ch.value}>
                    {ch.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Opções específicas para FLAC */}
      {config.format === "flac" && (
        <div className="space-y-3 pt-1 border-t border-[#F1F5F9]" id="v2-video-settings-flac">
          <div className="p-3 bg-[#FAF5FF] border border-[#EDE9FE] rounded-xl flex items-start gap-2.5 text-xs text-[#5B21B6]">
            <Sparkles className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Extração Lossless Estúdio:</strong> Preserva a pureza absoluta da trilha sonora em FLAC compacto.
            </p>
          </div>
        </div>
      )}

      {/* Opções específicas para OGG */}
      {config.format === "ogg" && (
        <div className="space-y-3 pt-1 border-t border-[#F1F5F9]" id="v2-video-settings-ogg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#6366F1]" />
              Taxa de Bits OGG / Opus:
            </label>
            <span className="text-xs font-black text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
              {config.oggKbps || 128} kbps
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {oggBitrates.map((b) => {
              const isSelected = (config.oggKbps || 128) === b.value;
              return (
                <button
                  key={b.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...config, oggKbps: b.value })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#0F172A] border-[#0F172A] text-white shadow-xs font-bold"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white hover:border-[#CBD5E1]"
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

      {/* Resumo da Extração */}
      <div className="p-3.5 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#6366F1]" />
          <span className="font-bold text-[#0F172A]">
            Perfil de Saída do Áudio:
          </span>
        </div>
        <span className="font-extrabold text-[#4F46E5]">
          {config.format.toUpperCase()}
          {config.format === "mp3" && ` • ${config.mp3Kbps} kbps`}
          {config.format === "wav" && ` • PCM ${config.wavBitDepth || 16}-bit`}
          {config.format === "flac" && ` • Lossless`}
          {config.format === "aac" && ` • ${config.aacKbps} kbps`}
          {config.format === "ogg" && ` • ${config.oggKbps || 128} kbps`}
        </span>
      </div>

      {/* Termos e Aviso de Privacidade */}
      <div className="pt-2 border-t border-[#F1F5F9]">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.hasAcceptedTerms}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, hasAcceptedTerms: e.target.checked })}
            className="mt-0.5 w-4 h-4 text-[#6366F1] rounded border-[#CBD5E1] focus:ring-[#6366F1] cursor-pointer"
            id="v2-checkbox-terms"
          />
          <div className="text-xs text-[#475569] font-medium leading-relaxed">
            <span className="font-bold text-[#0F172A]">Privacidade 100% no seu computador:</span> O vídeo é processado localmente no seu navegador sem upload para servidores.
          </div>
        </label>
      </div>
    </div>
  );
};
