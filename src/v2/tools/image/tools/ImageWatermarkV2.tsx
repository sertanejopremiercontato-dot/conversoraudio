import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Type,
  Image as ImageIcon,
  Play,
  Trash2,
  Move,
  RotateCcw,
  Upload,
  Layers,
  Sparkles,
  Check,
  Eye
} from "lucide-react";
import {
  ImageFileItem,
  ImageProcessResult,
  WatermarkConfig,
  WatermarkPosition,
  ImageOutputFormat
} from "../types";
import { prepareImageFile, applyWatermark, getPositionCoords } from "../services/imageEngineV2";
import { ImageDropzoneV2 } from "../components/ImageDropzoneV2";
import { ImageProgressV2 } from "../components/ImageProgressV2";
import { ImageResultV2 } from "../components/ImageResultV2";
import { trackEventV2 } from "../../../integrations/analytics";

interface ImageWatermarkV2Props {
  onBack: () => void;
}

const POSITIONS: { id: WatermarkPosition; label: string; short: string }[] = [
  { id: "top-left", label: "Superior Esquerdo", short: "Top Esq" },
  { id: "top-center", label: "Superior Centro", short: "Top Cent" },
  { id: "top-right", label: "Superior Direito", short: "Top Dir" },
  { id: "center-left", label: "Centro Esquerdo", short: "Cent Esq" },
  { id: "center", label: "Centro Total", short: "Centro" },
  { id: "center-right", label: "Centro Direito", short: "Cent Dir" },
  { id: "bottom-left", label: "Inferior Esquerdo", short: "Inf Esq" },
  { id: "bottom-center", label: "Inferior Centro", short: "Inf Cent" },
  { id: "bottom-right", label: "Inferior Direito", short: "Inf Dir" }
];

export const ImageWatermarkV2: React.FC<ImageWatermarkV2Props> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const [config, setConfig] = useState<WatermarkConfig>({
    type: "text",
    text: {
      text: "MultiConverte Protegido",
      fontSize: 48,
      color: "#FFFFFF",
      opacity: 0.8,
      position: "bottom-right",
      isTiled: false,
      offsetX: 0,
      offsetY: 0
    },
    logo: {
      scalePercent: 30,
      opacity: 0.85,
      position: "bottom-right",
      isTiled: false,
      logoWidth: 0,
      logoHeight: 0,
      offsetX: 0,
      offsetY: 0
    },
    format: "original",
    quality: 0.95
  });

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  // Canvas preview ref & interactive drag state
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

  // Handle image upload
  const handleFilesSelected = async (files: File[]) => {
    setErrorMessage(null);
    try {
      const items: ImageFileItem[] = [];
      for (const file of files) {
        const item = await prepareImageFile(file);
        items.push(item);
      }
      setImages((prev) => [...prev, ...items]);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao carregar imagens.");
    }
  };

  // Handle Logo Upload
  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setLogoPreviewUrl(url);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        logoImgRef.current = img;
        setConfig((prev) => ({
          ...prev,
          logo: {
            ...prev.logo,
            logoFile: file,
            logoUrl: url,
            logoWidth: img.naturalWidth,
            logoHeight: img.naturalHeight
          }
        }));
      };
      img.src = url;
    }
  };

  const handleClearAll = () => {
    setImages([]);
    setActiveIndex(0);
    setResults([]);
    setErrorMessage(null);
  };

  const handleResetPosition = () => {
    if (config.type === "text") {
      setConfig((prev) => ({
        ...prev,
        text: { ...prev.text, offsetX: 0, offsetY: 0 }
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        logo: { ...prev.logo, offsetX: 0, offsetY: 0 }
      }));
    }
  };

  const handleCenterPosition = () => {
    if (config.type === "text") {
      setConfig((prev) => ({
        ...prev,
        text: { ...prev.text, position: "center", offsetX: 0, offsetY: 0 }
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        logo: { ...prev.logo, position: "center", offsetX: 0, offsetY: 0 }
      }));
    }
  };

  // Render Real-time WYSIWYG Preview on Canvas
  useEffect(() => {
    if (!activeImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = activeImage.previewUrl;

    baseImg.onload = () => {
      const maxDim = 900;
      let canvasW = baseImg.naturalWidth;
      let canvasH = baseImg.naturalHeight;

      if (canvasW > maxDim || canvasH > maxDim) {
        if (canvasW >= canvasH) {
          canvasH = Math.round((maxDim * canvasH) / canvasW);
          canvasW = maxDim;
        } else {
          canvasW = Math.round((maxDim * canvasW) / canvasH);
          canvasH = maxDim;
        }
      }

      canvas.width = canvasW;
      canvas.height = canvasH;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw background checkerboard for transparent photos
      const tileSize = 16;
      for (let x = 0; x < canvasW; x += tileSize) {
        for (let y = 0; y < canvasH; y += tileSize) {
          ctx.fillStyle = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 ? "#F8FAFC" : "#EDF2F7";
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }

      // Draw active image
      ctx.drawImage(baseImg, 0, 0, canvasW, canvasH);

      // Render Text Watermark
      if (config.type === "text" && config.text.text.trim()) {
        const { text, fontSize, color, opacity, position, isTiled, offsetX = 0, offsetY = 0 } = config.text;
        const previewFontSize = Math.max(12, Math.round(fontSize * (canvasW / 1000)));

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.font = `bold ${previewFontSize}px sans-serif`;
        ctx.textBaseline = "top";

        // Add subtle shadow for visibility against light/dark photos
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        if (isTiled) {
          const textMetrics = ctx.measureText(text);
          const textW = textMetrics.width;
          const textH = previewFontSize;
          const stepX = textW + previewFontSize * 2.5;
          const stepY = textH + previewFontSize * 3;

          ctx.rotate((-30 * Math.PI) / 180);
          const diagonal = Math.sqrt(canvasW * canvasW + canvasH * canvasH);
          for (let x = -diagonal; x < diagonal * 1.5; x += stepX) {
            for (let y = -diagonal; y < diagonal * 1.5; y += stepY) {
              ctx.fillText(text, x, y);
            }
          }
        } else {
          const textMetrics = ctx.measureText(text);
          const textW = textMetrics.width;
          const textH = previewFontSize;
          const { x, y } = getPositionCoords(position, canvasW, canvasH, textW, textH, 20, offsetX, offsetY);
          ctx.fillText(text, x, y);
        }
        ctx.restore();
      }

      // Render Logo Watermark
      if (config.type === "logo" && logoPreviewUrl) {
        const renderLogo = (logo: HTMLImageElement) => {
          const scale = config.logo.scalePercent / 100;
          const baseTargetW = canvasW * 0.4 * scale;
          const logoAspect = logo.naturalWidth / logo.naturalHeight;
          const logoTargetW = Math.max(20, baseTargetW);
          const logoTargetH = logoTargetW / logoAspect;

          ctx.save();
          ctx.globalAlpha = config.logo.opacity;

          if (config.logo.isTiled) {
            const stepX = logoTargetW + 60;
            const stepY = logoTargetH + 60;
            ctx.rotate((-30 * Math.PI) / 180);
            const diagonal = Math.sqrt(canvasW * canvasW + canvasH * canvasH);
            for (let x = -diagonal; x < diagonal * 1.5; x += stepX) {
              for (let y = -diagonal; y < diagonal * 1.5; y += stepY) {
                ctx.drawImage(logo, x, y, logoTargetW, logoTargetH);
              }
            }
          } else {
            const { offsetX = 0, offsetY = 0 } = config.logo;
            const { x, y } = getPositionCoords(
              config.logo.position,
              canvasW,
              canvasH,
              logoTargetW,
              logoTargetH,
              20,
              offsetX,
              offsetY
            );
            ctx.drawImage(logo, x, y, logoTargetW, logoTargetH);
          }
          ctx.restore();
        };

        if (logoImgRef.current && logoImgRef.current.complete) {
          renderLogo(logoImgRef.current);
        } else {
          const logo = new Image();
          logo.crossOrigin = "anonymous";
          logo.onload = () => {
            logoImgRef.current = logo;
            renderLogo(logo);
          };
          logo.src = logoPreviewUrl;
        }
      }
    };
  }, [activeImage, config, logoPreviewUrl]);

  // Pointer dragging handlers for intuitive positioning
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const isTiled = config.type === "text" ? config.text.isTiled : config.logo.isTiled;
    if (isTiled || !canvasRef.current) return;

    canvasRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const currentOffset =
      config.type === "text"
        ? { x: config.text.offsetX || 0, y: config.text.offsetY || 0 }
        : { x: config.logo.offsetX || 0, y: config.logo.offsetY || 0 };

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: currentOffset.x,
      startOffsetY: currentOffset.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const rect = canvasRef.current.getBoundingClientRect();
    const sensitivity = 2.0;

    const newOffsetX = Math.max(-1, Math.min(1, dragStartRef.current.startOffsetX + (deltaX / rect.width) * sensitivity));
    const newOffsetY = Math.max(-1, Math.min(1, dragStartRef.current.startOffsetY + (deltaY / rect.height) * sensitivity));

    if (config.type === "text") {
      setConfig((prev) => ({
        ...prev,
        text: { ...prev.text, offsetX: newOffsetX, offsetY: newOffsetY }
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        logo: { ...prev.logo, offsetX: newOffsetX, offsetY: newOffsetY }
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging && canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch (_) {}
      setIsDragging(false);
    }
  };

  // Perform Real Batch / Single Image Watermarking
  const handleProcessAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(5);
    setStepText(`Aplicando marca d'água visual em ${images.length} imagem(ns)...`);
    setErrorMessage(null);

    const outResults: ImageProcessResult[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setStepText(`Processando foto ${i + 1} de ${images.length}: ${item.name}`);
        const res = await applyWatermark(item, config);
        outResults.push(res);
        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      setResults(outResults);

      trackEventV2("image_watermark_completed", {
        type: config.type,
        file_count: images.length,
        app_version: "v2"
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro ao aplicar a marca d'água.");
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
          <span>Voltar para Marca d'Água</span>
        </button>
        <ImageResultV2
          results={results}
          title="Marca d'Água Aplicada com Sucesso!"
          onReset={handleClearAll}
          zipFileName="imagens-protegidas.zip"
        />
      </div>
    );
  }

  const isTiledActive = config.type === "text" ? config.text.isTiled : !!config.logo.isTiled;
  const currentPosition = config.type === "text" ? config.text.position : config.logo.position;

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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0F172A]">
              Marca d’Água em Imagens
            </h2>
            <p className="text-xs md:text-sm text-[#64748B] mt-0.5">
              Prévia visual em tempo real: posicione textos, logotipos, ajuste opacidade e proteja suas fotos com alta definição.
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
                  {images.length} {images.length === 1 ? "foto selecionada" : "fotos selecionadas"}
                </span>
                {images.length > 1 && (
                  <span className="text-[11px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                    Visualizando: {activeImage?.name}
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
              {/* LEFT COLUMN: Large Real WYSIWYG Preview */}
              <div className="lg:col-span-7 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#0284C7]" />
                    <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                      Prévia da Marca d’Água
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-[#0284C7] text-white text-[10px] font-extrabold shadow-xs">
                    {activeImage ? `${activeImage.width} × ${activeImage.height} px` : "Prévia Real"}
                  </div>
                </div>

                {/* Canvas Container */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900/5 flex items-center justify-center p-3 min-h-[380px] max-h-[480px]">
                  <div className="relative max-w-full max-h-[440px] flex items-center justify-center shadow-lg rounded-xl overflow-hidden bg-white border border-[#CBD5E1]">
                    <canvas
                      ref={canvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      className={`w-full h-full max-h-[440px] object-contain transition-transform ${
                        !isTiledActive ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
                      }`}
                    />

                    {/* Drag Hint Overlay */}
                    {!isTiledActive && !isDragging && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/50 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs pointer-events-none opacity-80">
                        <Move className="w-3 h-3" />
                        <span>Arraste para reposicionar</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Positioning Quick Actions */}
                {!isTiledActive && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#64748B] font-semibold">
                      Posição atual: <strong className="text-[#0F172A]">{currentPosition.replace("-", " ")}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCenterPosition}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#334155] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Move className="w-3 h-3 text-[#0284C7]" />
                        <span>Centralizar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPosition}
                        title="Redefinir posição"
                        className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#334155] text-xs font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Spec Bar below preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E2E8F0] text-center">
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Tipo</div>
                    <div className="text-xs font-black text-[#0F172A] capitalize">
                      {config.type === "text" ? "Texto" : "Logotipo"}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Opacidade</div>
                    <div className="text-xs font-black text-[#0284C7]">
                      {Math.round((config.type === "text" ? config.text.opacity : config.logo.opacity) * 100)}%
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Padrão</div>
                    <div className="text-xs font-black text-[#0F172A]">
                      {isTiledActive ? "Diagonal" : "Único"}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Saída</div>
                    <div className="text-xs font-black text-[#0F172A] uppercase">
                      {config.format === "original" ? "Original" : config.format}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Mode Selector & Configuration Controls */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 md:p-5 space-y-5">
                  {/* Type Selector (Text / Logo) */}
                  <div className="grid grid-cols-2 gap-1 bg-slate-200/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, type: "text" }))}
                      className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        config.type === "text"
                          ? "bg-white text-[#0284C7] shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      <span>Marca de Texto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, type: "logo" }))}
                      className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        config.type === "logo"
                          ? "bg-white text-[#0284C7] shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Logotipo / Imagem</span>
                    </button>
                  </div>

                  {/* TAB 1: TEXT WATERMARK CONTROLS */}
                  {config.type === "text" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[#0F172A] block mb-1.5">
                          Texto da Marca d’Água:
                        </label>
                        <input
                          type="text"
                          value={config.text.text}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              text: { ...prev.text, text: e.target.value }
                            }))
                          }
                          placeholder="Ex: @seunome ou © Sua Empresa"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs md:text-sm font-bold text-[#0F172A] focus:outline-hidden focus:border-[#0284C7]"
                        />
                      </div>

                      {/* Font Size & Opacity */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-1">
                            <span>Tamanho da Fonte:</span>
                            <span className="text-[#0284C7] font-black">{config.text.fontSize} px</span>
                          </div>
                          <input
                            type="range"
                            min="16"
                            max="140"
                            value={config.text.fontSize}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                text: { ...prev.text, fontSize: parseInt(e.target.value) || 24 }
                              }))
                            }
                            className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-1">
                            <span>Opacidade:</span>
                            <span className="text-[#0284C7] font-black">{Math.round(config.text.opacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={config.text.opacity}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                text: { ...prev.text, opacity: parseFloat(e.target.value) }
                              }))
                            }
                            className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                          />
                        </div>

                        {/* Color Picker */}
                        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                          <label className="text-xs font-bold text-[#0F172A]">
                            Cor do Texto:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.text.color}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  text: { ...prev.text, color: e.target.value }
                                }))
                              }
                              className="w-8 h-8 rounded-lg border border-[#CBD5E1] cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-[#475569]">
                              {config.text.color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Diagonal Repeat Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-[#334155] bg-white p-3 rounded-xl border border-[#E2E8F0]">
                        <input
                          type="checkbox"
                          checked={config.text.isTiled}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              text: { ...prev.text, isTiled: e.target.checked }
                            }))
                          }
                          className="w-4 h-4 mt-0.5 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
                        />
                        <div>
                          <span>Repetir em padrão diagonal por toda a foto</span>
                          <p className="text-[10px] text-[#94A3B8] font-normal mt-0.5">
                            Proteção anti-cópia total em 30 graus
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    /* TAB 2: LOGO WATERMARK CONTROLS */
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[#0F172A] block mb-1.5">
                          Arquivo do Logotipo (PNG com transparência recomendado):
                        </label>
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#CBD5E1] hover:border-[#0284C7] bg-white rounded-xl cursor-pointer transition-colors group">
                          <Upload className="w-6 h-6 text-[#94A3B8] group-hover:text-[#0284C7] mb-1 transition-colors" />
                          <span className="text-xs font-bold text-[#0F172A]">
                            {config.logo.logoFile ? config.logo.logoFile.name : "Selecionar Logotipo"}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] mt-0.5">PNG, WEBP ou JPG</span>
                          <input
                            type="file"
                            accept="image/png,image/webp,image/jpeg"
                            onChange={handleLogoSelected}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {logoPreviewUrl && (
                        <div className="flex items-center gap-3 p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                          <img src={logoPreviewUrl} alt="Logo" className="w-10 h-10 object-contain rounded-md bg-slate-100 p-1" />
                          <div className="text-left">
                            <span className="text-xs font-bold text-[#16A34A] block">
                              Logotipo carregado com sucesso
                            </span>
                            <span className="text-[10px] text-[#94A3B8]">
                              {config.logo.logoWidth} × {config.logo.logoHeight} px
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Scale & Opacity */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-1">
                            <span>Tamanho / Escala do Logotipo:</span>
                            <span className="text-[#0284C7] font-black">{config.logo.scalePercent}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={config.logo.scalePercent}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                logo: { ...prev.logo, scalePercent: parseInt(e.target.value) || 30 }
                              }))
                            }
                            className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-1">
                            <span>Opacidade do Logotipo:</span>
                            <span className="text-[#0284C7] font-black">{Math.round(config.logo.opacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={config.logo.opacity}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                logo: { ...prev.logo, opacity: parseFloat(e.target.value) }
                              }))
                            }
                            className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                          />
                        </div>
                      </div>

                      {/* Diagonal Repeat for Logo */}
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-[#334155] bg-white p-3 rounded-xl border border-[#E2E8F0]">
                        <input
                          type="checkbox"
                          checked={!!config.logo.isTiled}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              logo: { ...prev.logo, isTiled: e.target.checked }
                            }))
                          }
                          className="w-4 h-4 mt-0.5 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
                        />
                        <div>
                          <span>Repetir logotipo em padrão diagonal</span>
                          <p className="text-[10px] text-[#94A3B8] font-normal mt-0.5">
                            Cobrir a imagem inteira com marca d'água contínua
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* 9-Point Grid Position Selector (Shown if not tiled) */}
                  {!isTiledActive && (
                    <div className="space-y-2 pt-3 border-t border-[#E2E8F0]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#0F172A]">
                          Posição na Imagem:
                        </label>
                        <span className="text-[10px] text-[#0284C7] font-extrabold">9 Pontos</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                        {POSITIONS.map((pos) => {
                          const isSelected = currentPosition === pos.id;
                          return (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => {
                                if (config.type === "text") {
                                  setConfig((prev) => ({
                                    ...prev,
                                    text: { ...prev.text, position: pos.id, offsetX: 0, offsetY: 0 }
                                  }));
                                } else {
                                  setConfig((prev) => ({
                                    ...prev,
                                    logo: { ...prev.logo, position: pos.id, offsetX: 0, offsetY: 0 }
                                  }));
                                }
                              }}
                              className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#0284C7] text-white border-[#0284C7] shadow-xs"
                                  : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-slate-100"
                              }`}
                            >
                              {pos.short}
                            </button>
                          );
                        })}
                      </div>
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
                            onClick={() => setConfig((prev) => ({ ...prev, format: fmt }))}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              config.format === fmt
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
                  onClick={handleProcessAll}
                  disabled={isProcessing || (config.type === "logo" && !config.logo.logoFile && !logoPreviewUrl)}
                  className="w-full py-4 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    Aplicar Marca d'Água em {images.length} {images.length === 1 ? "Imagem" : "Imagens"}
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
