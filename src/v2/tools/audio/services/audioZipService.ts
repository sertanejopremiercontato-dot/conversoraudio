/**
 * Conversor Audio V2 - Audio ZIP Packaging Service
 * 
 * Empacotamento local em lote via fflate (sem envio de arquivos para servidor).
 */

import { zipSync } from "fflate";
import { AudioQueueItemV2 } from "../types";

export async function createAudioBatchZipBlob(items: AudioQueueItemV2[]): Promise<Blob> {
  const completedItems = items.filter(
    (item) => item.status === "concluido" && item.convertedBlobUrl && item.convertedFileName
  );

  if (completedItems.length === 0) {
    throw new Error("Nenhum arquivo convertido disponível para download em ZIP.");
  }

  const zipFiles: Record<string, Uint8Array> = {};

  for (const item of completedItems) {
    if (!item.convertedBlobUrl || !item.convertedFileName) continue;
    const response = await fetch(item.convertedBlobUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    // Evita colisão de nomes no ZIP
    let finalName = item.convertedFileName;
    let counter = 1;
    while (zipFiles[finalName]) {
      const dotIndex = item.convertedFileName.lastIndexOf(".");
      const base = dotIndex !== -1 ? item.convertedFileName.substring(0, dotIndex) : item.convertedFileName;
      const ext = dotIndex !== -1 ? item.convertedFileName.substring(dotIndex) : "";
      finalName = `${base} (${counter})${ext}`;
      counter++;
    }

    zipFiles[finalName] = new Uint8Array(arrayBuffer);
  }

  const zipped = zipSync(zipFiles);
  return new Blob([zipped], { type: "application/zip" });
}
