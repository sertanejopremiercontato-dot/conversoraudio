import React, { useState, useRef } from "react";
import {
  Edit3,
  Save,
  Image as ImageIcon,
  Trash2,
  Upload,
  ArrowRight,
  X,
  Eye,
  CheckCircle2,
  FileAudio
} from "lucide-react";
import { AudioMetadataModel, AudioCoverArt } from "../../../types/audioMetadata";

interface MetadataEditorFormProps {
  model: AudioMetadataModel;
  onSubmitSave: (updatedModel: AudioMetadataModel, outputFilename: string) => void;
  onCancel: () => void;
}

export const MetadataEditorForm: React.FC<MetadataEditorFormProps> = ({
  model,
  onSubmitSave,
  onCancel
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State loaded directly from initial model (Requirement 18)
  const [title, setTitle] = useState(model.title || "");
  const [artist, setArtist] = useState(model.artist || "");
  const [album, setAlbum] = useState(model.album || "");
  const [albumArtist, setAlbumArtist] = useState(model.albumArtist || "");
  const [year, setYear] = useState(model.year || "");
  const [genre, setGenre] = useState(model.genre || "");
  const [composer, setComposer] = useState(model.composer || "");
  const [performer, setPerformer] = useState(model.performer || "");
  const [trackNumber, setTrackNumber] = useState(model.trackNumber || "");
  const [discNumber, setDiscNumber] = useState(model.discNumber || "");
  const [bpm, setBpm] = useState(model.bpm || "");
  const [key, setKey] = useState(model.key || "");
  const [isrc, setIsrc] = useState(model.isrc || "");
  const [copyright, setCopyright] = useState(model.copyright || "");
  const [publisher, setPublisher] = useState(model.publisher || "");
  const [comment, setComment] = useState(model.comment || "");
  const [lyrics, setLyrics] = useState(model.lyrics || "");

  // Cover State
  const [cover, setCover] = useState<AudioCoverArt | null>(model.cover || null);

  // Filename State (Requirement 20)
  const baseName = model.filename.substring(0, model.filename.lastIndexOf(".")) || model.filename;
  const ext = model.format.toLowerCase();
  const [customFilename, setCustomFilename] = useState(`${baseName}-editado.${ext}`);

  // Cover upload handling
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          setCover({
            dataUrl,
            mimeType: imgFile.type || "image/jpeg",
            format: imgFile.type ? imgFile.type.split("/")[1] : "jpeg",
            width: img.naturalWidth,
            height: img.naturalHeight,
            sizeBytes: imgFile.size
          });
        };
      };
      reader.readAsDataURL(imgFile);
    }
  };

  const handleSave = () => {
    const updatedModel: AudioMetadataModel = {
      ...model,
      title,
      artist,
      album,
      albumArtist,
      year,
      genre,
      composer,
      performer,
      trackNumber,
      discNumber,
      bpm,
      key,
      isrc,
      copyright,
      publisher,
      comment,
      lyrics,
      cover
    };

    onSubmitSave(updatedModel, customFilename);
  };

  // Preview List for Requirement 19
  const previewFields = [
    { label: "Título", val: title },
    { label: "Artista", val: artist },
    { label: "Álbum", val: album },
    { label: "Artista do Álbum", val: albumArtist },
    { label: "Ano / Data", val: year },
    { label: "Gênero", val: genre },
    { label: "Compositor", val: composer },
    { label: "Intérprete", val: performer },
    { label: "Número da Faixa", val: trackNumber },
    { label: "Número do Disco", val: discNumber },
    { label: "BPM", val: bpm },
    { label: "Chave / Tom", val: key },
    { label: "ISRC", val: isrc },
    { label: "Copyright", val: copyright },
    { label: "Editora", val: publisher },
    { label: "Comentários", val: comment },
    { label: "Lyrics / Letras", val: lyrics },
    { label: "Capa do Álbum", val: cover ? `Imagem ${cover.format.toUpperCase()} (${(cover.sizeBytes / 1024).toFixed(1)} KB)` : "Sem Capa" }
  ].filter(f => f.val && f.val.trim().length > 0);

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/20 px-3 py-1 rounded-full">
            FORMULÁRIO DE EDIÇÃO
          </span>
          <h3 className="text-xl font-black text-[#0F172A] mt-2 flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-[#0284C7]" /> Editar Metadados do Arquivo
          </h3>
          <p className="text-xs text-[#475569] mt-1">
            Altere, adicione ou remova individualmente qualquer campo desejado.
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

      {/* Cover Section */}
      <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
        <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-600" /> Capa / Arte do Álbum
        </h4>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {cover ? (
            <div className="relative group shrink-0">
              <img
                src={cover.dataUrl}
                alt="Capa do Áudio"
                className="w-28 h-28 object-cover rounded-2xl border border-[#E2E8F0] shadow-sm"
              />
              <button
                type="button"
                onClick={() => setCover(null)}
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                title="Apagar capa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-2 text-center text-[#475569] bg-white shrink-0">
              <ImageIcon className="h-6 w-6 opacity-40 mb-1" />
              <span className="text-[10px] font-bold">Sem capa</span>
            </div>
          )}

          <div className="space-y-2 text-center sm:text-left flex-1">
            <p className="text-xs font-bold text-[#0F172A]">
              {cover ? "Substituir Imagem da Capa" : "Adicionar Imagem da Capa"}
            </p>
            <p className="text-[11px] text-[#475569]">
              Selecione uma imagem JPG ou PNG para incorporar como arte oficial.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 font-bold text-xs hover:bg-purple-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{cover ? "Substituir Capa" : "Carregar Nova Imagem"}</span>
              </button>

              {cover && (
                <button
                  type="button"
                  onClick={() => setCover(null)}
                  className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Apagar Capa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Metadata Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Título da Música</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome da faixa"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Artista / Intérprete</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Nome do artista principal"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Álbum</label>
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="Nome do álbum"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Artista do Álbum</label>
          <input
            type="text"
            value={albumArtist}
            onChange={(e) => setAlbumArtist(e.target.value)}
            placeholder="Caso diferente do artista principal"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Ano / Data</label>
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Ex: 2026"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Gênero Musical</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Ex: Pop, Rock, Sertanejo, MPB"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Compositor</label>
          <input
            type="text"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="Nome dos compositores"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Intérprete</label>
          <input
            type="text"
            value={performer}
            onChange={(e) => setPerformer(e.target.value)}
            placeholder="Intérprete da gravação"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Número da Faixa</label>
          <input
            type="text"
            value={trackNumber}
            onChange={(e) => setTrackNumber(e.target.value)}
            placeholder="Ex: 1"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Número do Disco</label>
          <input
            type="text"
            value={discNumber}
            onChange={(e) => setDiscNumber(e.target.value)}
            placeholder="Ex: 1"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">BPM (Andamento)</label>
          <input
            type="text"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="Ex: 120"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Chave / Tom Musical</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Ex: C Major, Am"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Código ISRC</label>
          <input
            type="text"
            value={isrc}
            onChange={(e) => setIsrc(e.target.value)}
            placeholder="Código ISRC"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">Copyright</label>
          <input
            type="text"
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
            placeholder="Aviso de Direitos Autorais"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#475569] mb-1">Editora / Publisher</label>
          <input
            type="text"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="Gravadora ou Editora"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#475569] mb-1">Comentários</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Comentários personalizados..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#475569] mb-1">Lyrics / Letras da Música</label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={3}
            placeholder="Letra inteira da música..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* OUTPUT FILENAME FIELD (REQUIREMENT 20) */}
      <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
        <label className="block text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-[#0284C7]" /> Nome do arquivo final (Não sobrescreve o original)
        </label>
        <input
          type="text"
          value={customFilename}
          onChange={(e) => setCustomFilename(e.target.value)}
          placeholder="musica-editada.mp3"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
        />
      </div>

      {/* REQUIREMENT 19: PRÉVIA ANTES DE SALVAR (TABLE CAMPO | VALOR FINAL) */}
      <div className="p-5 rounded-2xl bg-[#E0F2FE]/50 border border-[#0284C7]/20 space-y-3">
        <h4 className="text-xs font-black text-[#0284C7] uppercase tracking-wider flex items-center gap-2">
          <Eye className="h-4 w-4" /> METADADOS QUE SERÃO SALVOS
        </h4>

        {previewFields.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#475569] uppercase text-[10px]">
                  <th className="py-2 px-3">CAMPO</th>
                  <th className="py-2 px-3">VALOR FINAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {previewFields.map((f, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-3 font-bold text-[#475569]">{f.label}</td>
                    <td className="py-1.5 px-3 font-black text-[#0F172A]">{f.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[#475569] italic">Nenhum metadado preenchido. O arquivo será salvo sem tags.</p>
        )}
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
          onClick={handleSave}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>SALVAR NOVO ARQUIVO</span>
        </button>
      </div>
    </div>
  );
};
