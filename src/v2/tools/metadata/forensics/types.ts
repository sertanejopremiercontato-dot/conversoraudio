/**
 * AUDIO FORENSICS CLEAN STUDIO - TYPE DEFINITIONS
 * Modelo canônico de tipos para auditoria forense, integridade criptográfica e limpeza física.
 */

export enum ForensicsItemClassification {
  ESSENTIAL_STRUCTURE = "ESSENTIAL_STRUCTURE",
  EDITABLE_METADATA = "EDITABLE_METADATA",
  OPTIONAL_CONTAINER_METADATA = "OPTIONAL_CONTAINER_METADATA",
  PROVENANCE_SIGNATURE = "PROVENANCE_SIGNATURE",
  ENCODER_TECHNICAL_SIGNATURE = "ENCODER_TECHNICAL_SIGNATURE",
  MPEG_STREAM_TECHNICAL_STRUCTURE = "MPEG_STREAM_TECHNICAL_STRUCTURE",
  UNKNOWN_BLOCK = "UNKNOWN_BLOCK",
}

export enum ForensicsAnalysisState {
  NOT_PROCESSED = "NOT_PROCESSED", // Estado A: ANÁLISE CONCLUÍDA — ARQUIVO NÃO PROCESSADO
  RECONSTRUCTING = "RECONSTRUCTING", // Estado B: RECONSTRUINDO
  CLEANED_AND_VERIFIED = "CLEANED_AND_VERIFIED", // Estado C: LIMPEZA FORENSE EXECUTADA E VERIFICADA
  PARTIAL_CLEAN = "PARTIAL_CLEAN", // Estado D: LIMPEZA PARCIAL (RESTAM ASSINATURAS DE SOFTWARE)
  CLEAN_FAILED = "CLEAN_FAILED", // Estado E: LIMPEZA INCOMPLETA / VERIFICAÇÃO FALHOU
  PREVIOUSLY_CLEANED_BY_TOOL = "PREVIOUSLY_CLEANED_BY_TOOL", // Estado F: ARQUIVO JÁ LIMPO POR ESTA FERRAMENTA (COMPROVADO POR RECIBO SHA-256)
}

export interface ChunkDetail {
  id: string;
  offset: number;
  size: number;
  payloadOffset: number;
  payloadEnd: number;
  isValid: boolean;
  isEssential: boolean;
  description: string;
  textValue?: string;
  subChunks?: ChunkDetail[];
}

export interface ForensicsItem {
  id: string;
  key: string;
  value: string;
  offset?: number;
  size?: number;
  source: string;
  classification: ForensicsItemClassification;
  isRemovable: boolean;
  details?: string;
  rawValue?: string;
  parsedFields?: Array<{ key: string; label: string; value: string }>;
}

export interface TechnicalDetails {
  format: string;
  container: string;
  codec: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  bitrate?: number;
  duration?: number;
  byteRate?: number;
  blockAlign?: number;
  audioFormatCode?: number;
  isPcmClassic: boolean;
  isExtensible: boolean;
  payloadSize: number;
  pcmSha256?: string;
}

export interface CleanReceipt {
  cleanedFileSha256: string;
  audioPayloadSha256: string;
  originalFileSha256: string;
  fileName: string;
  format: string;
  cleanerVersion: string;
  verificationVersion: string;
  removedItemsCount: number;
  removedItems: ForensicsItem[];
  verifiedAt: string;
  isStrictClean?: boolean;
  status?: string;
}

export interface AudioContentAnalysis {
  status: "NOT_IMPLEMENTED" | "NOT_DETERMINED" | "NEURAL_ACOUSTIC_REQUIRED";
  message: string;
  details: string;
}

export interface AudioForensicsResult {
  identity: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    format: string;
    fileSha256: string;
  };
  technical: TechnicalDetails;
  containerStructure: {
    isForensicallyMinimal: boolean;
    totalChunksCount: number;
    chunks: ChunkDetail[];
    structuralErrors: string[];
  };
  embeddedMetadata: ForensicsItem[];
  provenance: ForensicsItem[];
  encoderSignatures: ForensicsItem[];
  technicalStructures?: ForensicsItem[];
  unknownBlocks: ForensicsItem[];
  integrity: {
    fileSha256: string;
    audioPayloadSha256: string;
    isPcmExact: boolean;
    pcmSha256?: string;
  };
  cleanReceipt: CleanReceipt | null;
  contentAnalysis: AudioContentAnalysis;
  analysisState: ForensicsAnalysisState;
  stateDescription: string;
}

export interface CleanExecutionResult {
  success: boolean;
  cleanedFile: File;
  originalResult: AudioForensicsResult;
  cleanedResult: AudioForensicsResult;
  audioHashMatches: boolean;
  receipt: CleanReceipt;
  message: string;
}

export interface EditableMetadata {
  title?: string;
  artist?: string;
  album?: string;
  composer?: string;
  genre?: string;
  year?: string;
  trackNumber?: string;
  isrc?: string;
  bpm?: string;
  publisher?: string;
  copyright?: string;
  comment?: string;
  coverArtBlob?: Blob;
  coverArtMime?: string;
}
