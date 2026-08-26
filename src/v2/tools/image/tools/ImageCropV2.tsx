import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Scissors,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  Crop as CropIcon,
  Maximize2
} from "lucide-react";
import { ImageFileItem, ImageProcessResult, AspectRatioOption, ImageOutputFormat, CropBox } from "../types";
import { prepareImageFile, cropImage, loadImageFromFile } from "../services/imageEngineV2";
import { ImageDropzoneV2 } from "../components/ImageDropzoneV2";
import { ImageProgressV2 } from "../components/ImageProgressV2";
import { ImageResultV2 } from "../components/ImageResultV2";
import { trackEventV2 } from "../../../integrations/analytics";

interface ImageCropV2Props {
  onBack: () => void;
}

export const ImageCropV2: React.FC<ImageCropV2Props> = ({ onBack }) => {
  const [item, setItem] = useState<ImageFileItem | null>(null);
  const [aspectOption, setAspectOption] = useState<AspectRatioOption>("free");
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });
  const [format, setFormat] = useState<ImageOutputFormat | "original">("original");

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImageProcessResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDims, setContainerDims] = useState<{ width: number; height: number }>({
    width: 600,
    height: 400
  });

  // State for dragging/resizing crop box on preview
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialBox, setInitialBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setErrorMessage(null);
    try {
      const prepared = await prepareImageFile(files[0]);
      setItem(prepared);
      // Initialize crop box to 80% centered
      const boxW = Math.round(prepared.width * 0.8);
      const boxH = Math.round(prepared.height * 0.8);
      const boxX = Math.round((prepared.width - boxW) / 2);
      const boxY = Math.round((prepared.height - boxH) / 2);
      setCropBox({ x: boxX, y: boxY, width: boxW, height: boxH });
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao carregar imagem.");
    }
  };

  const handleResetAll = () => {
    setItem(null);
    setResult(null);
    setErrorMessage(null);
  };

  const applyAspectRatio = (opt: AspectRatioOption) => {
    setAspectOption(opt);
    if (!item) return;

    let targetRatio: number | null = null;
    if (opt === "1:1") targetRatio = 1;
    if (opt === "16:9") targetRatio = 16 / 9;
    if (opt === "4:3") targetRatio = 4 / 3;
    if (opt === "9:16") targetRatio = 9 / 16;
    if (opt === "3:2") targetRatio = 3 / 2;

    if (targetRatio === null) return;

    let newW = cropBox.width;
    let newH = Math.round(newW / targetRatio);

    if (newH > item.height) {
      newH = item.height;
      newW = Math.round(newH * targetRatio);
    }
    if (newW > item.width) {
      newW = item.width;
      newH = Math.round(newW / targetRatio);
    }

    const newX = Math.max(0, Math.min(item.width - newW, cropBox.x));
    const newY = Math.max(0, Math.min(item.height - newH, cropBox.y));

    setCropBox({ x: newX, y: newY, width: newW, height: newH });
  };

  const handleCrop = async () => {
    if (!item) return;
    setIsProcessing(true);
    setProgress(30);
    setErrorMessage(null);

    try {
      setProgress(60);
      const cropped = await cropImage(item, cropBox, format, 0.95);
      setProgress(100);
      setResult(cropped);

      trackEventV2("image_crop_completed", {
        app_version: "v2"
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao recortar imagem.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Compute scale between displayed preview and actual natural image dimensions
  const scale = item && containerDims.width > 0 ? containerDims.width / item.width : 1;

  if (result) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleResetAll}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Recortar Outra Imagem</span>
        </button>
        <ImageResultV2
          results={[result]}
          title="Recorte Realizado com Sucesso!"
          onReset={handleResetAll}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Ferramentas de Imagem</span>
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0F172A]">
              Cortar Imagem
            </h2>
            <p className="text-xs md:text-sm text-[#64748B] mt-0.5">
              Enquadre fotos com proporções exatas (1:1, 16:9, 9:16) ou recorte livremente com precisão.
            </p>
          </div>
        </div>

        {!item ? (
          <ImageDropzoneV2 onFilesSelected={handleFileSelected} multiple={false} />
        ) : (
          <div className="space-y-6">
            {/* Aspect Ratio Toolbar */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#0F172A] mr-1">Proporção:</span>
                {(
                  [
                    { id: "free", label: "Livre" },
                    { id: "1:1", label: "1:1 (Quadrado)" },
                    { id: "16:9", label: "16:9 (Widescreen)" },
                    { id: "4:3", label: "4:3 (Padrão)" },
                    { id: "9:16", label: "9:16 (Stories)" },
                    { id: "3:2", label: "3:2 (Foto)" }
                  ] as { id: AspectRatioOption; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => applyAspectRatio(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      aspectOption === opt.id
                        ? "bg-[#0284C7] text-white shadow-xs"
                        : "bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="text-xs font-bold text-[#0284C7] bg-[#E0F2FE] px-3 py-1 rounded-full">
                Saída: {Math.round(cropBox.width)} × {Math.round(cropBox.height)} px
              </div>
            </div>

            {/* Interactive Visual Canvas Area */}
            <div
              ref={containerRef}
              className="bg-[#0F172A] rounded-2xl overflow-hidden relative flex items-center justify-center min-h-[380px] select-none p-4"
            >
              <div className="relative inline-block max-w-full max-h-[500px]">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  onLoad={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setContainerDims({ width: rect.width, height: rect.height });
                  }}
                  className="max-w-full max-h-[500px] object-contain block opacity-70"
                />

                {/* Crop Box Overlay */}
                <div
                  style={{
                    position: "absolute",
                    left: `${(cropBox.x / item.width) * 100}%`,
                    top: `${(cropBox.y / item.height) * 100}%`,
                    width: `${(cropBox.width / item.width) * 100}%`,
                    height: `${(cropBox.height / item.height) * 100}%`,
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)"
                  }}
                  className="border-2 border-white cursor-move pointer-events-auto"
                >
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Corner Anchors */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-[#0284C7] rounded-full" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-[#0284C7] rounded-full" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-[#0284C7] rounded-full" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[#0284C7] rounded-full" />
                </div>
              </div>
            </div>

            {/* Range controls for easy precise adjustments */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-1">
                    <span>Posição Horizontal (X):</span>
                    <span>{Math.round(cropBox.x)} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, item.width - cropBox.width)}
                    value={cropBox.x}
                    onChange={(e) =>
                      setCropBox((prev) => ({ ...prev, x: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-1">
                    <span>Posição Vertical (Y):</span>
                    <span>{Math.round(cropBox.y)} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, item.height - cropBox.height)}
                    value={cropBox.y}
                    onChange={(e) =>
                      setCropBox((prev) => ({ ...prev, y: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-1">
                  <span>Zoom / Largura do Recorte:</span>
                  <span>{Math.round(cropBox.width)} px</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max={item.width}
                  value={cropBox.width}
                  onChange={(e) => {
                    const newW = parseInt(e.target.value) || 50;
                    let newH = cropBox.height;
                    if (aspectOption === "1:1") newH = newW;
                    else if (aspectOption === "16:9") newH = Math.round((newW * 9) / 16);
                    else if (aspectOption === "4:3") newH = Math.round((newW * 3) / 4);
                    else if (aspectOption === "9:16") newH = Math.round((newW * 16) / 9);
                    else if (aspectOption === "3:2") newH = Math.round((newW * 2) / 3);

                    if (newH <= item.height) {
                      setCropBox((prev) => ({
                        ...prev,
                        width: newW,
                        height: newH,
                        x: Math.min(prev.x, item.width - newW),
                        y: Math.min(prev.y, item.height - newH)
                      }));
                    }
                  }}
                  className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCrop}
                disabled={isProcessing}
                className="flex-1 py-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Scissors className="w-4 h-4" />
                <span>Aplicar Recorte e Exportar</span>
              </button>

              <button
                onClick={handleResetAll}
                className="px-5 py-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] font-bold text-xs md:text-sm cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {isProcessing && (
        <ImageProgressV2 progress={progress} currentStepText="Processando recorte de imagem..." />
      )}
    </div>
  );
};
