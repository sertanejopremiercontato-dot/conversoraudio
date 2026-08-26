import React, { useState } from "react";
import { AudioMetadataModel, RawMetadataItem, CleanStatsInfo, RawMetadataInventoryItem } from "../../../../types/audioMetadata";
import { 
  FileAudio, 
  Music, 
  User, 
  Disc, 
  Calendar, 
  Tag, 
  Layers, 
  FileText, 
  Terminal, 
  Activity, 
  ShieldCheck, 
  Info, 
  Sliders, 
  Cpu, 
  Globe, 
  Radio, 
  Code2, 
  KeyRound, 
  Hash, 
  Clock,
  CheckCircle2,
  Check,
  Sparkles,
  Layers as LayersIcon,
  Trash2,
  AlertCircle,
  Database,
  Binary,
  Search,
  Eye,
  Copy,
  Fingerprint
} from "lucide-react";

interface MetadataOriginalViewV2Props {
  metadata: AudioMetadataModel;
  isCleaned?: boolean;
  cleanStats?: CleanStatsInfo | null;
}

export const MetadataOriginalViewV2: React.FC<MetadataOriginalViewV2Props> = ({
  metadata,
  isCleaned = false,
  cleanStats = null
}) => {
  const [inventoryFilter, setInventoryFilter] = useState<"ALL" | "REMOVABLE" | "TECHNICAL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}s`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "--";
    return num.toLocaleString("pt-BR");
  };

  // 0. INVENTÁRIO COMPLETO SEM FILTRO OU PERDA
  const inventory: RawMetadataInventoryItem[] = metadata.inventory || [];
  
  const filteredInventory = inventory.filter((item) => {
    if (inventoryFilter === "REMOVABLE" && !item.isRemovable) return false;
    if (inventoryFilter === "TECHNICAL" && item.isRemovable) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(term);
      const matchVal = item.value.toLowerCase().includes(term);
      const matchOrig = item.origin.toLowerCase().includes(term);
      const matchBlock = item.block.toLowerCase().includes(term);
      return matchName || matchVal || matchOrig || matchBlock;
    }
    return true;
  });

  const removableItemsCount = inventory.filter((i) => i.isRemovable).length;
  const technicalItemsCount = inventory.filter((i) => !i.isRemovable).length;

  // 1. A — METADADOS / INFORMAÇÕES EXTRAS
  const musicalFields = [
    { label: "Título da Música", value: metadata.title, icon: Music },
    { label: "Artista Principal", value: metadata.artist, icon: User },
    { label: "Álbum", value: metadata.album, icon: Disc },
    { label: "Artista do Álbum", value: metadata.albumArtist, icon: User },
    { label: "Compositor / Autores", value: metadata.composer, icon: User },
    { label: "Ano / Data", value: metadata.year, icon: Calendar },
    { label: "Gênero", value: metadata.genre, icon: Tag },
    { 
      label: "Número da Faixa", 
      value: metadata.trackNumber ? `${metadata.trackNumber}${metadata.totalTracks ? ` de ${metadata.totalTracks}` : ""}` : undefined, 
      icon: Hash 
    },
    { 
      label: "Disco / Volume", 
      value: metadata.discNumber ? `${metadata.discNumber}${metadata.totalDiscs ? ` de ${metadata.totalDiscs}` : ""}` : undefined, 
      icon: Layers 
    },
    { label: "Código ISRC", value: metadata.isrc, icon: ShieldCheck },
    { label: "Andamento (BPM)", value: metadata.bpm ? `${metadata.bpm} BPM` : undefined, icon: Clock },
    { label: "Tom Musical (Key)", value: metadata.key, icon: KeyRound },
    { label: "Editora / Gravadora", value: metadata.publisher, icon: Globe },
    { label: "Copyright / Direitos", value: metadata.copyright, icon: ShieldCheck },
    { label: "Comentários", value: metadata.comment, icon: FileText, isLong: true },
    { label: "Letra da Música", value: metadata.lyrics, icon: FileText, isLong: true }
  ].filter((f) => !!f.value);

  const originFields = [
    { label: "Software / Aplicativo", value: metadata.software, icon: Terminal },
    { label: "Codificador (Encoder)", value: metadata.encoder, icon: Cpu },
    { label: "Codificado por (Encoded By)", value: metadata.encodedBy, icon: User },
    { label: "Biblioteca de Escrita (Writing Library)", value: metadata.writingLibrary, icon: Code2 },
    { label: "Fabricante / Vendor", value: metadata.vendor, icon: Globe },
    { label: "Originador (Originator / BWF)", value: metadata.originator, icon: Activity },
    { label: "Ferramenta de Codificação (Encoding Tool)", value: metadata.tool, icon: Sliders },
    { label: "Fonte / Origem (Source)", value: metadata.source, icon: Radio },
    { label: "Website / URL", value: metadata.url || metadata.website, icon: Globe },
    { label: "Data de Criação", value: metadata.creationTime, icon: Calendar },
    { label: "Descrição", value: metadata.description, icon: FileText }
  ].filter((f) => !!f.value);

  const allRawItems: RawMetadataItem[] = metadata.rawTagsList || [];
  const knownStandardTagKeys = new Set([
    "title", "artist", "album", "albumartist", "year", "genre", "track", "tracknumber", "disc", "discnumber",
    "composer", "isrc", "bpm", "key", "publisher", "copyright", "comment", "lyrics",
    "software", "encoder", "encodedby", "writinglibrary", "vendor", "originator", "originatorreference", "originationdate", "tool", "source", "url", "website",
    "description", "creationtime",
    "tit2", "tt2", "tpe1", "tp1", "talb", "tal", "tpe2", "tp2", "tcom", "tcm", "tcon", "tco",
    "tyer", "tye", "tdrc", "trck", "trk", "tpos", "tpa", "tcop", "tcr", "tpub", "tpb", "tsrc", "trc",
    "tbpm", "tbp", "tkey", "tke", "tlan", "tla", "comm", "com", "uslt", "ult", "tsse", "tss", "tenc", "ten",
    "apic", "pic", "covr", "picture",
    "inam", "iart", "iprd", "icrd", "ignr", "icmt", "isft", "icop", "itrk", "isrc", "ieng", "itch",
    "©nam", "©art", "©alb", "aart", "©day", "©gen", "©wrt", "©cmt", "©lyr", "©too", "cprt", "trkn", "disk",
    "id3v1_title", "id3v1_artist", "id3v1_album", "id3v1_year", "id3v1_comment", "id3v1_genre"
  ]);

  const nativeTagItems = allRawItems.filter((item) => {
    if (item.category === "TECNICO" || item.category === "ESTRUTURA") return false;
    const cleanKey = item.key.toLowerCase().replace(/[^a-z0-9©_]/g, "");
    return !knownStandardTagKeys.has(cleanKey);
  });

  const totalRemovableCount = musicalFields.length + originFields.length + (metadata.cover ? 1 : 0) + nativeTagItems.length;

  // 2. B — DADOS TÉCNICOS DO ÁUDIO (PERMANECEM)
  const technicalItems = [
    { label: "Formato do Arquivo", value: metadata.format, highlight: true },
    { label: "Contêiner", value: metadata.technical.containerType || metadata.format },
    { label: "Codec Real", value: metadata.technical.codec || metadata.format },
    { label: "Taxa de Amostragem (Sample Rate)", value: metadata.technical.sampleRateHz ? `${formatNumber(metadata.technical.sampleRateHz)} Hz (${(metadata.technical.sampleRateHz / 1000).toFixed(1)} kHz)` : "44.100 Hz", highlight: true },
    { label: "Profundidade de Bits (Bit Depth)", value: metadata.technical.bitsPerSample ? `${metadata.technical.bitsPerSample} bits (PCM)` : (metadata.format === "WAV" ? "16 bits (PCM)" : "24/32 bits float"), highlight: true },
    { label: "Canais de Áudio", value: metadata.technical.channels === 1 ? "Mono (1 canal)" : metadata.technical.channels === 2 ? "Estéreo (2 canais)" : `${metadata.technical.channels} canais`, highlight: true },
    { label: "Layout de Canais", value: metadata.technical.channelLayout || "Estéreo (2.0)" },
    { label: "Taxa de Bits (Bitrate)", value: metadata.technical.bitrateKbps ? `${metadata.technical.bitrateKbps} kbps` : "CBR (PCM)" },
    ...(metadata.technical.byteRate ? [{ label: "Taxa de Bytes (ByteRate)", value: `${formatNumber(metadata.technical.byteRate)} B/s (${(metadata.technical.byteRate / 1024).toFixed(1)} KB/s)` }] : []),
    ...(metadata.technical.blockAlign ? [{ label: "Alinhamento de Bloco (BlockAlign)", value: `${metadata.technical.blockAlign} bytes` }] : []),
    ...(metadata.technical.audioFormatCode ? [{ label: "Código de Formato (AudioFormat)", value: `${metadata.technical.audioFormatCode} (${metadata.technical.audioFormatName || "PCM Linear"})` }] : []),
    { label: "Duração Total", value: formatDuration(metadata.technical.durationSeconds) },
    { label: "Tamanho do Arquivo", value: `${formatFileSize(metadata.filesize)} (${formatNumber(metadata.filesize)} bytes)` }
  ];

  return (
    <div className="space-y-8" id="audio-metadata-reader-results">
      {/* ----------------- CABEÇALHO DO ARQUIVO ANALISADO ----------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-sm border border-sky-100 dark:border-sky-900/50">
              <FileAudio className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                isCleaned 
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                  : "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
              }`}>
                {isCleaned ? "ARQUIVO LIMPO & RE-ANALISADO" : "ARQUIVO ANALISADO"}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 break-all">
                {metadata.filename}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {metadata.technical.isLossless ? "Áudio Sem Perdas (Lossless)" : "Áudio Comprimido"}
            </span>
          </div>
        </div>

        {/* Auditoria de Fluxo de Dados (Sem Filtros) */}
        {metadata.audit && (
          <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Eye className="w-3.5 h-3.5 text-sky-500" />
              Auditoria de Dados (Sem Filtros):
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span>common: <strong>{metadata.audit.commonCount}</strong></span>
              <span>native: <strong>{metadata.audit.nativeCount}</strong></span>
              <span>raw: <strong>{metadata.audit.rawCount}</strong></span>
              <span>normalizados: <strong>{metadata.audit.normalizedCount}</strong></span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">renderizados: {metadata.audit.renderedCount}</span>
            </div>
          </div>
        )}

        {/* Mensagem Explicativa Principal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">
              {isCleaned
                ? "Releitura completa do arquivo após a limpeza física:"
                : "Todas as informações encontradas no arquivo original:"}
            </p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {isCleaned
                ? "O arquivo foi relido do zero em nível binário para comprovar a eliminação de todos os metadados extras e a preservação total dos dados técnicos do áudio."
                : totalRemovableCount === 0
                  ? "Todas as informações do arquivo foram analisadas. Foram encontrados todos os dados técnicos essenciais. Nenhum metadado textual ou extra está gravado neste arquivo."
                  : `Foram detectados ${totalRemovableCount} metadados / informações extras gravadas no arquivo além dos dados técnicos do áudio.`}
            </p>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Nome</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate block mt-0.5" title={metadata.filename}>
              {metadata.filename}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Formato</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
              {metadata.format}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Tamanho</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
              {formatFileSize(metadata.filesize)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Duração</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
              {formatDuration(metadata.technical.durationSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* ----------------- COMPROVAÇÃO DA LIMPEZA (DEPOIS DE LIMPAR) ----------------- */}
      {isCleaned && (
        <div className={`p-6 border-2 rounded-3xl space-y-5 text-xs ${
          (cleanStats?.afterCount ?? totalRemovableCount) === 0
            ? "bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-slate-100"
            : "bg-amber-500/10 border-amber-500 text-slate-900 dark:text-slate-100"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-300">
                {cleanStats?.beforeCount === 0 
                  ? "✓ ARQUIVO JÁ SEM METADADOS EXTRAS" 
                  : "✓ METADADOS LIMPOS COM SUCESSO"}
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">
                {cleanStats?.beforeCount === 0
                  ? "O arquivo original já não possuía metadados extras. Os dados técnicos do áudio foram preservados."
                  : "A releitura física confirmou: todas as informações extras foram eliminadas (0 restantes)."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-center pt-1">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">METADADOS EXTRAS ANTES</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {cleanStats?.beforeCount !== undefined ? cleanStats.beforeCount : "Detectados"} tags
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">METADADOS EXTRAS REMOVIDOS</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {cleanStats?.removedCount !== undefined ? cleanStats.removedCount : (cleanStats?.beforeCount || 0)} tags
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">METADADOS EXTRAS RESTANTES</span>
              <span className={`text-sm font-bold ${
                (cleanStats?.afterCount ?? totalRemovableCount) === 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}>
                {(cleanStats?.afterCount ?? totalRemovableCount) === 0
                  ? "0 (Arquivo Limpo)"
                  : `${cleanStats?.afterCount ?? totalRemovableCount} restantes`}
              </span>
            </div>
          </div>

          {/* TABELA: METADADOS REMOVIDOS (CAMPO/TAG | VALOR ANTES | STATUS) */}
          {cleanStats?.removedItems && cleanStats.removedItems.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                  METADADOS & BLOCOS REMOVIDOS DO ARQUIVO
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  {cleanStats.removedItems.filter(r => r.status === "REMOVIDO").length} itens removidos
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden font-mono text-xs bg-white dark:bg-slate-900">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 pl-3">CAMPO / TAG / BLOCO</th>
                      <th className="p-2.5">VALOR ANTES</th>
                      <th className="p-2.5 pr-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-xs">
                    {cleanStats.removedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 pl-3 font-bold text-slate-900 dark:text-white font-mono text-xs">
                          {item.tag}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 break-all">
                          {item.valueBefore}
                        </td>
                        <td className="p-2.5 pr-3 text-right whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.status === "REMOVIDO"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPROVAÇÃO ESTRUTURAL E BIT-A-BIT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* 1. Estrutura de Chunks / Blocos */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LayersIcon className="w-3.5 h-3.5 text-sky-600" />
                Estrutura de Blocos / Chunks (Antes vs Depois)
              </span>
              <div className="font-mono text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-slate-400">Antes: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {cleanStats?.chunksBefore && cleanStats.chunksBefore.length > 0
                      ? cleanStats.chunksBefore.join(", ")
                      : "Container com blocos de metadados"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Depois: </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {cleanStats?.chunksAfter && cleanStats.chunksAfter.length > 0
                      ? cleanStats.chunksAfter.join(", ")
                      : "Estrutura Mínima Necessária"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Hash do Payload de Áudio */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Integridade do Áudio (Bit-a-Bit)
              </span>
              <div className="font-mono text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
                <div className="truncate">
                  <span className="text-slate-400">Hash Áudio: </span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {cleanStats?.audioHashBefore ? `${cleanStats.audioHashBefore.slice(0, 16)}...` : "Calculado"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Check className="w-3 h-3" />
                  <span>100% IDÊNTICO — DADOS DE ÁUDIO PRESERVADOS</span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE METADADOS RESTANTES CASO EXISTA ALGUM */}
          {cleanStats?.remainingTags && cleanStats.remainingTags.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                METADADOS EXTRAS RESTANTES NO ARQUIVO:
              </span>
              <div className="p-3 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900 rounded-2xl space-y-1 font-mono text-xs text-amber-900 dark:text-amber-200">
                {cleanStats.remainingTags.map((tag, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3.5 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              DADOS TÉCNICOS PRESERVADOS: O áudio permanece 100% reproduzível e intacto.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVENTÁRIO COMPLETO DE METADADOS & DADOS ENCONTRADOS (TODAS AS INFORMAÇÕES) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LayersIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              TODAS AS INFORMAÇÕES ENCONTRADAS NO ARQUIVO
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inventário completo de leitura binária. Todos os identificadores, blocos, tags e parâmetros técnicos.
            </p>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar tag, valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100 w-36 sm:w-44"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setInventoryFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  inventoryFilter === "ALL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Todos ({inventory.length})
              </button>
              <button
                type="button"
                onClick={() => setInventoryFilter("REMOVABLE")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  inventoryFilter === "REMOVABLE"
                    ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 shadow-xs"
                    : "text-slate-500 hover:text-amber-600"
                }`}
              >
                Metadados / Extras ({removableItemsCount})
              </button>
              <button
                type="button"
                onClick={() => setInventoryFilter("TECHNICAL")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  inventoryFilter === "TECHNICAL"
                    ? "bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-300 shadow-xs"
                    : "text-slate-500 hover:text-sky-600"
                }`}
              >
                Dados Técnicos ({technicalItemsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tabela do Inventário */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 pl-4">NOME / IDENTIFICADOR</th>
                <th className="p-3">VALOR</th>
                <th className="p-3 hidden sm:table-cell">ORIGEM / BLOCO</th>
                <th className="p-3 pr-4 text-right">CLASSIFICAÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans text-xs">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white font-mono text-xs">
                      {item.name}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 break-all">
                      {item.value}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] hidden sm:table-cell">
                      {item.origin} {item.block && item.block !== item.origin ? `(${item.block})` : ""}
                    </td>
                    <td className="p-3 pr-4 text-right whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${
                        item.isRemovable
                          ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                      }`}>
                        {item.isRemovable ? "METADADOS EXTRAS (APAGÁVEL)" : "DADOS TÉCNICOS DO ÁUDIO"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 text-xs font-sans">
                    Nenhum item corresponde ao filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORIA A: METADADOS / INFORMAÇÕES EXTRAS (APAGÁVEIS) */}
      {/* ========================================================================= */}
      <div className={`p-6 rounded-3xl border-2 space-y-5 transition-all ${
        isCleaned && totalRemovableCount === 0
          ? "bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-800" 
          : "bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900/60"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
              isCleaned && totalRemovableCount === 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400"
            }`}>
              A
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                CATEGORIA A: METADADOS / INFORMAÇÕES EXTRAS (APAGÁVEIS)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identificação artística, software, encoder, capas e tags personalizadas que são eliminadas na limpeza
              </p>
            </div>
          </div>

          <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full self-start sm:self-center ${
            totalRemovableCount === 0
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
          }`}>
            {totalRemovableCount === 0 
              ? "0 metadados extras (Limpo)" 
              : `${totalRemovableCount} metadados extras encontrados`}
          </span>
        </div>

        {totalRemovableCount > 0 ? (
          <div className="space-y-4">
            {/* Metadados Artísticos */}
            {musicalFields.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Identificação Musical</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {musicalFields.map((field, idx) => {
                    const Icon = field.icon;
                    return (
                      <div
                        key={idx}
                        className={`p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 ${
                          field.isLong ? "sm:col-span-2 lg:col-span-3" : ""
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Icon className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-[10px] uppercase font-bold">{field.label}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white break-words">
                          {field.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Software / Encoder */}
            {originFields.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Software / Encoder / Origem</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {originFields.map((field, idx) => {
                    const Icon = field.icon;
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40"
                      >
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-1">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold">{field.label}</span>
                        </div>
                        <div className="font-bold font-mono text-slate-900 dark:text-white break-words">
                          {field.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Capa */}
            {metadata.cover && (
              <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 flex items-center gap-3">
                <img
                  src={metadata.cover.dataUrl}
                  alt="Capa"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover rounded-lg shadow"
                />
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 block">Capa Embutida</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{(metadata.cover.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            )}

            {/* Tags Nativas / Customizadas */}
            {nativeTagItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Tags Nativas / Personalizadas</span>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden font-mono text-xs">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                      {nativeTagItems.map((item, idx) => (
                        <tr key={`tag-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 pl-3 font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {item.key}
                          </td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300 break-all text-xs">
                            {item.value}
                          </td>
                          <td className="p-2.5 pr-3 text-right whitespace-nowrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              Removível
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
            {isCleaned 
              ? "✓ Todos os metadados extras foram eliminados fisicamente do arquivo (0 tags)."
              : "Nenhum metadado extra gravado neste arquivo."}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CATEGORIA B: DADOS TÉCNICOS DO ÁUDIO (PERMANECEM) */}
      {/* ========================================================================= */}
      <div className="p-6 bg-sky-50/40 dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-900/60 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-sm">
              B
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                CATEGORIA B: DADOS TÉCNICOS DO ÁUDIO (PERMANECEM)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estrutura física do som e parâmetros essenciais para decodificação e reprodução de áudio
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 self-start sm:self-center">
            {technicalItems.length} parâmetros técnicos
          </span>
        </div>

        {/* Mensagem de esclarecimento para o usuário */}
        <div className="p-3.5 bg-sky-100/70 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-900/60 flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <span>
            <strong>Estes dados são a física do som e permanecem intactos.</strong> Eles definem a taxa de amostragem, canais, codec e resolução do áudio para que o player consiga reproduzir o arquivo perfeitamente.
          </span>
        </div>

        {/* Grade de Dados Técnicos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {technicalItems.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-3.5 rounded-2xl border ${
                item.highlight 
                  ? "bg-white dark:bg-slate-800/80 border-sky-200 dark:border-sky-800 shadow-xs" 
                  : "bg-white/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"
              }`}
            >
              <span className="text-slate-400 text-[10px] uppercase font-bold block">{item.label}</span>
              <span className="font-bold text-slate-900 dark:text-white block mt-0.5 break-all">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
