import React, { useState } from "react";
import {
  ArrowLeft,
  Minimize2,
  Sliders,
  Sparkles,
  Play,
  Trash2,
  TrendingDown
} from "lucide-react";
import { ImageFileItem, ImageProcessResult } from "../types";
import { prepareImageFile, compressImage } from "../services/imageEngineV2";
import { ImageDropzoneV2 } from "../components/ImageDropzoneV2";
import { ImageProgressV2 } from "../components/ImageProgressV2";
import { ImageResultV2 } from "../components/ImageResultV2";
import { trackEventV2 } from "../../../integrations/analytics";

interface ImageCompressV2Props {
  onBack: () => void;
}

export const ImageCompressV2: React.FC<ImageCompressV2Props> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [preset, setPreset] = useState<"balanced" | "high" | "max" | "custom">("balanced");
  const [customQuality, setCustomQuality] = useState<number>(0.75);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [results, setResults] = useState<ImageProcessResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getEffectiveQuality = (): number => {
    if (preset === "high") return 0.88;
    if (preset === "balanced") return 0.75;
    if (preset === "max") return 0.55;
    return customQuality;
  };

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
      setErrorMessage(err.message || "Erro ao carregar fotos.");
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleClearAll = () => {
    setImages([]);
    setResults([]);
    setErrorMessage(null);
  };

  const handleCompressAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(5);
    setStepText(`Iniciando compressão inteligente de ${images.length} imagem(ns)...`);
    setErrorMessage(null);

    const outResults: ImageProcessResult[] = [];
    const quality = getEffectiveQuality();

    try {
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setStepText(`Comprimindo imagem ${i + 1} de ${images.length}: ${item.name}`);
        const result = await compressImage(item, quality);
        outResults.push(result);
        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      setResults(outResults);

      const totalOrig = outResults.reduce((acc, r) => acc + r.originalSize, 0);
      const totalFin = outResults.reduce((acc, r) => acc + r.finalSize, 0);
      const savedBytes = Math.max(0, totalOrig - totalFin);
      const savedPercent = totalOrig > 0 ? Math.round((savedBytes / totalOrig) * 100) : 0;

      trackEventV2("image_compression_completed", {
        file_count: images.length,
        quality: Math.round(quality * 100),
        savings_percent: savedPercent,
        app_version: "v2"
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro durante a compressão das imagens.");
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
          <span>Voltar para Seleção</span>
        </button>
        <ImageResultV2
          results={results}
          title="Compressão Concluída!"
          onReset={handleClearAll}
          zipFileName="imagens-otimizadas.zip"
          isCompression={true}
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
            <Minimize2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0F172A]">
              Comprimir Imagens
            </h2>
            <p className="text-xs md:text-sm text-[#64748B] mt-0.5">
              Reduza o tamanho em KB/MB das suas imagens mantendo a nitidez e dimensões intactas.
            </p>
          </div>
        </div>

        {images.length === 0 ? (
          <ImageDropzoneV2 onFilesSelected={handleFilesSelected} multiple={true} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">
                {images.length} {images.length === 1 ? "foto selecionada" : "fotos selecionadas"}
              </span>
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar lista</span>
              </button>
            </div>

            {/* List of images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[340px] overflow-y-auto p-1">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 relative group flex flex-col justify-between"
                >
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-[#E2E8F0] mb-2 relative">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      {img.format}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[#0F172A] truncate" title={img.name}>
                    {img.name}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    {(img.size / 1024).toFixed(1)} KB
                  </div>
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remover imagem"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <ImageDropzoneV2 onFilesSelected={handleFilesSelected} multiple={true} isCompact={true} />

            {/* Preset Selection */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-6">
              <label className="text-xs font-bold text-[#0F172A] block">
                Nível de Otimização:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPreset("balanced")}
                  className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
                    preset === "balanced"
                      ? "bg-[#0284C7] text-white border-[#0284C7] shadow-sm"
                      : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="font-bold text-xs md:text-sm">Equilibrado (Recomendado)</div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Redução de até 70% sem alteração visual perceptível.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPreset("high")}
                  className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
                    preset === "high"
                      ? "bg-[#0284C7] text-white border-[#0284C7] shadow-sm"
                      : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="font-bold text-xs md:text-sm">Alta Qualidade</div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Foco na nitidez máxima com otimização leve de bytes.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPreset("max")}
                  className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
                    preset === "max"
                      ? "bg-[#0284C7] text-white border-[#0284C7] shadow-sm"
                      : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="font-bold text-xs md:text-sm">Máxima Redução</div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Menor tamanho possível de arquivo para envios rápidos.
                  </div>
                </button>
              </div>

              {/* Slider for custom mode */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <div className="flex justify-between items-center text-xs font-bold text-[#0F172A] mb-2">
                  <span>Ajuste Fino de Qualidade:</span>
                  <span className="text-[#0284C7] font-black">
                    {Math.round(getEffectiveQuality() * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={getEffectiveQuality()}
                  onChange={(e) => {
                    setPreset("custom");
                    setCustomQuality(parseFloat(e.target.value));
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

            {/* Compress Action Button */}
            <button
              onClick={handleCompressAll}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Comprimir {images.length} {images.length === 1 ? "Imagem" : "Imagens"}</span>
            </button>
          </div>
        )}
      </div>

      {isProcessing && (
        <ImageProgressV2 progress={progress} currentStepText={stepText} />
      )}
    </div>
  );
};
