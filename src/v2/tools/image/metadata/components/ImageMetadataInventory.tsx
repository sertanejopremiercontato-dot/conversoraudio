import React, { useState } from "react";
import {
  ShieldAlert,
  Info,
  Layers,
  MapPin,
  Camera,
  Calendar,
  User,
  Tag,
  FileCode,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  MessageSquare,
  Binary,
  Compass,
  AlertCircle
} from "lucide-react";
import { ImageMetadataAnalysisResult, ImageMetadataItem } from "../types";

interface ImageMetadataInventoryProps {
  analysis: ImageMetadataAnalysisResult;
}

export const ImageMetadataInventory: React.FC<ImageMetadataInventoryProps> = ({ analysis }) => {
  const {
    privacyItems,
    provenanceItems,
    softwareItems,
    metadataItems,
    commentItems,
    xmpIptcItems,
    unknownOptionalItems,
    technicalItems,
    verification
  } = analysis;

  const [showRawChunks, setShowRawChunks] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const totalOptionalCount =
    privacyItems.length +
    provenanceItems.length +
    softwareItems.length +
    metadataItems.length +
    commentItems.length +
    xmpIptcItems.length +
    unknownOptionalItems.length;

  const renderItemCard = (item: ImageMetadataItem, theme: {
    bg: string;
    border: string;
    labelColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }) => {
    return (
      <div
        key={item.id}
        className={`p-3.5 rounded-2xl ${theme.bg} border ${theme.border} flex flex-col justify-between gap-1.5 transition-all`}
        id={`item-${item.id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`text-xs font-black ${theme.labelColor} block truncate`}>
              {item.label}
            </span>
            <span className="text-[10px] font-mono text-[#64748B] block">
              {item.key} {item.offsetHex ? `• Offset: ${item.offsetHex}` : ""} {item.size ? `(${item.size} bytes)` : ""}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${theme.badgeBg} border ${theme.badgeBorder} ${theme.badgeText} shrink-0`}
          >
            {item.source}
          </span>
        </div>

        <div className="text-sm font-bold text-[#0F172A] break-words select-all max-h-32 overflow-y-auto">
          {item.value}
        </div>

        {item.details && (
          <p className="text-[11px] text-[#475569] leading-tight mt-0.5 border-t border-black/5 pt-1">
            {item.details}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 sm:p-8 shadow-xs space-y-6" id="image-metadata-inventory-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-[#0F172A]">
            Inventário Forense de Metadados
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Varredura binária direta de segmentos físicos (EXIF, XMP, IPTC, ICC, tEXt, zTXt, RIFF)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-xs font-black text-[#DC2626]">
            {privacyItems.length} Rastreio/GPS
          </span>
          <span className="px-3 py-1 rounded-full bg-[#F1F5F9] text-xs font-bold text-[#475569]">
            {analysis.items.length} Campos Totais
          </span>
        </div>
      </div>

      {/* 1. SEÇÃO DE PRIVACIDADE E RASTREABILIDADE (GPS, NÚMEROS DE SÉRIE, DISPOSITIVO) */}
      {privacyItems.length > 0 && (
        <div className="space-y-3" id="privacy-metadata-block">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#DC2626]">
            <ShieldAlert className="w-4 h-4" />
            <span>1. Privacidade, GPS & Números de Série ({privacyItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {privacyItems.map((item) =>
              renderItemCard(item, {
                bg: "bg-[#FEF2F2]/70",
                border: "border-[#FECACA]",
                labelColor: "text-[#991B1B]",
                badgeBg: "bg-white",
                badgeText: "text-[#DC2626]",
                badgeBorder: "border-[#FECACA]"
              })
            )}
          </div>
        </div>
      )}

      {/* 2. PROVENIÊNCIA / CÂMERA & LENTE */}
      {provenanceItems.length > 0 && (
        <div className="space-y-3" id="provenance-metadata-block">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#D97706]">
            <Camera className="w-4 h-4" />
            <span>2. Proveniência, Câmera & Dispositivo ({provenanceItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {provenanceItems.map((item) =>
              renderItemCard(item, {
                bg: "bg-[#FFFBEB]/70",
                border: "border-[#FDE68A]",
                labelColor: "text-[#92400E]",
                badgeBg: "bg-white",
                badgeText: "text-[#D97706]",
                badgeBorder: "border-[#FDE68A]"
              })
            )}
          </div>
        </div>
      )}

      {/* 3. SOFTWARE & GERADORES / IA */}
      {softwareItems.length > 0 && (
        <div className="space-y-3" id="software-metadata-block">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7C3AED]">
            <Cpu className="w-4 h-4" />
            <span>3. Software, Ferramenta de Criação & IA Prompts ({softwareItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {softwareItems.map((item) =>
              renderItemCard(item, {
                bg: "bg-[#F5F3FF]/70",
                border: "border-[#DDD6FE]",
                labelColor: "text-[#5B21B6]",
                badgeBg: "bg-white",
                badgeText: "text-[#7C3AED]",
                badgeBorder: "border-[#DDD6FE]"
              })
            )}
          </div>
        </div>
      )}

      {/* 4. METADADOS GERAIS (TÍTULO, AUTOR, COPYRIGHT, PALAVRAS-CHAVE) */}
      {metadataItems.length > 0 && (
        <div className="space-y-3" id="general-metadata-block">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#2563EB]">
            <Tag className="w-4 h-4" />
            <span>4. Metadados Gerais, Autoria & Direitos ({metadataItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metadataItems.map((item) =>
              renderItemCard(item, {
                bg: "bg-[#EFF6FF]/60",
                border: "border-[#BFDBFE]",
                labelColor: "text-[#1E40AF]",
                badgeBg: "bg-white",
                badgeText: "text-[#2563EB]",
                badgeBorder: "border-[#BFDBFE]"
              })
            )}
          </div>
        </div>
      )}

      {/* 5. COMENTÁRIOS E TEXTO LIVRE */}
      {commentItems.length > 0 && (
        <div className="space-y-3" id="comment-metadata-block">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#059669]">
            <MessageSquare className="w-4 h-4" />
            <span>5. Comentários & Textos Livres ({commentItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commentItems.map((item) =>
              renderItemCard(item, {
                bg: "bg-[#ECFDF5]/60",
                border: "border-[#A7F3D0]",
                labelColor: "text-[#065F46]",
                badgeBg: "bg-white",
                badgeText: "text-[#059669]",
                badgeBorder: "border-[#A7F3D0]"
              })
            )}
          </div>
        </div>
      )}

      {/* 6. BLOCOS XMP & IPTC-NAA */}
      {xmpIptcItems.length > 0 && (
        <div className="space-y-3" id="xmp-iptc-metadata-block">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0284C7]">
            <Compass className="w-4 h-4" />
            <span>6. Pacotes XMP / IPTC-NAA ({xmpIptcItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {xmpIptcItems.map((item) =>
              renderItemCard(item, {
                bg: "bg-[#F0F9FF]/60",
                border: "border-[#BAE6FD]",
                labelColor: "text-[#0369A1]",
                badgeBg: "bg-white",
                badgeText: "text-[#0284C7]",
                badgeBorder: "border-[#BAE6FD]"
              })
            )}
          </div>
        </div>
      )}

      {/* 7. DADOS EXTRAS DESCONHECIDOS / TAGS PROPRIETÁRIAS */}
      {unknownOptionalItems.length > 0 && (
        <div className="space-y-3" id="unknown-optional-metadata-block">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#64748B]">
            <Binary className="w-4 h-4" />
            <span>7. Tags & Chunks Auxiliares Detectados ({unknownOptionalItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unknownOptionalItems.map((item) =>
              renderItemCard(item, {
                bg: "bg-[#F8FAFC]",
                border: "border-[#E2E8F0]",
                labelColor: "text-[#334155]",
                badgeBg: "bg-white",
                badgeText: "text-[#64748B]",
                badgeBorder: "border-[#CBD5E1]"
              })
            )}
          </div>
        </div>
      )}

      {/* Caso a imagem não tenha nenhum metadado opcional */}
      {totalOptionalCount === 0 && (
        <div className="p-6 rounded-2xl bg-[#ECFDF5]/60 border border-[#A7F3D0] text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto" />
          <h4 className="text-sm font-black text-[#065F46]">
            Nenhum metadado de rastreabilidade ou opcional detectado
          </h4>
          <p className="text-xs text-[#047857] max-w-md mx-auto">
            A imagem já está completamente limpa de dados EXIF, coordenadas de GPS, marcas de dispositivo ou comentários proprietários.
          </p>
        </div>
      )}

      {/* 8. ESTRUTURA TÉCNICA E PERFIL DE COR (PRESERVADOS) */}
      {technicalItems.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-[#F1F5F9]" id="technical-metadata-block">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#475569]">
            <Layers className="w-4 h-4" />
            <span>Estrutura Técnica & Calibração de Cores Preservada</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {technicalItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between gap-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-[#475569]">{item.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B]">
                    {item.source}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#0F172A]">
                  {item.value}
                </div>
                {item.details && (
                  <p className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                    {item.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. CHUNKS / SEGMENTOS FÍSICOS DA IMAGEM */}
      {verification.chunksSummary.length > 0 && (
        <div className="pt-2 border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={() => setShowRawChunks(!showRawChunks)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] transition-all cursor-pointer border border-[#E2E8F0]"
            id="btn-toggle-raw-chunks"
          >
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#059669]" />
              <span>Inspecionar Mapa Binário de Segmentos / Chunks ({verification.chunksSummary.length})</span>
            </div>
            {showRawChunks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRawChunks && (
            <div className="mt-3 p-4 rounded-2xl bg-[#0F172A] text-[#F8FAFC] font-mono text-xs space-y-2 overflow-x-auto max-h-72">
              <div className="text-[#94A3B8] pb-2 border-b border-[#334155] font-sans text-xs flex justify-between">
                <span>Segmento / Marcador Físico</span>
                <span>Offset • Tamanho</span>
              </div>
              {verification.chunksSummary.map((chunk, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-0.5 border-b border-[#1E293B]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#64748B] select-none shrink-0">[{idx + 1}]</span>
                    <span className={chunk.isRemovable ? "text-[#F87171] font-bold" : "text-[#34D399]"}>
                      {chunk.name}
                    </span>
                    {chunk.details && (
                      <span className="text-[#94A3B8] text-[11px] truncate hidden sm:inline">
                        — {chunk.details}
                      </span>
                    )}
                  </div>
                  <div className="text-[#94A3B8] text-[11px] shrink-0 text-right">
                    <span className="text-[#E2E8F0]">{chunk.size} B</span> •{" "}
                    <span>0x{chunk.offset.toString(16).toUpperCase().padStart(6, "0")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
