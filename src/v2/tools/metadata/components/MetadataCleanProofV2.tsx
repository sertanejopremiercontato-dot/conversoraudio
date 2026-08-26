import React from "react";
import { RawMetadataItem } from "../../../../types/audioMetadata";
import { CheckCircle2, AlertTriangle, ShieldCheck, FileAudio, Check, X, ArrowRight } from "lucide-react";

export interface CleanAuditItem {
  type: string;
  field: string;
  valueBefore: string;
  status: "REMOVIDO" | "NÃO REMOVIDO" | "PRESERVADO (TÉCNICO)";
}

interface MetadataCleanProofV2Props {
  beforeRemovableCount: number;
  beforeTechnicalCount: number;
  afterRemovableCount: number;
  afterTechnicalCount: number;
  auditList: CleanAuditItem[];
  isCompleteWipe: boolean;
  onProceedToEdit: () => void;
}

export const MetadataCleanProofV2: React.FC<MetadataCleanProofV2Props> = ({
  beforeRemovableCount,
  beforeTechnicalCount,
  afterRemovableCount,
  afterTechnicalCount,
  auditList,
  isCompleteWipe,
  onProceedToEdit
}) => {
  const isFullyClean = afterRemovableCount === 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-sm space-y-6" id="secao-comprovacao-limpeza">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 dark:border-emerald-950 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                COMPROVAÇÃO DA LIMPEZA
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                isFullyClean 
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" 
                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              }`}>
                {isFullyClean ? "100% Limpo (Verificado por Releitura)" : "Limpeza Parcial"}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Resultado Comprovado por Releitura Física do Binário Gerado
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceedToEdit}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-center"
        >
          <span>Avançar para Editar Metadados</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Comparison Metrics Grid: ANTES vs DEPOIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* ANTES DA LIMPEZA */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
            <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              ANTES DA LIMPEZA
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Arquivo Original</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Metadados Removíveis</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                {beforeRemovableCount}
              </span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tags Técnicas (Leitura)</span>
              <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                {beforeTechnicalCount}
              </span>
            </div>
          </div>
        </div>

        {/* DEPOIS DA LIMPEZA */}
        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-900/60 pb-2">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider text-[11px]">
              DEPOIS DA LIMPEZA (RELIDO)
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Releitura Real</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Metadados Restantes</span>
              <span className={`text-lg font-black ${afterRemovableCount === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
                {afterRemovableCount}
              </span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tags Técnicas Preservadas</span>
              <span className="text-lg font-black text-sky-600 dark:text-sky-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> {afterTechnicalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Verification Notice */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Stream de Áudio Intacto (Lossless Bitstream):
          </span>{" "}
          Os blocos de áudio (PCM / MPEG Frames) foram preservados bit a bit sem qualquer reencodificação sonora.
        </div>
      </div>

      {/* Proof Table: TIPO | CAMPO/TAG | VALOR ANTES | STATUS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Auditoria Detalhada Campo a Campo
          </h4>
          <span className="text-[11px] text-slate-500">
            {auditList.length} itens auditados
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-4">Tipo / Container</th>
                  <th className="p-3">Campo / Tag</th>
                  <th className="p-3">Valor Antes</th>
                  <th className="p-3 pr-4 text-center">Status Comprovado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {auditList.length > 0 ? (
                  auditList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 pl-4 whitespace-nowrap font-sans font-medium text-slate-700 dark:text-slate-300">
                        {item.type}
                      </td>
                      <td className="p-3 whitespace-nowrap font-bold text-sky-600 dark:text-sky-400">
                        {item.field}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-sans break-all max-w-xs">
                        {item.valueBefore}
                      </td>
                      <td className="p-3 pr-4 text-center whitespace-nowrap font-sans">
                        {item.status === "REMOVIDO" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <Check className="w-3 h-3" /> REMOVIDO
                          </span>
                        ) : item.status === "PRESERVADO (TÉCNICO)" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            PRESERVADO (TÉCNICO)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <X className="w-3 h-3" /> NÃO REMOVIDO
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 font-sans">
                      Nenhum item removível estava presente para auditoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
