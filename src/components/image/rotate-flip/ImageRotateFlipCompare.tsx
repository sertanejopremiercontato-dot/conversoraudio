import React, { useState, useEffect } from "react";
import { X, ArrowRight, RefreshCcw, Eye } from "lucide-react";
import { ImageCardItem } from "./ImageRotateFlipCard";
import {
  getTransformedDimensions,
  generateThumbnailPreview
} from "../../../utils/imageTransformCommands";

interface ImageRotateFlipCompareProps {
  item: ImageCardItem | null;
  onClose: () => void;
}

export default function ImageRotateFlipCompare({
  item,
  onClose
}: ImageRotateFlipCompareProps) {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [adjustedPreviewUrl, setAdjustedPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (item && item.source) {
      const url = generateThumbnailPreview(
        item.source,
        item.originalWidth,
        item.originalHeight,
        item.transform,
        600
      );
      setAdjustedPreviewUrl(url);
    }
  }, [item]);

  if (!item) return null;

  const { width: finalW, height: finalH } = getTransformedDimensions(
    item.originalWidth,
    item.originalHeight,
    item.transform.rotation
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card-main border border-border-main rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 bg-card-inner border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-primary" />
            <h3 className="font-display font-bold text-base text-text-main">
              Antes e Depois: <span className="text-green-light">{item.file.name}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-card-main text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ANTES (Original) */}
            <div className="space-y-3 text-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted block">
                ANTES (Original)
              </span>
              <div className="bg-[#181d22] border border-border-main rounded-xl p-4 min-h-[260px] flex items-center justify-center">
                <img
                  src={item.originalPreviewUrl}
                  alt="Original"
                  className="max-h-[240px] max-w-full object-contain rounded"
                />
              </div>
              <div className="text-xs font-mono text-text-sec space-y-1">
                <div>
                  Dimensões: <strong className="text-white">{item.originalWidth} × {item.originalHeight} px</strong>
                </div>
                <div>
                  Orientação EXIF: <strong className="text-white">{item.exifOrientation > 1 ? `Tag ${item.exifOrientation}` : "Normal (1)"}</strong>
                </div>
              </div>
            </div>

            {/* DEPOIS (Ajustada) */}
            <div className="space-y-3 text-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-green-primary block">
                DEPOIS (Com Ajustes)
              </span>
              <div className="bg-[#181d22] border border-green-primary/30 rounded-xl p-4 min-h-[260px] flex items-center justify-center">
                {adjustedPreviewUrl ? (
                  <img
                    src={adjustedPreviewUrl}
                    alt="Ajustada"
                    className="max-h-[240px] max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="w-8 h-8 border-2 border-green-primary/30 border-t-green-primary rounded-full animate-spin" />
                )}
              </div>
              <div className="text-xs font-mono text-text-sec space-y-1">
                <div>
                  Dimensões Finais: <strong className="text-green-primary">{finalW} × {finalH} px</strong>
                </div>
                <div>
                  Transformações:{" "}
                  <strong className="text-white">
                    {item.transform.rotation}° | {item.transform.flipH ? "Espelhado H" : "Sem espelho H"} | {item.transform.flipV ? "Espelhado V" : "Sem espelho V"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Split Slider for overlay comparison */}
          <div className="space-y-2 pt-4 border-t border-border-main/50">
            <div className="flex items-center justify-between text-xs font-bold text-text-sec">
              <span>Arraste para comparar na mesma visualização:</span>
              <span className="font-mono text-green-primary">{sliderPos}%</span>
            </div>
            <div className="relative h-64 bg-[#181d22] rounded-xl overflow-hidden border border-border-main select-none">
              {/* After Image (Full width background) */}
              <img
                src={adjustedPreviewUrl || item.originalPreviewUrl}
                alt="Ajustada"
                className="absolute inset-0 w-full h-full object-contain"
              />
              {/* Before Image (Clipped overlay) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-green-primary shadow-lg bg-[#181d22]"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={item.originalPreviewUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain max-w-none"
                  style={{ width: "100%" }}
                />
              </div>
              {/* Range Input Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-card-inner border-t border-border-main flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-green-primary hover:bg-green-dark text-white font-extrabold text-xs transition-colors cursor-pointer"
          >
            Fechar comparação
          </button>
        </div>
      </div>
    </div>
  );
}
