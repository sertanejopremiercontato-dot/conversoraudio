import React, { useState } from "react";
import { X, ZoomIn, ZoomOut, Maximize2, Split, Eye, ShieldCheck } from "lucide-react";
import { CompressedImageItem } from "../../../services/image/imageCompressorService";
import { formatBytes } from "../ImageFileList";

interface ImageCompressorCompareModalProps {
  item: CompressedImageItem;
  onClose: () => void;
}

export default function ImageCompressorCompareModal({
  item,
  onClose
}: ImageCompressorCompareModalProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider" | "toggle">("slider");
  const [sliderPos, setSliderPos] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeToggle, setActiveToggle] = useState<"original" | "compressed">("compressed");

  const originalUrl = item.previewUrl;
  const compressedUrl = item.compressedBlobUrl;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, z + 0.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(1, z - 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-bg-main border border-border-main rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-main/70 bg-card-inner">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base text-text-main flex items-center gap-2">
              <span>Comparação Antes / Depois</span>
              {item.visualQualityLabel && (
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-black border border-emerald-500/30">
                  Fidelidade: {item.visualQualityLabel} ({item.visualQualityScore}%)
                </span>
              )}
            </h3>
            <p className="text-xs text-text-muted">
              {item.name} • Resolução: {item.width} × {item.height} px
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-bg-sec p-1 rounded-xl border border-border-main text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("slider")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "slider"
                    ? "bg-green-primary text-white shadow-sm"
                    : "text-text-sec hover:text-text-main"
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>Divisor</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("side-by-side")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "side-by-side"
                    ? "bg-green-primary text-white shadow-sm"
                    : "text-text-sec hover:text-text-main"
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Lado a Lado</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("toggle")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "toggle"
                    ? "bg-green-primary text-white shadow-sm"
                    : "text-text-sec hover:text-text-main"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Alternar</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-bg-sec p-1 rounded-xl border border-border-main">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1.5 text-text-sec hover:text-text-main disabled:opacity-40 cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold px-2 text-text-muted">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1.5 text-text-sec hover:text-text-main disabled:opacity-40 cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-main hover:bg-bg-sec rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-card-inner/40 flex flex-col items-center justify-center min-h-[350px]">
          {viewMode === "slider" && originalUrl && compressedUrl && (
            <div className="relative w-full max-w-3xl aspect-square max-h-[55vh] rounded-2xl overflow-hidden border border-border-main select-none bg-checkered">
              {/* Background: Compressed */}
              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={compressedUrl}
                  alt="Comprimida"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>

              {/* Foreground: Original clipped */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <div
                  className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
                  style={{
                    width: "100%",
                    minWidth: "100%",
                    transform: `scale(${zoomLevel})`
                  }}
                >
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="w-full h-full object-contain"
                    style={{
                      maxWidth: "none",
                      width: "100%",
                      height: "100%"
                    }}
                    draggable={false}
                  />
                </div>
              </div>

              {/* Slider Handle Divider */}
              <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-xl cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-7 h-7 -ml-3.5 rounded-full bg-white text-emerald-700 shadow-lg flex items-center justify-center font-black text-xs border-2 border-emerald-500">
                  ↔
                </div>
              </div>

              {/* Invisible Range Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 bg-black/70 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur-sm pointer-events-none">
                Original ({formatBytes(item.originalSize)})
              </div>
              <div className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur-sm pointer-events-none">
                Comprimida ({formatBytes(item.compressedSize || item.originalSize)})
              </div>
            </div>
          )}

          {viewMode === "side-by-side" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {/* Original */}
              <div className="bg-bg-sec rounded-2xl border border-border-main p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-text-main">ORIGINAL</span>
                  <span className="text-text-muted">{formatBytes(item.originalSize)}</span>
                </div>
                <div className="aspect-square rounded-xl overflow-hidden border border-border-main/50 flex items-center justify-center bg-card-inner">
                  {originalUrl && (
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="w-full h-full object-contain"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  )}
                </div>
              </div>

              {/* Compressed */}
              <div className="bg-bg-sec rounded-2xl border border-emerald-500/40 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-400">COMPRIMIDA ({item.outputFormat || item.originalFormat})</span>
                  <span className="text-emerald-400 font-black">
                    {formatBytes(item.compressedSize || item.originalSize)} (-{item.savedPercentage}%)
                  </span>
                </div>
                <div className="aspect-square rounded-xl overflow-hidden border border-border-main/50 flex items-center justify-center bg-card-inner">
                  {compressedUrl && (
                    <img
                      src={compressedUrl}
                      alt="Comprimida"
                      className="w-full h-full object-contain"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {viewMode === "toggle" && (
            <div className="w-full max-w-lg space-y-4 flex flex-col items-center">
              <div className="flex items-center gap-2 bg-bg-sec p-1 rounded-xl border border-border-main">
                <button
                  type="button"
                  onClick={() => setActiveToggle("original")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeToggle === "original"
                      ? "bg-card-inner text-text-main shadow-sm"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  Original ({formatBytes(item.originalSize)})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToggle("compressed")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeToggle === "compressed"
                      ? "bg-green-primary text-white shadow-sm"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  Comprimida ({formatBytes(item.compressedSize || item.originalSize)})
                </button>
              </div>

              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-border-main bg-card-inner flex items-center justify-center">
                <img
                  src={activeToggle === "original" ? originalUrl : compressedUrl}
                  alt={activeToggle}
                  className="w-full h-full object-contain transition-all"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border-main/70 bg-card-inner flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dimensões Exatas Preservadas: {item.width} × {item.height} px (1:1)</span>
          </div>

          <div className="text-text-muted font-medium">
            Arraste a barra para comparar a nitidez pixel a pixel.
          </div>
        </div>
      </div>
    </div>
  );
}
