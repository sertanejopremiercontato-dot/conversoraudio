/**
 * AUDIO FORENSICS ENGINE
 * Motor Canônico Único de Auditoria Forense, Integridade Criptográfica e Limpeza Física.
 */

import {
  AudioForensicsResult,
  CleanExecutionResult,
  CleanReceipt,
  EditableMetadata,
  ForensicsAnalysisState,
  ForensicsItem,
  ForensicsItemClassification,
} from "./types";
import { WavForensicsAdapter } from "./WavForensicsAdapter";
import { Mp3ForensicsAdapter } from "./Mp3ForensicsAdapter";
import { CleanReceiptStore } from "./CleanReceiptStore";

const CLEANER_VERSION = "2.5.0-forensics-strict";
const VERIFICATION_VERSION = "2.5.0-sha256-verified";

export class AudioForensicsEngine {
  /**
   * Executa a auditoria forense completa de qualquer arquivo de áudio
   */
  public static async analyze(file: File): Promise<AudioForensicsResult> {
    const ext = file.name.toLowerCase().split(".").pop() || "";
    const mime = (file.type || "").toLowerCase();

    if (ext === "wav" || mime.includes("wav") || mime.includes("wave")) {
      return await WavForensicsAdapter.analyze(file);
    }

    if (ext === "mp3" || mime.includes("mpeg") || mime.includes("mp3")) {
      return await Mp3ForensicsAdapter.analyze(file);
    }

    // Formatos adicionais (Detecção Forense com status explícito)
    return await this.analyzeGenericAudio(file, ext);
  }

  /**
   * Executa a limpeza física e verificação criptográfica do arquivo
   */
  public static async clean(file: File): Promise<CleanExecutionResult> {
    const originalResult = await this.analyze(file);
    const ext = file.name.toLowerCase().split(".").pop() || "";

    let cleanOutput: { cleanedFile: File; originalPcmSha256: string; cleanedPcmSha256: string };

    if (ext === "wav" || originalResult.identity.format === "WAV") {
      cleanOutput = await WavForensicsAdapter.clean(file);
    } else if (ext === "mp3" || originalResult.identity.format === "MP3") {
      cleanOutput = await Mp3ForensicsAdapter.clean(file);
    } else {
      throw new Error(`Formato '${ext.toUpperCase()}' não possui suporte a reconstrução binária nesta versão.`);
    }

    // Releitura IMEDIATA do arquivo físico gerado
    const cleanedResult = await this.analyze(cleanOutput.cleanedFile);

    // Validação matemática de integridade do áudio
    const audioHashMatches = cleanOutput.originalPcmSha256 === cleanOutput.cleanedPcmSha256;

    if (!audioHashMatches) {
      throw new Error("Falha crítica de verificação: O hash do áudio no arquivo gerado divergiu do original.");
    }

    // Verificação estrita de ausência de metadados, proveniência e assinaturas de software
    const editableRemaining = cleanedResult.embeddedMetadata.filter(
      (m) => m.classification === ForensicsItemClassification.EDITABLE_METADATA
    ).length;
    const provenanceRemaining = cleanedResult.provenance.length;
    const softwareSignaturesRemaining = cleanedResult.encoderSignatures.length;
    const unknownRemaining = cleanedResult.unknownBlocks.length;

    const isStrictClean =
      audioHashMatches &&
      editableRemaining === 0 &&
      provenanceRemaining === 0 &&
      softwareSignaturesRemaining === 0 &&
      unknownRemaining === 0;

    // Lista de itens removidos (metadados, proveniência, blocos desconhecidos e assinaturas de software elimináveis)
    const removableEncoderSigs = (originalResult.encoderSignatures || []).filter((e) => e.isRemovable);
    const removedItems: ForensicsItem[] = [
      ...originalResult.embeddedMetadata,
      ...originalResult.provenance,
      ...removableEncoderSigs,
      ...originalResult.unknownBlocks,
    ];

    // Gerar Recibo Criptográfico Oficial
    const receipt: CleanReceipt = {
      cleanedFileSha256: cleanedResult.identity.fileSha256,
      audioPayloadSha256: cleanOutput.cleanedPcmSha256,
      originalFileSha256: originalResult.identity.fileSha256,
      fileName: file.name,
      format: originalResult.identity.format,
      cleanerVersion: CLEANER_VERSION,
      verificationVersion: VERIFICATION_VERSION,
      removedItemsCount: removedItems.length,
      removedItems,
      verifiedAt: new Date().toISOString(),
      isStrictClean,
      status: isStrictClean ? "STRICT_FORENSIC_CLEAN" : "PARTIAL_METADATA_CLEAN",
    };

    // Salvar no CleanReceiptStore se for limpeza estrita
    if (isStrictClean) {
      await CleanReceiptStore.saveReceipt(receipt);
      cleanedResult.analysisState = ForensicsAnalysisState.CLEANED_AND_VERIFIED;
      cleanedResult.stateDescription = "✓ LIMPEZA FORENSE EXECUTADA E VERIFICADA (Metadados, proveniência e software eliminados; estruturas técnicas preservadas)";
    } else {
      cleanedResult.analysisState = ForensicsAnalysisState.PARTIAL_CLEAN;
      cleanedResult.stateDescription = `⚠ LIMPEZA PARCIAL (Metadados eliminados, mas restam ${softwareSignaturesRemaining} assinatura(s) identificável(is) de software)`;
    }

    cleanedResult.cleanReceipt = receipt;

    return {
      success: isStrictClean,
      cleanedFile: cleanOutput.cleanedFile,
      originalResult,
      cleanedResult,
      audioHashMatches,
      receipt,
      message: isStrictClean
        ? "Arquivo purificado com sucesso por whitelist. Metadados, proveniência e software eliminados."
        : "Limpeza parcial: metadados removidos, porém assinaturas de software permanecem.",
    };
  }

  /**
   * Grava novos metadados limpos fornecidos pelo usuário sobre o arquivo
   */
  public static async writeNewMetadata(file: File, meta: EditableMetadata): Promise<File> {
    const ext = file.name.toLowerCase().split(".").pop() || "";
    if (ext === "wav") {
      return await WavForensicsAdapter.writeNewMetadata(file, meta);
    }
    if (ext === "mp3") {
      return await Mp3ForensicsAdapter.writeNewMetadata(file, meta);
    }
    return file;
  }

  // --- Analisador Genérico para Outros Formatos ---

  private static async analyzeGenericAudio(file: File, ext: string): Promise<AudioForensicsResult> {
    const buffer = await file.arrayBuffer();
    const fileSha256 = await this.computeSha256(buffer);
    const receipt = await CleanReceiptStore.getReceiptByFileSha256(fileSha256);

    const fmtName = ext.toUpperCase() || "AUDIO";

    return {
      identity: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "audio/unknown",
        format: fmtName,
        fileSha256,
      },
      technical: {
        format: fmtName,
        container: `${fmtName} Container`,
        codec: `${fmtName} Stream`,
        sampleRate: 44100,
        bitDepth: 16,
        channels: 2,
        isPcmClassic: false,
        isExtensible: false,
        payloadSize: file.size,
      },
      containerStructure: {
        isForensicallyMinimal: false,
        totalChunksCount: 0,
        chunks: [],
        structuralErrors: [],
      },
      embeddedMetadata: [],
      provenance: [],
      encoderSignatures: [],
      unknownBlocks: [],
      integrity: {
        fileSha256,
        audioPayloadSha256: fileSha256,
        isPcmExact: false,
      },
      cleanReceipt: receipt,
      contentAnalysis: {
        status: "NOT_IMPLEMENTED",
        message: "ANÁLISE DE ORIGEM POR CONTEÚDO SONORO: NÃO IMPLEMENTADA",
        details: `Formato ${fmtName} analisado em modo de conformidade básica.`,
      },
      analysisState: receipt ? ForensicsAnalysisState.PREVIOUSLY_CLEANED_BY_TOOL : ForensicsAnalysisState.NOT_PROCESSED,
      stateDescription: receipt
        ? "✓ LIMPEZA ANTERIOR COMPROVADA POR ESTE SISTEMA (RECIBO SHA-256 IDENTIFICADO)"
        : `ARQUIVO ${fmtName} ORIGINAL — NÃO PROCESSADO NESTA SESSÃO`,
    };
  }

  private static async computeSha256(buffer: ArrayBuffer): Promise<string> {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(digest));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return "crypto-subtle-unavailable";
  }
}
