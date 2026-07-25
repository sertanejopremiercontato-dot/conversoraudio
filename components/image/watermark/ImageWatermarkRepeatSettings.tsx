import React from "react";
import { RepeatWatermarkConfig, LogoWatermarkConfig } from "../../../utils/imageWatermarkPresets";
import { Grid, Type, Image as ImageIcon, ShieldCheck, ShieldAlert, Shield } from "lucide-react";

interface ImageWatermarkRepeatSettingsProps {
  config: RepeatWatermarkConfig;
  logoConfig: LogoWatermarkConfig;
  onChange: (updated: RepeatWatermarkConfig) => void;
}

export const ImageWatermarkRepeatSettings: React.FC<ImageWatermarkRepeatSettingsProps> = ({
  config,
  logoConfig,
  onChange
}) => {
  const applyProtectionPreset = (level: "light" | "medium" | "strong") => {
    switch (level) {
      case "light":
        onChange({
          ...config,
          opacity: 0.15,
          size: 3.5,
          spacingX: 220,
          spacingY: 150,
          rotation: -30,
          pattern: "diagonal"
        });
        break;
      case "medium":
        onChange({
          ...config,
          opacity: 0.3,
          size: 4.5,
          spacingX: 180,
          spacingY: 120,
          rotation: -30,
          pattern: "diagonal"
        });
        break;
      case "strong":
        onChange({
          ...config,
          opacity: 0.5,
          size: 5.5,
          spacingX: 140,
          spacingY: 90,
          rotation: -45,
          pattern: "diagonal"
        });
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Protection Presets */}
      <div className="space-y-2 bg-card-inner border border-border-main rounded-2xl p-3">
        <label className="text-xs font-bold text-text-sec flex items-center justify-between">
          <span>Nível de Proteção Repetida</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyProtectionPreset("light")}
            className="p-2 bg-card-main border border-border-main hover:border-green-primary rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer"
          >
            <Shield className="h-4 w-4 text-green-primary" />
            <span className="text-[11px] font-bold text-text-main">Proteção Leve</span>
          </button>
          <button
            type="button"
            onClick={() => applyProtectionPreset("medium")}
            className="p-2 bg-card-main border border-border-main hover:border-green-primary rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span className="text-[11px] font-bold text-text-main">Proteção Média</span>
          </button>
          <button
            type="button"
            onClick={() => applyProtectionPreset("strong")}
            className="p-2 bg-card-main border border-border-main hover:border-green-primary rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <span className="text-[11px] font-bold text-text-main">Proteção Forte</span>
          </button>
        </div>
      </div>

      {/* Repeat Content Type (Text vs Logo) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-sec">Conteúdo Repetido</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...config, type: "text" })}
            className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              config.type === "text"
                ? "bg-green-primary text-bg-main border-green-primary"
                : "bg-card-inner border-border-main text-text-sec hover:text-text-main"
            }`}
          >
            <Type className="h-4 w-4" /> Texto Repetido
          </button>
          <button
            type="button"
            onClick={() => {
              if (!logoConfig.logoSource) {
                alert("Por favor, carregue primeiro um logotipo na aba 'Logotipo' antes de usar essa opção.");
                return;
              }
              onChange({
                ...config,
                type: "logo",
                logoSource: logoConfig.logoSource,
                logoWidth: logoConfig.logoWidth,
                logoHeight: logoConfig.logoHeight
              });
            }}
            className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              config.type === "logo"
                ? "bg-green-primary text-bg-main border-green-primary"
                : "bg-card-inner border-border-main text-text-sec hover:text-text-main"
            }`}
          >
            <ImageIcon className="h-4 w-4" /> Logotipo Repetido
          </button>
        </div>
      </div>

      {/* Text Config for Repeat */}
      {config.type === "text" && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-sec">Texto do Padrão</label>
          <input
            type="text"
            value={config.text}
            onChange={(e) => onChange({ ...config, text: e.target.value })}
            placeholder="Ex: PREVIEW • PROIBIDA A CÓPIA"
            className="w-full bg-card-inner border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-green-primary"
          />
        </div>
      )}

      {/* Pattern & Angle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-sec">Padrão do Mosaico</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...config, pattern: "diagonal" })}
              className={`p-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                config.pattern === "diagonal"
                  ? "bg-green-primary text-bg-main border-green-primary"
                  : "bg-card-inner border-border-main text-text-sec"
              }`}
            >
              Diagonal
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, pattern: "straight" })}
              className={`p-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                config.pattern === "straight"
                  ? "bg-green-primary text-bg-main border-green-primary"
                  : "bg-card-inner border-border-main text-text-sec"
              }`}
            >
              Reto (Alinhado)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-sec">Rotação ({config.rotation}°)</label>
          <input
            type="range"
            min={-90}
            max={90}
            step={5}
            value={config.rotation}
            onChange={(e) => onChange({ ...config, rotation: parseInt(e.target.value) })}
            className="w-full accent-green-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Opacity & Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-sec">
            Opacidade ({Math.round(config.opacity * 100)}%)
          </label>
          <input
            type="range"
            min={0.05}
            max={0.8}
            step={0.05}
            value={config.opacity}
            onChange={(e) => onChange({ ...config, opacity: parseFloat(e.target.value) })}
            className="w-full accent-green-primary cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-sec">
            Tamanho dos Elementos ({config.size}%)
          </label>
          <input
            type="range"
            min={1.5}
            max={12}
            step={0.5}
            value={config.size}
            onChange={(e) => onChange({ ...config, size: parseFloat(e.target.value) })}
            className="w-full accent-green-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Spacing X & Spacing Y */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-main/60">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-text-muted">
            Espaçamento Horiz.: {config.spacingX}px
          </label>
          <input
            type="range"
            min={80}
            max={400}
            step={10}
            value={config.spacingX}
            onChange={(e) => onChange({ ...config, spacingX: parseInt(e.target.value) })}
            className="w-full accent-green-primary cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-text-muted">
            Espaçamento Vert.: {config.spacingY}px
          </label>
          <input
            type="range"
            min={60}
            max={300}
            step={10}
            value={config.spacingY}
            onChange={(e) => onChange({ ...config, spacingY: parseInt(e.target.value) })}
            className="w-full accent-green-primary cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
