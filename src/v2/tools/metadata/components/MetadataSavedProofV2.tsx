import React from "react";
import { AudioMetadataModel } from "../../../../types/audioMetadata";
import { CheckCircle2, Download, Printer, ShieldCheck, Tag, Music, Disc, User, FileAudio, Check } from "lucide-react";

interface MetadataSavedProofV2Props {
  savedModel: AudioMetadataModel;
  onDownloadFinal: () => void;
  onOpenReport: () => void;
}

export const MetadataSavedProofV2: React.FC<MetadataSavedProofV2Props> = ({
  savedModel,
  onDownloadFinal,
  onOpenReport
}) => {
  const verifiedFields = [
    { label: "Título", value: savedModel.title, icon: Music },
    { label: "Artista", value: savedModel.artist, icon: User },
    { label: "Álbum", value: savedModel.album, icon: Disc },
    { label: "Artista do Álbum", value: savedModel.albumArtist, icon: User },
    { label: "Compositor / Autor", value: savedModel.composer, icon: User },
    { label: "Código ISRC", value: savedModel.isrc, icon: ShieldCheck },
    { label: "Gênero", value: savedModel.genre, icon: Tag },
    { label: "Ano / Data", value: savedModel.year, icon: Tag },
    { label: "Faixa", value: savedModel.trackNumber, icon: Tag },
    { label: "BPM", value: savedModel.bpm, icon: Tag },
    { label: "Copyright", value: savedModel.copyright, icon: ShieldCheck },
    { label: "Editora / Publisher", value: savedModel.publisher, icon: Tag }
  ].filter((f) => !!f.value);

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-sm space-y-6" id="secao-dados-gravados-comprovacao">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 dark:border-emerald-950 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
            <Check className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                SALVO & REVALIDADO
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold">
                Releitura Física Concluída
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Dados Gravados com Sucesso no Arquivo de Áudio
            </h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={onOpenReport}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-500" />
            <span>Gerar / Imprimir Relatório</span>
          </button>

          <button
            type="button"
            onClick={onDownloadFinal}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>BAIXAR ARQUIVO FINAL</span>
          </button>
        </div>
      </div>

      {/* Verified Fields List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            DADOS GRAVADOS & COMPROVADOS POR RELEITURA:
          </h4>
          <span className="text-[11px] text-slate-500">
            {verifiedFields.length} campos confirmados no cabeçalho
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {verifiedFields.length > 0 ? (
            verifiedFields.map((f, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">{f.label}</span>
                <span className="font-bold text-slate-900 dark:text-white break-words mt-0.5 block">
                  {f.value}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-full p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-center">
              Nenhum metadado de texto foi inserido (arquivo gravado apenas com stream de áudio limpo).
            </div>
          )}
        </div>
      </div>

      {/* Stream Protection Badge */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Qualidade Sonora 100% Intacta:
          </span>{" "}
          O áudio foi exportado com os novos cabeçalhos preservando o fluxo de áudio PCM/MPEG original sem conversão ou recompressão.
        </div>
      </div>
    </div>
  );
};
