import React from "react";
import { Sliders, Sparkles, Check, ShieldCheck, Zap, Lock, Wand2 } from "lucide-react";
import { CompressionPreset, COMPRESSION_PRESETS } from "../../../utils/imageCompressionLevels";

export interface CompressorSettingsState {
  preset: CompressionPreset;
  customQualityPercentage: number; // 10 to 100
  keepOriginalFormat: boolean;
  autoSelectBestFormat: boolean;
}

interface ImageCompressorSettingsProps {
  settings: CompressorSettingsState;
  onChange: (newSettings: CompressorSettingsState) => void;
  disabled?: boolean;
}

export default function ImageCompressorSettings({
  settings,
  onChange,
  disabled
}: ImageCompressorSettingsProps) {
  const presetsList: CompressionPreset[] = ["extrema", "maxima", "alta", "media", "lossless"];

  const handlePresetSelect = (preset: CompressionPreset) => {
    onChange({
      ...settings,
      preset
    });
  };

  const handleSliderChange = (val: number) => {
    onChange({
      ...settings,
      customQualityPercentage: val
    });
  };

  const handleToggleAutoFormat = (auto: boolean) => {
    onChange({
      ...settings,
      autoSelectBestFormat: auto,
      keepOriginalFormat: !auto
    });
  };

  return (
    <div className="bg-card-inner rounded-3xl border border-border-main p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-main/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-text-main flex items-center gap-2">
              <span>Compressão Extrema & Inteligente</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-black border border-emerald-500/30">
                SSIM & Busca Adaptativa
              </span>
            </h4>
            <p className="text-[11px] text-text-muted">
              Redução máxima de tamanho em bytes com resolução física 100% preservada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/40 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Resolução Exata (1:1)</span>
        </div>
      </div>

      {/* Auto Format Choice Feature Checkbox / Switch */}
      <div className="bg-bg-sec p-4 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-xs text-text-main">
              Escolher Formato Mais Eficiente Automaticamente
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.2 rounded-full">
              Recomendado (75% a 90% economia)
            </span>
          </div>
          <p className="text-[11px] text-text-muted font-medium">
            Permite ao motor selecionar WebP/JPEG moderno para fotos e capas fotográficas. Se desmarcado, força a extensão original do arquivo.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={settings.autoSelectBestFormat}
            disabled={disabled}
            onChange={(e) => handleToggleAutoFormat(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-card-inner peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-primary"></div>
        </label>
      </div>

      {/* Presets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-text-sec uppercase tracking-wider block">
            Selecione o Modo de Compressão
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presetsList.map((key) => {
            const config = COMPRESSION_PRESETS[key];
            const isSelected = settings.preset === key;
            const isExtreme = key === "extrema";

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => handlePresetSelect(key)}
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-950/40 border-emerald-500 text-text-main shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500"
                    : isExtreme
                    ? "bg-bg-sec border-emerald-500/30 text-text-sec hover:border-emerald-500 hover:text-text-main"
                    : "bg-bg-sec border-border-main text-text-sec hover:border-emerald-500/40 hover:text-text-main"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-extrabold text-xs">
                    <span className="text-text-main flex items-center gap-1.5">
                      {isExtreme && <Zap className="w-3.5 h-3.5 text-emerald-400" />}
                      {config.label}
                    </span>
                    {config.badge && (
                      <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-md">
                        {config.badge}
                      </span>
                    )}
                    {isSelected && !config.badge && (
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted font-medium leading-relaxed">
                    {config.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-main/40 flex items-center justify-between text-[10px] font-bold text-text-muted">
                  <span>Meta de Fidelidade:</span>
                  <span className="text-emerald-400">{Math.round(config.targetSSIM * 100)}%+ SSIM</span>
                </div>
              </button>
            );
          })}

          {/* Custom Quality Option */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePresetSelect("personalizada")}
            className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
              settings.preset === "personalizada"
                ? "bg-emerald-950/40 border-emerald-500 text-text-main shadow-lg ring-1 ring-emerald-500"
                : "bg-bg-sec border-border-main text-text-sec hover:border-emerald-500/40 hover:text-text-main"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between font-extrabold text-xs">
                <span className="text-text-main flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Personalizada
                </span>
                {settings.preset === "personalizada" && (
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-text-muted font-medium leading-relaxed">
                Ajuste manual da porcentagem exata de qualidade para calibração fina.
              </p>
            </div>

            <div className="pt-2 border-t border-border-main/40 flex items-center justify-between text-[10px] font-bold text-text-muted">
              <span>Valor:</span>
              <span className="text-emerald-400">{settings.customQualityPercentage}%</span>
            </div>
          </button>
        </div>
      </div>

      {/* Custom Slider Input */}
      {settings.preset === "personalizada" && (
        <div className="bg-bg-sec p-4 rounded-2xl border border-border-main space-y-2.5 animate-fadeIn">
          <div className="flex justify-between text-xs font-bold text-text-sec">
            <span>Menor arquivo (10%)</span>
            <span className="text-emerald-400 font-black">{settings.customQualityPercentage}% de qualidade</span>
            <span>Máxima fidelidade (100%)</span>
          </div>

          <input
            type="range"
            min="10"
            max="100"
            step="1"
            disabled={disabled}
            value={settings.customQualityPercentage}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full accent-green-primary cursor-pointer h-2 bg-card-inner rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
