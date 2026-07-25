import React from "react";
import { ParsedSheet } from "../../../services/document/excelReaderService";
import { FileSpreadsheet, CheckSquare, Square, Edit3, Trash2, Layers, AlertTriangle } from "lucide-react";

interface ExcelSheetSelectorProps {
  filename: string;
  filesize: number;
  sheets: ParsedSheet[];
  onSheetsChange: (updatedSheets: ParsedSheet[]) => void;
  onResetFile: () => void;
}

export default function ExcelSheetSelector({
  filename,
  filesize,
  sheets,
  onSheetsChange,
  onResetFile
}: ExcelSheetSelectorProps) {
  const selectedCount = sheets.filter((s) => s.selected).length;

  const toggleSelectAll = (select: boolean) => {
    const updated = sheets.map((s) => ({ ...s, selected: select }));
    onSheetsChange(updated);
  };

  const toggleSheet = (id: string) => {
    const updated = sheets.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s));
    onSheetsChange(updated);
  };

  const handleCustomNameChange = (id: string, newName: string) => {
    const updated = sheets.map((s) => (s.id === id ? { ...s, customName: newName } : s));
    onSheetsChange(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      {/* File Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm md:text-base text-slate-100 truncate max-w-xs md:max-w-md">
              {filename}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatSize(filesize)} • {sheets.length} {sheets.length === 1 ? "planilha encontrada" : "planilhas encontradas"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetFile}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
          <span>Trocar arquivo</span>
        </button>
      </div>

      {/* Sheet Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          <h3 className="font-display font-bold text-sm text-slate-100">
            Selecione as Abas para Converter ({selectedCount} de {sheets.length} selecionadas)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => toggleSelectAll(true)}
            className="text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            Selecionar todas
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={() => toggleSelectAll(false)}
            className="text-slate-400 hover:underline font-semibold cursor-pointer"
          >
            Desmarcar todas
          </button>
        </div>
      </div>

      {/* Sheets List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sheets.map((sheet, idx) => (
          <div
            key={sheet.id}
            onClick={() => toggleSheet(sheet.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              sheet.selected
                ? "bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-500/5"
                : "bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-100"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSheet(sheet.id);
                  }}
                  className="text-emerald-400 focus:outline-none shrink-0 cursor-pointer"
                >
                  {sheet.selected ? (
                    <CheckSquare className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-600" />
                  )}
                </button>

                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Aba {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={sheet.customName}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleCustomNameChange(sheet.id, e.target.value)}
                    className="bg-transparent font-bold text-xs text-slate-200 border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none w-full truncate"
                    title="Clique para renomear a aba para o PDF"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-medium">
              <span>{sheet.rowCount} linhas x {sheet.colCount} colunas</span>
              {sheet.hasCharts && (
                <span className="text-amber-400 flex items-center gap-1" title="Contém gráficos ou desenhos">
                  <AlertTriangle className="h-3 w-3" /> Gráficos
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCount === 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs text-center font-semibold">
          Selecione pelo menos uma aba para prosseguir com a conversão.
        </div>
      )}
    </div>
  );
}
