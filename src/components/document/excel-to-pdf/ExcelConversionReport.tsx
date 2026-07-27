import React from "react";
import { ConversionReportData } from "../../../services/document/excelToPdfService";
import { FileCheck, AlertTriangle, Info, Layers, CheckCircle } from "lucide-react";

interface ExcelConversionReportProps {
  report: ConversionReportData;
}

export default function ExcelConversionReport({ report }: ExcelConversionReportProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
          <FileCheck className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-display font-bold text-base text-slate-100">
            Relatório de Conversão de Documento
          </h4>
          <p className="text-xs text-slate-400">Resumo do processamento realizado localmente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Abas Convertidas ({report.convertedSheets.length})
          </span>
          <p className="text-slate-200 font-semibold truncate">
            {report.convertedSheets.join(", ") || "Nenhuma"}
          </p>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Células Processadas
          </span>
          <p className="text-slate-200 font-semibold">
            {report.totalCellsProcessed.toLocaleString("pt-BR")} células
          </p>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Configuração
          </span>
          <p className="text-slate-200 font-semibold">
            {report.pageSizeUsed} • Orientação {report.orientationUsed}
          </p>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Páginas Geradas
          </span>
          <p className="text-slate-200 font-semibold">
            {report.generatedPagesCount} {report.generatedPagesCount === 1 ? "página" : "páginas"}
            {report.processingTimeMs ? ` (${(report.processingTimeMs / 1000).toFixed(2)}s)` : ""}
          </p>
        </div>

        {(report.imagesDetectedCount !== undefined && report.imagesDetectedCount > 0) && (
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Imagens Embutidas
            </span>
            <p className="text-slate-200 font-semibold">
              {report.imagesInsertedCount || 0} de {report.imagesDetectedCount} inseridas no PDF
            </p>
          </div>
        )}

        {(report.chartsDetectedCount !== undefined && report.chartsDetectedCount > 0) && (
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Gráficos Detectados
            </span>
            <p className="text-amber-400 font-semibold">
              {report.chartsDetectedCount} gráfico(s) (aviso exibido)
            </p>
          </div>
        )}
      </div>

      {report.skippedSheets.length > 0 && (
        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
          <span className="font-bold text-slate-300 block">Abas não incluídas:</span>
          <p>{report.skippedSheets.join(", ")}</p>
        </div>
      )}

      {/* Warnings or Unsupported Features */}
      {report.unsupportedFeatures.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Recursos do Excel não suportados no PDF estático:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-200/90">
            {report.unsupportedFeatures.map((feat, idx) => (
              <li key={idx}>{feat}</li>
            ))}
          </ul>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Info className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Avisos de processamento:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-400">
            {report.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
