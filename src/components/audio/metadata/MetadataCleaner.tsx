import { useState } from "react";
import { Trash2, AlertTriangle, ArrowRight, X, Check, ShieldCheck } from "lucide-react";
import { AudioMetadataModel, AnalysisSummaryStats, CleanOptions } from "../../../types/audioMetadata";

interface MetadataCleanerProps {
  model: AudioMetadataModel;
  stats: AnalysisSummaryStats;
  onSubmitClean: (options: CleanOptions) => void;
  onCancel: () => void;
}

export const MetadataCleaner: React.FC<MetadataCleanerProps> = ({
  model,
  stats,
  onSubmitClean,
  onCancel
}) => {
  // Checkboxes as specified in Requirement 14
  const [wipeAll, setWipeAll] = useState(true);
  const [removeMainMetadata, setRemoveMainMetadata] = useState(true);
  const [removeCover, setRemoveCover] = useState(true);
  const [removeComments, setRemoveComments] = useState(true);
  const [removeSoftwareEncoder, setRemoveSoftwareEncoder] = useState(true);
  const [removeTechnicalTags, setRemoveTechnicalTags] = useState(true);
  const [removePrivateTags, setRemovePrivateTags] = useState(true);
  const [removeCustomTags, setRemoveCustomTags] = useState(true);
  const [removeLyrics, setRemoveLyrics] = useState(true);
  const [removeCopyright, setRemoveCopyright] = useState(true);
  const [removeUrls, setRemoveUrls] = useState(true);

  const handleToggleWipeAll = (checked: boolean) => {
    setWipeAll(checked);
    if (checked) {
      setRemoveMainMetadata(true);
      setRemoveCover(true);
      setRemoveComments(true);
      setRemoveSoftwareEncoder(true);
      setRemoveTechnicalTags(true);
      setRemovePrivateTags(true);
      setRemoveCustomTags(true);
      setRemoveLyrics(true);
      setRemoveCopyright(true);
      setRemoveUrls(true);
    }
  };

  const handleToggleSubOption = (setter: (val: boolean) => void, val: boolean) => {
    setter(val);
    if (!val) {
      setWipeAll(false);
    }
  };

  const handleExecute = () => {
    onSubmitClean({
      wipeAll,
      removeMainMetadata,
      removeCover,
      removeComments,
      removeSoftwareEncoder,
      removeTechnicalTags,
      removePrivateTags,
      removeCustomTags,
      removeLyrics,
      removeCopyright,
      removeUrls
    });
  };

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full">
            CONFIRMAÇÃO DE LIMPEZA
          </span>
          <h3 className="text-xl font-black text-[#0F172A] mt-2 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-amber-500" /> O que deseja remover do áudio?
          </h3>
          <p className="text-xs text-[#475569] mt-1">
            Selecione quais dados e marcas de identificação você deseja apagar do arquivo sem re-encodar o som.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* RECOMMENDED OPTION HIGHLIGHTED */}
      <div
        onClick={() => handleToggleWipeAll(!wipeAll)}
        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
          wipeAll
            ? "bg-amber-50 border-amber-500 shadow-sm"
            : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-amber-400"
        }`}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={wipeAll}
            onChange={(e) => handleToggleWipeAll(e.target.checked)}
            className="w-5 h-5 rounded text-amber-500 focus:ring-0 cursor-pointer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#0F172A]">LIMPEZA COMPLETA</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#0284C7] text-white px-2 py-0.5 rounded-full">
                RECOMENDADO
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-0.5">
              Remover 100% dos metadados, comentários, capas, marcas do software/encoder e tags ocultas.
            </p>
          </div>
        </div>

        <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0" />
      </div>

      {/* INDIVIDUAL CHECKBOX OPTIONS (REQUIREMENT 14) */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
          Ou selecione opções específicas:
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeMainMetadata}
              onChange={(e) => handleToggleSubOption(setRemoveMainMetadata, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover título / artista / álbum</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeCover}
              onChange={(e) => handleToggleSubOption(setRemoveCover, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover capa</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeComments}
              onChange={(e) => handleToggleSubOption(setRemoveComments, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover comentários</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeSoftwareEncoder}
              onChange={(e) => handleToggleSubOption(setRemoveSoftwareEncoder, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover software / encoder</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeTechnicalTags}
              onChange={(e) => handleToggleSubOption(setRemoveTechnicalTags, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover tags técnicas</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removePrivateTags}
              onChange={(e) => handleToggleSubOption(setRemovePrivateTags, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover tags privadas</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeCustomTags}
              onChange={(e) => handleToggleSubOption(setRemoveCustomTags, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover tags personalizadas</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeLyrics}
              onChange={(e) => handleToggleSubOption(setRemoveLyrics, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover letras</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeCopyright}
              onChange={(e) => handleToggleSubOption(setRemoveCopyright, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover copyright</span>
          </label>

          <label className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={removeUrls}
              onChange={(e) => handleToggleSubOption(setRemoveUrls, e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-[#0F172A]">Remover URLs</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleExecute}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>EXAMINAR E LIMPAR AGORA</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
