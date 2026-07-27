import { parseDocxFile } from "./docxParserService";
import { renderWordModelToPdf, WordToPdfOptions, WordToPdfResult } from "./docxToPdfRenderer";
import { WordDocumentModel } from "./types";

export interface ConvertWordToPdfInputOptions extends WordToPdfOptions {
  onProgress?: (progressPercent: number, stage: string) => void;
}

export async function convertWordToPdf(
  fileInput: File | ArrayBuffer,
  filename?: string,
  options: ConvertWordToPdfInputOptions = {}
): Promise<{ docModel: WordDocumentModel; pdfResult: WordToPdfResult }> {
  options.onProgress?.(15, "Lendo pacote DOCX...");

  // Step 1: Parse DOCX file into intermediate model
  const docModel = await parseDocxFile(fileInput, filename);

  options.onProgress?.(50, "Processando parágrafos, tabelas e imagens...");

  // Step 2: Render intermediate model to PDF
  options.onProgress?.(75, "Gerando documento PDF pesquisável...");

  const pdfResult = await renderWordModelToPdf(docModel, options);

  options.onProgress?.(100, "Conversão concluída!");

  return {
    docModel,
    pdfResult,
  };
}

export { parseDocxFile, renderWordModelToPdf };
export type { WordToPdfOptions, WordToPdfResult };
