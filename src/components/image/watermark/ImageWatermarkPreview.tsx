import React, { useEffect, useRef, useState } from "react";
import { WatermarkSettings } from "../../../utils/imageWatermarkPresets";
import { applyWatermarkToCanvas } from "../../../utils/imageWatermarkCalculations";
import {
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Shield,
  Crosshair,
  Sparkles,
  Sliders
} from "lucide-react";

interface ImageWatermarkPreviewProps {
  imageFile: File;
  settings: WatermarkSettings;
  onUpdateProtectionArea?: (xPercent: number, yPercent: number) => void;
}

export const ImageWatermarkPreview: React.FC<ImageWatermarkPreviewProps> = ({
  imageFile,
  settings,
  onUpdateProtectionArea
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<"watermarked" | "split" | "original">("watermarked");
  const [splitPos, setSplitPos] = useState<number>(50); // % for split comparison
  const [zoom, setZoom] = useState<number>(1);
  const [isProcessingPreview, setIsProcessingPreview] = useState<boolean>(true);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Store loaded image element in ref to avoid reloading on every single slider change
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const url = URL.createObjectURL(imageFile);
    const img = new Image();

    img.onload = () => {
      if (isCancelled) return;
      loadedImgRef.current = img;
      setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      renderPreview();
    };

    img.src = url;

    return () => {
      isCancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const renderPreview = () => {
    if (!loadedImgRef.current || !canvasRef.current) return;
    setIsProcessingPreview(true);

    const img = loadedImgRef.current;
    const canvas = canvasRef.current;
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    canvas.width = w;
    canvas.height = h;

    const renderedCanvas = applyWatermarkToCanvas(img, w, h, settings);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, w, h);

      if (viewMode === "original") {
        ctx.drawImage(img, 0, 0, w, h);
      } else if (viewMode === "watermarked") {
        ctx.drawImage(renderedCanvas, 0, 0, w, h);
      } else if (viewMode === "split") {
        // Draw original on left, watermarked on right
        ctx.drawImage(img, 0, 0, w, h);
        const splitX = Math.round((w * splitPos) / 100);
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, w - splitX, h);
        ctx.clip();
        ctx.drawImage(renderedCanvas, 0, 0, w, h);
        ctx.restore();

        // Draw split line
        ctx.strokeStyle = "#39D977";
        ctx.lineWidth = Math.max(2, Math.round(w * 0.003));
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, h);
        ctx.stroke();
      }
    }

    setIsProcessingPreview(false);
  };

  useEffect(() => {
    renderPreview();
  }, [settings, viewMode, splitPos]);

  // Handle clicking on preview to position Protection Area
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!settings.protectionArea.enabled || !onUpdateProtectionArea) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPct = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));
    const yPct = Math.round(Math.max(0, Math.min(100, (clickY / rect.height) * 100)));

    onUpdateProtectionArea(xPct, yPct);
  };

  return (
    <div className="space-y-3">
      {/* View Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card-inner border border-border-main rounded-2xl p-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode("watermarked")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "watermarked"
                ? "bg-green-primary text-bg-main shadow-sm"
                : "text-text-sec hover:text-text-main"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Com Marca
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "split"
                ? "bg-green-primary text-bg-main shadow-sm"
                : "text-text-sec hover:text-text-main"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" /> Antes / Depois
          </button>
          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "original"
                ? "bg-green-primary text-bg-main shadow-sm"
                : "text-text-sec hover:text-text-main"
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" /> Original
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-card-main border border-border-main rounded-xl p-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1 text-text-sec hover:text-text-main rounded-lg cursor-pointer"
            title="Diminuir Zoom"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] font-bold text-text-muted px-1.5">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
            className="p-1 text-text-sec hover:text-text-main rounded-lg cursor-pointer"
            title="Aumentar Zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-1 text-text-sec hover:text-text-main rounded-lg cursor-pointer"
            title="Resetar Zoom"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Split comparison slider */}
      {viewMode === "split" && (
        <div className="flex items-center gap-3 px-2">
          <span className="text-xs font-semibold text-text-muted">Original</span>
          <input
            type="range"
            min={0}
            max={100}
            value={splitPos}
            onChange={(e) => setSplitPos(parseInt(e.target.value))}
            className="flex-1 accent-green-primary cursor-pointer"
          />
          <span className="text-xs font-semibold text-green-light">Com Marca</span>
        </div>
      )}

      {/* Interactive Protection Area Banner */}
      {settings.protectionArea.enabled && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-300 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              Clique em qualquer local da imagem abaixo para definir a <strong>Área de Proteção</strong>.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 rounded-full">
            X: {settings.protectionArea.xPercent}% Y: {settings.protectionArea.yPercent}%
          </span>
        </div>
      )}

      {/* Main Canvas Canvas Stage */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative bg-black/60 border border-border-main rounded-2xl p-2 flex items-center justify-center overflow-auto min-h-[320px] max-h-[520px] select-none"
      >
        <div
          className="transition-transform duration-150 origin-center relative inline-block max-w-full"
          style={{ transform: `scale(${zoom})` }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[480px] object-contain rounded-lg shadow-md block"
          />

          {/* Protection Area Target Marker */}
          {settings.protectionArea.enabled && (
            <div
              className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-dashed border-amber-400 rounded-full pointer-events-none flex items-center justify-center animate-pulse"
              style={{
                left: `${settings.protectionArea.xPercent}%`,
                top: `${settings.protectionArea.yPercent}%`
              }}
            >
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted px-1">
        <span>Dimensões: {imgDimensions.w} × {imgDimensions.h} px</span>
        <span>Prévia Fiel em Tempo Real</span>
      </div>
    </div>
  );
};
