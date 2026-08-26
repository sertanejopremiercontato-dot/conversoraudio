import React, { useState } from "react";
import { AudioMetadataModel } from "../../../../types/audioMetadata";
import { ChevronDown, ChevronUp, Code2, Tag, Search } from "lucide-react";

interface ExtraMetadataV2Props {
  model: AudioMetadataModel;
}

const TAG_DESCRIPTIONS: Record<string, string> = {
  TIT2: "Título da Música",
  TPE1: "Artista Principal",
  TALB: "Nome do Álbum",
  TPE2: "Artista do Álbum",
  TCOM: "Compositor / Autores",
  TCON: "Gênero Musical",
  TYER: "Ano de Lançamento",
  TDRC: "Data de Gravação / Lançamento",
  TRCK: "Número da Faixa",
  TPOS: "Número do Disco",
  TCOP: "Copyright / Direitos Autorais",
  TSRC: "Código ISRC",
  TBPM: "Andamento (BPM)",
  COMM: "Comentários / Notas",
  USLT: "Letras Não Sincronizadas",
  APIC: "Imagem da Capa (Attached Picture)",
  TSSE: "Software do Codificador",
  TENC: "Codificado por (Encoded By)",
  TPUB: "Editora / Gravadora / Publisher",
  TKEY: "Tom Musical (Key)",
  TLAN: "Idioma",
  TXXX: "Texto Personalizado (User Defined Text)",
  WXXX: "Link URL Personalizado",
  PRIV: "Dados Privados da Aplicação",
  UFID: "Identificador Único do Arquivo (UFID)",
  POPM: "Popularímetro / Classificação",
  GEOB: "Objeto Encapsulado Generalizado",
  WOAR: "URL Oficial do Artista",
  INAM: "Título (RIFF INFO)",
  IART: "Artista (RIFF INFO)",
  IPRD: "Álbum / Produto (RIFF INFO)",
  ICRD: "Data de Criação (RIFF INFO)",
  IGNR: "Gênero (RIFF INFO)",
  ICMT: "Comentário (RIFF INFO)",
  ICOP: "Copyright (RIFF INFO)",
  TITLE: "Título (Vorbis)",
  ARTIST: "Artista (Vorbis)",
  ALBUM: "Álbum (Vorbis)",
  GENRE: "Gênero (Vorbis)",
  DATE: "Data (Vorbis)",
  VENDOR: "Vendor / Plataforma (Vorbis)",
  ENCODER: "Codificador (Vorbis)",
  DESCRIPTION: "Descrição (Vorbis)"
};

export const ExtraMetadataV2: React.FC<ExtraMetadataV2Props> = ({
  model
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Aggregate all frames and raw tags
  const allItems: { id: string; type: string; value: string; sizeBytes?: number }[] = [];

  if (model.id3Frames && model.id3Frames.length > 0) {
    model.id3Frames.forEach((f) => {
      allItems.push({
        id: f.id,
        type: f.version || "ID3",
        value: f.value,
        sizeBytes: f.sizeBytes
      });
    });
  }

  if (model.rawTagsList && model.rawTagsList.length > 0) {
    model.rawTagsList.forEach((r) => {
      // Avoid duplicate display if already in ID3
      const alreadyPresent = allItems.some((item) => item.id === r.key && item.type === r.type);
      if (!alreadyPresent) {
        allItems.push({
          id: r.key,
          type: r.type || r.origin || "Raw Tag",
          value: r.value,
          sizeBytes: r.sizeBytes
        });
      }
    });
  } else if (model.rawTags) {
    Object.entries(model.rawTags).forEach(([key, val]) => {
      const stringVal = typeof val === "string" ? val : JSON.stringify(val);
      const alreadyPresent = allItems.some((item) => item.id === key);
      if (!alreadyPresent) {
        allItems.push({
          id: key,
          type: "Raw Tag",
          value: stringVal,
          sizeBytes: stringVal.length
        });
      }
    });
  }

  if (allItems.length === 0) {
    return null;
  }

  const filteredItems = allItems.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const desc = TAG_DESCRIPTIONS[item.id.toUpperCase()] || "";
    return (
      item.id.toLowerCase().includes(term) ||
      desc.toLowerCase().includes(term) ||
      item.value.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Code2 className="w-4 h-4 text-sky-500" />
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Todas as Tags Nativas e Técnicas Encontradas ({allItems.length} tags)
            </h4>
            <p className="text-[11px] text-slate-400">
              Visualização de todos os dados internos, IDs, encoders, URLs e tags de plataforma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {isOpen ? "Ocultar" : "Expandir"}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
          {/* Search Box */}
          {allItems.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome de tag, descrição ou valor..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {filteredItems.map((frame, idx) => {
              const desc = TAG_DESCRIPTIONS[frame.id.toUpperCase()];
              return (
                <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-mono text-[10px] font-bold">
                      {frame.id}
                    </span>
                    {desc && (
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                        {desc}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-normal">({frame.type})</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-mono text-[11px] break-all sm:text-right max-w-md">
                    {frame.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
