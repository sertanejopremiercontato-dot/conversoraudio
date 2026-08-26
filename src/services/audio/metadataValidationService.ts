import {
  AudioMetadataModel,
  AudioValidationResult,
  BeforeAfterItem,
  ProcessingStats
} from "../../types/audioMetadata";
import { calculateAudioPayloadHash } from "./audioHashService";

export interface ValidationAuditResult {
  validation: AudioValidationResult;
  diffList: BeforeAfterItem[];
  stats: ProcessingStats;
}

export async function validateMetadataResult(
  originalFile: File,
  initialModel: AudioMetadataModel,
  processedBlob: Blob,
  updatedModel: AudioMetadataModel
): Promise<ValidationAuditResult> {
  const startTime = performance.now();

  // Calculate pre and post SHA-256 hashes of the pure audio stream
  const preAudioHash = await calculateAudioPayloadHash(originalFile);
  const postAudioHash = await calculateAudioPayloadHash(processedBlob);

  const hashMatch = preAudioHash === postAudioHash;

  const validation: AudioValidationResult = {
    isValid: hashMatch,
    preAudioHash,
    postAudioHash,
    hashMatch,
    audioStreamUnchanged: hashMatch,
    message: hashMatch
      ? "Selo de Integridade Garantido: O hash SHA-256 do fluxo de áudio é idêntico. Zero perda ou recompressão de áudio."
      : "Atenção: Ocorreu uma variação no fluxo de áudio durante a gravação."
  };

  // Generate Before vs After Diff
  const diffList: BeforeAfterItem[] = [];

  const compareField = (label: string, beforeVal?: string, afterVal?: string) => {
    const b = (beforeVal || "").trim();
    const a = (afterVal || "").trim();

    if (!b && !a) return;

    let status: BeforeAfterItem["status"] = "kept";
    if (!b && a) status = "added";
    else if (b && !a) status = "removed";
    else if (b !== a) status = "modified";

    diffList.push({
      fieldLabel: label,
      beforeVal: b || "(Vazio)",
      afterVal: a || "(Removido)",
      status
    });
  };

  compareField("Título", initialModel.title, updatedModel.title);
  compareField("Artista", initialModel.artist, updatedModel.artist);
  compareField("Álbum", initialModel.album, updatedModel.album);
  compareField("Artista do Álbum", initialModel.albumArtist, updatedModel.albumArtist);
  compareField("Compositor", initialModel.composer, updatedModel.composer);
  compareField("Gênero", initialModel.genre, updatedModel.genre);
  compareField("Ano / Data", initialModel.year, updatedModel.year);
  compareField("Número da Faixa", initialModel.trackNumber, updatedModel.trackNumber);
  compareField("Disco", initialModel.discNumber, updatedModel.discNumber);
  compareField("Copyright", initialModel.copyright, updatedModel.copyright);
  compareField("ISRC", initialModel.isrc, updatedModel.isrc);
  compareField("BPM", initialModel.bpm, updatedModel.bpm);
  compareField("Comentários", initialModel.comment, updatedModel.comment);
  compareField("Encoder / Codificador", initialModel.encoder, updatedModel.encoder);

  // Cover Diff
  const coverBefore = initialModel.cover ? `Capa ${initialModel.cover.format.toUpperCase()} (${(initialModel.cover.sizeBytes / 1024).toFixed(1)} KB)` : "";
  const coverAfter = updatedModel.cover ? `Capa ${updatedModel.cover.format.toUpperCase()} (${(updatedModel.cover.sizeBytes / 1024).toFixed(1)} KB)` : "";
  if (coverBefore || coverAfter) {
    let status: BeforeAfterItem["status"] = "kept";
    if (!coverBefore && coverAfter) status = "added";
    else if (coverBefore && !coverAfter) status = "removed";
    else if (coverBefore !== coverAfter) status = "modified";

    diffList.push({
      fieldLabel: "Capa do Álbum",
      beforeVal: coverBefore || "(Sem capa)",
      afterVal: coverAfter || "(Removida)",
      status
    });
  }

  const endTime = performance.now();

  const stats: ProcessingStats = {
    fileSizeBytesBefore: originalFile.size,
    fileSizeBytesAfter: processedBlob.size,
    bytesSaved: originalFile.size - processedBlob.size,
    processingTimeMs: Math.round(endTime - startTime)
  };

  return {
    validation,
    diffList,
    stats
  };
}
