import React, { useState } from "react";
import { Image as ImageIcon, Upload, Trash2, X, ArrowRight, Check } from "lucide-react";
import { AudioMetadataModel, AudioCoverArt } from "../../../types/audioMetadata";

interface MetadataCoverManagerProps {
  model: AudioMetadataModel;
  onSubmitForProcessing: (updatedModel: AudioMetadataModel) => void;
  onCancel: () => void;
}

export const MetadataCoverManager: React.FC<MetadataCoverManagerProps> = ({
  model,
  onSubmitForProcessing,
  onCancel
}) => {
  const [cover, setCover] = useState<AudioCoverArt | null>(model.cover || null);

  const handleUploadNewCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCover({
            dataUrl: event.target.result as string,
            mimeType: file.type || "image/jpeg",
            format: (file.type || "jpeg").split("/")[1],
            sizeBytes: file.size
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    const updatedModel: AudioMetadataModel = {
      ...model,
      cover
    };
    onSubmitForProcessing(updatedModel);
  };

  return (
    <div className="w-full bg-card-main border border-border-main rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-main pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 px-2.5 py-0.5 rounded-full border border-blue-500/20">
            GERENCIADOR DE ARTE DO ÁLBUM
          </span>
          <h3 className="text-xl font-black text-text-main mt-1 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-500" />
            {model.cover ? "Trocar ou Remover Capa" : "Adicionar Capa ao Áudio"}
          </h3>
          <p className="text-xs text-text-sec mt-0.5">
            Adicione, substitua ou remova a imagem embutida no arquivo de áudio.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2.5 rounded-xl bg-card-inner border border-border-main text-text-sec hover:text-text-main transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-8 rounded-2xl bg-card-inner border border-border-main flex flex-col items-center justify-center text-center space-y-5">
        {cover ? (
          <div className="space-y-3">
            <img
              src={cover.dataUrl}
              alt="Capa do Áudio"
              className="w-48 h-48 object-cover rounded-2xl border-2 border-border-main shadow-lg mx-auto"
            />
            <p className="text-xs font-bold text-text-main">
              Formato: <span className="uppercase">{cover.format}</span> • {(cover.sizeBytes / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border-main bg-card-main flex items-center justify-center text-text-sec mx-auto">
              <ImageIcon className="h-10 w-10 opacity-30" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">Nenhuma capa configurada</p>
              <p className="text-xs text-text-sec">Selecione uma imagem para embutir na música</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-extrabold text-xs cursor-pointer transition-all shadow-md shadow-blue-500/20">
            <Upload className="h-4 w-4" />
            {cover ? "Escolher Outra Imagem" : "Selecionar Imagem do Computador"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUploadNewCover}
              className="hidden"
            />
          </label>

          {cover && (
            <button
              type="button"
              onClick={() => setCover(null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" /> Remover Capa
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border-main">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-card-inner border border-border-main text-text-sec hover:text-text-main font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleApply}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-green-primary text-bg-main hover:bg-green-light font-black text-xs transition-all shadow-lg shadow-green-primary/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Avançar: Processar e Baixar</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
