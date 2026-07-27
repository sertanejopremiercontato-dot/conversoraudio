import React, { useState, useEffect } from "react";
import { useSeoHead } from "../../lib/useSeoHead";
import { trackEvent } from "../../lib/gtag";
import { readExcelFile, ParsedExcelFile, ParsedSheet } from "../../services/document/excelReaderService";
import {
  PrintSettings,
  DEFAULT_PRINT_SETTINGS,
  calculateSmartSettings
} from "../../utils/document/excelPrintSettings";
import {
  convertExcelToPdf,
  ConversionReportData
} from "../../services/document/excelToPdfService";
import {
  isRemoteConverterConfigured,
  convertExcelToPdfRemote
} from "../../services/document/documentConverterApiService";

import ExcelUpload from "../../components/document/excel-to-pdf/ExcelUpload";
import ExcelSheetSelector from "../../components/document/excel-to-pdf/ExcelSheetSelector";
import ExcelPrintSettings from "../../components/document/excel-to-pdf/ExcelPrintSettings";
import ExcelPreview from "../../components/document/excel-to-pdf/ExcelPreview";
import ExcelProgress from "../../components/document/excel-to-pdf/ExcelProgress";
import ExcelResult from "../../components/document/excel-to-pdf/ExcelResult";
import ExcelConversionReport from "../../components/document/excel-to-pdf/ExcelConversionReport";

import {
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  FileText,
  ChevronRight,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";

interface ExcelToPdfProps {
  onNavigate?: (path: string) => void;
}

type Step = "upload" | "configure" | "processing" | "result";

export default function ExcelToPdf({ onNavigate }: ExcelToPdfProps) {
  useSeoHead("excelToPdf");

  const [step, setStep] = useState<Step>("upload");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<ParsedExcelFile | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Conversion state
  const [progressStep, setProgressStep] = useState("Iniciando conversão...");
  const [progressSheetName, setProgressSheetName] = useState("");
  const [progressSheetIdx, setProgressSheetIdx] = useState(1);
  const [progressTotalSheets, setProgressTotalSheets] = useState(1);
  const [progressPageIdx, setProgressPageIdx] = useState(1);
  const [progressTotalPages, setProgressTotalPages] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);

  const [reportData, setReportData] = useState<ConversionReportData | null>(null);

  const isRemoteConfigured = isRemoteConverterConfigured();

  const handleFileSelected = async (file: File) => {
    setIsLoadingFile(true);
    setUploadError(null);
    setRawFile(file);

    try {
      const parsed = await readExcelFile(file);
      setFileData(parsed);

      // Auto calculate smart print settings for active sheet
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
      const errorMsg = err?.message || "Não foi possível ler o arquivo Excel.";
      setUploadError(errorMsg);
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
      setUploadError("Selecione pelo menos uma aba para conversão.");
      return;
    }

    setStep("processing");
    setProgressPercent(5);

    const inputFormat = fileData.filename.split(".").pop()?.toLowerCase() || "xlsx";

    trackEvent("excel_to_pdf_started", {
      filename: fileData.filename,
      filesize: fileData.filesize,
      sheet_count: fileData.sheets.length,
      selected_sheet_count: selectedSheets.length,
      orientation: printSettings.orientation,
      page_size: printSettings.pageSize,
      scaling_mode: printSettings.scalingMode,
      input_format: inputFormat
    });

    // 1. Remote Conversion Path via Cloudflare LibreOffice Service
    if (isRemoteConfigured) {
      try {
        const pdfBlob = await convertExcelToPdfRemote(rawFile, {
          onProgress: (stage, pct) => {
            setProgressStep(stage);
            setProgressPercent(pct);
          },
        });

        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        const pdfFilename = fileData.filename.replace(/\.[^/.]+$/, "") + ".pdf";

        const report: ConversionReportData = {
          filename: fileData.filename,
          pdfFilename,
          pdfBlobUrl,
          pdfBytes: new Uint8Array(await pdfBlob.arrayBuffer()),
          pdfSize: pdfBlob.size,
          convertedSheets: selectedSheets.map((s) => s.name),
          skippedSheets: fileData.sheets.filter((s) => !s.selected).map((s) => s.name),
          totalCellsProcessed: selectedSheets.reduce((sum, s) => sum + Object.keys(s.cells || {}).length, 0),
          uncalculatedFormulasCount: 0,
          generatedPagesCount: 1,
          unsupportedFeatures: [],
          warnings: [],
          orientationUsed: printSettings.orientation,
          pageSizeUsed: printSettings.pageSize,
        };

        setReportData(report);
        setStep("result");

        trackEvent("excel_to_pdf_completed_remote", {
          filename: fileData.filename,
          sheet_count: selectedSheets.length,
          pdf_size: pdfBlob.size,
          success: true
        });
        return;
      } catch (err: any) {
        console.error("[ExcelToPdf] Erro na conversão remota:", err);
        setUploadError(err?.message || "Falha na conversão remota de alta fidelidade.");
        setStep("configure");
        return;
      }
    }

    // 2. Local Flow (using Excel Rendering Engine and local PDF generator)
    try {
      const report = await convertExcelToPdf(
        fileData,
        printSettings,
        "",
        (msg, sheetName, sIdx, totalS, pIdx, totalP, pct) => {
          setProgressStep(msg);
          setProgressSheetName(sheetName);
          setProgressSheetIdx(sIdx);
          setProgressTotalSheets(totalS);
          setProgressPageIdx(pIdx);
          setProgressTotalPages(totalP);
          setProgressPercent(pct);
        }
      );

      setReportData(report);
      setStep("result");

      trackEvent("excel_to_pdf_completed", {
        filename: fileData.filename,
        sheet_count: selectedSheets.length,
        page_count: report.generatedPagesCount,
        pdf_size: report.pdfSize,
        success: true
      });
    } catch (err: any) {
      const errorMsg = err?.message || "Falha durante a geração do documento PDF.";
      setUploadError(errorMsg);
      setStep("configure");

      trackEvent("excel_to_pdf_failed", {
        filename: fileData.filename,
        error_message: errorMsg
      });
    }
  };

  const handleReset = () => {
    if (reportData?.pdfBlobUrl) {
      URL.revokeObjectURL(reportData.pdfBlobUrl);
    }
    setRawFile(null);
    setFileData(null);
    setReportData(null);
    setUploadError(null);
    setStep("upload");
  };

  const activeSheet = fileData?.sheets.find((s) => s.selected) || fileData?.sheets[0];

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Ferramenta de Documentos • 100% Grátis</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100" id="excel-to-pdf-title">
          Converter Excel para PDF Grátis
        </h1>

        <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Converta suas planilhas <strong>XLSX</strong>, <strong>XLS</strong> e <strong>CSV</strong> em documentos PDF de alta qualidade. Escolha as abas, configure orientação, margens e ajuste automático de colunas.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {[
            "Preserva cores e tabelas",
            "Ajuste automático de colunas",
            "Múltiplas abas",
            "Repetição de cabeçalho",
            "Processamento 100% local",
            "Sem cadastro"
          ].map((item, idx) => (
            <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-semibold px-3 py-1 rounded-full">
              ✓ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main Interactive Container */}
      <div id="excel-to-pdf-workspace">
        {step === "upload" && (
          <ExcelUpload
            onFileSelected={handleFileSelected}
            isLoading={isLoadingFile}
            error={uploadError}
          />
        )}

        {step === "configure" && fileData && (
          <div className="space-y-8">
            <ExcelSheetSelector
              filename={fileData.filename}
              filesize={fileData.filesize}
              sheets={fileData.sheets}
              onSheetsChange={handleSheetsChange}
              onResetFile={handleReset}
            />

            {activeSheet && (
              <ExcelPrintSettings
                settings={printSettings}
                onChange={setPrintSettings}
                activeSheet={activeSheet}
              />
            )}

            {activeSheet && (
              <ExcelPreview
                sheet={activeSheet}
                settings={printSettings}
              />
            )}

            {/* Action Bar */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 backdrop-blur-md shadow-2xl">
              <div className="text-xs text-slate-400">
                <span>
                  Pronto para converter <strong>{fileData.sheets.filter((s) => s.selected).length}</strong> de {fileData.sheets.length} abas
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleStartConversion}
                  disabled={fileData.sheets.filter((s) => s.selected).length === 0}
                  className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial"
                >
                  <span>Gerar PDF Agora</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <ExcelProgress
            stepMessage={progressStep}
            sheetName={progressSheetName}
            sheetIdx={progressSheetIdx}
            totalSheets={progressTotalSheets}
            pageIdx={progressPageIdx}
            totalPages={progressTotalPages}
            percent={progressPercent}
            onCancel={handleReset}
          />
        )}

        {step === "result" && reportData && (
          <div className="space-y-8">
            <ExcelResult
              pdfBlobUrl={reportData.pdfBlobUrl}
              defaultFilename={reportData.pdfFilename}
              pdfSize={reportData.pdfSize}
              pageCount={reportData.generatedPagesCount}
              sheetCount={reportData.convertedSheets.length}
              onReset={handleReset}
            />

            <ExcelConversionReport report={reportData} />
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5 text-emerald-400" />
          <h3 className="font-display font-bold text-lg text-slate-100">
            Perguntas Frequentes sobre a Conversão de Excel para PDF
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-400">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-200 text-sm">Como converter uma planilha Excel em PDF sem cortar colunas?</h4>
            <p>
              Nossa ferramenta inclui o recurso de <strong>Ajuste Inteligente</strong>. Por padrão, a opção &quot;Ajustar colunas na largura da página&quot; dimensiona automaticamente todas as colunas da planilha para que caibam perfeitamente na página, trocando para orientação Paisagem se houver muitas colunas.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-200 text-sm">É seguro enviar minhas planilhas financeiras?</h4>
            <p>
              Sim! Todo o processamento do Excel ocorre 100% diretamente no seu próprio navegador de internet. Seu arquivo nunca é enviado para servidores externos nem armazenado.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-200 text-sm">Posso escolher quais abas do Excel serão convertidas?</h4>
            <p>
              Sim, ao carregar o arquivo você pode selecionar exatamente quais planilhas (abas) deseja incluir no PDF e até renomeá-las individualmente.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-200 text-sm">Suporta fórmulas, cores e células mescladas?</h4>
            <p>
              Sim! A ferramenta reconhece valores formatados (moedas R$, datas, porcentagens), cores de fundo, texto em negrito/itálico, bordas de tabela e células mescladas.
            </p>
          </div>
        </div>
      </div>

      {/* Related Tools Links */}
      <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-6 space-y-4">
        <h4 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>Outras Ferramentas de Documentos e PDF do MultiConverte</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            onClick={() => onNavigate?.("/pdf/extrair-texto")}
            className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                Extrair Texto de PDF
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </div>

          <div
            onClick={() => onNavigate?.("/documento")}
            className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                Hub de Documentos
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
