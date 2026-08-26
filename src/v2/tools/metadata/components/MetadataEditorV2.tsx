import React from "react";
import { AudioMetadataModel } from "../../../../types/audioMetadata";
import { 
  Music, 
  User, 
  Disc, 
  Calendar, 
  Tag, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Globe, 
  Hash, 
  KeyRound,
  Edit3
} from "lucide-react";

interface MetadataEditorV2Props {
  model: AudioMetadataModel;
  onChange: (updated: Partial<AudioMetadataModel>) => void;
}

export const MetadataEditorV2: React.FC<MetadataEditorV2Props> = ({
  model,
  onChange
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6" id="secao-editar-metadados-form">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
          <Edit3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Editar Metadados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preencha os dados que você deseja gravar no seu arquivo de áudio
          </p>
        </div>
      </div>

      {/* 1. Identificação Principal da Faixa */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          1. Identificação da Música & Artista
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-purple-500" />
              <span>Título da Música</span>
            </label>
            <input
              type="text"
              value={model.title || ""}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Ex: Minha Canção"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-500" />
              <span>Artista Principal</span>
            </label>
            <input
              type="text"
              value={model.artist || ""}
              onChange={(e) => onChange({ artist: e.target.value })}
              placeholder="Ex: Nome do Cantor ou Banda"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-purple-500" />
              <span>Álbum</span>
            </label>
            <input
              type="text"
              value={model.album || ""}
              onChange={(e) => onChange({ album: e.target.value })}
              placeholder="Ex: Nome do Álbum / EP / Single"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-500" />
              <span>Artista do Álbum</span>
            </label>
            <input
              type="text"
              value={model.albumArtist || ""}
              onChange={(e) => onChange({ albumArtist: e.target.value })}
              placeholder="Ex: Artista ou Vários Artistas"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>Ano / Data</span>
            </label>
            <input
              type="text"
              value={model.year || ""}
              onChange={(e) => onChange({ year: e.target.value })}
              placeholder="Ex: 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-500" />
              <span>Gênero</span>
            </label>
            <input
              type="text"
              value={model.genre || ""}
              onChange={(e) => onChange({ genre: e.target.value })}
              placeholder="Ex: Sertanejo, Pop, Rock, MPB..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Faixa & Disco Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Nº da Faixa
            </label>
            <input
              type="text"
              value={model.trackNumber || ""}
              onChange={(e) => onChange({ trackNumber: e.target.value })}
              placeholder="Ex: 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Total de Faixas
            </label>
            <input
              type="text"
              value={model.totalTracks || ""}
              onChange={(e) => onChange({ totalTracks: e.target.value })}
              placeholder="Ex: 10"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Nº do Disco
            </label>
            <input
              type="text"
              value={model.discNumber || ""}
              onChange={(e) => onChange({ discNumber: e.target.value })}
              placeholder="Ex: 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Total de Discos
            </label>
            <input
              type="text"
              value={model.totalDiscs || ""}
              onChange={(e) => onChange({ totalDiscs: e.target.value })}
              placeholder="Ex: 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Créditos & Identificadores */}
      <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          2. Créditos, Direitos & ISRC
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-500" />
              <span>Compositor</span>
            </label>
            <input
              type="text"
              value={model.composer || ""}
              onChange={(e) => onChange({ composer: e.target.value })}
              placeholder="Ex: Nome do Compositor ou Autores"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>Código ISRC</span>
            </label>
            <input
              type="text"
              value={model.isrc || ""}
              onChange={(e) => onChange({ isrc: e.target.value })}
              placeholder="Ex: BR-XXX-26-00001"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span>BPM (Batidas por Minuto)</span>
            </label>
            <input
              type="text"
              value={model.bpm || ""}
              onChange={(e) => onChange({ bpm: e.target.value })}
              placeholder="Ex: 128"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-500" />
              <span>Editora / Publisher</span>
            </label>
            <input
              type="text"
              value={model.publisher || ""}
              onChange={(e) => onChange({ publisher: e.target.value })}
              placeholder="Ex: Gravadora ou Selo Musical"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>Copyright / Direitos</span>
            </label>
            <input
              type="text"
              value={model.copyright || ""}
              onChange={(e) => onChange({ copyright: e.target.value })}
              placeholder="Ex: © 2026 Todos os direitos reservados"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Textos, Letra e Notas */}
      <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          3. Letra da Música & Comentários
        </h4>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>Comentário</span>
            </label>
            <textarea
              rows={2}
              value={model.comment || ""}
              onChange={(e) => onChange({ comment: e.target.value })}
              placeholder="Observações adicionais sobre o áudio..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>Letra</span>
            </label>
            <textarea
              rows={4}
              value={model.lyrics || ""}
              onChange={(e) => onChange({ lyrics: e.target.value })}
              placeholder="Cole a letra completa da música aqui..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-[11px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
