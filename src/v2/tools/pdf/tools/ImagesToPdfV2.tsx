import React, { useState } from "react";
import { ArrowLeft, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2, AlertCircle } from "lucide-react";
import { PdfDropzoneV2 } from "../components/PdfDropzoneV2";
import { PdfProgressV2 } from "../components/PdfProgressV2";
import { PdfResultV2 } from "../components/PdfResultV2";
import { PdfEngineV2 } from "../services/pdfEngineV2";
import { ImagesToPdfConfigV2, PdfFileItemV2, PdfResultDataV2 } from "../types";
import { trackEventV2 } from "../../../integrations/analytics";

interface ImagesToPdfV2Props {
  onBack: () => void;
}

export const ImagesToPdfV2: React.FC<ImagesToPdfV2Props> = ({ onBack }) => {
  const [images, setImages] = useState<PdfFileItemV2[]>([]);
  const [config, setConfig] = useState<ImagesToPdfConfigV2>({
    pageSize: "a4",
    orientation: "auto",
    margin: "small",
    quality: "high"
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [result, setResult] = useState<PdfResultDataV2 | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImagesAdded = (newFiles: File[]) => {
    const validImages = newFiles.filter(
      (f) =>
        f.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)
    );

    if (validImages.length === 0) {
      setErrorMessage("Por favor, selecione arquivos de imagem válidos (JPG, PNG, WEBP, etc.).");
      return;
    }

    const items: PdfFileItemV2[] = validImages.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file)
    }));

    setImages((prev) => [...prev, ...items]);
    setErrorMessage(null);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setImages(updated);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleStartConvert = async () => {
    if (images.length === 0) {
      setErrorMessage("Adicione pelo menos uma imagem para gerar o PDF.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      const output = await PdfEngineV2.convertImagesToPdf(
        images.map((img) => img.file),
        config,
        (pct, text) => {
          setProgress(pct);
          setStepText(text);
        }
      );

      const downloadUrl = URL.createObjectURL(output.blob);
      setResult({
        blob: output.blob,
        fileName: `fotos-em-pdf-${Date.now()}.pdf`,
        finalSize: output.size,
        pageCount: output.pageCount,
        downloadUrl
      });

      trackEventV2("images_to_pdf_completed", {
        image_count: images.length,
        page_size: config.pageSize,
        orientation: config.orientation,
        app_version: "v2"
      });
    } catch (err: any) {
      console.error("Erro ao converter imagens para PDF:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao transformar imagens em PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setResult(null);
    setImages([]);
    setProgress(0);
    setStepText("");
    setErrorMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Hub PDF</span>
        </button>

        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Imagens para PDF</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Transforme fotos e capturas em um documento PDF</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Flow */}
      {result ? (
        <PdfResultV2
          result={result}
          onReset={handleReset}
          title="PDF gerado com sucesso!"
          subtitle="Suas imagens foram convertidas e compiladas em um PDF nítido."
        />
      ) : isProcessing ? (
        <PdfProgressV2 progress={progress} stepText={stepText} />
      ) : (
        <div className="space-y-6">
          {images.length === 0 ? (
            <PdfDropzoneV2
              onFilesSelected={handleImagesAdded}
              accept="image/*"
              title="Selecione as imagens para converter em PDF"
              subtitle="Arraste JPG, PNG, WEBP ou clique para escolher fotos"
              iconType="image"
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              {/* Header inside form */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Imagens Selecionadas ({images.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ajuste a ordem das fotos ou configure o tamanho da folha.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Fotos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => e.target.files && handleImagesAdded(Array.from(e.target.files))}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      images.forEach((img) => img.previewUrl && URL.revokeObjectURL(img.previewUrl));
                      setImages([]);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* Configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tamanho da Página</label>
                  <select
                    value={config.pageSize}
                    onChange={(e) => setConfig({ ...config, pageSize: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="a4">A4 Padrão (210 x 297 mm)</option>
                    <option value="letter">Carta / Letter</option>
                    <option value="fit">Ajustar ao Tamanho da Foto</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Orientação</label>
                  <select
                    value={config.orientation}
                    onChange={(e) => setConfig({ ...config, orientation: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="auto">Automática (Detectar Foto)</option>
                    <option value="portrait">Retrato (Vertical)</option>
                    <option value="landscape">Paisagem (Horizontal)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Margens</label>
                  <select
                    value={config.margin}
                    onChange={(e) => setConfig({ ...config, margin: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="none">Sem Margem (Borda a borda)</option>
                    <option value="small">Margem Suave</option>
                    <option value="large">Margem Ampla</option>
                  </select>
                </div>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {images.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 flex flex-col justify-between"
                  >
                    <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden mb-2">
                      {item.previewUrl && (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>#{index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, index - 1)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, index + 1)}
                          disabled={index === images.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartConvert}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gerar PDF ({images.length} fotos)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
