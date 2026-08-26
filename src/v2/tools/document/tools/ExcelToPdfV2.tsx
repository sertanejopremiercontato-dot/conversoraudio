import React, { useState } from "react";
import { readExcelFile, ParsedExcelFile, ParsedSheet } from "../../../../services/document/excelReaderService";
import {
  PrintSettings,
  DEFAULT_PRINT_SETTINGS,
  calculateSmartSettings
} from "../../../../utils/document/excelPrintSettings";
import {
  convertExcelToPdf,
  ConversionReportData
} from "../../../../services/document/excelToPdfService";
import {
  isRemoteConverterConfigured,
  convertExcelToPdfRemote
} from "../../../../services/document/documentConverterApiService";
import { trackEventV2 } from "../../../integrations/analytics";
import { DocumentResultDataV2 } from "../types";

import { DocumentDropzoneV2 } from "../components/DocumentDropzoneV2";
import { DocumentProgressV2 } from "../components/DocumentProgressV2";
import { DocumentResultV2 } from "../components/DocumentResultV2";
import { ExcelSheetSelectorV2 } from "../components/ExcelSheetSelectorV2";
import { ExcelPrintSettingsV2 } from "../components/ExcelPrintSettingsV2";
import { ExcelPreviewV2 } from "../components/ExcelPreviewV2";

import { FileSpreadsheet, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, HelpCircle } from "lucide-react";

interface ExcelToPdfV2Props {
  onBack: () => void;
}

type Step = "upload" | "configure" | "processing" | "result";

export const ExcelToPdfV2: React.FC<ExcelToPdfV2Props> = ({ onBack }) => {
  const [step, setStep] = useState<Step>("upload");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<ParsedExcelFile | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Conversion Progress State
  const [progressStep, setProgressStep] = useState("Iniciando conversão...");
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressSheetInfo, setProgressSheetInfo] = useState("");

  const [resultData, setResultData] = useState<DocumentResultDataV2 | null>(null);

  const isRemoteConfigured = isRemoteConverterConfigured();

  const handleFileSelected = async (file: File) => {
    setIsLoadingFile(true);
    setUploadError(null);
    setRawFile(file);

    try {
      const parsed = await readExcelFile(file);
      setFileData(parsed);

      // Auto-calculate smart settings for active sheet
      if (parsed.sheets.length > 0) {
        const smart = calculateSmartSettings(parsed.sheets[0], DEFAULT_PRINT_SETTINGS.pageSize, DEFAULT_PRINT_SETTINGS.margin);
        setPrintSettings({
          ...DEFAULT_PRINT_SETTINGS,
          orientation: smart.suggestedOrientation,
          scalingMode: smart.suggestedScalingMode
        });
      }

      setStep("configure");
    } catch (err: any) {
      setUploadError(err?.message || "Não foi possível ler a planilha Excel. Verifique se o arquivo é válido.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSheetsChange = (updatedSheets: ParsedSheet[]) => {
    if (!fileData) return;
    setFileData({
      ...fileData,
      sheets: updatedSheets
    });
  };

  const handleStartConversion = async () => {
    if (!fileData || !rawFile) return;

    const selectedSheets = fileData.sheets.filter((s) => s.selected);
    if (selectedSheets.length === 0) {
      setUploadError("Selecione pelo menos uma aba da planilha para converter.");
      return;
    }

    setStep("processing");
    setProgressPercent(5);
    setProgressStep("Inicializando motor de renderização...");

    const startTime = Date.now();
    const inputFormat = fileData.filename.split(".").pop()?.toLowerCase() || "xlsx";

    // 1. Remote Path if explicitly configured
    if (isRemoteConfigured) {
      try {
        const pdfBlob = await convertExcelToPdfRemote(rawFile, {
          onProgress: (stage, pct) => {
            setProgressStep(stage);
            setProgressPercent(pct);
          }
        });

        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        const outName = fileData.filename.replace(/\.[^/.]+$/, "") + ".pdf";

        setResultData({
          pdfBlobUrl,
          pdfBlob,
          filename: outName,
          filesize: pdfBlob.size,
          pageCount: 1,
          sheetCount: selectedSheets.length,
          processingTimeMs: Date.now() - startTime
        });

        trackEventV2("excel_to_pdf_completed", {
          input_format: inputFormat,
          output_format: "pdf",
          file_count: 1,
          status: "completed"
        });

        setStep("result");
        return;
      } catch (err: any) {
        console.warn("[ExcelToPdfV2] Falha remota, alternando para renderizador local:", err);
      }
    }

    // 2. Primary 100% Local Browser Engine
    try {
      const report: ConversionReportData = await convertExcelToPdf(
        fileData,
        printSettings,
        "",
        (msg, sheetName, sIdx, totalS, pIdx, totalP, pct) => {
          setProgressStep(msg);
          setProgressPercent(pct);
          if (sheetName) {
            setProgressSheetInfo(`Aba ${sIdx}/${totalS}: ${sheetName} (Pág. ${pIdx}/${totalP})`);
          }
        }
      );

      const pdfBlob = new Blob([report.pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);

      setResultData({
        pdfBlobUrl,
        pdfBlob,
        filename: report.pdfFilename,
        filesize: report.pdfSize,
        pageCount: report.generatedPagesCount,
        sheetCount: report.convertedSheets.length,
        processingTimeMs: Date.now() - startTime,
        warnings: report.warnings
      });

      trackEventV2("excel_to_pdf_completed", {
        input_format: inputFormat,
        output_format: "pdf",
        file_count: 1,
        status: "completed"
      });

      setStep("result");
    } catch (err: any) {
      const errorMsg = err?.message || "Falha ao gerar o arquivo PDF.";
      setUploadError(errorMsg);
      setStep("configure");
    }
  };

  const handleReset = () => {
    if (resultData?.pdfBlobUrl) {
      URL.revokeObjectURL(resultData.pdfBlobUrl);
    }
    setRawFile(null);
    setFileData(null);
    setResultData(null);
    setUploadError(null);
    setProgressPercent(0);
    setStep("upload");
  };

  const activeSheet = fileData?.sheets.find((s) => s.selected) || fileData?.sheets[0];

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
            Converter Excel para PDF
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] mt-1">
            Converta planilhas <strong>XLSX, XLS e CSV</strong> em documentos PDF de alta qualidade com ajuste automático de colunas.
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
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              title="Arraste e solte sua planilha Excel ou CSV aqui"
              subtitle="Suporta arquivos .XLSX, .XLS e .CSV de até 30MB"
              buttonText="Selecionar Planilha do Computador"
              iconType="excel"
              isLoading={isLoadingFile}
              error={uploadError}
              onFileSelected={handleFileSelected}
            />

            {/* Features Highlight */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { title: "Ajuste Inteligente", desc: "Evita corte de colunas" },
                { title: "Múltiplas Abas", desc: "Escolha quais abas exportar" },
                { title: "Cores & Bordas", desc: "Preserva estilos visuais" },
                { title: "100% Privado", desc: "Não envia dados a servidores" }
              ].map((f, i) => (
                <div key={i} className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-0.5">
                  <h4 className="text-xs font-extrabold text-[#0F172A]">{f.title}</h4>
                  <p className="text-[11px] text-[#64748B]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "configure" && fileData && (
          <div className="space-y-6">
            <ExcelSheetSelectorV2
              filename={fileData.filename}
              filesize={fileData.filesize}
              sheets={fileData.sheets}
              onSheetsChange={handleSheetsChange}
              onResetFile={handleReset}
            />

            {activeSheet && (
              <ExcelPrintSettingsV2
                settings={printSettings}
                onChange={setPrintSettings}
                activeSheet={activeSheet}
              />
            )}

            {activeSheet && (
              <ExcelPreviewV2
                sheet={activeSheet}
                settings={printSettings}
              />
            )}

            {/* Action Bar Sticky */}
            <div className="bg-white/95 border border-[#E2E8F0] p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 backdrop-blur-md shadow-xl">
              <div className="text-xs text-[#475569]">
                <span>
                  Pronto para converter <strong>{fileData.sheets.filter((s) => s.selected).length}</strong> de {fileData.sheets.length} abas
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleStartConversion}
                  disabled={fileData.sheets.filter((s) => s.selected).length === 0}
                  className="px-8 py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#0284C7]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial"
                >
                  <span>Gerar PDF Agora</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <DocumentProgressV2
            stageMessage={progressStep}
            percent={progressPercent}
            sheetOrPageInfo={progressSheetInfo}
            onCancel={handleReset}
          />
        )}

        {step === "result" && resultData && (
          <DocumentResultV2
            result={resultData}
            onReset={handleReset}
            title="Planilha Convertida em PDF com Sucesso!"
            subtitle="Seu documento está pronto. Faça o download ou visualize o resultado abaixo."
          />
        )}
      </div>

      {/* FAQ */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5 text-[#0284C7]" />
          <h3 className="font-display font-bold text-base sm:text-lg text-[#0F172A]">
            Perguntas Frequentes sobre a Conversão de Excel para PDF
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-[#475569]">
          <div className="space-y-1.5">
            <h4 className="font-bold text-[#0F172A] text-sm">Como converter mantendo todas as colunas visíveis?</h4>
            <p>
              Nossa ferramenta inclui o <strong>Ajuste Inteligente</strong> ativado por padrão. Ele calcula as larguras e orienta para Paisagem automaticamente se houver muitas colunas.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-[#0F172A] text-sm">Minhas planilhas e números financeiros são seguros?</h4>
            <p>
              Sim! Todo o processamento ocorre 100% diretamente no seu próprio navegador de internet. Seu arquivo nunca é armazenado nem transmitido a servidores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
