import { WorkbookVisualModel, ExcelRenderingOptions } from "./types";
import { buildWorkbookVisualModelFromData } from "./excelModelBuilder";

export async function buildWorkbookVisualModel(
  fileInput: File | ArrayBuffer,
  options: ExcelRenderingOptions = {}
): Promise<WorkbookVisualModel> {
  let arrayBuffer: ArrayBuffer;
  let filename = "planilha.xlsx";

  if (fileInput instanceof File) {
    filename = fileInput.name;
    try {
      arrayBuffer = await fileInput.arrayBuffer();
    } catch (e: any) {
      throw new Error(`Erro ao ler arquivo de entrada: ${e?.message || "Falha de leitura"}`);
    }
  } else if (fileInput instanceof ArrayBuffer) {
    arrayBuffer = fileInput;
  } else {
    throw new Error("Entrada inválida. Forneça um arquivo do tipo File ou ArrayBuffer.");
  }

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("O arquivo fornecido está vazio ou corrompido.");
  }

  try {
    return await buildWorkbookVisualModelFromData(arrayBuffer, filename, options);
  } catch (err: any) {
    throw new Error(`Falha no processamento da planilha: ${err?.message || "Erro interno na Excel Rendering Engine"}`);
  }
}
