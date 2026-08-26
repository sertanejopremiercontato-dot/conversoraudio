import React, { useState } from "react";
import { convertWordToPdf } from "../../../../services/document/wordToPdf/wordToPdfService";
import {
  isRemoteConverterConfigured,
  convertWordToPdfRemote
} from "../../../../services/document/documentConverterApiService";
import { trackEventV2 } from "../../../integrations/analytics";
import { DocumentResultDataV2 } from "../types";

import { DocumentDropzoneV2 } from "../components/DocumentDropzoneV2";
import { DocumentProgressV2 } from "../components/DocumentProgressV2";
import { DocumentResultV2 } from "../components/DocumentResultV2";

import { FileText, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, HelpCircle, FileCheck, RefreshCw } from "lucide-react";

interface WordToPdfV2Props {
  onBack: () => void;
}

type Step = "upload" | "ready" | "processing" | "result";

export const WordToPdfV2: React.FC<WordToPdfV2Props> = ({ onBack }) => {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Conversion Progress
  const [progressStage, setProgressStage] = useState("Iniciando...");
  const [progressPercent, setProgressPercent] = useState(0);

  const [resultData, setResultData] = useState<DocumentResultDataV2 | null>(null);

  const isRemoteConfigured = isRemoteConverterConfigured();

  const handleFileSelect = (selectedFile: File) => {
    setUploadError(null);
    const fileName = selectedFile.name.toLowerCase();

    if (!fileName.endsWith(".docx") && !fileName.endsWith(".doc")) {
      setUploadError("Por favor, selecione um arquivo de documento Word válido (.docx ou .doc).");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setUploadError("O arquivo excede o limite máximo permitido de 25MB.");
      return;
    }

    setFile(selectedFile);
    setStep("ready");
  };

  const handleConvert = async () => {
    if (!file) return;

    setStep("processing");
    setUploadError(null);
    setProgressPercent(10);
    setProgressStage("Lendo estrutura do documento...");

    const startTime = Date.now();
    const isDocx = file.name.toLowerCase().endsWith(".docx");

    // 1. Remote Converter if explicitly configured
    if (isRemoteConfigured) {
      try {
        const pdfBlob = await convertWordToPdfRemote(file, {
          onProgress: (stage, pct) => {
            setProgressStage(stage);
            setProgressPercent(pct);
          }
        });

        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        const outName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";

        setResultData({
          pdfBlobUrl,
          pdfBlob,
          filename: outName,
          filesize: pdfBlob.size,
          pageCount: 1,
          processingTimeMs: Date.now() - startTime
        });

        trackEventV2("word_to_pdf_completed", {
          input_format: isDocx ? "docx" : "doc",
          output_format: "pdf",
          file_count: 1,
          status: "completed"
        });

        setStep("result");
        return;
      } catch (err: any) {
        console.warn("[WordToPdfV2] Falha remota, tentando motor local se DOCX:", err);
      }
    }

    // 2. Client-side Local Engine (DOCX)
    if (isDocx) {
      try {
        const { pdfResult } = await convertWordToPdf(file, file.name, {
          onProgress: (pct, stage) => {
            setProgressPercent(pct);
            setProgressStage(stage);
          }
        });

        setResultData({
          pdfBlobUrl: pdfResult.pdfUrl,
          pdfBlob: pdfResult.pdfBlob,
          filename: pdfResult.filename,
          filesize: pdfResult.fileSizeBytes,
          pageCount: pdfResult.pageCount,
          processingTimeMs: Date.now() - startTime,
          warnings: pdfResult.warnings
        });

        trackEventV2("word_to_pdf_completed", {
          input_format: "docx",
          output_format: "pdf",
          file_count: 1,
          status: "completed"
        });

        setStep("result");
        return;
      } catch (err: any) {
        console.error("[WordToPdfV2] Erro local:", err);
        setUploadError(err?.message || "Falha ao processar e converter o documento DOCX.");
        setStep("ready");
        return;
      }
    }

    // If legacy binary .doc without remote server
    setUploadError("Arquivos legados no formato binário .DOC requerem conversão prévia para .DOCX para processamento direto no navegador.");
    setStep("ready");
  };

  const handleReset = () => {
    if (resultData?.pdfBlobUrl) {
      URL.revokeObjectURL(resultData.pdfBlobUrl);
    }
    setFile(null);
    setResultData(null);
    setUploadError(null);
    setProgressPercent(0);
    setStep("upload");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] mb-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Hub de Documentos</span>
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Converter Word para PDF
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] mt-1">
            Transforme documentos <strong>Word (.DOCX)</strong> em arquivos PDF formatados, pesquisáveis e com alta resolução.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] rounded-full text-xs font-bold self-start sm:self-auto shadow-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Processamento Local</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="space-y-6">
        {step === "upload" && (
          <div className="space-y-6">
            <DocumentDropzoneV2
              accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              title="Arraste e solte seu documento Word aqui"
              subtitle="Suporta arquivos .DOCX de até 25MB com formatação completa"
              buttonText="Selecionar Documento Word"
              iconType="word"
              isLoading={isLoadingFile}
              error={uploadError}
              onFileSelected={handleFileSelect}
            />

            {/* Feature Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { title: "Texto & Títulos", desc: "Preserva fontes e hierarquias" },
                { title: "Tabelas & Listas", desc: "Mantém alinhamentos e células" },
                { title: "PDF Pesquisável", desc: "Texto selecionável e indexável" },
                { title: "Privacidade Total", desc: "Seu arquivo não sai do dispositivo" }
              ].map((f, i) => (
                <div key={i} className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-0.5">
                  <h4 className="text-xs font-extrabold text-[#0F172A]">{f.title}</h4>
                  <p className="text-[11px] text-[#64748B]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "ready" && file && (
          <div className="space-y-6 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#E0F2FE] rounded-2xl border border-[#BAE6FD] text-[#0284C7]">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A] truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Tamanho: {formatFileSize(file.size)} • Formato detectado: {file.name.split(".").pop()?.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] rounded-xl px-3.5 py-2 transition cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Escolher outro arquivo</span>
              </button>
            </div>

            {uploadError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
                <p className="font-bold text-amber-900">Aviso</p>
                <p className="leading-relaxed">{uploadError}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleConvert}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <span>Converter para PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <DocumentProgressV2
            stageMessage={progressStage}
            percent={progressPercent}
            onCancel={handleReset}
          />
        )}

        {step === "result" && resultData && (
          <DocumentResultV2
            result={resultData}
            onReset={handleReset}
            title="Documento Word Convertido em PDF!"
            subtitle="Seu documento foi convertido com sucesso. Baixe ou visualize o resultado abaixo."
          />
        )}
      </div>

      {/* FAQ */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5 text-[#0284C7]" />
          <h3 className="font-display font-bold text-base sm:text-lg text-[#0F172A]">
            Perguntas Frequentes sobre a Conversão de Word para PDF
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-[#475569]">
          <div className="space-y-1.5">
            <h4 className="font-bold text-[#0F172A] text-sm">Quais elementos do Word são preservados no PDF?</h4>
            <p>
              O motor preserva títulos (H1, H2, H3), parágrafos, formatações em negrito/itálico, cores de texto, listas numeradas e com marcadores, tabelas estruturadas e margens de página.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-[#0F172A] text-sm">Alguns elementos avançados podem variar?</h4>
            <p>
              Alguns elementos avançados como macros específicas ou estilos de numeração complexos podem sofrer pequenas diferenças na conversão padrão web.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
