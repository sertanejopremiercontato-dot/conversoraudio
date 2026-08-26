import React, { useState } from "react";
import { CleanOptions } from "../../../../types/audioMetadata";
import { AlertTriangle, Trash2, X, Check } from "lucide-react";

interface MetadataCleanModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClean: (options: CleanOptions) => void;
}

const DEFAULT_CUSTOM_OPTIONS: CleanOptions = {
  wipeAll: false,
  removeMainMetadata: true,
  removeCover: true,
  removeComments: true,
  removeSoftwareEncoder: true,
  removeTechnicalTags: true,
  removePrivateTags: true,
  removeCustomTags: true,
  removeLyrics: true,
  removeCopyright: true,
  removeUrls: true
};

export const MetadataCleanModalV2: React.FC<MetadataCleanModalV2Props> = ({
  isOpen,
  onClose,
  onConfirmClean
}) => {
  const [cleanMode, setCleanMode] = useState<"all" | "custom">("all");
  const [customOptions, setCustomOptions] = useState<CleanOptions>(DEFAULT_CUSTOM_OPTIONS);

  if (!isOpen) return null;

  const handleApply = () => {
    if (cleanMode === "all") {
      onConfirmClean({
        wipeAll: true,
        removeMainMetadata: true,
        removeCover: true,
        removeComments: true,
        removeSoftwareEncoder: true,
        removeTechnicalTags: true,
        removePrivateTags: true,
        removeCustomTags: true,
        removeLyrics: true,
        removeCopyright: true,
        removeUrls: true
      });
    } else {
      onConfirmClean({
        ...customOptions,
        wipeAll: false
      });
    }
    onClose();
  };

  const toggleOption = (key: keyof CleanOptions) => {
    setCustomOptions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Limpar Metadados de Áudio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Isso removerá os metadados selecionados do arquivo exportado. O áudio original não será alterado nem reencodado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setCleanMode("all")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              cleanMode === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Limpar Tudo (Total)
          </button>
          <button
            type="button"
            onClick={() => setCleanMode("custom")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              cleanMode === "custom"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Personalizado
          </button>
        </div>

        {/* Options */}
        {cleanMode === "all" ? (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold">Remoção Completa de Tags</p>
            <p className="text-[11px] leading-relaxed">
              Todos os metadados (título, artista, álbum, ano, capa, ISRC, comentários, software codificador e tags nativas) serão removidos do arquivo na exportação, mantendo apenas o bitstream de áudio limpo.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={customOptions.removeMainMetadata}
                onChange={() => toggleOption("removeMainMetadata")}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                Metadados Principais (Título, Artista, Álbum, Ano, Gênero)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={customOptions.removeCover}
                onChange={() => toggleOption("removeCover")}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                Capa do Álbum (Artwork / Imagem)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={customOptions.removeComments}
                onChange={() => toggleOption("removeComments")}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                Comentários e Descrições
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={customOptions.removeLyrics}
                onChange={() => toggleOption("removeLyrics")}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                Letras Embutidas (Lyrics)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={customOptions.removeCopyright}
                onChange={() => toggleOption("removeCopyright")}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                Direitos Autorais, ISRC e Gravadora
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={customOptions.removeSoftwareEncoder}
                onChange={() => toggleOption("removeSoftwareEncoder")}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                Informações de Software e Encoder (TSSE, LAME, TENC)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={customOptions.removeTechnicalTags}
                onChange={() => toggleOption("removeTechnicalTags")}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                Tags Técnicas (ReplayGain, UFID, POPM, Privadas)
              </span>
            </label>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar e Limpar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
