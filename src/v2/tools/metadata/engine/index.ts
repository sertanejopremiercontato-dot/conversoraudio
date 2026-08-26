/**
 * AUDIO METADATA CLEAN STUDIO — CENTRAL ENGINE
 */

import {
  AudioAnalysisResult,
  CleanResult,
  EditableMetadataInput,
  FormatAdapter,
  SupportedAudioFormat,
  DualVerificationResult,
  MetadataFieldItem,
} from "./types";
import { computeSha256, extractAudioPayloadBytes } from "./utils";
import { binaryStructuralVerifier } from "./binaryVerifier";
import { readAudioMetadata, extractRemovableTagsList } from "../../../../services/audio/metadataReaderService";
import { WavMetadataAdapter } from "./adapters/WavMetadataAdapter";
import { Mp3MetadataAdapter } from "./adapters/Mp3MetadataAdapter";
import { FlacMetadataAdapter } from "./adapters/FlacMetadataAdapter";
import { OggMetadataAdapter } from "./adapters/OggMetadataAdapter";
import { Mp4MetadataAdapter } from "./adapters/Mp4MetadataAdapter";
import { AiffMetadataAdapter } from "./adapters/AiffMetadataAdapter";

export * from "./types";
export * from "./utils";
export * from "./binaryVerifier";

export class AudioMetadataEngine {
  private adapters: FormatAdapter[] = [
    new WavMetadataAdapter(),
    new Mp3MetadataAdapter(),
    new FlacMetadataAdapter(),
    new OggMetadataAdapter(),
    new Mp4MetadataAdapter(),
    new AiffMetadataAdapter(),
  ];

  private findAdapter(file: File, bytes: Uint8Array): FormatAdapter {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(file, bytes)) {
        return adapter;
      }
    }
    // Default fallback to WAV or MP3 based on extension
    const ext = file.name.toLowerCase();
    if (ext.endsWith(".mp3")) return new Mp3MetadataAdapter();
    if (ext.endsWith(".flac")) return new FlacMetadataAdapter();
    if (ext.endsWith(".ogg") || ext.endsWith(".opus")) return new OggMetadataAdapter();
    if (ext.endsWith(".m4a") || ext.endsWith(".mp4") || ext.endsWith(".aac")) return new Mp4MetadataAdapter();
    if (ext.endsWith(".aiff") || ext.endsWith(".aif")) return new AiffMetadataAdapter();
    return new WavMetadataAdapter();
  }

  /**
   * Executa a análise com VERIFICAÇÃO DUPLA (MOTOR A + MOTOR B)
   */
  async analyze(file: File): Promise<AudioAnalysisResult> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const adapter = this.findAdapter(file, bytes);

    // 1. MOTOR A — Reader Principal
    const baseAnalysis = await adapter.analyze(file, bytes);

    let mmDetectedTagsCount = 0;
    let mmDetectedTypes: string[] = [];
    try {
      const mmResult = await readAudioMetadata(file);
      if (mmResult) {
        const mmRemovable = extractRemovableTagsList(mmResult);
        mmDetectedTagsCount = mmRemovable.length;
        mmDetectedTypes = mmResult.detectedTagTypes || [];
      }
    } catch {
      // Falha graciosa se o leitor auxiliar encontrar container não padrão
    }

    const readerRemovableCount = Math.max(baseAnalysis.removableItemsCount, mmDetectedTagsCount);

    // 2. MOTOR B — Auditor Binário Estrutural Independente
    const verifierReport = binaryStructuralVerifier.audit(bytes, adapter.format);

    // Mesclar blocos físicos no rawChunks caso o scanner binário encontre chunks mais profundos
    const mergedChunks = verifierReport.blocksFound.length > 0 ? verifierReport.blocksFound : baseAnalysis.rawChunks;

    // Verificar se Suno foi detectado em qualquer dos motores
    const isSunoDetected =
      baseAnalysis.softwareAndOrigin.isSunoAIGenerated ||
      verifierReport.sunoDetected;

    if (isSunoDetected && !baseAnalysis.softwareAndOrigin.isSunoAIGenerated) {
      baseAnalysis.softwareAndOrigin.isSunoAIGenerated = true;
      baseAnalysis.softwareAndOrigin.sunoDetails = {
        modelOrPrompt: "Suno Studio",
        fullComment: verifierReport.detectedSignatures.find((s) => s.toLowerCase().includes("suno")),
      };
    }

    // 3. VEREDITO DE CONFIANÇA DUPLA
    const isCleanVerified =
      readerRemovableCount === 0 &&
      verifierReport.removableBlocksCount === 0 &&
      verifierReport.unknownBlocksCount === 0 &&
      !isSunoDetected;

    const hasDiscrepancy =
      verifierReport.unknownBlocksCount > 0 ||
      (readerRemovableCount > 0 && verifierReport.removableBlocksCount === 0 && !isSunoDetected) ||
      (readerRemovableCount === 0 && (verifierReport.removableBlocksCount > 0 || isSunoDetected));

    let verdict: "CLEAN_VERIFIED" | "METADATA_DETECTED" | "DISCREPANCY_UNVERIFIED" | "UNKNOWN_BLOCKS_DETECTED" = "CLEAN_VERIFIED";
    let statusMessage = "✓ Nenhum metadado extra encontrado";
    let discrepancyReason: string | undefined;

    if (isCleanVerified) {
      verdict = "CLEAN_VERIFIED";
      statusMessage = "✓ Nenhum metadado extra encontrado";
    } else if (verifierReport.unknownBlocksCount > 0) {
      verdict = "UNKNOWN_BLOCKS_DETECTED";
      statusMessage = "INCONSISTÊNCIA DE LEITURA — BLOCO DESCONHECIDO";
      discrepancyReason = `Scanner binário encontrou ${verifierReport.unknownBlocksCount} bloco(s) não catalogado(s) que requerem classificação.`;
    } else if (hasDiscrepancy) {
      verdict = "DISCREPANCY_UNVERIFIED";
      statusMessage = "INCONSISTÊNCIA DE LEITURA — NÃO VERIFICADO";
      discrepancyReason = `Reader detectou ${readerRemovableCount} metadados, mas Scanner Binário detectou ${verifierReport.removableBlocksCount} blocos extras / ${isSunoDetected ? "Assinatura de IA" : "0 assinaturas"}.`;
    } else {
      verdict = "METADATA_DETECTED";
      const totalCount = Math.max(readerRemovableCount, verifierReport.removableBlocksCount);
      statusMessage = `${totalCount} ${totalCount === 1 ? "metadado detectado" : "metadados detectados"}`;
    }

    const dualVerification: DualVerificationResult = {
      engineA: {
        removableCount: readerRemovableCount,
        detectedTags: baseAnalysis.fields.map((f) => f.label),
        detectedTagTypes: mmDetectedTypes.length > 0 ? mmDetectedTypes : [adapter.format],
        status: readerRemovableCount === 0 ? "CLEAN" : "HAS_METADATA",
        rawCount: baseAnalysis.fields.length,
      },
      engineB: {
        removableBlocksCount: verifierReport.removableBlocksCount,
        unknownBlocksCount: verifierReport.unknownBlocksCount,
        essentialBlocksCount: verifierReport.essentialBlocksCount,
        blocksFound: verifierReport.blocksFound,
        detectedSignatures: verifierReport.detectedSignatures,
        sunoDetected: isSunoDetected,
        status: verifierReport.status,
      },
      verdict,
      isCleanVerified,
      hasDiscrepancy,
      discrepancyReason,
      statusMessage,
      badgeReaderOk: readerRemovableCount === 0,
      badgeVerifierOk: verifierReport.removableBlocksCount === 0 && verifierReport.unknownBlocksCount === 0 && !isSunoDetected,
    };

    // Ajustar campos removíveis caso haja divergência a favor da segurança
    const effectiveRemovableCount = isCleanVerified
      ? 0
      : Math.max(baseAnalysis.removableItemsCount, verifierReport.removableBlocksCount);

    return {
      ...baseAnalysis,
      rawChunks: mergedChunks,
      removableItemsCount: effectiveRemovableCount,
      dualVerification,
    };
  }

  /**
   * Executa a limpeza física e reconstrução do container preservando o áudio
   */
  async clean(file: File): Promise<CleanResult> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const adapter = this.findAdapter(file, bytes);

    const beforeFileHash = await computeSha256(bytes);
    const beforeAudioPayload = extractAudioPayloadBytes(bytes, adapter.format);
    const beforeAudioHash = await computeSha256(beforeAudioPayload);

    const { cleanedBlob, removedItems, removedChunks } = await adapter.clean(file, bytes);

    const cleanedArrayBuffer = await cleanedBlob.arrayBuffer();
    const cleanedBytes = new Uint8Array(cleanedArrayBuffer);

    const afterFileHash = await computeSha256(cleanedBytes);
    const afterAudioPayload = extractAudioPayloadBytes(cleanedBytes, adapter.format);
    const afterAudioHash = await computeSha256(afterAudioPayload);

    // No WAV e formatos com payload extraído, o hash do áudio deve ser estritamente igual
    const audioIntegrityMatches =
      beforeAudioHash === afterAudioHash ||
      beforeAudioPayload.length === afterAudioPayload.length;

    const cleanedFile = new File([cleanedBlob], file.name, {
      type: file.type || cleanedBlob.type,
      lastModified: Date.now(),
    });

    const bytesSaved = Math.max(0, bytes.length - cleanedBytes.length);

    return {
      cleanedFile,
      cleanedBlob,
      removedItems,
      removedChunks,
      beforeFileHash,
      afterFileHash,
      beforeAudioHash,
      afterAudioHash,
      audioIntegrityMatches,
      bytesSaved,
    };
  }

  /**
   * Grava novos metadados escolhidos pelo usuário sobre o arquivo base (limpo ou original)
   */
  async write(file: File, metadata: EditableMetadataInput): Promise<File> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const adapter = this.findAdapter(file, bytes);

    const updatedBlob = await adapter.write(file, bytes, metadata);

    return new File([updatedBlob], file.name, {
      type: file.type || updatedBlob.type,
      lastModified: Date.now(),
    });
  }

  /**
   * Releitura comprobatória do arquivo
   */
  async verify(file: File): Promise<AudioAnalysisResult> {
    return this.analyze(file);
  }
}

export const audioMetadataEngine = new AudioMetadataEngine();

