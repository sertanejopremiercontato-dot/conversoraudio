import React, { useRef } from "react";
import { AudioCoverArt } from "../../../../types/audioMetadata";
import { Image as ImageIcon, Upload, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface ArtworkEditorV2Props {
  cover?: AudioCoverArt | null;
  onUpdateCover: (cover?: AudioCoverArt | null) => void;
}

export const ArtworkEditorV2: React.FC<ArtworkEditorV2Props> = ({
  cover,
  onUpdateCover
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          onUpdateCover({
            dataUrl,
            mimeType: file.type || "image/jpeg",
            format: file.type.split("/")[1] || "jpeg",
            sizeBytes: file.size,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            typeDescription: "Capa Personalizada"
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleRemoveCover = () => {
    onUpdateCover(undefined);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-sky-500" />
          <span>Capa do Álbum / Artwork</span>
        </h4>
        {cover ? (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
            Capa Presente
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            Sem Capa
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Visual Preview */}
        <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-inner group">
          {cover?.dataUrl ? (
            <img
              src={cover.dataUrl}
              alt="Capa do Álbum"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-3 space-y-1">
              <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-[10px] text-slate-400 font-medium">Nenhuma capa encontrada</p>
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="flex-1 space-y-3 w-full text-xs">
          {cover ? (
            <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Tipo MIME:</span>
                <span className="font-mono font-medium">{cover.mimeType}</span>
              </div>
              {cover.width && cover.height && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Dimensões:</span>
                  <span className="font-mono font-medium">{cover.width} x {cover.height} px</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Tamanho:</span>
                <span className="font-mono font-medium">
                  {(cover.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              Adicione uma imagem JPEG ou PNG quadrada para servir como capa oficial do arquivo exportado.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{cover ? "Substituir Capa" : "Adicionar Capa"}</span>
            </button>

            {cover && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Capa</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
