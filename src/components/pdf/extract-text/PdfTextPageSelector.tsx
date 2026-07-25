import React from "react";
import { Layers, Hash, Info } from "lucide-react";
import { parsePageRange } from "../../../utils/pageRangeParser";

interface PdfTextPageSelectorProps {
  totalPages: number;
  selectedRangeStr: string;
  onRangeChange: (val: string) => void;
}

export const PdfTextPageSelector: React.FC<PdfTextPageSelectorProps> = ({
  totalPages,
  selectedRangeStr,
  onRangeChange
}) => {
  const isAll = !selectedRangeStr || selectedRangeStr.trim() === "";
  const { pages, error } = parsePageRange(selectedRangeStr, totalPages);

  return (
    <div className="bg-card-main border border-border-main rounded-3xl p-6 md:p-8 space-y-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-main pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-card-inner border border-border-main rounded-xl text-green-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-text-main">
              Seleção de Páginas
            </h3>
            <p className="text-xs text-text-sec">
              Escolha quais páginas deseja extrair o texto
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 bg-card-inner border border-border-main text-green-light rounded-full text-xs font-bold w-fit">
          Total: {totalPages} {totalPages === 1 ? "página" : "páginas"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onRangeChange("")}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            isAll
              ? "bg-green-primary/10 border-green-primary text-text-main"
              : "bg-card-inner border-border-main hover:border-green-primary/50 text-text-sec"
          }`}
        >
          <div>
            <p className="font-bold text-xs md:text-sm">Todas as Páginas</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Extrair o texto de todo o documento (1 a {totalPages})
            </p>
          </div>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              isAll
                ? "border-green-primary bg-green-primary"
                : "border-border-main"
            }`}
          >
            {isAll && <span className="w-1.5 h-1.5 rounded-full bg-bg-main" />}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isAll) onRangeChange(`1-${Math.min(totalPages, 5)}`);
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            !isAll
              ? "bg-green-primary/10 border-green-primary text-text-main"
              : "bg-card-inner border-border-main hover:border-green-primary/50 text-text-sec"
          }`}
        >
          <div>
            <p className="font-bold text-xs md:text-sm">Intervalo Personalizado</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Defina páginas específicas ou faixas
            </p>
          </div>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              !isAll
                ? "border-green-primary bg-green-primary"
                : "border-border-main"
            }`}
          >
            {!isAll && <span className="w-1.5 h-1.5 rounded-full bg-bg-main" />}
          </span>
        </button>
      </div>

      {!isAll && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-green-primary shrink-0" />
            <label htmlFor="pdf-page-range-input" className="text-xs font-bold text-text-main">
              Informe o intervalo (Ex: 1-5, 1,3,7, 2-4,8):
            </label>
          </div>

          <input
            id="pdf-page-range-input"
            type="text"
            value={selectedRangeStr}
            onChange={(e) => onRangeChange(e.target.value)}
            placeholder="Ex: 1-5, 8, 11-15"
            className="w-full px-4 py-3 bg-card-inner border border-border-main focus:border-green-primary focus:outline-none rounded-2xl text-xs md:text-sm text-text-main font-mono"
          />

          {error ? (
            <p className="text-xs text-red-400 font-medium flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          ) : (
            <p className="text-[11px] text-green-primary font-semibold flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>
                Páginas selecionadas ({pages.length}): {pages.join(", ")}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
