import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Maximize2,
  Lock,
  Unlock,
  Play,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Crop,
  Layers,
  Sparkles,
  Smartphone,
  Sliders,
  Check
} from "lucide-react";
import { ImageFileItem, ImageProcessResult, ImageOutputFormat } from "../types";
import { prepareImageFile, resizeImage } from "../services/imageEngineV2";
import { ImageDropzoneV2 } from "../components/ImageDropzoneV2";
import { ImageProgressV2 } from "../components/ImageProgressV2";
import { ImageResultV2 } from "../components/ImageResultV2";
import { trackEventV2 } from "../../../integrations/analytics";

interface ImageResizeV2Props {
  onBack: () => void;
}

interface SocialPreset {
  id: string;
  label: string;
  w: number;
  h: number;
  ratioLabel: string;
  desc: string;
}

const SOCIAL_PRESETS: SocialPreset[] = [
  { id: "insta_feed", label: "Instagram Feed", w: 1080, h: 1080, ratioLabel: "1:1", desc: "Quadrado" },
  { id: "stories_reels", label: "Stories / Reels / TikTok", w: 1080, h: 1920, ratioLabel: "9:16", desc: "Vertical" },
  { id: "facebook_post", label: "Facebook Post", w: 1200, h: 630, ratioLabel: "1.91:1", desc: "Paisagem" },
  { id: "youtube_thumb", label: "YouTube Thumbnail", w: 1280, h: 720, ratioLabel: "16:9", desc: "HD Widescreen" },
  { id: "twitter_post", label: "Twitter / X Post", w: 1200, h: 675, ratioLabel: "16:9", desc: "Widescreen" },
  { id: "twitter_header", label: "Header Twitter / X", w: 1500, h: 500, ratioLabel: "3:1", desc: "Panorâmico" }
];

export const ImageResizeV2: React.FC<ImageResizeV2Props> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Settings
  const [mode, setMode] = useState<"pixels" | "percentage" | "presets">("presets");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("stories_reels");
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1920);
  const [keepAspectRatio, setKeepAspectRatio] = useState(false);
  const [percentage, setPercentage] = useState<number>(50);
  const [format, setFormat] = useState<ImageOutputFormat | "original">("original");
  const [quality] = useState<number>(0.92);

  // Framing and positioning
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");
  const [zoom, setZoom] = useState<number>(1.0);
  const [offsetX, setOffsetX] = useState<number>(0); // -1 to 1
  const [offsetY, setOffsetY] = useState<number>(0); // -1 to 1

  // Interactive dragging in canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number }>({
    x: 0,
    y: 0,
    startOffsetX: 0,
    startOffsetY: 0
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [results, setResults] = useState<ImageProcessResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeImage = images[activeIndex] || images[0] || null;

  // Calculate target dimensions based on mode and settings
  const targetDimensions = useMemo(() => {
    if (!activeImage) return { w: width, h: height, ratioStr: "1:1" };

    let targetW = width;
    let targetH = height;

    if (mode === "percentage") {
      const factor = percentage / 100;
      targetW = Math.max(1, Math.round(activeImage.width * factor));
      targetH = Math.max(1, Math.round(activeImage.height * factor));
    } else if (mode === "pixels") {
      targetW = Math.max(1, width);
      targetH = Math.max(1, height);
    } else if (mode === "presets") {
      const preset = SOCIAL_PRESETS.find((p) => p.id === selectedPresetId);
      if (preset) {
        targetW = preset.w;
        targetH = preset.h;
      }
    }

    // Compute gcd for ratio string
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(targetW, targetH);
    const rW = targetW / divisor;
    const rH = targetH / divisor;
    const ratioStr = rW > 50 || rH > 50 ? `${(targetW / targetH).toFixed(2)}:1` : `${rW}:${rH}`;

    return { w: targetW, h: targetH, ratioStr };
  }, [activeImage, mode, width, height, percentage, selectedPresetId]);

  // When first images loaded
  const handleFilesSelected = async (files: File[]) => {
    setErrorMessage(null);
    try {
      const items: ImageFileItem[] = [];
      for (const file of files) {
        const item = await prepareImageFile(file);
        items.push(item);
      }
      setImages((prev) => {
        const combined = [...prev, ...items];
        return combined;
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao carregar imagens.");
    }
  };

  const handleWidthChange = (val: number) => {
    const newW = Math.max(1, val);
    setWidth(newW);
    if (keepAspectRatio && activeImage && activeImage.width > 0) {
      const aspect = activeImage.height / activeImage.width;
      setHeight(Math.max(1, Math.round(newW * aspect)));
    }
  };

  const handleHeightChange = (val: number) => {
    const newH = Math.max(1, val);
    setHeight(newH);
    if (keepAspectRatio && activeImage && activeImage.height > 0) {
      const aspect = activeImage.width / activeImage.height;
      setWidth(Math.max(1, Math.round(newH * aspect)));
    }
  };

  const handleSelectPreset = (preset: SocialPreset) => {
    setSelectedPresetId(preset.id);
    setWidth(preset.w);
    setHeight(preset.h);
    setKeepAspectRatio(false);
    setMode("presets");
  };

  const handleResetFraming = () => {
    setZoom(1.0);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleCenter = () => {
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleClearAll = () => {
    setImages([]);
    setActiveIndex(0);
    setResults([]);
    setErrorMessage(null);
    handleResetFraming();
  };

  // Render Real-time WYSIWYG Preview on Canvas
  useEffect(() => {
    if (!activeImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeImage.previewUrl;

    img.onload = () => {
      const targetW = targetDimensions.w;
      const targetH = targetDimensions.h;

      // Set canvas resolution matching the target aspect ratio in high DPI for crisp preview
      const maxCanvasDim = 900;
      let canvasW = maxCanvasDim;
      let canvasH = maxCanvasDim;

      if (targetW >= targetH) {
        canvasW = maxCanvasDim;
        canvasH = Math.max(1, Math.round((maxCanvasDim * targetH) / targetW));
      } else {
        canvasH = maxCanvasDim;
        canvasW = Math.max(1, Math.round((maxCanvasDim * targetW) / targetH));
      }

      canvas.width = canvasW;
      canvas.height = canvasH;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw subtle transparent checkerboard pattern
      const tileSize = 16;
      for (let x = 0; x < canvasW; x += tileSize) {
        for (let y = 0; y < canvasH; y += tileSize) {
          ctx.fillStyle = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 ? "#F8FAFC" : "#EDF2F7";
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }

      // If format is JPG, fill with white background
      if (format === "JPG") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvasW, canvasH);
      }

      // Calculate framing on preview canvas
      let baseScale: number;
      if (fitMode === "contain") {
        baseScale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
      } else {
        baseScale = Math.max(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
      }

      const effectiveScale = baseScale * zoom;
      const renderW = img.naturalWidth * effectiveScale;
      const renderH = img.naturalHeight * effectiveScale;

      const maxPanX = Math.max(0, (renderW - canvasW) / 2);
      const maxPanY = Math.max(0, (renderH - canvasH) / 2);

      const centerX = (canvasW - renderW) / 2;
      const centerY = (canvasH - renderH) / 2;

      const dx = centerX + offsetX * maxPanX;
      const dy = centerY + offsetY * maxPanY;

      ctx.drawImage(img, dx, dy, renderW, renderH);

      // Draw subtle boundary frame
      ctx.strokeStyle = "rgba(2, 132, 199, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvasW - 2, canvasH - 2);
    };
  }, [activeImage, targetDimensions, fitMode, zoom, offsetX, offsetY, format]);

  // Pointer dragging handlers for intuitive panning
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || fitMode !== "cover") return;
    canvasRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || !activeImage) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const rect = canvasRef.current.getBoundingClientRect();
    const sensitivity = 2.5;

    const newOffsetX = Math.max(-1, Math.min(1, dragStartRef.current.startOffsetX + (deltaX / rect.width) * sensitivity));
    const newOffsetY = Math.max(-1, Math.min(1, dragStartRef.current.startOffsetY + (deltaY / rect.height) * sensitivity));

    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging && canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch (_) {}
      setIsDragging(false);
    }
  };

  // Perform Real Batch / Single Image Resize
  const handleResizeAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(5);
    setStepText(`Iniciando redimensionamento com enquadramento visual...`);
    setErrorMessage(null);

    const outResults: ImageProcessResult[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setStepText(`Redimensionando foto ${i + 1} de ${images.length}: ${item.name}`);

        let targetW = targetDimensions.w;
        let targetH = targetDimensions.h;

        if (mode === "percentage") {
          const factor = percentage / 100;
          targetW = Math.max(1, Math.round(item.width * factor));
          targetH = Math.max(1, Math.round(item.height * factor));
        }

        const res = await resizeImage(item, targetW, targetH, format, quality, {
          fitMode,
          zoom,
          offsetX,
          offsetY
        });

        // Strict dimension verification
        if (res.width !== targetW || res.height !== targetH) {
          throw new Error(`Validação de saída falhou: esperado ${targetW}x${targetH}, obtido ${res.width}x${res.height}`);
        }

        outResults.push(res);
        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      setResults(outResults);

      trackEventV2("image_resize_completed", {
        file_count: images.length,
        app_version: "v2",
        target_width: targetDimensions.w,
        target_height: targetDimensions.h,
        fit_mode: fitMode
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro durante o redimensionamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (results.length > 0) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleClearAll}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Redimensionamento</span>
        </button>
        <ImageResultV2
          results={results}
          title="Redimensionamento Concluído com Sucesso!"
          onReset={handleClearAll}
          zipFileName="imagens-redimensionadas.zip"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Ferramentas de Imagem</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        {/* Header Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <Maximize2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0F172A]">
              Redimensionar Imagens
            </h2>
            <p className="text-xs md:text-sm text-[#64748B] mt-0.5">
              Enquadramento visual em tempo real, proporções de redes sociais, zoom e redimensionamento de alta precisão.
            </p>
          </div>
        </div>

        {images.length === 0 ? (
          <ImageDropzoneV2 onFilesSelected={handleFilesSelected} multiple={true} />
        ) : (
          <div className="space-y-6">
            {/* Top Bar with count and clear button */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#0F172A]">
                  {images.length} {images.length === 1 ? "foto carregada" : "fotos carregadas"}
                </span>
                {images.length > 1 && (
                  <span className="text-[11px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                    Editando: {activeImage?.name}
                  </span>
                )}
              </div>
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar lista</span>
              </button>
            </div>

            {/* Thumbnail selector if multiple images */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`shrink-0 flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${
                      activeIndex === idx
                        ? "bg-[#E0F2FE] border-[#0284C7] text-[#0284C7]"
                        : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="text-left">
                      <div className="text-[11px] font-bold truncate max-w-[120px]">{img.name}</div>
                      <div className="text-[9px] text-[#94A3B8]">{img.width} × {img.height} px</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Two-Column Layout: 60% Left Preview / 40% Right Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Large WYSIWYG Frame Preview */}
              <div className="lg:col-span-7 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crop className="w-4 h-4 text-[#0284C7]" />
                    <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                      Prévia do Resultado
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-[#0284C7] text-white text-[10px] font-extrabold shadow-xs">
                    {targetDimensions.w} × {targetDimensions.h} • {targetDimensions.ratioStr}
                  </div>
                </div>

                {/* Canvas Container with dynamic aspect-ratio */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900/5 flex items-center justify-center p-3 min-h-[380px] max-h-[480px]">
                  <div
                    className="relative max-w-full max-h-[440px] flex items-center justify-center shadow-lg rounded-xl overflow-hidden bg-white border border-[#CBD5E1]"
                    style={{
                      aspectRatio: `${targetDimensions.w} / ${targetDimensions.h}`
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      className={`w-full h-full max-h-[440px] object-contain transition-transform ${
                        fitMode === "cover" ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
                      }`}
                    />

                    {/* Subtle Drag Hint Overlay */}
                    {fitMode === "cover" && !isDragging && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/50 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs pointer-events-none opacity-80">
                        <Move className="w-3 h-3" />
                        <span>Arraste para enquadrar</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fit Mode Toggle & Framing Controls */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Fit Mode Buttons */}
                    <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => setFitMode("cover")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          fitMode === "cover"
                            ? "bg-white text-[#0F172A] shadow-xs"
                            : "text-[#64748B] hover:text-[#0F172A]"
                        }`}
                      >
                        Preencher e Recortar
                      </button>
                      <button
                        type="button"
                        onClick={() => setFitMode("contain")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          fitMode === "contain"
                            ? "bg-white text-[#0F172A] shadow-xs"
                            : "text-[#64748B] hover:text-[#0F172A]"
                        }`}
                      >
                        Caber sem Cortar
                      </button>
                    </div>

                    {/* Quick Reset / Center Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCenter}
                        title="Centralizar posição"
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#334155] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Move className="w-3 h-3 text-[#0284C7]" />
                        <span>Centralizar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetFraming}
                        title="Redefinir enquadramento e zoom"
                        className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#334155] text-xs font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
                      </button>
                    </div>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0]">
                    <span className="text-xs font-bold text-[#475569] shrink-0">Zoom:</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(1.0, Number((z - 0.1).toFixed(1))))}
                      className="p-1 rounded-md hover:bg-slate-100 text-[#475569] cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                    />
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(1))))}
                      className="p-1 rounded-md hover:bg-slate-100 text-[#475569] cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-extrabold text-[#0284C7] shrink-0 w-10 text-right">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>
                </div>

                {/* Dynamic Spec Bar below preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E2E8F0] text-center">
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Original</div>
                    <div className="text-xs font-black text-[#0F172A]">
                      {activeImage ? `${activeImage.width} × ${activeImage.height}` : "-"}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Saída</div>
                    <div className="text-xs font-black text-[#0284C7]">
                      {targetDimensions.w} × {targetDimensions.h}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Proporção</div>
                    <div className="text-xs font-black text-[#0F172A]">
                      {targetDimensions.ratioStr}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Modo</div>
                    <div className="text-xs font-black text-[#0F172A] truncate">
                      {fitMode === "cover" ? "Preencher" : "Caber"}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Mode Tabs & Parameter Controls */}
              <div className="lg:col-span-5 space-y-5">
                {/* Tabs */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 md:p-5 space-y-5">
                  <div className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMode("presets")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === "presets"
                          ? "bg-white text-[#0284C7] shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      Redes Sociais
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("pixels")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === "pixels"
                          ? "bg-white text-[#0284C7] shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      Por Pixels
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("percentage")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === "percentage"
                          ? "bg-white text-[#0284C7] shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      Porcentagem
                    </button>
                  </div>

                  {/* TAB 1: SOCIAL PRESETS */}
                  {mode === "presets" && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                        <span>Formatos Populares:</span>
                        <span className="text-[11px] text-[#0284C7] font-extrabold">Prévia instantânea</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SOCIAL_PRESETS.map((p) => {
                          const isSelected = selectedPresetId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPreset(p)}
                              className={`p-3 rounded-xl text-left border transition-all cursor-pointer relative group ${
                                isSelected
                                  ? "bg-[#E0F2FE]/50 border-[#0284C7] shadow-xs ring-2 ring-[#0284C7]/20"
                                  : "bg-white border-[#E2E8F0] hover:border-[#0284C7]/50 hover:bg-slate-50/80"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className={`font-black text-xs ${isSelected ? "text-[#0284C7]" : "text-[#0F172A]"}`}>
                                  {p.label}
                                </div>
                                {isSelected && (
                                  <div className="w-4 h-4 rounded-full bg-[#0284C7] text-white flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <div className="text-[11px] font-bold text-[#475569] mt-1">
                                {p.w} × {p.h} px
                              </div>
                              <div className="text-[10px] text-[#94A3B8] font-semibold">
                                {p.desc} • {p.ratioLabel}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PIXELS */}
                  {mode === "pixels" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#0F172A] block mb-1.5">
                            Largura (px):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            value={width}
                            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs md:text-sm font-bold text-[#0F172A] focus:outline-hidden focus:border-[#0284C7]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#0F172A] block mb-1.5">
                            Altura (px):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            value={height}
                            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs md:text-sm font-bold text-[#0F172A] focus:outline-hidden focus:border-[#0284C7]"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#334155] bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                        <input
                          type="checkbox"
                          checked={keepAspectRatio}
                          onChange={(e) => setKeepAspectRatio(e.target.checked)}
                          className="w-4 h-4 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
                        />
                        {keepAspectRatio ? (
                          <Lock className="w-3.5 h-3.5 text-[#0284C7]" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-[#94A3B8]" />
                        )}
                        <span>Manter proporção original da imagem</span>
                      </label>
                    </div>
                  )}

                  {/* TAB 3: PERCENTAGE */}
                  {mode === "percentage" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold text-[#0F172A]">
                        <span>Escala de Redução:</span>
                        <span className="text-[#0284C7] font-black">{percentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        step="5"
                        value={percentage}
                        onChange={(e) => setPercentage(parseInt(e.target.value))}
                        className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setPercentage(pct)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              percentage === pct
                                ? "bg-[#0284C7] text-white border-[#0284C7]"
                                : "bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      {activeImage && (
                        <div className="text-[11px] text-[#64748B] bg-white p-2.5 rounded-xl border border-[#E2E8F0] text-center font-semibold">
                          Resultado: <strong className="text-[#0F172A]">{targetDimensions.w} × {targetDimensions.h} px</strong> (aproximadamente {percentage}% do original {activeImage.width}×{activeImage.height})
                        </div>
                      )}
                    </div>
                  )}

                  {/* Export Format Selector */}
                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <label className="text-xs font-bold text-[#0F172A] block mb-2">
                      Formato de Exportação:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["original", "JPG", "PNG", "WEBP"] as (ImageOutputFormat | "original")[]).map(
                        (fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setFormat(fmt)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              format === fmt
                                ? "bg-[#0284C7] text-white border-[#0284C7] shadow-xs"
                                : "bg-white text-[#334155] border-[#E2E8F0] hover:bg-slate-50"
                            }`}
                          >
                            {fmt === "original" ? "Original" : fmt}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Action Submit Button */}
                <button
                  onClick={handleResizeAll}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    Redimensionar {images.length} {images.length === 1 ? "Imagem" : "Imagens"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isProcessing && (
        <ImageProgressV2 progress={progress} currentStepText={stepText} />
      )}
    </div>
  );
};
