/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Music, ShieldCheck, Play, ArrowRight } from "lucide-react";

export interface VideoConversionConfig {
  format: "mp3" | "wav";
  mp3Kbps: 64 | 96 | 128 | 192 | 320;
  wavSampleRate: "44100" | "48000" | "original";
  wavChannels: "mono" | "stereo" | "original";
  hasAcceptedTerms: boolean;
}

interface VideoOutputSettingsProps {
  config: VideoConversionConfig;
  onChange: (newConfig: VideoConversionConfig) => void;
  onStartConversion: () => void;
  disabled?: boolean;
}

export default function VideoOutputSettings({
  config,
  onChange,
  onStartConversion,
  disabled = false
}: VideoOutputSettingsProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-5 md:p-6 space-y-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="p-2 bg-[#E0F2FE] border border-[#0284C7]/20 text-[#0284C7] rounded-xl">
          <Music className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-[#0F172A] text-sm md:text-base">
            Configuração do Áudio de Saída
          </h4>
          <p className="text-xs text-[#475569]">Escolha o formato e a qualidade desejada</p>
        </div>
      </div>

      {/* Target Format selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block">
          Converter Para:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...config, format: "mp3" })}
            className={`py-3 px-4 rounded-xl font-bold text-xs md:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              config.format === "mp3"
                ? "bg-[#0284C7] text-white border-[#0284C7] shadow-sm"
                : "bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] hover:border-[#0284C7]/40"
            }`}
          >
            <span>Format MP3</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-mono">Mais Leve</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...config, format: "wav" })}
            className={`py-3 px-4 rounded-xl font-bold text-xs md:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              config.format === "wav"
                ? "bg-[#0284C7] text-white border-[#0284C7] shadow-sm"
                : "bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] hover:border-[#0284C7]/40"
            }`}
          >
            <span>Format WAV</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-mono">Sem Perda</span>
          </button>
        </div>
      </div>

      {/* MP3 Quality Settings */}
      {config.format === "mp3" && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block">
            Qualidade do MP3 (Bitrate):
          </label>
          <div className="grid grid-cols-5 gap-2">
            {([64, 96, 128, 192, 320] as const).map((kbps) => (
              <button
                key={kbps}
                type="button"
                onClick={() => onChange({ ...config, mp3Kbps: kbps })}
                className={`py-2 px-1 rounded-xl font-bold text-xs border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  config.mp3Kbps === kbps
                    ? "bg-[#E0F2FE] border-[#0284C7] text-[#0284C7]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                <span>{kbps}</span>
                <span className="text-[9px] opacity-70">kbps</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#475569] italic pt-1">
            {config.mp3Kbps === 96 && "✓ 96 kbps (Padrão MultiConverte): Excelente equilíbrio entre qualidade sonora e tamanho reduzido."}
            {config.mp3Kbps === 64 && "• 64 kbps: Arquivo ultra compacto, ideal para fala ou gravações."}
            {config.mp3Kbps === 128 && "• 128 kbps: Qualidade padrão de áudio digital."}
            {config.mp3Kbps === 192 && "• 192 kbps: Alta qualidade sonora para vídeos musicais."}
            {config.mp3Kbps === 320 && "• 320 kbps: Máxima fidelidade suportada pelo formato MP3."}
          </p>
        </div>
      )}

      {/* WAV Settings */}
      {config.format === "wav" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block">
              Frequência de Amostragem:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "44100", label: "44.100 Hz (Padrão)" },
                { id: "48000", label: "48.000 Hz (Vídeo)" },
                { id: "original", label: "Manter Original" }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ ...config, wavSampleRate: item.id as any })}
                  className={`py-2 px-2 rounded-xl font-extrabold text-xs border transition-all text-center cursor-pointer ${
                    config.wavSampleRate === item.id
                      ? "bg-[#E0F2FE] border-[#0284C7] text-[#0284C7]"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:text-[#0F172A]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block">
              Canais de Áudio:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "original", label: "Manter Original" },
                { id: "stereo", label: "Estéreo (2 canais)" },
                { id: "mono", label: "Mono (1 canal)" }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ ...config, wavChannels: item.id as any })}
                  className={`py-2 px-2 rounded-xl font-extrabold text-xs border transition-all text-center cursor-pointer ${
                    config.wavChannels === item.id
                      ? "bg-[#E0F2FE] border-[#0284C7] text-[#0284C7]"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:text-[#0F172A]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Responsibility Checkbox */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.hasAcceptedTerms}
            onChange={(e) => onChange({ ...config, hasAcceptedTerms: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7] bg-white cursor-pointer"
          />
          <span className="text-xs text-[#0F172A] leading-relaxed font-medium">
            Declaro que tenho os direitos ou a autorização necessária para utilizar este conteúdo e assumo total responsabilidade pelo seu uso.
          </span>
        </label>
      </div>

      {/* Convert Button */}
      <button
        type="button"
        onClick={onStartConversion}
        disabled={disabled || !config.hasAcceptedTerms}
        className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm md:text-base flex items-center justify-center gap-3 transition-all shadow-md ${
          !disabled && config.hasAcceptedTerms
            ? "bg-[#0284C7] hover:bg-[#0369A1] text-white cursor-pointer scale-[1.01]"
            : "bg-[#E2E8F0] text-[#94A3B8] border border-[#CBD5E1] cursor-not-allowed opacity-60 shadow-none"
        }`}
      >
        <ShieldCheck className="h-5 w-5" />
        <span>EXTRAIR ÁUDIO ({config.format.toUpperCase()})</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
