import React from "react";
import { WATERMARK_PRESETS, WatermarkPreset, WatermarkSettings } from "../../../utils/imageWatermarkPresets";
import { Sparkles, ShoppingBag, Camera, ShieldAlert, Share2, Copyright } from "lucide-react";

interface ImageWatermarkPresetsProps {
  activePresetId?: string;
  onSelectPreset: (preset: WatermarkPreset) => void;
}

export const ImageWatermarkPresets: React.FC<ImageWatermarkPresetsProps> = ({
  activePresetId,
  onSelectPreset
}) => {
  const getPresetIcon = (id: string) => {
    switch (id) {
      case "store_product":
        return <ShoppingBag className="h-4 w-4 text-amber-400" />;
      case "portfolio":
        return <Camera className="h-4 w-4 text-blue-400" />;
      case "protected_preview":
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      case "social_media":
        return <Share2 className="h-4 w-4 text-purple-400" />;
      case "copyright":
      default:
        return <Copyright className="h-4 w-4 text-green-primary" />;
    }
  };

  return (
    <div className="space-y-3 bg-card-main border border-border-main rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-green-primary" />
        <h4 className="font-bold text-xs text-text-main uppercase tracking-wider">
          Presets Rápidos de Uso
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {WATERMARK_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isActive
                  ? "bg-green-primary/10 border-green-primary text-green-light shadow-sm"
                  : "bg-card-inner border-border-main hover:border-green-primary/50 text-text-sec hover:text-text-main"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {getPresetIcon(preset.id)}
                <span className="font-bold text-xs truncate">{preset.name}</span>
              </div>
              <p className="text-[10px] text-text-muted leading-tight font-medium line-clamp-2">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
