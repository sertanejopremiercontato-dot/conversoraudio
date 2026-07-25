import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Wand2,
  Trash2,
  Eye,
  Undo2,
  Redo2,
  RotateCcw as ResetIcon,
  Check,
  CheckSquare,
  Square
} from "lucide-react";
import {
  TransformState,
  getTransformedDimensions,
  generateThumbnailPreview
} from "../../../utils/imageTransformCommands";

export interface ImageCardItem {
  id: string;
  file: File;
  source: CanvasImageSource;
  originalWidth: number;
  originalHeight: number;
  originalPreviewUrl: string;
  exifOrientation: number;
  transform: TransformState;
  history: TransformState[];
  historyIndex: number;
  selected: boolean;
}

interface ImageRotateFlipCardProps {
  item: ImageCardItem;
  onToggleSelect: (id: string) => void;
  onUpdateTransform: (id: string, newTransform: TransformState) => void;
  onUndo: (id: string) => void;
  onRedo: (id: string) => void;
  onReset: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenCompare: (item: ImageCardItem) => void;
}

export default function ImageRotateFlipCard({
  item,
  onToggleSelect,
  onUpdateTransform,
  onUndo,
  onRedo,
  onReset,
  onRemove,
  onOpenCompare
}: ImageRotateFlipCardProps) {
  const [thumbUrl, setThumbUrl] = useState<string>("");

  const { width: currentW, height: currentH } = getTransformedDimensions(
    item.originalWidth,
    item.originalHeight,
    item.transform.rotation
  );

  const canUndo = item.historyIndex > 0;
  const canRedo = item.historyIndex < item.history.length - 1;

  // Generate lightweight thumbnail preview on transform state change
  useEffect(() => {
    if (item.source) {
      const url = generateThumbnailPreview(
        item.source,
        item.originalWidth,
        item.originalHeight,
        item.transform,
        320
      );
      setThumbUrl(url);
    }
  }, [item.source, item.originalWidth, item.originalHeight, item.transform]);

  const handleRotateLeft = () => {
    const newRot = ((item.transform.rotation - 90 % 360) + 360) % 360;
    onUpdateTransform(item.id, { ...item.transform, rotation: newRot });
  };

  const handleRotateRight = () => {
    const newRot = (item.transform.rotation + 90) % 360;
    onUpdateTransform(item.id, { ...item.transform, rotation: newRot });
  };

  const handleRotate180 = () => {
    const newRot = (item.transform.rotation + 180) % 360;
    onUpdateTransform(item.id, { ...item.transform, rotation: newRot });
  };

  const handleFlipH = () => {
    onUpdateTransform(item.id, { ...item.transform, flipH: !item.transform.flipH });
  };

  const handleFlipV = () => {
    onUpdateTransform(item.id, { ...item.transform, flipV: !item.transform.flipV });
  };

  const hasChanges =
    item.transform.rotation !== 0 ||
    item.transform.flipH ||
    item.transform.flipV ||
    item.transform.autoOriented;

  return (
    <div
      className={`bg-card-main rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md relative group ${
        item.selected
          ? "border-green-primary bg-green-primary/5"
          : "border-border-main hover:border-green-primary/50"
      }`}
    >
      {/* Top Header: Checkbox selection & File info */}
      <div className="p-3 bg-card-inner/60 border-b border-border-main/50 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleSelect(item.id)}
          className="flex items-center gap-2 text-xs font-bold text-text-main truncate hover:text-green-light transition-colors cursor-pointer"
        >
          {item.selected ? (
            <CheckSquare className="h-4 w-4 text-green-primary shrink-0" />
          ) : (
            <Square className="h-4 w-4 text-text-muted shrink-0" />
          )}
          <span className="truncate max-w-[160px]" title={item.file.name}>
            {item.file.name}
          </span>
        </button>

        <div className="flex items-center gap-1">
          {/* Compare Button */}
          <button
            type="button"
            onClick={() => onOpenCompare(item)}
            className="p-1.5 rounded-lg bg-card-main border border-border-main hover:border-green-primary text-text-sec hover:text-green-light text-xs font-bold transition-all cursor-pointer"
            title="Comparar Antes e Depois"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg bg-card-main border border-border-main hover:border-red-500/50 text-text-muted hover:text-red-400 text-xs transition-all cursor-pointer"
            title="Remover imagem"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Thumbnail Area */}
      <div className="p-4 flex flex-col items-center justify-center min-h-[180px] bg-[#1a1f24] relative">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={item.file.name}
            className="max-h-[160px] max-w-full object-contain rounded-lg shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-green-primary/30 border-t-green-primary animate-spin" />
        )}

        {/* Auto Orientation Badge */}
        {item.transform.autoOriented && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-green-primary/90 text-white font-extrabold text-[10px] shadow-sm">
            Orientação corrigida
          </div>
        )}
      </div>

      {/* Info & Dimensions Bar */}
      <div className="px-3 py-2 bg-card-inner/40 border-t border-border-main/30 flex items-center justify-between text-[11px] text-text-muted font-mono font-semibold">
        <span>
          {currentW} × {currentH} px
        </span>
        <span>
          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
        </span>
      </div>

      {/* Controls Bar */}
      <div className="p-3 bg-card-main border-t border-border-main/50 space-y-2">
        {/* Undo/Redo & Reset row */}
        <div className="flex items-center justify-between border-b border-border-main/30 pb-2 text-[11px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canUndo}
              onClick={() => onUndo(item.id)}
              className="p-1 rounded-md bg-card-inner border border-border-main hover:border-green-primary/50 text-text-sec hover:text-green-light disabled:opacity-30 disabled:hover:border-border-main disabled:hover:text-text-sec cursor-pointer disabled:cursor-not-allowed transition-all"
              title="Desfazer ação"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={() => onRedo(item.id)}
              className="p-1 rounded-md bg-card-inner border border-border-main hover:border-green-primary/50 text-text-sec hover:text-green-light disabled:opacity-30 disabled:hover:border-border-main disabled:hover:text-text-sec cursor-pointer disabled:cursor-not-allowed transition-all"
              title="Refazer ação"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-[10px] text-text-muted font-bold">
            {item.transform.rotation}° | {item.transform.flipH ? "H:Sim" : "H:Não"} | {item.transform.flipV ? "V:Sim" : "V:Não"}
          </span>

          {hasChanges && (
            <button
              type="button"
              onClick={() => onReset(item.id)}
              className="text-[10px] font-bold text-text-muted hover:text-red-400 transition-colors cursor-pointer"
            >
              Redefinir
            </button>
          )}
        </div>

        {/* Individual Transformation Buttons */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          <button
            type="button"
            onClick={handleRotateLeft}
            className="p-2 rounded-lg bg-card-inner border border-border-main hover:border-green-primary text-text-main hover:text-green-light flex items-center justify-center transition-all cursor-pointer"
            title="Girar 90° Esquerda"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleRotateRight}
            className="p-2 rounded-lg bg-card-inner border border-border-main hover:border-green-primary text-text-main hover:text-green-light flex items-center justify-center transition-all cursor-pointer"
            title="Girar 90° Direita"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleRotate180}
            className="p-2 rounded-lg bg-card-inner border border-border-main hover:border-green-primary text-text-main hover:text-green-light flex items-center justify-center transition-all cursor-pointer text-[10px] font-bold"
            title="Girar 180°"
          >
            180°
          </button>

          <button
            type="button"
            onClick={handleFlipH}
            className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
              item.transform.flipH
                ? "bg-green-primary/20 border-green-primary text-green-light"
                : "bg-card-inner border-border-main hover:border-green-primary text-text-main hover:text-green-light"
            }`}
            title="Espelhar Horizontalmente"
          >
            <FlipHorizontal className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleFlipV}
            className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
              item.transform.flipV
                ? "bg-green-primary/20 border-green-primary text-green-light"
                : "bg-card-inner border-border-main hover:border-green-primary text-text-main hover:text-green-light"
            }`}
            title="Espelhar Verticalmente"
          >
            <FlipVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
