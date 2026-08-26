import React, { useState } from "react";
import {
  ArrowLeft,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Rotate3D,
  Play,
  Trash2,
  Sparkles,
  Undo2
} from "lucide-react";
import { ImageFileItem, ImageProcessResult, RotateFlipState } from "../types";
import { prepareImageFile, rotateFlipImage } from "../services/imageEngineV2";
import { ImageDropzoneV2 } from "../components/ImageDropzoneV2";
import { ImageProgressV2 } from "../components/ImageProgressV2";
import { ImageResultV2 } from "../components/ImageResultV2";
import { trackEventV2 } from "../../../integrations/analytics";

interface ImageRotateV2Props {
  onBack: () => void;
}

export const ImageRotateV2: React.FC<ImageRotateV2Props> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [state, setState] = useState<RotateFlipState>({
    rotation: 0,
    flipH: false,
    flipV: false
  });

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
      setErrorMessage(err.message || "Erro ao carregar imagens.");
    }
  };

  const handleRotateCW = () => {
    setState((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  const handleRotateCCW = () => {
    setState((prev) => ({ ...prev, rotation: (prev.rotation - 90 + 360) % 360 }));
  };

  const handleFlipH = () => {
    setState((prev) => ({ ...prev, flipH: !prev.flipH }));
  };

  const handleFlipV = () => {
    setState((prev) => ({ ...prev, flipV: !prev.flipV }));
  };

  const handleResetTransform = () => {
    setState({ rotation: 0, flipH: false, flipV: false });
  };

  const handleClearAll = () => {
    setImages([]);
    setResults([]);
    handleResetTransform();
    setErrorMessage(null);
  };

  const handleProcessAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(5);
    setStepText(`Ajustando rotação e espelhamento de ${images.length} imagem(ns)...`);
    setErrorMessage(null);

    const outResults: ImageProcessResult[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setStepText(`Processando ${i + 1} de ${images.length}: ${item.name}`);
        const res = await rotateFlipImage(item, state);
        outResults.push(res);
        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      setResults(outResults);

      trackEventV2("image_rotate_completed", {
        rotation: state.rotation,
        flip_h: state.flipH,
        flip_v: state.flipV,
        file_count: images.length,
        app_version: "v2"
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro durante a rotação.");
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
          title="Ajuste de Rotação Concluído!"
          onReset={handleClearAll}
          zipFileName="imagens-giradas.zip"
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
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0F172A]">
              Girar e Inverter Imagens
            </h2>
            <p className="text-xs md:text-sm text-[#64748B] mt-0.5">
              Corrija a orientação de fotos de celular e espelhe imagens horizontalmente ou verticalmente em lote.
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

            {/* Transform Controls Toolbar */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex flex-wrap items-center justify-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRotateCCW}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0284C7] text-xs font-bold text-[#334155] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4 text-[#0284C7]" />
                  <span>90° Esquerda</span>
                </button>

                <button
                  type="button"
                  onClick={handleRotateCW}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0284C7] text-xs font-bold text-[#334155] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <RotateCw className="w-4 h-4 text-[#0284C7]" />
                  <span>90° Direita</span>
                </button>

                <button
                  type="button"
                  onClick={handleFlipH}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    state.flipH
                      ? "bg-[#0284C7] text-white border-[#0284C7]"
                      : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#0284C7] shadow-xs"
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>Espelhar H</span>
                </button>

                <button
                  type="button"
                  onClick={handleFlipV}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    state.flipV
                      ? "bg-[#0284C7] text-white border-[#0284C7]"
                      : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#0284C7] shadow-xs"
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  <span>Espelhar V</span>
                </button>
              </div>

              {(state.rotation !== 0 || state.flipH || state.flipV) && (
                <button
                  type="button"
                  onClick={handleResetTransform}
                  className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Redefinir</span>
                </button>
              )}
            </div>

            {/* Live Interactive Preview */}
            <div className="bg-[#0F172A] rounded-2xl p-6 min-h-[340px] flex items-center justify-center overflow-hidden">
              <div
                style={{
                  transform: `rotate(${state.rotation}deg) scale(${state.flipH ? -1 : 1}, ${
                    state.flipV ? -1 : 1
                  })`,
                  transition: "transform 0.25s ease-out"
                }}
                className="max-w-[480px] max-h-[380px] flex items-center justify-center"
              >
                <img
                  src={images[0].previewUrl}
                  alt={images[0].name}
                  className="max-w-full max-h-[360px] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleProcessAll}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Salvar e Baixar {images.length} {images.length === 1 ? "Imagem" : "Imagens"}</span>
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
