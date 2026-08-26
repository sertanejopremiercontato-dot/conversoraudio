import React, { useState } from "react";
import { Edit3, Download, CheckCircle2, Sparkles, Hash, AlertCircle, Save } from "lucide-react";
import { ImageMetadataEditForm, ImageWriteResult } from "../types";
import { formatBytes } from "../services/imageMetadataVerifier";

interface ImageMetadataEditorCardProps {
  form: ImageMetadataEditForm;
  onChange: (form: ImageMetadataEditForm) => void;
  onWrite: () => void;
  onDownloadEdited: (file: File) => void;
  isWriting: boolean;
  writeResult: ImageWriteResult | null;
  onPrefillFromOriginal: () => void;
}

export const ImageMetadataEditorCard: React.FC<ImageMetadataEditorCardProps> = ({
  form,
  onChange,
  onWrite,
  onDownloadEdited,
  isWriting,
  writeResult,
  onPrefillFromOriginal
}) => {
  const handleFieldChange = (field: keyof ImageMetadataEditForm, value: string) => {
    onChange({
      ...form,
      [field]: value
    });
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 sm:p-8 shadow-xs space-y-6" id="image-metadata-editor-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#0F172A]">
              2. Editor de Metadados & Autoria
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Grave novas informações de título, autor e copyright sobre a base limpa da imagem
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onPrefillFromOriginal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] transition-all cursor-pointer shadow-2xs"
          id="btn-prefill-metadata"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Aproveitar Campos Existentes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Título da Imagem */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
            <span>Título da Imagem</span>
            <span className="text-[10px] text-[#64748B]">EXIF / XMP / IPTC</span>
          </label>
          <input
            type="text"
            value={form.title || ""}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="Ex: Pôr do Sol na Praia do Rosa"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white text-sm text-[#0F172A] font-medium outline-hidden transition-all"
            id="input-metadata-title"
          />
        </div>

        {/* Autor / Fotógrafo */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
            <span>Autor / Criador</span>
            <span className="text-[10px] text-[#64748B]">Artist / Creator</span>
          </label>
          <input
            type="text"
            value={form.artist || ""}
            onChange={(e) => handleFieldChange("artist", e.target.value)}
            placeholder="Ex: Mônica Estevão"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white text-sm text-[#0F172A] font-medium outline-hidden transition-all"
            id="input-metadata-artist"
          />
        </div>

        {/* Direitos Autorais / Copyright */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
            <span>Direitos Autorais (Copyright)</span>
            <span className="text-[10px] text-[#64748B]">dc:rights</span>
          </label>
          <input
            type="text"
            value={form.copyright || ""}
            onChange={(e) => handleFieldChange("copyright", e.target.value)}
            placeholder="Ex: © 2026 Todos os direitos reservados"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white text-sm text-[#0F172A] font-medium outline-hidden transition-all"
            id="input-metadata-copyright"
          />
        </div>

        {/* Palavras-chave / Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
            <span>Palavras-chave (separadas por vírgula)</span>
            <span className="text-[10px] text-[#64748B]">Keywords</span>
          </label>
          <input
            type="text"
            value={form.keywords || ""}
            onChange={(e) => handleFieldChange("keywords", e.target.value)}
            placeholder="Ex: natureza, praia, viagem, fotografia"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white text-sm text-[#0F172A] font-medium outline-hidden transition-all"
            id="input-metadata-keywords"
          />
        </div>

        {/* Descrição / Legenda (Full Width) */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
            <span>Descrição / Legenda</span>
            <span className="text-[10px] text-[#64748B]">ImageDescription</span>
          </label>
          <textarea
            rows={2}
            value={form.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            placeholder="Ex: Fotografia autoral capturada durante o final de tarde..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white text-sm text-[#0F172A] font-medium outline-hidden transition-all resize-none"
            id="input-metadata-description"
          />
        </div>

        {/* Comentário Adicional */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
            <span>Comentário</span>
            <span className="text-[10px] text-[#64748B]">UserComment</span>
          </label>
          <input
            type="text"
            value={form.comment || ""}
            onChange={(e) => handleFieldChange("comment", e.target.value)}
            placeholder="Ex: Tratamento e exportação oficial"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white text-sm text-[#0F172A] font-medium outline-hidden transition-all"
            id="input-metadata-comment"
          />
        </div>

        {/* Data de Criação */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
            <span>Data de Criação</span>
            <span className="text-[10px] text-[#64748B]">DateTime</span>
          </label>
          <input
            type="text"
            value={form.creationDate || ""}
            onChange={(e) => handleFieldChange("creationDate", e.target.value)}
            placeholder="Ex: 2026:08:25 14:30:00"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white text-sm text-[#0F172A] font-medium outline-hidden transition-all"
            id="input-metadata-creation-date"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onWrite}
          disabled={isWriting}
          className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
            isWriting
              ? "bg-[#94A3B8] cursor-not-allowed"
              : "bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99]"
          }`}
          id="btn-save-write-metadata"
        >
          {isWriting ? (
            <span>Gravando e validando novos metadados...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Gravar Novos Metadados na Imagem</span>
            </>
          )}
        </button>
      </div>

      {/* Relatório após gravação de novos metadados com diagnóstico e prova de identidade física */}
      {writeResult && (
        <div className={`mt-4 p-4 sm:p-5 rounded-2xl border space-y-4 ${
          writeResult.validationStatus === "VALIDATED"
            ? "bg-[#EFF6FF] border-[#BFDBFE]"
            : "bg-[#FEF2F2] border-[#FECACA]"
        }`} id="write-result-section">
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
              writeResult.validationStatus === "VALIDATED" ? "text-[#2563EB]" : "text-[#DC2626]"
            }`}>
              {writeResult.validationStatus === "VALIDATED" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                  <span>Gravação Concluída & Reanálise Física Validada</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                  <span>Gravação Não Validada na Reanálise Física</span>
                </>
              )}
            </div>
            {writeResult.reanalysisVerification && (
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                writeResult.validationStatus === "VALIDATED"
                  ? "bg-[#DBEAFE] text-[#1E40AF]"
                  : "bg-[#FEE2E2] text-[#991B1B]"
              }`}>
                {writeResult.reanalysisVerification.iTxTCount} Chunks iTXt
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white border border-[#BFDBFE]">
              <span className="text-[11px] font-semibold text-[#64748B] block">Campos Gravados</span>
              <span className="text-sm font-black text-[#2563EB] block mt-0.5">
                {writeResult.savedFields.length} campos
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#BFDBFE]">
              <span className="text-[11px] font-semibold text-[#64748B] block">Tamanho Final</span>
              <span className="text-sm font-black text-[#0F172A] block mt-0.5">
                {formatBytes(writeResult.finalSize)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#BFDBFE]">
              <span className="text-[11px] font-semibold text-[#64748B] block">Status de Rastreio</span>
              <span className="text-sm font-black text-[#059669] block mt-0.5">
                0 Leaks de GPS
              </span>
            </div>
          </div>

          {/* Diagnóstico Físico e Prova de Identidade do Arquivo Final */}
          <div className="p-3.5 rounded-xl bg-white border border-[#BFDBFE] text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Diagnóstico do Arquivo Produzido (finalEditedFile):</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE]">
                SOURCE: finalEditedFile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#64748B] font-semibold block">Nome do Arquivo Final:</span>
                <span className="font-mono font-bold text-[#0F172A] truncate block select-all">
                  {writeResult.finalEditedFile.name}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] font-semibold block">Tamanho Real dos Bytes:</span>
                <span className="font-mono font-bold text-[#0F172A] block">
                  {writeResult.finalSize.toLocaleString("pt-BR")} bytes ({formatBytes(writeResult.finalSize)})
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[#64748B] font-semibold block text-[11px]">SHA-256 Real dos Bytes:</span>
              <span className="font-mono text-[11px] text-[#1E40AF] block truncate select-all">
                {writeResult.finalSha256}
              </span>
            </div>

            {/* Prova de Preservação IDAT */}
            {writeResult.idatPayloadHashBefore && writeResult.idatPayloadHashAfter && (
              <div className="pt-2 border-t border-[#F1F5F9] space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-[#475569]">
                  <span className="font-semibold">IDAT Hash Before:</span>
                  <span className="font-mono truncate max-w-[55%]">{writeResult.idatPayloadHashBefore}</span>
                </div>
                <div className="flex items-center justify-between text-[#475569]">
                  <span className="font-semibold">IDAT Hash After:</span>
                  <span className="font-mono truncate max-w-[55%]">{writeResult.idatPayloadHashAfter}</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="font-bold text-[#0F172A]">Payload IDAT Preservado Verbatim:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    writeResult.isIdatPayloadPreserved
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : "bg-[#FEF2F2] text-[#DC2626]"
                  }`}>
                    {writeResult.isIdatPayloadPreserved ? "SIM (100% Intacto)" : "NÃO"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Checklist de Metadados Físicos Relidos dos Bytes */}
          {writeResult.reanalysisVerification && (
            <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1] text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#334155] block text-[11px]">
                  Confronto Físico dos Bytes Reanalisados:
                </span>
                <span className="text-[10px] font-bold text-[#2563EB]">
                  {writeResult.reanalysisVerification.iTxTCount} iTXt Chunks
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[#64748B]">Título Relido:</span>
                  <span className="font-mono font-bold text-[#0F172A] truncate max-w-[55%] select-all">
                    {writeResult.reanalysisVerification.recheckedTitle || "—"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[#64748B]">Autor Relido:</span>
                  <span className="font-mono font-bold text-[#0F172A] truncate max-w-[55%] select-all">
                    {writeResult.reanalysisVerification.recheckedAuthor || "—"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[#64748B]">Copyright Relido:</span>
                  <span className="font-mono font-bold text-[#0F172A] truncate max-w-[55%] select-all">
                    {writeResult.reanalysisVerification.recheckedCopyright || "—"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[#64748B]">Palavras-chave Relidas:</span>
                  <span className="font-mono font-bold text-[#0F172A] truncate max-w-[55%] select-all">
                    {writeResult.reanalysisVerification.recheckedKeywords || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pesquisa Bruta de Strings UTF-8 nos Bytes */}
          {writeResult.rawUtf8Search && writeResult.rawUtf8Search.length > 0 && (
            <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1] text-xs space-y-2">
              <span className="font-bold text-[#334155] block text-[11px]">
                Busca Direta nos Bytes Físicos (Offsets Reais UTF-8):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                {writeResult.rawUtf8Search.map((s, idx) => (
                  <div key={idx} className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[#475569] font-medium truncate max-w-[50%]">"{s.term}"</span>
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      s.found ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"
                    }`}>
                      {s.found ? `Offset: 0x${s.offset?.toString(16).toUpperCase()} (${s.offset})` : "Não encontrado"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Metadados Físicos Relidos na Reanálise */}
          {writeResult.analysisAfterWrite?.items && writeResult.analysisAfterWrite.items.length > 0 && (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs space-y-2">
              <span className="font-bold text-[#334155] block text-[11px]">
                Todos os Metadados Confirmados na Reanálise Física ({writeResult.analysisAfterWrite.items.length} tags/chunks):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {writeResult.analysisAfterWrite.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-[#E2E8F0] text-[11px]">
                    <span className="font-semibold text-[#0F172A] truncate max-w-[40%]">
                      {item.label || item.key}
                    </span>
                    <span className="font-mono text-[#2563EB] truncate max-w-[55%] text-right select-all">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => writeResult?.finalEditedFile && onDownloadEdited(writeResult.finalEditedFile)}
            disabled={!writeResult?.finalEditedFile}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#94A3B8] disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
            id="btn-download-edited-image"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Imagem com Novos Metadados</span>
          </button>
        </div>
      )}
    </div>
  );
};
