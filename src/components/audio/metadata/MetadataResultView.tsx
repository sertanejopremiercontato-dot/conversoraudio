import React, { useState } from "react";
import { Download, ShieldCheck, CheckCircle2, Edit3, RotateCcw, FileAudio, ArrowRight, Save } from "lucide-react";
import {
  AudioMetadataModel,
  AudioValidationResult,
  BeforeAfterItem,
  ProcessingStats
} from "../../../types/audioMetadata";

interface MetadataResultViewProps {
  processedBlob: Blob;
  outputFilename: string;
  initialModel: AudioMetadataModel;
  reanalyzedModel: AudioMetadataModel;
  stats: ProcessingStats;
  validation: AudioValidationResult;
  diffList: BeforeAfterItem[];
  onEditAgain: () => void;
  onProcessAnother: () => void;
}

export const MetadataResultView: React.FC<MetadataResultViewProps> = ({
  processedBlob,
  outputFilename,
  initialModel,
  reanalyzedModel,
  stats,
  validation,
  diffList,
  onEditAgain,
  onProcessAnother
}) => {
  const [filename, setFilename] = useState(outputFilename);

  // Compute real count before vs after from reanalyzed model
  const totalBefore = initialModel.rawTagsList.length + (initialModel.cover ? 1 : 0) + (initialModel.title ? 1 : 0) + (initialModel.artist ? 1 : 0);
  const totalAfter = reanalyzedModel.rawTagsList.length + (reanalyzedModel.cover ? 1 : 0) + (reanalyzedModel.title ? 1 : 0) + (reanalyzedModel.artist ? 1 : 0);

  const handleDownload = () => {
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "audio-processado.mp3";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
      {/* SUCCESS HEADER BANNER */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-[#10B981] text-white px-3 py-1 rounded-full">
          REANÁLISE E VALIDAÇÃO CONCLUÍDAS
        </span>
        <h2 className="text-2xl font-black text-[#0F172A]">
          Arquivo Gerado e Verificado com Sucesso!
        </h2>
        <p className="text-xs text-[#475569] max-w-xl mx-auto font-medium">
          {validation.message}
        </p>
      </div>

      {/* BEFORE VS AFTER VERIFICATION BOX (REQUIREMENT 16) */}
      <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
        <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> VERIFICAÇÃO PÓS-PROCESSAMENTO (ANTES vs DEPOIS)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1">
            <p className="text-[11px] font-bold text-[#475569]">Metadados Antes</p>
            <p className="text-xl font-black text-amber-600">{totalBefore}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1">
            <p className="text-[11px] font-bold text-[#475569]">Metadados Depois</p>
            <p className="text-xl font-black text-[#10B981]">{totalAfter}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1">
            <p className="text-[11px] font-bold text-[#475569]">Capa do Álbum</p>
            <p className="text-xs font-black text-[#0F172A]">
              {reanalyzedModel.cover ? "Mantida / Presente" : "Removida"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1">
            <p className="text-[11px] font-bold text-[#475569]">Encoder / Software</p>
            <p className="text-xs font-black text-[#0F172A]">
              {reanalyzedModel.encoder ? "Presente" : "Removido"}
            </p>
          </div>
        </div>

        {/* Audit Diff Table */}
        {diffList.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-extrabold text-[#0F172A] mb-2">Resumo das alterações realizadas:</p>
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full text-left text-xs border-collapse bg-white">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] uppercase text-[10px]">
                    <th className="py-2 px-3">CAMPO</th>
                    <th className="py-2 px-3">VALOR ANTES</th>
                    <th className="py-2 px-3">VALOR DEPOIS</th>
                    <th className="py-2 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {diffList.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-bold text-[#0F172A]">{item.fieldLabel}</td>
                      <td className="py-2 px-3 text-[#475569] truncate max-w-xs">{item.beforeVal}</td>
                      <td className="py-2 px-3 text-[#0F172A] truncate max-w-xs">{item.afterVal}</td>
                      <td className="py-2 px-3 font-bold">
                        {item.status === "removed" && <span className="text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">Removido</span>}
                        {item.status === "modified" && <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Modificado</span>}
                        {item.status === "added" && <span className="text-[#10B981] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Adicionado</span>}
                        {item.status === "kept" && <span className="text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded">Mantido</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FILENAME EDIT & DOWNLOAD (REQUIREMENT 20) */}
      <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
        <div>
          <label className="block text-xs font-black text-[#0F172A] uppercase tracking-wider mb-1 flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-[#0284C7]" /> Nome do arquivo para download
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-4 px-6 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
        >
          <Download className="h-5 w-5" />
          <span>BAIXAR ARQUIVO FINAL ({formatSize(processedBlob.size)})</span>
        </button>
      </div>

      {/* REQUIREMENT 17: EDITAR DADOS DO ARQUIVO DEPOIS DA LIMPEZA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onEditAgain}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0284C7] hover:bg-[#E0F2FE] font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Edit3 className="h-4 w-4" />
          <span>EDITAR DADOS DO ARQUIVO</span>
        </button>

        <button
          type="button"
          onClick={onProcessAnother}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>PROCESSAR OUTRO ARQUIVO</span>
        </button>
      </div>
    </div>
  );
};
