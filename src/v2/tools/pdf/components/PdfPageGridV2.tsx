import React from "react";
import { RotateCw, RotateCcw, Trash2, Undo2, ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { PdfPageItemV2 } from "../types";

interface PdfPageGridV2Props {
  pages: PdfPageItemV2[];
  onRotatePage: (id: string, angleDelta: number) => void;
  onToggleDelete: (id: string) => void;
  onMovePage?: (fromIndex: number, toIndex: number) => void;
  allowReorder?: boolean;
}

export const PdfPageGridV2: React.FC<PdfPageGridV2Props> = ({
  pages,
  onRotatePage,
  onToggleDelete,
  onMovePage,
  allowReorder = true
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {pages.map((page, index) => {
        const isDeleted = page.deleted;

        return (
          <div
            key={page.id}
            className={`group relative rounded-2xl border transition-all p-3 flex flex-col items-center justify-between ${
              isDeleted
                ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-60"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500"
            }`}
          >
            {/* Page Header Indicator */}
            <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono">
                Pág. {index + 1}
              </span>
              {page.rotation > 0 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {page.rotation}°
                </span>
              )}
            </div>

            {/* Thumbnail Canvas / Container */}
            <div className="w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-200/60 dark:border-slate-700/60">
              {page.thumbnailUrl ? (
                <img
                  src={page.thumbnailUrl}
                  alt={`Página ${page.pageNumber}`}
                  className="w-full h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `rotate(${page.rotation}deg)`
                  }}
                />
              ) : (
                <div className="text-center p-2 text-xs text-slate-400">
                  <span>Página {page.pageNumber}</span>
                </div>
              )}

              {isDeleted && (
                <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold text-xs shadow-sm">
                    Excluída
                  </span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="w-full flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onRotatePage(page.id, -90)}
                title="Girar 90° para a esquerda"
                disabled={isDeleted}
                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onRotatePage(page.id, 90)}
                title="Girar 90° para a direita"
                disabled={isDeleted}
                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onToggleDelete(page.id)}
                title={isDeleted ? "Restaurar página" : "Excluir página"}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDeleted
                    ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                }`}
              >
                {isDeleted ? <Undo2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>

              {allowReorder && onMovePage && (
                <>
                  <button
                    type="button"
                    onClick={() => index > 0 && onMovePage(index, index - 1)}
                    disabled={index === 0}
                    title="Mover para trás"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => index < pages.length - 1 && onMovePage(index, index + 1)}
                    disabled={index === pages.length - 1}
                    title="Mover para frente"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
