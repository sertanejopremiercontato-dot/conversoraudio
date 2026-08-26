import React, { useState } from "react";
import {
  FileAudio,
  Music,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  Tag,
  Eraser,
  Edit3,
  X,
  Info
} from "lucide-react";
import { AudioMetadataModel, AnalysisSummaryStats } from "../../../types/audioMetadata";

interface MetadataFullAnalysisViewProps {
  model: AudioMetadataModel;
  stats: AnalysisSummaryStats;
  onCleanClick: () => void;
  onEditClick: () => void;
  onResetClick: () => void;
  onRemoveCoverClick?: () => void;
  onReplaceCoverClick?: () => void;
}

export const MetadataFullAnalysisView: React.FC<MetadataFullAnalysisViewProps> = ({
  model,
  stats,
  onCleanClick,
  onEditClick,
  onResetClick,
  onRemoveCoverClick,
  onReplaceCoverClick
}) => {
  const [showRawTable, setShowRawTable] = useState(false);
  const [expandedText, setExpandedText] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedText((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Size helper
  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "Não identificado";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Duration helper
  const formatDuration = (secs: number) => {
    if (!secs || secs <= 0) return "Não identificado";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s} (${secs}s)`;
  };

  // Row renderer
  const renderRow = (label: string, value: string | number | undefined, isRemovable: boolean = false) => {
    const valStr = value !== undefined && value !== null && String(value).trim().length > 0
      ? String(value)
      : null;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-3 rounded-xl hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0]/60 last:border-0 gap-1 sm:gap-4">
        <span className="text-xs font-bold text-[#475569]">{label}</span>
        <div className="flex items-center gap-2 text-right">
          {valStr ? (
            <>
              <span className="text-xs font-black text-[#0F172A] break-all">{valStr}</span>
              {isRemovable ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0 border border-amber-200">
                  <AlertTriangle className="h-3 w-3" /> Removível
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full shrink-0 border border-[#0284C7]/20">
                  <CheckCircle2 className="h-3 w-3" /> Presente
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-medium text-[#94A3B8] italic">Não identificado</span>
          )}
        </div>
      </div>
    );
  };

  // Text block renderer for long lyrics or comments
  const renderTextBlock = (label: string, text: string | undefined, key: string) => {
    if (!text || text.trim().length === 0) {
      return renderRow(label, undefined);
    }

    const isLong = text.length > 120;
    const isExpanded = !!expandedText[key];

    return (
      <div className="py-2.5 px-3 rounded-xl bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#475569]">{label}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <CheckCircle2 className="h-3 w-3" /> Presente ({text.length} caracteres)
          </span>
        </div>
        <div className="text-xs font-medium text-[#0F172A] whitespace-pre-wrap bg-white p-3 rounded-lg border border-[#E2E8F0]">
          {isLong && !isExpanded ? `${text.substring(0, 120)}...` : text}
        </div>
        {isLong && (
          <button
            type="button"
            onClick={() => toggleExpand(key)}
            className="text-[11px] font-bold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Recolher texto</span> <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Expandir conteúdo completo</span> <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* HEADER BANNER - REQUIREMENT 25 */}
      <div className="bg-[#E0F2FE] border border-[#0284C7]/30 rounded-3xl p-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider bg-white text-[#0284C7] px-3 py-1 rounded-full border border-[#0284C7]/20">
            ANÁLISE COMPLETA DO ÁUDIO
          </span>
          <h2 className="text-2xl font-black text-[#0F172A]">
            Encontramos estas informações no seu áudio
          </h2>
          <p className="text-xs text-[#475569] font-medium">
            Revise todos os metadados antes de escolher se deseja limpar ou editar.
          </p>
        </div>

        {/* TOP MAIN ACTIONS (REQUIREMENT 13) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCleanClick}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Eraser className="h-4 w-4" />
            <span>LIMPAR METADADOS</span>
          </button>

          <button
            type="button"
            onClick={onEditClick}
            className="px-5 py-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span>EDITAR METADADOS</span>
          </button>

          <button
            type="button"
            onClick={onResetClick}
            className="px-4 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <X className="h-4 w-4" />
            <span>OUTRO ARQUIVO</span>
          </button>
        </div>
      </div>

      {/* CORRUPTED TAGS WARNING (REQUIREMENT 22) */}
      {model.hasCorruptedTagsWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <span>Alguns metadados estão corrompidos ou fora do padrão. Continuando com o restante das informações.</span>
        </div>
      )}

      {/* SUMMARY STATS CARDS (REQUIREMENT 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1 shadow-sm">
          <p className="text-2xl font-black text-[#0284C7]">{stats.totalMetadataFound}</p>
          <p className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Metadados encontrados</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1 shadow-sm">
          <p className="text-2xl font-black text-blue-600">{stats.personalTextFieldsCount}</p>
          <p className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Campos pessoais / texto</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1 shadow-sm">
          <p className="text-2xl font-black text-purple-600">{stats.embeddedCoversCount}</p>
          <p className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Imagens incorporadas</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1 shadow-sm">
          <p className="text-2xl font-black text-amber-600">{stats.technicalTagsCount}</p>
          <p className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Tags técnicas</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-1 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-2xl font-black text-red-500">{stats.unknownTagsCount}</p>
          <p className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Tags desconhecidas</p>
        </div>
      </div>

      {/* GROUPS / CLASSIFIED DATA SECTIONS (REQUIREMENT 12) */}

      {/* GROUP 1: RESUMO DO ARQUIVO (REQUIREMENT 3) */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-[#0284C7]" /> RESUMO DO ARQUIVO
          </h3>
          <span className="text-xs font-bold text-[#0284C7] bg-[#E0F2FE] px-2.5 py-0.5 rounded-full border border-[#0284C7]/20">
            {model.format}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
          {renderRow("Nome do arquivo", model.filename)}
          {renderRow("Extensão", model.format)}
          {renderRow("Tamanho", formatSize(model.filesize))}
          {renderRow("Tipo MIME", model.mimeType)}
          {renderRow("Duração", formatDuration(model.technical.durationSeconds))}
          {renderRow("Bitrate", model.technical.bitrateKbps ? `${model.technical.bitrateKbps} kbps` : undefined)}
          {renderRow("Sample rate", model.technical.sampleRateHz ? `${model.technical.sampleRateHz} Hz` : undefined)}
          {renderRow("Número de canais", model.technical.channels === 1 ? "1 (Mono)" : model.technical.channels === 2 ? "2 (Estéreo)" : undefined)}
          {renderRow("Codec", model.technical.codec)}
          {renderRow("Formato / container", model.technical.containerType)}
        </div>
      </div>

      {/* GROUP 2: CAPA DO ÁUDIO (REQUIREMENT 5) */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-purple-600" /> CAPA DO ÁUDIO
          </h3>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            model.cover ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]"
          }`}>
            {model.cover ? "1 Imagem Incorporada" : "Sem Capa"}
          </span>
        </div>

        {model.cover ? (
          <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <img
              src={model.cover.dataUrl}
              alt="Capa do Áudio"
              className="w-32 h-32 object-cover rounded-2xl border border-[#E2E8F0] shadow-sm shrink-0"
            />
            <div className="space-y-2 text-center md:text-left flex-1 text-xs">
              <p className="font-extrabold text-[#0F172A] text-sm">Arte de Capa Incorporada Detectada</p>
              <div className="grid grid-cols-2 gap-2 text-[#475569] font-medium">
                <p>Tipo: <strong className="text-[#0F172A]">{model.cover.typeDescription || "Capa Principal"}</strong></p>
                <p>Formato: <strong className="text-[#0F172A] uppercase">{model.cover.format}</strong></p>
                <p>Dimensões: <strong className="text-[#0F172A]">{model.cover.width && model.cover.height ? `${model.cover.width} x ${model.cover.height} px` : "Não identificadas"}</strong></p>
                <p>Tamanho: <strong className="text-[#0F172A]">{formatSize(model.cover.sizeBytes)}</strong></p>
              </div>

              {/* Cover action buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                {onRemoveCoverClick && (
                  <button
                    type="button"
                    onClick={onRemoveCoverClick}
                    className="px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    REMOVER CAPA
                  </button>
                )}
                {onReplaceCoverClick && (
                  <button
                    type="button"
                    onClick={onReplaceCoverClick}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    SUBSTITUIR CAPA
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center rounded-2xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] space-y-1">
            <p className="text-xs font-bold text-[#475569]">Nenhuma capa incorporada.</p>
          </div>
        )}
      </div>

      {/* GROUP 3: IDENTIDADE DA MÚSICA & CRÉDITOS (REQUIREMENT 4) */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <Music className="h-4 w-4 text-[#0284C7]" /> IDENTIDADE DA MÚSICA & CRÉDITOS
          </h3>
          <span className="text-xs font-bold text-[#475569]">
            Metadados Principais
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
          {renderRow("Título", model.title)}
          {renderRow("Artista", model.artist)}
          {renderRow("Álbum", model.album)}
          {renderRow("Artista do álbum", model.albumArtist)}
          {renderRow("Ano / Data", model.year, true)}
          {renderRow("Número da faixa", model.trackNumber)}
          {renderRow("Total de faixas", model.totalTracks)}
          {renderRow("Número do disco", model.discNumber)}
          {renderRow("Total de discos", model.totalDiscs)}
          {renderRow("Gênero", model.genre)}
          {renderRow("Compositor", model.composer)}
          {renderRow("Intérprete", model.performer)}
          {renderRow("Autor", model.author)}
          {renderRow("Copyright", model.copyright, true)}
          {renderRow("Editora / Publisher", model.publisher, true)}
          {renderRow("ISRC", model.isrc, true)}
          {renderRow("BPM", model.bpm)}
          {renderRow("Chave / Tom", model.key)}
          {renderRow("Idioma", model.language)}
        </div>
      </div>

      {/* GROUP 4: COMENTÁRIOS / TEXTO (REQUIREMENT 6) */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" /> COMENTÁRIOS & TEXTOS
          </h3>
        </div>

        <div className="space-y-2">
          {renderTextBlock("Comentários", model.comment, "comment")}
          {renderTextBlock("Descrição", model.description, "description")}
          {renderRow("Subtítulo", model.subtitle)}
          {renderTextBlock("Lyrics / Letras", model.lyrics, "lyrics")}
          {renderRow("Grouping", model.grouping)}
          {renderRow("Mood", model.mood)}
          {renderRow("Encoder settings", model.encoderSettings)}
        </div>
      </div>

      {/* GROUP 5: SOFTWARE / CODIFICAÇÃO (REQUIREMENT 7) */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4 text-amber-600" /> SOFTWARE & ORIGEM
          </h3>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Identificadores de exportação
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
          {renderRow("Software", model.software, true)}
          {renderRow("Encoder", model.encoder, true)}
          {renderRow("Encoded by", model.encodedBy, true)}
          {renderRow("Writing library", model.writingLibrary, true)}
          {renderRow("Application", model.application, true)}
          {renderRow("Tool", model.tool, true)}
          {renderRow("Vendor", model.vendor, true)}
          {renderRow("Creation time", model.creationTime, true)}
          {renderRow("Modification time", model.modificationTime, true)}
          {renderRow("Original filename", model.originalFilename, true)}
          {renderRow("Copyright message", model.copyrightMessage, true)}
        </div>
      </div>

      {/* GROUP 6: DADOS TÉCNICOS E OCULTOS (REQUIREMENT 9) */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-4 w-4 text-purple-600" /> DADOS TÉCNICOS E OCULTOS
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
          {renderRow("Encoder delay", model.encoderDelay)}
          {renderRow("Padding", model.padding)}
          {renderRow("ReplayGain", model.replayGain)}
          {renderRow("Loudness", model.loudness)}
          {renderRow("Peak", model.peak)}
          {renderRow("Gapless information", model.gaplessInfo)}
          {renderRow("Private frames", model.privateFramesCount ? `${model.privateFramesCount} presentes` : undefined, true)}
          {renderRow("Unique file identifier (UFID)", model.ufid, true)}
          {renderRow("Popularimeter", model.popularimeter)}
          {renderRow("Chapter markers", model.chapterMarkers)}
          {renderRow("Timestamps", model.timestamps)}
        </div>
      </div>

      {/* GROUP 7: TAGS ID3 COMPLETAS (FOR MP3) (REQUIREMENT 8) */}
      {model.id3Frames && model.id3Frames.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#0284C7]" /> TAGS ID3 COMPLETAS ENCONTRADAS
            </h3>
            <span className="text-xs font-bold bg-[#E0F2FE] text-[#0284C7] px-2.5 py-0.5 rounded-full border border-[#0284C7]/20">
              {model.id3Frames.length} Frames
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {model.id3Frames.map((frame, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono font-black text-[#0284C7] bg-[#E0F2FE] px-1.5 py-0.5 rounded text-[10px]">
                    {frame.id}
                  </span>
                  <p className="font-bold text-[#0F172A]">{frame.description}</p>
                  <p className="text-[#475569] break-all">{frame.value}</p>
                </div>
                {frame.isUnknown ? (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded shrink-0 border border-red-200">
                    TAG DESCONHECIDA / RAW
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#475569] shrink-0">
                    {frame.sizeBytes} B
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GROUP 8: METADADOS BRUTOS ENCONTRADOS (TABLE) (REQUIREMENT 10) */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#475569]" /> METADADOS BRUTOS ENCONTRADOS
            </h3>
            <p className="text-[11px] text-[#475569] mt-0.5">
              Proposta técnica mostrando exatamente todos os blocos armazenados no arquivo de áudio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRawTable(!showRawTable)}
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showRawTable ? "Ocultar tabela" : `Exibir tabela (${model.rawTagsList.length} itens)`}
          </button>
        </div>

        {showRawTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">TIPO</th>
                  <th className="py-2.5 px-3">CHAVE / FRAME</th>
                  <th className="py-2.5 px-3">VALOR</th>
                  <th className="py-2.5 px-3">TAMANHO</th>
                  <th className="py-2.5 px-3">ORIGEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {model.rawTagsList.length > 0 ? (
                  model.rawTagsList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC]">
                      <td className="py-2 px-3 font-bold text-[#0284C7]">{row.type}</td>
                      <td className="py-2 px-3 font-mono font-bold text-[#0F172A]">{row.key}</td>
                      <td className="py-2 px-3 text-[#0F172A] break-all max-w-xs">{row.value}</td>
                      <td className="py-2 px-3 text-[#475569]">{row.sizeBytes} B</td>
                      <td className="py-2 px-3 text-[#475569]">{row.origin}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[#475569] italic">
                      Nenhuma tag bruta extra registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BUTTONS (REQUIREMENT 13) */}
      <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <p className="text-sm font-black text-[#0F172A]">Qual a sua decisão?</p>
          <p className="text-xs text-[#475569]">Você pode higienizar o arquivo para privacidade ou editar os metadados.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCleanClick}
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Eraser className="h-4 w-4" />
            <span>LIMPAR METADADOS</span>
          </button>

          <button
            type="button"
            onClick={onEditClick}
            className="px-6 py-3.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span>EDITAR METADADOS</span>
          </button>

          <button
            type="button"
            onClick={onResetClick}
            className="px-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
          >
            CANCELAR / OUTRO ARQUIVO
          </button>
        </div>
      </div>
    </div>
  );
};
