import React from "react";
import { Settings, AlignLeft, CheckSquare, Square } from "lucide-react";
import { ExtractionMode } from "../../../utils/pdfTextLayout";
import { TextCleaningOptions } from "../../../utils/pdfTextCleaner";

interface PdfTextSettingsProps {
  mode: ExtractionMode;
  onModeChange: (mode: ExtractionMode) => void;
  cleaningOptions: TextCleaningOptions;
  onCleaningOptionChange: (opts: TextCleaningOptions) => void;
}

export const PdfTextSettings: React.FC<PdfTextSettingsProps> = ({
  mode,
  onModeChange,
  cleaningOptions,
  onCleaningOptionChange
}) => {
  const toggleOption = (key: keyof TextCleaningOptions) => {
    onCleaningOptionChange({
      ...cleaningOptions,
      [key]: !cleaningOptions[key]
    });
  };

  return (
    <div className="bg-card-main border border-border-main rounded-3xl p-6 md:p-8 space-y-6 shadow-lg">
      <div className="flex items-center gap-3 border-b border-border-main pb-4">
        <div className="p-2.5 bg-card-inner border border-border-main rounded-xl text-green-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm md:text-base text-text-main">
            Opções de Extração e Limpeza
          </h3>
          <p className="text-xs text-text-sec">
            Ajuste a organização do texto e os filtros de formatação
          </p>
        </div>
      </div>

      {/* Extraction Mode */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
          <AlignLeft className="h-4 w-4 text-green-primary" />
          <span>Modo de Organização:</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onModeChange("perPage")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === "perPage"
                ? "bg-green-primary/10 border-green-primary text-text-main"
                : "bg-card-inner border-border-main hover:border-green-primary/50 text-text-sec"
            }`}
          >
            <p className="font-bold text-xs md:text-sm">Separar por Página</p>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
              Adiciona cabeçalho com número da página (Ex: --- Página 1 ---)
            </p>
          </button>

          <button
            type="button"
            onClick={() => onModeChange("continuous")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === "continuous"
                ? "bg-green-primary/10 border-green-primary text-text-main"
                : "bg-card-inner border-border-main hover:border-green-primary/50 text-text-sec"
            }`}
          >
            <p className="font-bold text-xs md:text-sm">Texto Contínuo</p>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
              Une todo o texto do documento em um fluxo contínuo
            </p>
          </button>

          <button
            type="button"
            onClick={() => onModeChange("preserveLines")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === "preserveLines"
                ? "bg-green-primary/10 border-green-primary text-text-main"
                : "bg-card-inner border-border-main hover:border-green-primary/50 text-text-sec"
            }`}
          >
            <p className="font-bold text-xs md:text-sm">Manter Linhas</p>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
              Preserva ao máximo as quebras visuais de cada linha do PDF
            </p>
          </button>
        </div>
      </div>

      {/* Cleaning Filters */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-text-main uppercase tracking-wider">
          Filtros de Limpeza Automática:
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toggleOption("removeDuplicateSpaces")}
            className="flex items-center gap-3 p-3.5 bg-card-inner border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-left cursor-pointer"
          >
            {cleaningOptions.removeDuplicateSpaces ? (
              <CheckSquare className="h-4 w-4 text-green-primary shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-text-muted shrink-0" />
            )}
            <span className="text-xs font-semibold text-text-main">
              Remover espaços duplicados
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleOption("fixExcessiveLineBreaks")}
            className="flex items-center gap-3 p-3.5 bg-card-inner border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-left cursor-pointer"
          >
            {cleaningOptions.fixExcessiveLineBreaks ? (
              <CheckSquare className="h-4 w-4 text-green-primary shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-text-muted shrink-0" />
            )}
            <span className="text-xs font-semibold text-text-main">
              Corrigir quebras de linha excessivas
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleOption("joinHyphenatedWords")}
            className="flex items-center gap-3 p-3.5 bg-card-inner border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-left cursor-pointer"
          >
            {cleaningOptions.joinHyphenatedWords ? (
              <CheckSquare className="h-4 w-4 text-green-primary shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-text-muted shrink-0" />
            )}
            <span className="text-xs font-semibold text-text-main">
              Juntar palavras hifenizadas no fim da linha
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleOption("removeEmptyPages")}
            className="flex items-center gap-3 p-3.5 bg-card-inner border border-border-main hover:border-green-primary/50 rounded-2xl transition-all text-left cursor-pointer"
          >
            {cleaningOptions.removeEmptyPages ? (
              <CheckSquare className="h-4 w-4 text-green-primary shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-text-muted shrink-0" />
            )}
            <span className="text-xs font-semibold text-text-main">
              Ignorar páginas totalmente sem texto
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
