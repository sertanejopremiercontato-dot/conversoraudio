import React from "react";
import { ParsedSheet } from "../../../../services/document/excelReaderService";
import { FileSpreadsheet, CheckSquare, Square, Edit3, Trash2, Layers, RefreshCw } from "lucide-react";

interface ExcelSheetSelectorV2Props {
  filename: string;
  filesize: number;
  sheets: ParsedSheet[];
  onSheetsChange: (updatedSheets: ParsedSheet[]) => void;
  onResetFile: () => void;
}

export const ExcelSheetSelectorV2: React.FC<ExcelSheetSelectorV2Props> = ({
  filename,
  filesize,
  sheets,
  onSheetsChange,
  onResetFile
}) => {
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
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* File Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#E0F2FE] text-[#0284C7] rounded-2xl border border-[#BAE6FD]">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm sm:text-base text-[#0F172A] truncate max-w-xs sm:max-w-md">
              {filename}
            </h4>
            <p className="text-xs text-[#475569] mt-0.5">
              {formatSize(filesize)} • {sheets.length} {sheets.length === 1 ? "planilha detectada" : "planilhas detectadas"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetFile}
          className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-xl px-3.5 py-2 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Trocar arquivo</span>
        </button>
      </div>

      {/* Sheet List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#0284C7]" />
          <h5 className="font-display font-bold text-xs sm:text-sm text-[#0F172A]">
            Selecione as Abas para Converter em PDF ({selectedCount}/{sheets.length})
          </h5>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSelectAll(true)}
            className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer"
          >
            Marcar todas
          </button>
          <span className="text-[#CBD5E1]">•</span>
          <button
            type="button"
            onClick={() => toggleSelectAll(false)}
            className="text-[11px] font-bold text-[#64748B] hover:underline cursor-pointer"
          >
            Desmarcar todas
          </button>
        </div>
      </div>

      {/* Sheet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sheets.map((sheet) => {
          const cellCount = Object.keys(sheet.cells || {}).length;
          const isSelected = sheet.selected;

          return (
            <div
              key={sheet.id}
              onClick={() => toggleSheet(sheet.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 select-none ${
                isSelected
                  ? "bg-[#F0F9FF] border-[#0284C7] shadow-xs"
                  : "bg-[#F8FAFC] border-[#E2E8F0] opacity-60 hover:opacity-100 hover:border-[#CBD5E1]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-[#0284C7] shrink-0">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 fill-[#0284C7] text-white" />
                    ) : (
                      <Square className="h-5 w-5 text-[#94A3B8]" />
                    )}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#0F172A] truncate">
                    {sheet.customName || sheet.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#E2E8F0]/60">
                <span>{sheet.rowCount} linhas × {sheet.colCount} cols</span>
                <span>{cellCount} células</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
