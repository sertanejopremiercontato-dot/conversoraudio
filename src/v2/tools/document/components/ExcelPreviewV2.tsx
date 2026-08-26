import React, { useState } from "react";
import { ParsedSheet } from "../../../../services/document/excelReaderService";
import { PrintSettings } from "../../../../utils/document/excelPrintSettings";
import { calculatePageChunksForSheet } from "../../../../utils/document/excelPageCalculator";
import { formatCellValueForDisplay } from "../../../../utils/document/excelCellFormatter";
import { Eye, FileText, Maximize2, X } from "lucide-react";

interface ExcelPreviewV2Props {
  sheet: ParsedSheet;
  settings: PrintSettings;
}

export const ExcelPreviewV2: React.FC<ExcelPreviewV2Props> = ({ sheet, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const chunks = calculatePageChunksForSheet(sheet, settings);
  const estimatedPages = Math.max(1, chunks.length);

  // Preview first 8 rows and 8 columns
  const previewMaxRow = Math.min(sheet.maxRow, sheet.minRow + 7);
  const previewMaxCol = Math.min(sheet.maxCol, sheet.minCol + 7);

  const rows: number[] = [];
  for (let r = sheet.minRow; r <= previewMaxRow; r++) rows.push(r);

  const cols: number[] = [];
  for (let c = sheet.minCol; c <= previewMaxCol; c++) cols.push(c);

  const colLetter = (colIdx: number) => {
    let temp = colIdx + 1;
    let letter = "";
    while (temp > 0) {
      let mod = (temp - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      temp = Math.floor((temp - mod) / 26);
    }
    return letter;
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#E0F2FE] text-[#0284C7] rounded-xl border border-[#BAE6FD]">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm sm:text-base text-[#0F172A]">
              Pré-visualização da Planilha ({sheet.customName || sheet.name})
            </h4>
            <p className="text-xs text-[#475569]">
              Área de dados: {sheet.rowCount} linhas × {sheet.colCount} colunas • ~{estimatedPages} {estimatedPages === 1 ? "página estimada" : "páginas estimadas"} no PDF
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold rounded-xl text-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Expandir Grade</span>
        </button>
      </div>

      {/* Mini Data Grid */}
      <div className="overflow-x-auto rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#E2E8F0]/70 text-[#475569] font-bold border-b border-[#CBD5E1]">
              <th className="p-2 text-center border-r border-[#CBD5E1] w-10 text-[11px]">#</th>
              {cols.map((c) => (
                <th key={c} className="p-2 border-r border-[#CBD5E1] min-w-[90px] text-[11px]">
                  {colLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, rIdx) => (
              <tr key={r} className={rIdx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"}>
                <td className="p-2 text-center border-r border-b border-[#CBD5E1] font-bold text-[#64748B] text-[11px] bg-[#E2E8F0]/30">
                  {r + 1}
                </td>
                {cols.map((c) => {
                  const cell = sheet.cells?.[`${r},${c}`];
                  const displayVal = cell ? formatCellValueForDisplay(cell) : "";
                  return (
                    <td
                      key={c}
                      className="p-2 border-r border-b border-[#CBD5E1] truncate max-w-[120px] text-[#0F172A]"
                      title={displayVal}
                    >
                      {displayVal || <span className="text-[#CBD5E1]">-</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0284C7]" />
                <h3 className="font-bold text-base text-[#0F172A]">
                  Estrutura da Planilha: {sheet.customName || sheet.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#E2E8F0] text-[#475569] font-bold">
                    <th className="p-2 text-center border border-[#CBD5E1] w-12 text-[11px]">#</th>
                    {cols.map((c) => (
                      <th key={c} className="p-2 border border-[#CBD5E1] min-w-[110px] text-[11px]">
                        {colLetter(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r}>
                      <td className="p-2 text-center border border-[#CBD5E1] font-bold text-[#64748B] text-[11px] bg-[#F1F5F9]">
                        {r + 1}
                      </td>
                      {cols.map((c) => {
                        const cell = sheet.cells?.[`${r},${c}`];
                        const displayVal = cell ? formatCellValueForDisplay(cell) : "";
                        return (
                          <td key={c} className="p-2 border border-[#CBD5E1] text-[#0F172A]">
                            {displayVal || <span className="text-[#CBD5E1]">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
