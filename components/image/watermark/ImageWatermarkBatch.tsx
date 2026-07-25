import React from "react";
import { CheckSquare, Square, Trash2, CheckCircle2, Layers } from "lucide-react";

export interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  selected: boolean;
  width?: number;
  height?: number;
}

interface ImageWatermarkBatchProps {
  items: BatchItem[];
  activeItemId: string | null;
  onSelectItemForPreview: (id: string) => void;
  onToggleItemSelection: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvertSelection: () => void;
  onRemoveItem: (id: string) => void;
}

export const ImageWatermarkBatch: React.FC<ImageWatermarkBatchProps> = ({
  items,
  activeItemId,
  onSelectItemForPreview,
  onToggleItemSelection,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onRemoveItem
}) => {
  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <div className="space-y-3 bg-card-main border border-border-main rounded-2xl p-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-main/60">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-green-primary" />
          <h4 className="font-bold text-xs text-text-main uppercase tracking-wider">
            Lote de Imagens ({selectedCount} de {items.length} selecionadas)
          </h4>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-green-primary hover:underline cursor-pointer"
          >
            Todas
          </button>
          <span className="text-border-main">|</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-text-sec hover:text-text-main cursor-pointer"
          >
            Nenhuma
          </button>
          <span className="text-border-main">|</span>
          <button
            type="button"
            onClick={onInvertSelection}
            className="text-text-sec hover:text-text-main cursor-pointer"
          >
            Inverter
          </button>
        </div>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
        {items.map((item) => {
          const isActive = activeItemId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onSelectItemForPreview(item.id)}
              className={`relative group rounded-xl border p-2 flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-green-primary/10 border-green-primary shadow-sm"
                  : item.selected
                  ? "bg-card-inner border-border-main hover:border-green-primary/50"
                  : "bg-card-inner/40 border-border-main/40 opacity-60"
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleItemSelection(item.id);
                }}
                className="text-green-primary shrink-0 cursor-pointer"
              >
                {item.selected ? (
                  <CheckSquare className="h-4 w-4 fill-green-primary/20" />
                ) : (
                  <Square className="h-4 w-4 text-text-muted" />
                )}
              </button>

              {/* Thumbnail */}
              <div className="w-9 h-9 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-border-main/60 flex items-center justify-center">
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[11px] text-text-main block truncate leading-tight">
                  {item.file.name}
                </span>
                <span className="text-[9px] text-text-muted block">
                  {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0 cursor-pointer"
                title="Remover Imagem"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
