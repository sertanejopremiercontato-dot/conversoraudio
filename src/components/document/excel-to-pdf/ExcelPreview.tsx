import React, { useState } from "react";
import { ParsedSheet } from "../../../services/document/excelReaderService";
import { PrintSettings, PAGE_SIZES, MARGINS } from "../../../utils/document/excelPrintSettings";
import { calculatePageChunksForSheet } from "../../../utils/document/excelPageCalculator";
import { formatCellValueForDisplay } from "../../../utils/document/excelCellFormatter";
import { Eye, FileText, Maximize2, X, ZoomIn } from "lucide-react";

interface ExcelPreviewProps {
  sheet: ParsedSheet;
  settings: PrintSettings;
}

export default function ExcelPreview({ sheet, settings }: ExcelPreviewProps) {
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
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-100">
              Prévia Leve do Documento ({sheet.customName || sheet.name})
            </h3>
            <p className="text-xs text-slate-400">
              Área estimada: {sheet.rowCount} linhas x {sheet.colCount} colunas • ~{estimatedPages} {estimatedPages === 1 ? "página estimada" : "páginas estimadas"} no PDF
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Visualizar página</span>
        </button>
      </div>

      {/* Mini Table Preview */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-2">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-400 font-mono text-[10px]">
              <th className="p-2 border border-slate-800 w-10 text-center bg-slate-950">#</th>
              {cols.map((c) => (
                <th key={c} className="p-2 border border-slate-800 min-w-[80px] text-center font-bold">
                  {colLetter(c)}
                </th>
              ))}
              {sheet.maxCol > previewMaxCol && (
                <th className="p-2 border border-slate-800 text-slate-600 text-center">...</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r} className="hover:bg-slate-900/40">
                <td className="p-2 border border-slate-800 text-center font-mono text-[10px] text-slate-500 bg-slate-950">
                  {r + 1}
                </td>
                {cols.map((c) => {
                  const cell = sheet.cells[`${r}_${c}`];
                  const formatted = cell ? formatCellValueForDisplay(cell) : "";
                  return (
                    <td
                      key={c}
                      className={`p-2 border border-slate-800 text-slate-200 truncate max-w-[120px] ${
                        cell?.bold ? "font-bold" : ""
                      } ${cell?.align === "right" ? "text-right" : cell?.align === "center" ? "text-center" : "text-left"}`}
                      title={formatted}
                    >
                      {formatted}
                    </td>
                  );
                })}
                {sheet.maxCol > previewMaxCol && (
                  <td className="p-2 border border-slate-800 text-slate-600 text-center">...</td>
                )}
              </tr>
            ))}
            {sheet.maxRow > previewMaxRow && (
              <tr>
                <td colSpan={cols.length + 2} className="p-2 border border-slate-800 text-center text-slate-500 italic text-[11px]">
                  Mais {sheet.maxRow - previewMaxRow} linhas serão incluídas no PDF final...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Page Preview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display font-bold text-base text-slate-100">
                  Visualização de Páginas Estimadas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {chunks.map((chunk, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>Página {idx + 1} de {chunks.length} ({chunk.sheetCustomName})</span>
                    <span>Orientação: {chunk.orientation === "landscape" ? "Paisagem" : "Retrato"}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Exibindo linhas {chunk.startRow + 1} até {chunk.endRow + 1} • Colunas {colLetter(chunk.startCol)} até {colLetter(chunk.endCol)} • Escala: {Math.round(chunk.scale * 100)}%
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
