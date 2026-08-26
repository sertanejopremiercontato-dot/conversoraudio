/**
 * AUDIO METADATA CLEAN STUDIO — ENGINE CORE TYPES
 */

export type SupportedAudioFormat = "WAV" | "MP3" | "FLAC" | "OGG" | "OPUS" | "M4A" | "AAC" | "AIFF" | "UNKNOWN";

export interface TechnicalProperties {
  format: string;
  container: string;
  codec: string;
  durationSeconds: number;
  durationFormatted: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  sampleRateHz?: number;
  bitDepth?: number;
  channels?: number;
  channelsDescription?: string;
  bitrateKbps?: number;
  isLossless: boolean;
  audioDataOffset?: number;
  audioDataLength?: number;
}

export interface MetadataFieldItem {
  id: string;
  label: string;
  value: string;
  source: string; // e.g., "ID3v2.3", "LIST/INFO", "VorbisComment", "bext", "iXML"
  category: "IDENTIFICATION" | "CREDITS" | "SOFTWARE_ORIGIN" | "CUSTOM" | "CONTAINER_TAG";
  isRemovable: boolean;
}

export interface SoftwareAndOrigin {
  software?: string;
  encoder?: string;
  generator?: string;
  originator?: string;
  writingApp?: string;
  vendor?: string;
  url?: string;
  isSunoAIGenerated?: boolean;
  sunoDetails?: {
    modelOrPrompt?: string;
    created?: string;
    project?: string;
    tempo?: string;
    fullComment?: string;
  };
}

export interface ArtworkData {
  present: boolean;
  format?: string;
  mimeType?: string;
  dataUrl?: string;
  sizeBytes?: number;
  description?: string;
  rawBuffer?: Uint8Array;
}

export interface RawChunkOrBlock {
  id: string;
  name: string;
  offset: number;
  size: number;
  type: "HEADER" | "AUDIO_STREAM" | "METADATA" | "EXTRA" | "PADDING" | "UNKNOWN";
  description?: string;
  isRemovable: boolean;
}

export interface IntegrityHashes {
  fileSha256: string;
  audioPayloadSha256: string;
}

export interface EngineAReaderResult {
  removableCount: number;
  detectedTags: string[];
  detectedTagTypes: string[];
  status: "CLEAN" | "HAS_METADATA" | "ERROR";
  rawCount: number;
}

export interface EngineBVerifierResult {
  removableBlocksCount: number;
  unknownBlocksCount: number;
  essentialBlocksCount: number;
  blocksFound: RawChunkOrBlock[];
  detectedSignatures: string[];
  sunoDetected: boolean;
  status: "CLEAN" | "HAS_METADATA" | "HAS_UNKNOWN_BLOCKS" | "ERROR";
}

export interface DualVerificationResult {
  engineA: EngineAReaderResult;
  engineB: EngineBVerifierResult;
  verdict: "CLEAN_VERIFIED" | "METADATA_DETECTED" | "DISCREPANCY_UNVERIFIED" | "UNKNOWN_BLOCKS_DETECTED";
  isCleanVerified: boolean;
  hasDiscrepancy: boolean;
  discrepancyReason?: string;
  statusMessage: string;
  badgeReaderOk: boolean;
  badgeVerifierOk: boolean;
}

export interface AudioAnalysisResult {
  sessionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: number;
  format: SupportedAudioFormat;
  technical: TechnicalProperties;
  fields: MetadataFieldItem[];
  softwareAndOrigin: SoftwareAndOrigin;
  artwork: ArtworkData;
  rawChunks: RawChunkOrBlock[];
  removableItemsCount: number;
  removableItems: MetadataFieldItem[];
  integrity: IntegrityHashes;
  dualVerification: DualVerificationResult;
}

export interface CleanResult {
  cleanedFile: File;
  cleanedBlob: Blob;
  removedItems: MetadataFieldItem[];
  removedChunks: RawChunkOrBlock[];
  beforeFileHash: string;
  afterFileHash: string;
  beforeAudioHash: string;
  afterAudioHash: string;
  audioIntegrityMatches: boolean;
  bytesSaved: number;
}

export interface EditableMetadataInput {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: string;
  genre?: string;
  composer?: string;
  trackNumber?: string;
  trackTotal?: string;
  discNumber?: string;
  discTotal?: string;
  isrc?: string;
  bpm?: string;
  publisher?: string;
  copyright?: string;
  comment?: string;
  lyrics?: string;
  artwork?: {
    file?: File;
    dataUrl?: string;
    mimeType?: string;
    rawBuffer?: Uint8Array;
  } | null;
}

export interface FormatAdapter {
  format: SupportedAudioFormat;
  canHandle(file: File, bytes: Uint8Array): boolean;
  analyze(file: File, bytes: Uint8Array): Promise<AudioAnalysisResult>;
  clean(file: File, bytes: Uint8Array): Promise<{ cleanedBlob: Blob; removedItems: MetadataFieldItem[]; removedChunks: RawChunkOrBlock[] }>;
  write(file: File, bytes: Uint8Array, metadata: EditableMetadataInput): Promise<Blob>;
}
