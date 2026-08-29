import React, { useState } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Play,
  Trash2
} from "lucide-react";
import { ImageFileItem, ImageOutputFormat, ImageProcessResult } from "../types";
import { prepareImageFile, convertImage } from "../services/imageEngineV2";
import { ImageDropzoneV2 } from "../components/ImageDropzoneV2";
import { ImageProgressV2 } from "../components/ImageProgressV2";
import { ImageResultV2 } from "../components/ImageResultV2";
import { trackEventV2 } from "../../../integrations/analytics";

interface ImageConverterV2Props {
  onBack: () => void;
}

export const ImageConverterV2: React.FC<ImageConverterV2Props> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageOutputFormat>("WEBP");
  const [quality, setQuality] = useState<number>(0.85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [results, setResults] = useState<ImageProcessResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(err.message || "Erro ao carregar imagens selecionadas.");
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

  const handleConvertAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(5);
    setStepText(`Iniciando conversão de ${images.length} imagem(ns)...`);
    setErrorMessage(null);

    const outResults: ImageProcessResult[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setStepText(`Convertendo imagem ${i + 1} de ${images.length}: ${item.name}`);
        const result = await convertImage(item, targetFormat, quality);
        outResults.push(result);
        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      setResults(outResults);

      trackEventV2("image_conversion_completed", {
        output_format: targetFormat,
        file_count: images.length,
        quality: Math.round(quality * 100),
        app_version: "v2"
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro durante a conversão das imagens.");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasPngToJpg = images.some((img) => img.format === "PNG") && targetFormat === "JPG";

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
          title="Conversão de Imagens Concluída!"
          onReset={handleClearAll}
          zipFileName={`imagens-convertidas-${targetFormat.toLowerCase()}.zip`}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0F172A]">
              Converter Imagens
            </h2>
            <p className="text-xs md:text-sm text-[#64748B] mt-0.5">
              Converta fotos em lote entre JPG, PNG e WEBP com aceleração no seu navegador.
            </p>
          </div>
        </div>

        {/* Dropzone */}
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
                    {img.width} × {img.height} px
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

            {/* Conversion Controls */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#0F172A] block">
                  Formato de Saída Desejado:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["WEBP", "JPG", "PNG"] as ImageOutputFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setTargetFormat(fmt)}
                      className={`py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer border ${
                        targetFormat === fmt
                          ? "bg-[#0284C7] text-white border-[#0284C7] shadow-sm"
                          : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1]"
                      }`}
                    >
                      {fmt}
                      {fmt === "WEBP" && (
                        <span className="block text-[10px] font-normal opacity-90">
                          Mais leve para Web
                        </span>
                      )}
                      {fmt === "JPG" && (
                        <span className="block text-[10px] font-normal opacity-90">
                          Fotos e Câmeras
                        </span>
                      )}
                      {fmt === "PNG" && (
                        <span className="block text-[10px] font-normal opacity-90">
                          Com Transparência
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider (for JPG and WEBP) */}
              {targetFormat !== "PNG" ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[#0F172A]">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#0284C7]" />
                      Qualidade da Imagem:
                    </span>
                    <span className="text-[#0284C7] font-black">{Math.round(quality * 100)}%</span>
                  </div>

                  {/* Quality Presets */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Alta Qualidade", val: 0.85, tag: "85%" },
                      { label: "Equilibrado", val: 0.80, tag: "80% (Recomendado)" },
                      { label: "Arquivo Menor", val: 0.70, tag: "70%" }
                    ].map((p) => (
                      <button
                        key={p.tag}
                        type="button"
                        onClick={() => setQuality(p.val)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          Math.abs(quality - p.val) < 0.02
                            ? "bg-[#E0F2FE] text-[#0284C7] border-[#0284C7]"
                            : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
                        }`}
                      >
                        <div>{p.label}</div>
                        <div className="text-[9px] font-normal opacity-80">{p.tag}</div>
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                  />
                  <div className="flex justify-between text-[10px] text-[#94A3B8] font-bold">
                    <span>Menor tamanho (30%)</span>
                    <span>Recomendado (80%-85%)</span>
                    <span>Máxima qualidade (100%)</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 text-xs text-[#166534] flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <p>
                    <strong>Formato PNG (Sem Perdas):</strong> O PNG preserva transparência e nitidez máxima sem artefatos. Para economizar espaço mantendo transparência, você também pode usar o formato <strong>WebP</strong>.
                  </p>
                </div>
              )}

              {/* Recommendation Note */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-[11px] text-[#475569] flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>
                  <strong>Dica de Desempenho:</strong> Para reduzir o tamanho do arquivo mantendo ótima qualidade visual, recomendamos o formato <strong>WebP</strong>.
                </span>
              </div>

              {/* Transparency Notice */}
              {hasPngToJpg && (
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3.5 text-xs text-[#92400E] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <p>
                    <strong>Aviso de Transparência:</strong> O formato JPG não suporta fundo transparente. As áreas transparentes das suas imagens PNG serão preenchidas com fundo branco sólido.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Convert Action Button */}
            <button
              onClick={handleConvertAll}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Converter {images.length} {images.length === 1 ? "Imagem" : "Imagens"} para {targetFormat}</span>
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
