import React, { useEffect, useState } from "react";
import { ImageWatermarkUpload } from "../../components/image/watermark/ImageWatermarkUpload";
import { ImageWatermarkEditor } from "../../components/image/watermark/ImageWatermarkEditor";
import { ImageWatermarkResults } from "../../components/image/watermark/ImageWatermarkResults";
import { BatchItem } from "../../components/image/watermark/ImageWatermarkBatch";
import {
  WatermarkSettings
} from "../../utils/imageWatermarkPresets";
import {
  processWatermarkImage,
  ProcessedWatermarkResult
} from "../../services/image/imageWatermarkService";
import { trackEvent } from "../../lib/gtag";
import useSeoHead from "../../lib/useSeoHead";
import AdBanner from "../../components/AdBanner";
import { ShieldCheck, AlertCircle, Sparkles, ArrowLeft, Layers } from "lucide-react";

interface ImageWatermarkProps {
  onNavigate?: (path: string) => void;
}

export default function ImageWatermark({ onNavigate }: ImageWatermarkProps) {
  useSeoHead("image_watermark");

  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedWatermarkResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up object URLs on unmount or reset
  useEffect(() => {
    return () => {
      batchItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      results.forEach((res) => {
        if (res.dataUrl) URL.revokeObjectURL(res.dataUrl);
      });
    };
  }, []);

  const handleFilesSelected = (files: File[]) => {
    setErrorMessage(null);
    setResults([]);

    const newItems: BatchItem[] = files.map((file, idx) => {
      const id = `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);
      return {
        id,
        file,
        previewUrl,
        selected: true
      };
    });

    setBatchItems(newItems);
    setActiveItemId(newItems[0]?.id || null);

    trackEvent("image_watermark_started", {
      tool_name: "Marca d’água em imagens",
      file_count: files.length
    });
  };

  const handleSelectItemForPreview = (id: string) => {
    setActiveItemId(id);
  };

  const handleToggleItemSelection = (id: string) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = () => {
    setBatchItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  };

  const handleDeselectAll = () => {
    setBatchItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const handleInvertSelection = () => {
    setBatchItems((prev) => prev.map((item) => ({ ...item, selected: !item.selected })));
  };

  const handleRemoveItem = (id: string) => {
    setBatchItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      if (activeItemId === id) {
        setActiveItemId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  const handleApplyWatermark = async (settings: WatermarkSettings) => {
    const selectedItems = batchItems.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      setErrorMessage("Por favor, selecione ao menos uma imagem para aplicar a marca d'água.");
      return;
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setErrorMessage(null);

    const processedResults: ProcessedWatermarkResult[] = [];
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        try {
          const res = await processWatermarkImage(
            { file: item.file, settings },
            item.id
          );
          processedResults.push(res);
          successCount++;
        } catch (err: any) {
          console.error(`Erro ao processar imagem ${item.file.name}:`, err);
          failCount++;
        }

        const pct = Math.round(((i + 1) / selectedItems.length) * 100);
        setProgressPercent(pct);
      }

      if (processedResults.length === 0) {
        throw new Error("Não foi possível aplicar a marca d'água em nenhuma das imagens enviadas.");
      }

      setResults(processedResults);

      trackEvent("image_watermark_completed", {
        tool_name: "Marca d’água em imagens",
        watermark_type: settings.watermarkType,
        preset_name: settings.presetName || "custom",
        file_count: selectedItems.length,
        processed_count: successCount,
        failed_count: failCount,
        output_format: settings.outputFormat,
        success: true
      });
    } catch (err: any) {
      const msg = err?.message || "Ocorreu uma falha ao aplicar a marca d'água.";
      setErrorMessage(msg);

      trackEvent("image_watermark_failed", {
        tool_name: "Marca d’água em imagens",
        watermark_type: settings.watermarkType,
        file_count: selectedItems.length,
        failed_count: selectedItems.length,
        success: false
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    batchItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    results.forEach((res) => {
      if (res.dataUrl) URL.revokeObjectURL(res.dataUrl);
    });

    setBatchItems([]);
    setActiveItemId(null);
    setResults([]);
    setIsProcessing(false);
    setProgressPercent(0);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-2">
      {/* Back Button */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate("/")}
          className="inline-flex items-center gap-2 text-xs font-bold text-text-sec hover:text-green-light transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Ferramentas</span>
        </button>
      )}

      {/* Main Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card-inner border border-border-main text-green-primary text-xs font-bold">
          <ShieldCheck className="h-4 w-4" />
          <span>Proteção em Lote Totalmente Privada</span>
        </div>
        <h1 className="font-display text-2xl md:text-4xl font-extrabold text-text-main tracking-tight">
          Marca d’água em imagens grátis
        </h1>
        <p className="text-sm md:text-base text-text-sec max-w-2xl mx-auto font-semibold leading-relaxed">
          Adicione texto, logotipo ou marca repetida às suas fotos e artes para proteger suas criações de forma rápida e profissional.
        </p>
        <span className="inline-block text-xs font-bold text-text-muted bg-card-inner px-3 py-1 rounded-full border border-border-main">
          🔒 Seus arquivos não ficam salvos em nossos servidores.
        </span>
      </div>

      <AdBanner positionId="below_watermark_top" toolName="Marca d’água" />

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Workflow Screens */}
      {results.length > 0 ? (
        <ImageWatermarkResults
          results={results}
          onReset={handleReset}
          onNavigate={onNavigate}
          onDownloadSingle={() =>
            trackEvent("image_watermark_download_clicked", {
              tool_name: "Marca d’água em imagens"
            })
          }
          onDownloadZip={() =>
            trackEvent("image_watermark_zip_download_clicked", {
              tool_name: "Marca d’água em imagens",
              file_count: results.length
            })
          }
        />
      ) : batchItems.length === 0 ? (
        <ImageWatermarkUpload onFilesSelected={handleFilesSelected} />
      ) : (
        <ImageWatermarkEditor
          batchItems={batchItems}
          activeItemId={activeItemId}
          onSelectItemForPreview={handleSelectItemForPreview}
          onToggleItemSelection={handleToggleItemSelection}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onInvertSelection={handleInvertSelection}
          onRemoveItem={handleRemoveItem}
          onApplyWatermark={handleApplyWatermark}
          isProcessing={isProcessing}
          progressPercent={progressPercent}
        />
      )}

      <AdBanner positionId="page_bottom" toolName="Marca d’água" />
    </div>
  );
}
