/**
 * MultiConverte Document Converter API Service
 * Shared client service for Word and Excel remote PDF conversion via Cloudflare Worker/Container.
 */

export interface RemoteConversionProgressCallback {
  (step: string, percent: number): void;
}

export function getRawConverterApiUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_DOCUMENT_CONVERTER_API_URL;
  return typeof envUrl === "string" ? envUrl.trim() : "";
}

export function isRemoteConverterConfigured(): boolean {
  const url = getRawConverterApiUrl();
  return url.length > 0 && (url.startsWith("http://") || url.startsWith("https://"));
}

/**
 * Helper to normalize base URL and endpoint paths cleanly.
 * Handles both base URL (https://api.domain.com) and full route formats gracefully.
 */
function getEndpointUrl(endpointPath: "/convert/word-to-pdf" | "/convert/excel-to-pdf"): string {
  const rawUrl = getRawConverterApiUrl().replace(/\/+$/, "");

  if (!rawUrl) {
    throw new Error("Serviço de conversão de documentos ainda não configurado.");
  }

  // If rawUrl already includes the route, return it directly
  if (rawUrl.includes(endpointPath)) {
    return rawUrl;
  }

  // Remove trailing route suffixes if present to avoid duplication
  const baseUrl = rawUrl
    .replace(/\/convert\/(word-to-pdf|excel-to-pdf)\/?$/i, "")
    .replace(/\/convert\/?$/i, "");

  return `${baseUrl}${endpointPath}`;
}

async function uploadAndConvertRemote(
  file: File,
  endpointPath: "/convert/word-to-pdf" | "/convert/excel-to-pdf",
  onProgress?: RemoteConversionProgressCallback
): Promise<Blob> {
  const targetUrl = getEndpointUrl(endpointPath);

  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", targetUrl, true);
    xhr.responseType = "blob";

    onProgress?.("Validando arquivo...", 5);

    // Track real upload progress
    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Map upload progress from 5% to 65%
          const uploadPercent = Math.round(5 + (event.loaded / event.total) * 60);
          onProgress?.(`Enviando arquivo (${Math.round((event.loaded / event.total) * 100)}%)...`, uploadPercent);
        } else {
          onProgress?.("Enviando arquivo ao servidor...", 35);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.("Preparando o arquivo PDF...", 90);
        const pdfBlob = xhr.response as Blob;

        if (!pdfBlob || pdfBlob.size === 0) {
          return reject(new Error("O servidor retornou um arquivo PDF vazio."));
        }

        onProgress?.("Concluído!", 100);
        resolve(pdfBlob);
      } else {
        // Read JSON error message if returned as Blob
        const blobResponse = xhr.response as Blob;
        if (blobResponse && blobResponse.type.includes("json")) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result as string);
              reject(new Error(json.error || `Erro na conversão remota (Status ${xhr.status}).`));
            } catch {
              reject(new Error(`Erro no servidor de conversão (Status ${xhr.status}).`));
            }
          };
          reader.onerror = () => reject(new Error(`Erro no servidor de conversão (Status ${xhr.status}).`));
          reader.readAsText(blobResponse);
        } else {
          if (xhr.status === 429) {
            reject(new Error("O servidor de conversão está muito ocupado no momento. Tente novamente em instantes."));
          } else if (xhr.status === 504) {
            reject(new Error("O tempo limite para a conversão do documento foi excedido no servidor."));
          } else {
            reject(new Error(`Falha no servidor de conversão remoto (Status ${xhr.status}).`));
          }
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Falha na conexão de rede com o serviço remoto de conversão. Verifique sua internet ou tente mais tarde."));
    };

    xhr.ontimeout = () => {
      reject(new Error("A conexão com o servidor de conversão expirou."));
    };

    onProgress?.("Iniciando conversão no servidor LibreOffice...", 70);

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

/**
 * Converts a Word document (.doc or .docx) to PDF using the remote LibreOffice service.
 */
export async function convertWordToPdfRemote(
  file: File,
  options?: { onProgress?: RemoteConversionProgressCallback }
): Promise<Blob> {
  return uploadAndConvertRemote(file, "/convert/word-to-pdf", options?.onProgress);
}

/**
 * Converts an Excel spreadsheet (.xls or .xlsx) to PDF using the remote LibreOffice service.
 */
export async function convertExcelToPdfRemote(
  file: File,
  options?: { onProgress?: RemoteConversionProgressCallback }
): Promise<Blob> {
  return uploadAndConvertRemote(file, "/convert/excel-to-pdf", options?.onProgress);
}
