import React, { useRef } from "react";
import { LogoWatermarkConfig, NinePosition } from "../../../utils/imageWatermarkPresets";
import { Upload, Image as ImageIcon, Trash2, Grid, RotateCw, Sparkles } from "lucide-react";

interface ImageWatermarkLogoSettingsProps {
  config: LogoWatermarkConfig;
  onChange: (updated: LogoWatermarkConfig) => void;
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

export const ImageWatermarkLogoSettings: React.FC<ImageWatermarkLogoSettingsProps> = ({
  config,
  onChange
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida para a logo (PNG, JPG, WEBP, SVG).");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onChange({
        ...config,
        logoFile: file,
        logoSource: img,
        logoPreviewUrl: previewUrl,
        logoWidth: img.width,
        logoHeight: img.height
      });
    };
    img.src = previewUrl;
  };

  const handleRemoveLogo = () => {
    if (config.logoPreviewUrl) {
      URL.revokeObjectURL(config.logoPreviewUrl);
    }
    onChange({
      ...config,
      logoFile: null,
      logoSource: null,
      logoPreviewUrl: "",
      logoWidth: 0,
      logoHeight: 0
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Logo or Preview */}
      {!config.logoSource ? (
        <div
          onClick={() => logoInputRef.current?.click()}
          className="border-2 border-dashed border-border-main hover:border-green-primary rounded-2xl p-6 text-center cursor-pointer bg-card-inner transition-all flex flex-col items-center justify-center space-y-2"
        >
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <div className="p-3 bg-[#303943] text-green-primary rounded-xl">
            <Upload className="h-6 w-6" />
          </div>
          <span className="font-bold text-xs text-text-main">
            Clique para enviar seu Logotipo ou Marca
          </span>
          <span className="text-[11px] text-text-muted">
            PNG transparente recomendado (ou JPG, WEBP, SVG)
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-card-inner border border-border-main rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black/40 border border-border-main p-1 flex items-center justify-center overflow-hidden">
              <img
                src={config.logoPreviewUrl}
                alt="Logotipo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-xs text-text-main block truncate max-w-[180px]">
                {config.logoFile?.name || "Logotipo"}
              </span>
              <span className="text-[10px] text-text-muted">
                {config.logoWidth} × {config.logoHeight} px (Aspecto Preservado)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-card-main border border-border-main hover:border-green-primary rounded-xl text-xs font-bold text-text-sec hover:text-text-main transition-all cursor-pointer"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
              title="Remover Logotipo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings when logo exists */}
      {config.logoSource && (
        <div className="space-y-4 pt-2 border-t border-border-main/60">
          {/* Scale & Opacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-text-sec">
                <span>Tamanho / Escala ({config.scale}%)</span>
              </div>
              <input
                type="range"
                min={2}
                max={60}
                step={1}
                value={config.scale}
                onChange={(e) => onChange({ ...config, scale: parseInt(e.target.value) })}
                className="w-full accent-green-primary cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-text-sec">
                <span>Opacidade ({Math.round(config.opacity * 100)}%)</span>
                <span className="flex items-center gap-1 text-[11px]">
                  <RotateCw className="h-3 w-3 text-green-primary" /> {config.rotation}°
                </span>
              </div>
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

          {/* 9 Positions Picker */}
          <div className="space-y-2 pt-2 border-t border-border-main/60">
            <label className="text-xs font-bold text-text-sec flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Grid className="h-3.5 w-3.5 text-green-primary" /> Posicionamento do Logotipo
              </span>
              <span className="text-[10px] text-text-muted">Margem: X {config.offsetX}px, Y {config.offsetY}px</span>
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
      )}
    </div>
  );
};
