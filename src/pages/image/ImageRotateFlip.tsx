import React, { useState, useEffect, useRef } from "react";
import {
  Scissors,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Wand2,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ShieldCheck,
  AlertCircle,
  Play,
  ArrowRight,
  Info,
  CheckCircle2
} from "lucide-react";
import ImageRotateFlipUpload, {
  MAX_SINGLE_IMAGE_SIZE,
  MAX_BATCH_SIZE,
  MAX_IMAGES_COUNT
} from "../../components/image/rotate-flip/ImageRotateFlipUpload";
import ImageRotateFlipToolbar from "../../components/image/rotate-flip/ImageRotateFlipToolbar";
import ImageRotateFlipGrid from "../../components/image/rotate-flip/ImageRotateFlipGrid";
import { ImageCardItem } from "../../components/image/rotate-flip/ImageRotateFlipCard";
import ImageRotateFlipCompare from "../../components/image/rotate-flip/ImageRotateFlipCompare";
import ImageRotateFlipProgress from "../../components/image/rotate-flip/ImageRotateFlipProgress";
import ImageRotateFlipResults from "../../components/image/rotate-flip/ImageRotateFlipResults";
import AdBanner from "../../components/AdBanner";

import { decodeImageFile } from "../../services/image/imageDecoder";
import {
  getExifOrientation,
  exifOrientationToTransform
} from "../../utils/imageOrientationUtils";
import {
  TransformState,
  createInitialTransformState
} from "../../utils/imageTransformCommands";
import {
  processRotateFlipImage,
  ProcessedRotateFlipResult
} from "../../services/image/imageRotateFlipService";
import { createZipArchive, triggerDownload } from "../../utils/downloadZip";
import { trackEvent, trackPageView } from "../../lib/gtag";
import useSeoHead from "../../lib/useSeoHead";

interface ImageRotateFlipProps {
  onNavigate?: (path: string) => void;
}

export default function ImageRotateFlip({ onNavigate }: ImageRotateFlipProps) {
  // Page SEO setup
  useSeoHead(
    "imageRotateFlip",
    "Girar e Espelhar Imagem Grátis Online | MultiConverte",
    "Gire imagens para esquerda ou direita, espelhe fotos e corrija a orientação de várias imagens de uma só vez."
  );

  useEffect(() => {
    trackPageView("Girar e Espelhar Imagens Grátis", "/imagem/girar-espelhar");
  }, []);

  // State
  const [items, setItems] = useState<ImageCardItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [qualitySetting, setQualitySetting] = useState<"max" | "high" | "rec">("max");
  const [compareItem, setCompareItem] = useState<ImageCardItem | null>(null);

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [processedIndex, setProcessedIndex] = useState<number>(0);
  const [currentProcessingName, setCurrentProcessingName] = useState<string>("");
  const [results, setResults] = useState<ProcessedRotateFlipResult[] | null>(null);
  const [zipDownloading, setZipDownloading] = useState<boolean>(false);

  const cancelProcessingRef = useRef<boolean>(false);

  // Clean up Object URLs and source resources on unmount
  useEffect(() => {
    return () => {
      items.forEach((it) => {
        if (it.originalPreviewUrl) URL.revokeObjectURL(it.originalPreviewUrl);
        if (it.source && "close" in it.source && typeof it.source.close === "function") {
          it.source.close();
        }
      });
      if (results) {
        results.forEach((r) => {
          if (r.dataUrl) URL.revokeObjectURL(r.dataUrl);
        });
      }
    };
  }, []);

  // File addition handler
  const handleFilesSelected = async (newFiles: File[]) => {
    setError(null);
    if (newFiles.length === 0) return;

    if (items.length + newFiles.length > MAX_IMAGES_COUNT) {
      setError(`Você pode adicionar no máximo ${MAX_IMAGES_COUNT} imagens por lote.`);
      return;
    }

    let batchTotalSize = items.reduce((acc, it) => acc + it.file.size, 0);
    for (const f of newFiles) {
      if (f.size > MAX_SINGLE_IMAGE_SIZE) {
        setError(`A imagem "${f.name}" excede o tamanho máximo permitido de 25 MB (${(f.size / (1024 * 1024)).toFixed(1)} MB).`);
        return;
      }
      batchTotalSize += f.size;
    }

    if (batchTotalSize > MAX_BATCH_SIZE) {
      setError(`O tamanho total do lote excede o limite máximo de 300 MB (${(batchTotalSize / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setLoadingFiles(true);
    const createdItems: ImageCardItem[] = [];

    try {
      for (const file of newFiles) {
        if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|avif|bmp)$/i)) {
          setError(`Formato de arquivo não suportado no arquivo "${file.name}". Envie imagens JPG, PNG, WEBP, AVIF ou BMP.`);
          setLoadingFiles(false);
          return;
        }

        const decoded = await decodeImageFile(file);
        const exifOrient = await getExifOrientation(file);
        const initialTransform = createInitialTransformState();

        const item: ImageCardItem = {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          file,
          source: decoded.source,
          originalWidth: decoded.width,
          originalHeight: decoded.height,
          originalPreviewUrl: decoded.previewUrl,
          exifOrientation: exifOrient,
          transform: initialTransform,
          history: [initialTransform],
          historyIndex: 0,
          selected: false
        };

        createdItems.push(item);
      }

      setItems((prev) => [...prev, ...createdItems]);
    } catch (err: any) {
      console.error("Erro ao carregar imagens:", err);
      setError(err.message || "Não foi possível carregar algumas imagens. Verifique se o arquivo não está corrompido.");
    } finally {
      setLoadingFiles(false);
    }
  };

  // State updates with Undo/Redo tracking
  const updateItemTransform = (id: string, newTransform: TransformState) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;

        const currentInHistory = it.history[it.historyIndex];
        if (
          currentInHistory &&
          currentInHistory.rotation === newTransform.rotation &&
          currentInHistory.flipH === newTransform.flipH &&
          currentInHistory.flipV === newTransform.flipV &&
          currentInHistory.autoOriented === newTransform.autoOriented
        ) {
          return it;
        }

        // Slice up to current history index and push new state (max 10)
        const updatedHistory = it.history.slice(0, it.historyIndex + 1);
        updatedHistory.push(newTransform);
        if (updatedHistory.length > 10) updatedHistory.shift();

        return {
          ...it,
          transform: newTransform,
          history: updatedHistory,
          historyIndex: updatedHistory.length - 1
        };
      })
    );
  };

  const handleUndo = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id || it.historyIndex <= 0) return it;
        const newIndex = it.historyIndex - 1;
        return {
          ...it,
          historyIndex: newIndex,
          transform: it.history[newIndex]
        };
      })
    );
  };

  const handleRedo = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id || it.historyIndex >= it.history.length - 1) return it;
        const newIndex = it.historyIndex + 1;
        return {
          ...it,
          historyIndex: newIndex,
          transform: it.history[newIndex]
        };
      })
    );
  };

  const handleResetItem = (id: string) => {
    const init = createInitialTransformState();
    updateItemTransform(id, init);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.originalPreviewUrl) URL.revokeObjectURL(target.originalPreviewUrl);
        if (target.source && "close" in target.source && typeof target.source.close === "function") {
          target.source.close();
        }
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleSelectAll = () => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: true })));
  };

  const handleClearSelection = () => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: false })));
  };

  const handleInvertSelection = () => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: !it.selected })));
  };

  // Batch action dispatcher
  const handleBatchAction = (
    action: "rotateLeft" | "rotateRight" | "rotate180" | "flipH" | "flipV" | "autoOrient" | "reset"
  ) => {
    const selectedCount = items.filter((i) => i.selected).length;
    const targets = selectedCount > 0 ? items.filter((i) => i.selected) : items;

    let autoAppliedCount = 0;

    targets.forEach((it) => {
      let current = { ...it.transform };

      switch (action) {
        case "rotateLeft":
          current.rotation = ((current.rotation - 90 % 360) + 360) % 360;
          break;
        case "rotateRight":
          current.rotation = (current.rotation + 90) % 360;
          break;
        case "rotate180":
          current.rotation = (current.rotation + 180) % 360;
          break;
        case "flipH":
          current.flipH = !current.flipH;
          break;
        case "flipV":
          current.flipV = !current.flipV;
          break;
        case "autoOrient": {
          const autoState = exifOrientationToTransform(it.exifOrientation);
          current.rotation = autoState.rotation;
          current.flipH = autoState.flipH;
          current.flipV = autoState.flipV;
          current.autoOriented = true;
          autoAppliedCount++;
          break;
        }
        case "reset":
          current = createInitialTransformState();
          break;
      }

      updateItemTransform(it.id, current);
    });

    if (action === "autoOrient" && autoAppliedCount > 0) {
      trackEvent("image_orientation_auto_applied", {
        tool_name: "Girar e Espelhar Imagens",
        file_count: autoAppliedCount,
        auto_orientation: true
      });
    }
  };

  const handleClearAll = () => {
    items.forEach((it) => {
      if (it.originalPreviewUrl) URL.revokeObjectURL(it.originalPreviewUrl);
      if (it.source && "close" in it.source && typeof it.source.close === "function") {
        it.source.close();
      }
    });
    setItems([]);
    setResults(null);
    setError(null);
  };

  // Main Processing Handler
  const handleProcessImages = async () => {
    if (items.length === 0) return;

    setError(null);
    setProcessing(true);
    setProcessedIndex(0);
    cancelProcessingRef.current = false;

    trackEvent("image_rotate_flip_started", {
      tool_name: "Girar e Espelhar Imagens",
      file_count: items.length,
      quality: qualitySetting
    });

    const outputResults: ProcessedRotateFlipResult[] = [];
    let failedCount = 0;

    for (let i = 0; i < items.length; i++) {
      if (cancelProcessingRef.current) break;

      const currentItem = items[i];
      setProcessedIndex(i + 1);
      setCurrentProcessingName(currentItem.file.name);

      try {
        const res = await processRotateFlipImage(
          {
            file: currentItem.file,
            transform: currentItem.transform,
            qualitySetting
          },
          currentItem.id
        );
        outputResults.push(res);
      } catch (err) {
        console.error(`Erro ao processar imagem ${currentItem.file.name}:`, err);
        failedCount++;
      }
    }

    setProcessing(false);

    if (outputResults.length > 0) {
      setResults(outputResults);
      trackEvent("image_rotate_flip_completed", {
        tool_name: "Girar e Espelhar Imagens",
        file_count: items.length,
        processed_count: outputResults.length,
        failed_count: failedCount,
        success: true
      });
    } else if (failedCount > 0) {
      setError("Não foi possível processar as imagens do lote. Verifique se os arquivos não estão corrompidos.");
      trackEvent("image_rotate_flip_failed", {
        tool_name: "Girar e Espelhar Imagens",
        file_count: items.length,
        failed_count: failedCount,
        success: false
      });
    }
  };

  const handleCancelProcessing = () => {
    cancelProcessingRef.current = true;
    setProcessing(false);
  };

  // ZIP Download
  const handleDownloadZip = async () => {
    if (!results || results.length === 0) return;

    setZipDownloading(true);
    try {
      const zipEntries = await Promise.all(
        results.map(async (r) => {
          const arrayBuf = await r.blob.arrayBuffer();
          return {
            filename: r.outputFileName,
            data: new Uint8Array(arrayBuf)
          };
        })
      );

      const zipBlob = createZipArchive(zipEntries);
      triggerDownload(zipBlob, "imagens-ajustadas.zip");

      trackEvent("image_rotate_flip_zip_download_clicked", {
        tool_name: "Girar e Espelhar Imagens",
        file_count: results.length
      });
    } catch (err) {
      console.error("Erro ao gerar arquivo ZIP:", err);
      setError("Não foi possível gerar o arquivo ZIP com as imagens.");
    } finally {
      setZipDownloading(false);
    }
  };

  const selectedCount = items.filter((i) => i.selected).length;
  const hasIndividualAdjustments = items.some(
    (i) =>
      i.transform.rotation !== 0 ||
      i.transform.flipH ||
      i.transform.flipV ||
      i.transform.autoOriented
  );

  return (
    <div className="space-y-8 text-center max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-primary/10 border border-green-primary/30 text-green-primary font-bold text-xs uppercase tracking-wider">
          <Scissors className="h-4 w-4" />
          <span>Ferramenta de Imagem MultiConverte</span>
        </div>
        <h1 className="font-display font-black text-2xl md:text-4xl text-text-main tracking-tight">
          Girar e Espelhar Imagens Grátis
        </h1>
        <p className="text-sm md:text-base text-text-sec font-semibold max-w-2xl mx-auto leading-relaxed">
          Corrija a posição das suas imagens, gire, espelhe e aplique ajustes rápidos em lote para redes sociais ou uso pessoal.
        </p>

        <div className="inline-flex items-center gap-2 text-xs font-bold text-text-muted bg-card-main border border-border-main px-3.5 py-1.5 rounded-full">
          <ShieldCheck className="h-4 w-4 text-green-primary" />
          <span>Seus arquivos não ficam salvos.</span>
        </div>
      </div>

      {/* Ad Banner Top */}
      <AdBanner positionId="tool_top" toolName="Girar e Espelhar Imagens" />

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-left text-red-400 text-xs font-bold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-text-muted hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Results View or Workspace */}
      {results && results.length > 0 ? (
        <ImageRotateFlipResults
          results={results}
          onDownloadZip={handleDownloadZip}
          onResetAll={handleClearAll}
          zipDownloading={zipDownloading}
        />
      ) : (
        <div className="space-y-6">
          {/* File Upload Box */}
          <ImageRotateFlipUpload
            onFilesSelected={handleFilesSelected}
            disabled={loadingFiles || processing}
          />

          {loadingFiles && (
            <div className="p-8 bg-card-main border border-border-main rounded-2xl flex items-center justify-center gap-3 text-xs font-bold text-text-muted">
              <div className="w-5 h-5 border-2 border-green-primary/30 border-t-green-primary rounded-full animate-spin" />
              <span>Carregando e analisando imagens...</span>
            </div>
          )}

          {/* Batch Toolbar & Cards Grid */}
          {items.length > 0 && (
            <div className="space-y-6">
              <ImageRotateFlipToolbar
                totalCount={items.length}
                selectedCount={selectedCount}
                hasIndividualAdjustments={hasIndividualAdjustments}
                qualitySetting={qualitySetting}
                onQualityChange={setQualitySetting}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onInvertSelection={handleInvertSelection}
                onBatchAction={handleBatchAction}
                onClearAll={handleClearAll}
              />

              <ImageRotateFlipGrid
                items={items}
                onToggleSelect={handleToggleSelect}
                onUpdateTransform={updateItemTransform}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onReset={handleResetItem}
                onRemove={handleRemoveItem}
                onOpenCompare={setCompareItem}
              />

              {/* Action Button: Process Images */}
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleProcessImages}
                  disabled={processing}
                  className="px-8 py-4 bg-green-primary hover:bg-green-dark disabled:bg-green-primary/50 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-green-primary/20 flex items-center gap-3 cursor-pointer group"
                >
                  <Play className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
                  <span>PROCESSAR IMAGENS ({items.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Modal */}
      {processing && (
        <ImageRotateFlipProgress
          currentCount={processedIndex}
          totalCount={items.length}
          currentFileName={currentProcessingName}
          onCancel={handleCancelProcessing}
        />
      )}

      {/* Compare Modal */}
      <ImageRotateFlipCompare
        item={compareItem}
        onClose={() => setCompareItem(null)}
      />

      {/* Related Internal Tools Navigation Links */}
      <div className="pt-8 border-t border-border-main/60 space-y-4 text-left">
        <h3 className="font-display font-bold text-sm text-text-main uppercase tracking-wider">
          Outras Ferramentas de Imagem do MultiConverte
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("/imagem/cortar")}
            className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-xl text-text-sec hover:text-green-light flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Cortar Imagem</span>
            <ArrowRight className="h-4 w-4 text-green-primary" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("/imagem/redimensionar")}
            className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-xl text-text-sec hover:text-green-light flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Redimensionar Imagem</span>
            <ArrowRight className="h-4 w-4 text-green-primary" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("/imagem/comprimir")}
            className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-xl text-text-sec hover:text-green-light flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Compressor de Imagens</span>
            <ArrowRight className="h-4 w-4 text-green-primary" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("/imagem/converter")}
            className="p-3.5 bg-card-main border border-border-main hover:border-green-primary/50 rounded-xl text-text-sec hover:text-green-light flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Conversor de Imagens</span>
            <ArrowRight className="h-4 w-4 text-green-primary" />
          </button>
        </div>
      </div>

      {/* Ad Banner Bottom */}
      <AdBanner positionId="tool_bottom" toolName="Girar e Espelhar Imagens" />
    </div>
  );
}
