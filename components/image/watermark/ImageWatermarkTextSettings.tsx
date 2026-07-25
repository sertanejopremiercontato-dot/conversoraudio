import React from "react";
import { TextWatermarkConfig, NinePosition } from "../../../utils/imageWatermarkPresets";
import { Type, Bold, Italic, RotateCw, Grid, Sliders, Palette, Move } from "lucide-react";

interface ImageWatermarkTextSettingsProps {
  config: TextWatermarkConfig;
  onChange: (updated: TextWatermarkConfig) => void;
}

const NINE_POSITIONS: { id: NinePosition; label: string }[] = [
  { id: "top-left", label: "Superior Esq." },
  { id: "top-center", label: "Superior Centro" },
  { id: "top-right", label: "Superior Dir." },
  { id: "center-left", label: "Centro Esq." },
  { id: "center", label: "Centro" },
  { id: "center-right", label: "Centro Dir." },
  { id: "bottom-left", label: "Inferior Esq." },
  { id: "bottom-center", label: "Inferior Centro" },
  { id: "bottom-right", label: "Inferior Dir." }
];

const SAFE_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS"
];

const COLOR_PRESETS = [
  "#FFFFFF",
  "#000000",
  "#39D977",
  "#FF3B30",
  "#FFCC00",
  "#007AFF",
  "#AF52DE"
];

export const ImageWatermarkTextSettings: React.FC<ImageWatermarkTextSettingsProps> = ({
  config,
  onChange
}) => {
  const insertSymbol = (sym: string) => {
    onChange({ ...config, text: config.text + sym });
  };

  return (
    <div className="space-y-4">
      {/* Text Input & Quick Symbols */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-sec flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-green-primary" /> Texto da Marca d’Água
          </span>
          <span className="text-[10px] text-text-muted">Símbolos Rápidos</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={config.text}
            onChange={(e) => onChange({ ...config, text: e.target.value })}
            placeholder="Digite o texto da marca d'água"
            className="flex-1 bg-card-inner border border-border-main rounded-xl px-3 py-2 text-sm text-text-main focus:outline-none focus:border-green-primary font-semibold"
          />
          <div className="flex items-center gap-1">
            {["©", "®", "™"].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => insertSymbol(sym)}
                className="px-2.5 py-2 bg-card-inner border border-border-main hover:border-green-primary rounded-xl text-xs font-bold text-text-sec hover:text-green-light transition-all cursor-pointer"
                title={`Inserir ${sym}`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Font Family & Size / Scale Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-sec">Fonte</label>
          <select
            value={config.fontFamily}
            onChange={(e) => onChange({ ...config, fontFamily: e.target.value })}
            className="w-full bg-card-inner border border-border-main rounded-xl px-3 py-2 text-xs font-semibold text-text-main focus:outline-none focus:border-green-primary"
          >
            {SAFE_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-sec">Tamanho ({config.fontSize}%)</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    scaleMode: config.scaleMode === "proportional" ? "fixed" : "proportional"
                  })
                }
                className="text-[10px] text-green-primary font-bold hover:underline cursor-pointer"
              >
                {config.scaleMode === "proportional" ? "Proporcional %" : "Fixo em px"}
              </button>
            </div>
          </div>
          <input
            type="range"
            min={config.scaleMode === "proportional" ? 1 : 10}
            max={config.scaleMode === "proportional" ? 20 : 150}
            step={0.5}
            value={config.fontSize}
            onChange={(e) => onChange({ ...config, fontSize: parseFloat(e.target.value) })}
            className="w-full accent-green-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Color, Presets & Opacity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-green-primary" /> Cor e Estilo
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.color}
              onChange={(e) => onChange({ ...config, color: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <div className="flex items-center gap-1 flex-1 overflow-x-auto py-1">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ ...config, color: c })}
                  className="w-5 h-5 rounded-full border border-white/20 shrink-0 cursor-pointer"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            {/* Bold / Italic */}
            <div className="flex items-center gap-1 bg-card-inner border border-border-main rounded-xl p-1">
              <button
                type="button"
                onClick={() => onChange({ ...config, bold: !config.bold })}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  config.bold ? "bg-green-primary text-bg-main" : "text-text-sec hover:text-text-main"
                }`}
                title="Negrito"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, italic: !config.italic })}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  config.italic ? "bg-green-primary text-bg-main" : "text-text-sec hover:text-text-main"
                }`}
                title="Itálico"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Opacity & Rotation */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-sec flex items-center justify-between">
            <span>Opacidade ({Math.round(config.opacity * 100)}%)</span>
            <span className="flex items-center gap-1">
              <RotateCw className="h-3 w-3 text-green-primary" /> {config.rotation}°
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={config.opacity}
              onChange={(e) => onChange({ ...config, opacity: parseFloat(e.target.value) })}
              className="w-full accent-green-primary cursor-pointer"
            />
            <input
              type="range"
              min={-180}
              max={180}
              step={5}
              value={config.rotation}
              onChange={(e) => onChange({ ...config, rotation: parseInt(e.target.value) })}
              className="w-full accent-green-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Effects: Outline, Shadow, Background */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border-main/60">
        <label className="flex items-center gap-1.5 text-xs font-bold text-text-sec cursor-pointer">
          <input
            type="checkbox"
            checked={config.hasOutline}
            onChange={(e) => onChange({ ...config, hasOutline: e.target.checked })}
            className="rounded accent-green-primary"
          />
          Contorno
        </label>
        {config.hasOutline && (
          <input
            type="color"
            value={config.outlineColor}
            onChange={(e) => onChange({ ...config, outlineColor: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer bg-transparent"
            title="Cor do Contorno"
          />
        )}

        <label className="flex items-center gap-1.5 text-xs font-bold text-text-sec cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={config.hasShadow}
            onChange={(e) => onChange({ ...config, hasShadow: e.target.checked })}
            className="rounded accent-green-primary"
          />
          Sombra
        </label>

        <label className="flex items-center gap-1.5 text-xs font-bold text-text-sec cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={config.hasBg}
            onChange={(e) => onChange({ ...config, hasBg: e.target.checked })}
            className="rounded accent-green-primary"
          />
          Fundo
        </label>
      </div>

      {/* 9 Positions Picker */}
      <div className="space-y-2 pt-2 border-t border-border-main/60">
        <label className="text-xs font-bold text-text-sec flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Grid className="h-3.5 w-3.5 text-green-primary" /> Posicionamento Rápido
          </span>
          <span className="text-[10px] text-text-muted">Ajuste Fino Margem: X {config.offsetX}px, Y {config.offsetY}px</span>
        </label>

        <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
          {NINE_POSITIONS.map((pos) => {
            const isSelected = config.position === pos.id;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => onChange({ ...config, position: pos.id })}
                className={`p-2 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer ${
                  isSelected
                    ? "bg-green-primary text-bg-main border-green-primary shadow-sm"
                    : "bg-card-inner border-border-main hover:border-green-primary/50 text-text-sec hover:text-text-main"
                }`}
              >
                {pos.label}
              </button>
            );
          })}
        </div>

        {/* Fine Offsets */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Margem Horiz. (X): {config.offsetX}px</span>
            <input
              type="range"
              min={0}
              max={200}
              value={config.offsetX}
              onChange={(e) => onChange({ ...config, offsetX: parseInt(e.target.value) })}
              className="w-full accent-green-primary cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Margem Vert. (Y): {config.offsetY}px</span>
            <input
              type="range"
              min={0}
              max={200}
              value={config.offsetY}
              onChange={(e) => onChange({ ...config, offsetY: parseInt(e.target.value) })}
              className="w-full accent-green-primary cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
