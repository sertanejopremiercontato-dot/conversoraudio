import React, { useState } from "react";
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Wand2,
  CheckSquare,
  Square,
  Sliders,
  Trash2,
  RefreshCw,
  Check,
  AlertTriangle
} from "lucide-react";

interface ImageRotateFlipToolbarProps {
  totalCount: number;
  selectedCount: number;
  hasIndividualAdjustments: boolean;
  qualitySetting: "max" | "high" | "rec";
  onQualityChange: (q: "max" | "high" | "rec") => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onInvertSelection: () => void;
  onBatchAction: (action: "rotateLeft" | "rotateRight" | "rotate180" | "flipH" | "flipV" | "autoOrient" | "reset") => void;
  onClearAll: () => void;
}

export default function ImageRotateFlipToolbar({
  totalCount,
  selectedCount,
  hasIndividualAdjustments,
  qualitySetting,
  onQualityChange,
  onSelectAll,
  onClearSelection,
  onInvertSelection,
  onBatchAction,
  onClearAll
}: ImageRotateFlipToolbarProps) {
  const [confirmPendingAction, setConfirmPendingAction] = useState<
    ("rotateLeft" | "rotateRight" | "rotate180" | "flipH" | "flipV" | "autoOrient" | "reset") | null
  >(null);

  const targetLabel = selectedCount > 0 ? `nas ${selectedCount} selecionadas` : "em TODAS as imagens";

  const handleActionClick = (
    action: "rotateLeft" | "rotateRight" | "rotate180" | "flipH" | "flipV" | "autoOrient" | "reset"
  ) => {
    if (hasIndividualAdjustments && selectedCount === 0 && action !== "reset") {
      setConfirmPendingAction(action);
    } else {
      onBatchAction(action);
    }
  };

  const executeConfirmedAction = () => {
    if (confirmPendingAction) {
      onBatchAction(confirmPendingAction);
      setConfirmPendingAction(null);
    }
  };

  return (
    <div className="bg-card-main border border-border-main rounded-2xl p-4 md:p-5 space-y-4 shadow-sm">
      {/* Confirmation Modal for Overwriting Batch Adjustments */}
      {confirmPendingAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-main border border-border-main rounded-2xl p-6 max-w-md w-full space-y-4 text-left shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-display font-bold text-base text-text-main">
                Confirmar aplicação em lote
              </h3>
            </div>
            <p className="text-xs text-text-sec font-semibold leading-relaxed">
              Você possui ajustes individuais personalizados em algumas imagens. Aplicar esta ação em lote redefinirá as imagens para que fiquem uniformes.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPendingAction(null)}
                className="px-4 py-2 rounded-xl border border-border-main hover:bg-card-inner text-text-sec text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="px-4 py-2 rounded-xl bg-green-primary hover:bg-green-dark text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Sim, aplicar a todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Row: Selection state & Quality setting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-main/50 pb-3">
        {/* Selection Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          <span className="text-text-muted font-bold mr-1">
            {selectedCount > 0 ? `${selectedCount} de ${totalCount} selecionadas` : `${totalCount} imagens no lote`}:
          </span>
          <button
            type="button"
            onClick={onSelectAll}
            className="px-2.5 py-1 rounded-lg bg-card-inner border border-border-main hover:border-green-primary/50 text-text-main text-[11px] font-bold transition-all cursor-pointer"
          >
            Selecionar todas
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2.5 py-1 rounded-lg bg-card-inner border border-border-main hover:border-green-primary/50 text-text-muted hover:text-text-main text-[11px] font-bold transition-all cursor-pointer"
            >
              Limpar seleção
            </button>
          )}
          <button
            type="button"
            onClick={onInvertSelection}
            className="px-2.5 py-1 rounded-lg bg-card-inner border border-border-main hover:border-green-primary/50 text-text-sec text-[11px] font-bold transition-all cursor-pointer"
          >
            Inverter
          </button>
        </div>

        {/* Quality Selector & Clear All */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-text-muted">Qualidade:</span>
            <select
              value={qualitySetting}
              onChange={(e) => onQualityChange(e.target.value as any)}
              className="bg-card-inner border border-border-main text-text-main text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-green-primary"
            >
              <option value="max">Máxima (100%)</option>
              <option value="high">Alta (92%)</option>
              <option value="rec">Recomendada (85%)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[11px] font-bold transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Limpar lote</span>
          </button>
        </div>
      </div>

      {/* General Actions Toolbar (Ações em Lote) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-green-light">
            Ações Rápidas {targetLabel}
          </span>
          {selectedCount > 0 && (
            <span className="text-[10px] text-green-primary font-bold bg-green-primary/10 px-2 py-0.5 rounded-full border border-green-primary/20">
              Modo seleção ativo
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {/* Girar 90° Esq */}
          <button
            type="button"
            onClick={() => handleActionClick("rotateLeft")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-card-inner border border-border-main hover:border-green-primary text-text-main hover:text-green-light rounded-xl text-xs font-bold transition-all cursor-pointer group shadow-xs"
            title="Girar 90° para esquerda"
          >
            <RotateCcw className="h-4 w-4 text-green-primary group-hover:scale-110 transition-transform" />
            <span>-90° Esq</span>
          </button>

          {/* Girar 90° Dir */}
          <button
            type="button"
            onClick={() => handleActionClick("rotateRight")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-card-inner border border-border-main hover:border-green-primary text-text-main hover:text-green-light rounded-xl text-xs font-bold transition-all cursor-pointer group shadow-xs"
            title="Girar 90° para direita"
          >
            <RotateCw className="h-4 w-4 text-green-primary group-hover:scale-110 transition-transform" />
            <span>+90° Dir</span>
          </button>

          {/* Girar 180° */}
          <button
            type="button"
            onClick={() => handleActionClick("rotate180")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-card-inner border border-border-main hover:border-green-primary text-text-main hover:text-green-light rounded-xl text-xs font-bold transition-all cursor-pointer group shadow-xs"
            title="Girar 180°"
          >
            <RefreshCw className="h-4 w-4 text-green-primary group-hover:scale-110 transition-transform" />
            <span>Girar 180°</span>
          </button>

          {/* Espelhar H */}
          <button
            type="button"
            onClick={() => handleActionClick("flipH")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-card-inner border border-border-main hover:border-green-primary text-text-main hover:text-green-light rounded-xl text-xs font-bold transition-all cursor-pointer group shadow-xs"
            title="Espelhar horizontalmente"
          >
            <FlipHorizontal className="h-4 w-4 text-green-primary group-hover:scale-110 transition-transform" />
            <span>Espelhar H</span>
          </button>

          {/* Espelhar V */}
          <button
            type="button"
            onClick={() => handleActionClick("flipV")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-card-inner border border-border-main hover:border-green-primary text-text-main hover:text-green-light rounded-xl text-xs font-bold transition-all cursor-pointer group shadow-xs"
            title="Espelhar verticalmente"
          >
            <FlipVertical className="h-4 w-4 text-green-primary group-hover:scale-110 transition-transform" />
            <span>Espelhar V</span>
          </button>

          {/* Corrigir Orientação */}
          <button
            type="button"
            onClick={() => handleActionClick("autoOrient")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-primary/15 border border-green-primary/40 hover:bg-green-primary/25 text-green-light rounded-xl text-xs font-bold transition-all cursor-pointer group shadow-xs"
            title="Corrigir orientação EXIF de foto de celular automaticamente"
          >
            <Wand2 className="h-4 w-4 text-green-primary group-hover:rotate-12 transition-transform" />
            <span>Corrigir Orientação</span>
          </button>

          {/* Redefinir */}
          <button
            type="button"
            onClick={() => handleActionClick("reset")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-card-inner border border-border-main hover:border-text-muted text-text-muted hover:text-text-main rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Redefinir todas as transformações"
          >
            <span>Redefinir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
