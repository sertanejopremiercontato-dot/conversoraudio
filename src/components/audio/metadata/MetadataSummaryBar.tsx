import React from "react";
import { CheckCircle2, AlertTriangle, Image as ImageIcon, Database, FileText, RefreshCw } from "lucide-react";
import { AnalysisSummaryStats, AudioMetadataModel } from "../../../types/audioMetadata";

interface MetadataSummaryBarProps {
  model: AudioMetadataModel;
  stats: AnalysisSummaryStats;
  onResetClick: () => void;
}

export const MetadataSummaryBar: React.FC<MetadataSummaryBarProps> = ({
  model,
  stats,
  onResetClick
}) => {
  return (
    <div className="w-full bg-card-main border border-border-main rounded-3xl p-6 shadow-lg space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-primary/10 border border-green-primary/20 text-green-primary flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-green-primary/20 text-green-primary px-2.5 py-0.5 rounded-full border border-green-primary/30">
                ANÁLISE GRATUITA CONCLUÍDA
              </span>
              <span className="text-xs font-bold text-text-sec">Formato {model.format}</span>
            </div>
            <h3 className="text-lg font-black text-text-main mt-0.5 truncate max-w-md">
              {model.filename}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetClick}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card-inner border border-border-main text-text-sec hover:text-text-main hover:border-green-primary/50 text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Analisar outro áudio
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card-inner border border-border-main flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-primary/10 text-green-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-black text-text-main">{stats.totalMetadataFound}</p>
            <p className="text-[11px] font-bold text-text-sec">Metadados encontrados</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card-inner border border-border-main flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-black text-text-main">{stats.embeddedCoversCount}</p>
            <p className="text-[11px] font-bold text-text-sec">Capa incorporada</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card-inner border border-border-main flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-black text-text-main">{stats.technicalTagsCount}</p>
            <p className="text-[11px] font-bold text-text-sec">Campos técnicos</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card-inner border border-border-main flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-black text-text-main">{stats.removableFieldsCount}</p>
            <p className="text-[11px] font-bold text-text-sec">Informações removíveis</p>
          </div>
        </div>
      </div>

      {/* Legend / Visual Indicators */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1 border-t border-border-main/50">
        <span className="text-text-sec text-[11px] uppercase tracking-wider font-extrabold">Legenda:</span>
        <div className="inline-flex items-center gap-1.5 text-green-primary bg-green-primary/10 px-2.5 py-1 rounded-lg">
          <CheckCircle2 className="h-3.5 w-3.5" /> ✓ Encontrado
        </div>
        <div className="inline-flex items-center gap-1.5 text-text-sec bg-card-inner px-2.5 py-1 rounded-lg">
          <span className="font-mono">—</span> Não encontrado
        </div>
        <div className="inline-flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
          <AlertTriangle className="h-3.5 w-3.5" /> ⚠ Informação que pode ser removida
        </div>
      </div>
    </div>
  );
};
