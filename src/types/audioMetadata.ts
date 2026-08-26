export type AudioFormatCategory = "MP3" | "WAV" | "FLAC" | "M4A" | "OGG" | "AIFF" | "UNKNOWN";

export interface AudioCoverArt {
  dataUrl: string;
  mimeType: string;
  format: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  typeDescription?: string;
}

export interface RiffChunkItem {
  id: string;
  sizeBytes: number;
  offset: number;
  description?: string;
  subType?: string;
  isRemovable?: boolean;
}

export interface AudioTechnicalDetails {
  durationSeconds: number;
  bitrateKbps: number;
  sampleRateHz: number;
  channels: number; // 1 = Mono, 2 = Stereo, etc.
  codec: string;
  isVbr?: boolean;
  containerType: string;
  
  // Structural & PCM Format details
  audioFormatCode?: number; // 1 = PCM, 3 = IEEE Float, 6 = A-law, 7 = µ-law, 65534 = Extensible
  audioFormatName?: string; // "PCM Uncompressed (Linear)", "IEEE 754 Float", etc.
  bitsPerSample?: number;   // 16, 24, 32
  blockAlign?: number;      // 4 (e.g., 2 channels * 2 bytes)
  byteRate?: number;        // SampleRate * BlockAlign (e.g., 176400 B/s)
  channelLayout?: string;   // "Estéreo (2.0)", "Mono (1.0)", "5.1 Surround"
  endianness?: string;      // "Little-Endian (LE)" / "Big-Endian (BE)"
  isLossless?: boolean;     // true for WAV, FLAC, ALAC; false for MP3, AAC
  audioDataOffset?: number; // byte offset where PCM/MPEG audio payload begins
  audioDataLength?: number; // byte length of pure audio payload
  fileHash?: string;        // Hash SHA-256 do arquivo completo (File Fingerprint)
  audioPayloadHash?: string; // Hash SHA-256 do payload puro de áudio
  chunksList?: RiffChunkItem[]; // List of all RIFF chunks found in WAV/container
  mpegVersion?: string;     // "MPEG-1", "MPEG-2", "MPEG-2.5"
  mpegLayer?: string;       // "Layer III (MP3)", "Layer II", "Layer I"
  mpegChannelMode?: string; // "Joint Stereo", "Stereo", "Single Channel"
  advancedTagsCount: number;
}

export interface ID3FrameItem {
  id: string;
  version: string; // e.g. "ID3v2.2", "ID3v2.3", "ID3v2.4", "ID3v1"
  description: string;
  value: string;
  sizeBytes: number;
  isUnknown: boolean;
  isRemovable?: boolean;
}

export interface RawMetadataItem {
  type: string; // e.g., "RIFF Chunk", "RIFF INFO", "ID3v2.3", "ID3v1", "BWF BEXT", "Vorbis", "iXML", "XMP"
  key: string;  // e.g., "AudioFormat", "fmt", "INAM", "IART", "ISFT", "TIT2", "TPE1", "COMM"
  value: string;
  sizeBytes: number;
  origin: string; // e.g., "Cabeçalho fmt", "LIST INFO", "ID3v2 Tag", "BWF Header"
  container?: string; // "WAV / RIFF", "MP3 / MPEG", "FLAC", "M4A / MP4", "OGG / Opus", "AIFF"
  blockOrFrame?: string; // "LIST/INFO", "fmt", "bext", "iXML", "ID3v2.3", "VORBIS_COMMENT"
  isRemovable?: boolean; // true = metadado removível; false = dado técnico obrigatório
  category?: "MUSICAL" | "TECNICO" | "ORIGEM" | "ESTRUTURA";
}

export interface RemovedMetadataItem {
  tag: string;
  category: string;
  valueBefore: string;
  status: "REMOVIDO" | "PRESERVADO";
}

export interface CleanStatsInfo {
  beforeCount: number;
  afterCount: number;
  removedCount: number;
  removedItems: RemovedMetadataItem[];
  remainingTags?: string[];
  chunksBefore?: string[];
  chunksAfter?: string[];
  audioHashBefore?: string;
  audioHashAfter?: string;
  audioHashMatch?: boolean;
}

export interface PostCleanComparison {
  beforeCount: number;
  removedCount: number;
  preservedCount: number;
  technicalPreserved: boolean;
  audioPreserved: boolean;
  remainingItems: RawMetadataItem[];
  timestamp: string;
  audioHashBefore?: string;
  audioHashAfter?: string;
  audioHashMatch?: boolean;
}

export interface RawMetadataInventoryItem {
  id: string;
  name: string;
  value: string;
  origin: string;
  container: string;
  block: string;
  isRemovable: boolean;
  typeLabel: "REMOVER NA LIMPEZA" | "ESSENCIAL PARA REPRODUÇÃO";
  category: "MUSICAL" | "ORIGEM" | "TAGS_NATIVAS" | "TECNICO" | "ESTRUTURA";
}

export interface MetadataAuditTrail {
  commonCount: number;
  nativeCount: number;
  rawCount: number;
  normalizedCount: number;
  renderedCount: number;
  protectedCount: number;
  removableCount: number;
}

export interface AudioMetadataModel {
  filename: string;
  filesize: number;
  mimeType: string;
  format: AudioFormatCategory;
  detectedTagTypes: string[];
  hasCorruptedTagsWarning?: boolean;
  
  // Auditoria de contagem da pipeline sem filtros
  audit?: MetadataAuditTrail;
  inventory?: RawMetadataInventoryItem[];
  
  // Metadados principais (Musicais)
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: string;
  trackNumber?: string;
  totalTracks?: string;
  discNumber?: string;
  totalDiscs?: string;
  genre?: string;
  composer?: string;
  performer?: string;
  author?: string;
  copyright?: string;
  publisher?: string;
  isrc?: string;
  bpm?: string;
  key?: string;
  language?: string;

  // Campos de texto estendidos
  comment?: string;
  description?: string;
  subtitle?: string;
  lyrics?: string;
  grouping?: string;
  mood?: string;
  encoderSettings?: string;

  // Software e Origem (Realmente gravados, sem inferência)
  software?: string;
  encoder?: string;
  encodedBy?: string;
  writingLibrary?: string;
  application?: string;
  tool?: string;
  vendor?: string;
  originator?: string;
  origin?: string;
  source?: string;
  website?: string;
  url?: string;
  creationTime?: string;
  modificationTime?: string;
  originalFilename?: string;
  copyrightMessage?: string;

  // Metadados técnicos / invisíveis
  encoderDelay?: string;
  padding?: string;
  replayGain?: string;
  loudness?: string;
  peak?: string;
  gaplessInfo?: string;
  privateFramesCount?: number;
  ufid?: string;
  popularimeter?: string;
  chapterMarkers?: string;
  timestamps?: string;

  // Capa do áudio
  cover?: AudioCoverArt | null;
  
  // Detalhes técnicos estruturais completos
  technical: AudioTechnicalDetails;

  // ID3 frames especificas (para MP3)
  id3Frames: ID3FrameItem[];

  // Lista de metadados brutos / raw table (RIFF, BEXT, ID3, Vorbis, iXML, XMP)
  rawTagsList: RawMetadataItem[];
  
  // Todos os raw tags para chave/valor legados
  rawTags: Record<string, string>;

  // Comparativo após limpeza / releitura
  postCleanComparison?: PostCleanComparison | null;
}

export interface AnalysisSummaryStats {
  totalMetadataFound: number;
  personalTextFieldsCount: number;
  embeddedCoversCount: number;
  technicalTagsCount: number;
  unknownTagsCount: number;
  removableFieldsCount: number;
  removableFieldsList: { key: string; label: string; currentVal: string; reason: string }[];
}

export interface BeforeAfterItem {
  fieldLabel: string;
  beforeVal: string;
  afterVal: string;
  status: "kept" | "modified" | "removed" | "added";
}

export interface AudioValidationResult {
  isValid: boolean;
  preAudioHash: string;
  postAudioHash: string;
  hashMatch: boolean;
  audioStreamUnchanged: boolean;
  message: string;
}

export interface ProcessingStats {
  fileSizeBytesBefore: number;
  fileSizeBytesAfter: number;
  bytesSaved: number;
  processingTimeMs: number;
}

export interface CleanOptions {
  wipeAll: boolean;
  removeMainMetadata: boolean; // título/artista/álbum
  removeCover: boolean;
  removeComments: boolean;
  removeSoftwareEncoder: boolean;
  removeLyrics: boolean;
  removeCopyright: boolean;
  removeTechnicalTags: boolean;
  removePrivateTags?: boolean;
  removeTrackInfo?: boolean;
  removeCustomTags?: boolean;
  removeOriginData?: boolean;
  removeUrls?: boolean;
}
