import React, { useState } from "react";
import { ArrowLeft, Image as ImageIcon, Download, Archive, AlertCircle, FileText, CheckCircle2, Eye } from "lucide-react";
import JSZip from "jszip";
import { PdfDropzoneV2 } from "../components/PdfDropzoneV2";
import { PdfProgressV2 } from "../components/PdfProgressV2";
import { PdfRenderV2, RenderedPageImage } from "../services/pdfRenderV2";
import { trackEventV2 } from "../../../integrations/analytics";

interface PdfToImagesV2Props {
  onBack: () => void;
}

export const PdfToImagesV2: React.FC<PdfToImagesV2Props> = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"jpg" | "png" | "webp">("jpg");
  const [dpi, setDpi] = useState<number>(150);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [renderedPages, setRenderedPages] = useState<RenderedPageImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor, selecione um arquivo em formato PDF.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setRenderedPages([]);
  };

  const handleStartRender = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      setStepText("Carregando páginas do documento...");
      const doc = await PdfRenderV2.loadDocument(selectedFile);
      const totalPages = doc.numPages;
      const pages: RenderedPageImage[] = [];

      for (let i = 1; i <= totalPages; i++) {
        setStepText(`Renderizando página ${i} de ${totalPages}...`);
        setProgress(Math.round((i / totalPages) * 100));

        const pageImg = await PdfRenderV2.renderPageToBlob(doc, i, format, dpi, 0.85);
        pages.push(pageImg);
      }

      setRenderedPages(pages);

      trackEventV2("pdf_to_images_completed", {
        page_count: totalPages,
        format,
        dpi,
        app_version: "v2"
      });
    } catch (err: any) {
      console.error("Erro ao converter PDF em imagens:", err);
      setErrorMessage(err?.message || "Ocorreu um erro ao extrair as páginas em imagem.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (page: RenderedPageImage) => {
    const a = document.createElement("a");
    a.href = page.dataUrl;
    a.download = `pagina-${page.pageNumber}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    if (renderedPages.length === 0) return;

    const zip = new JSZip();
    const folderName = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : "pdf-imagens";
    const imgFolder = zip.folder(folderName);

    renderedPages.forEach((page) => {
      imgFolder?.file(`pagina-${page.pageNumber}.${format}`, page.blob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${folderName}-todas-paginas.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setRenderedPages([]);
    setProgress(0);
    setStepText("");
    setErrorMessage(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Hub PDF</span>
        </button>

        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">PDF para Imagens</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Converta cada página do PDF em imagem JPG, PNG ou WEBP</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Flow */}
      {renderedPages.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {renderedPages.length} {renderedPages.length === 1 ? "Página Convertida" : "Páginas Convertidas"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Baixe individualmente ou faça download de todas em um único arquivo ZIP.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadAllZip}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>Baixar Todas (.ZIP)</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Novo PDF
              </button>
            </div>
          </div>

          {/* Grid of Converted Pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {renderedPages.map((page) => (
              <div
                key={page.pageNumber}
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span className="font-mono">Página {page.pageNumber}</span>
                  <span>{formatSize(page.size)}</span>
                </div>

                <div className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center">
                  <img
                    src={page.dataUrl}
                    alt={`Página ${page.pageNumber}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadSingle(page)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-200 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Imagem</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : isProcessing ? (
        <PdfProgressV2 progress={progress} stepText={stepText} />
      ) : (
        <div className="space-y-6">
          {!selectedFile ? (
            <PdfDropzoneV2
              onFilesSelected={handleFileSelected}
              multiple={false}
              title="Selecione o PDF para converter em imagens"
              subtitle="Arraste seu PDF ou clique para selecionar"
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{selectedFile.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(selectedFile.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Trocar Arquivo
                </button>
              </div>

              {/* Configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Formato de Saída</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="jpg">JPG (Leve e compatível)</option>
                    <option value="png">PNG (Qualidade gráfica máxima)</option>
                    <option value="webp">WEBP (Moderno e ultra-compacto)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Resolução / Nitidez</label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={96}>96 DPI (Visualização rápida na tela)</option>
                    <option value={150}>150 DPI (Recomendado - Excelente nitidez)</option>
                    <option value={300}>300 DPI (Alta definição para impressão)</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartRender}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Converter Páginas em Imagens</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
