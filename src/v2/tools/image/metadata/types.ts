export type ImageMetadataCategory =
  | "METADATA" // Metadados Editáveis / Autorais
  | "PRIVACY" // Privacidade / GPS / Seriais
  | "PROVENANCE" // Proveniência / Câmera / Lente / Dispositivo
  | "SOFTWARE_GENERATOR" // Software / Editor / IA / Gerador
  | "COMMENTS" // Comentários / Texto Livre
  | "XMP_IPTC" // Blocos XMP e IPTC
  | "UNKNOWN_OPTIONAL" // Tags desconhecidas / Chunks opcionais
  | "TECHNICAL" // Estrutura Técnica Necessária
  | "COLOR_STRUCTURE"; // Perfil de Cor / ICC (Gerenciamento de Cor)

export interface ImageMetadataItem {
  id: string;
  key: string;
  label: string;
  value: string;
  source: string; // ex: "JPEG / APP1 (EXIF IFD0)", "PNG / zTXt (Prompt)", "WebP / XMP"
  category: ImageMetadataCategory;
  offset?: number; // Offset físico em bytes no arquivo original
  offsetHex?: string; // Hexadecimal do offset (ex: "0x0000012A")
  size?: number; // Tamanho em bytes
  isRemovable: boolean;
  details?: string;
  rawHex?: string;
}

export interface ImageTechnicalInfo {
  format: "JPEG" | "PNG" | "WEBP" | "AVIF" | "HEIC" | "TIFF" | "UNKNOWN";
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  colorDepth?: string;
  hasAlpha?: boolean;
  orientation?: number | string;
  colorProfile?: string;
  dpi?: number;
  chunksCount?: number;
  magicBytes: string;
  isLosslessCleanable?: boolean;
  cleanMethodSummary?: string;
}

export interface ImageVerificationInfo {
  fileSha256: string;
  chunksSummary: { name: string; offset: number; size: number; details?: string; isRemovable?: boolean }[];
  removableMetadataCount: number;
  privacyIssuesCount: number;
  softwareGeneratorCount: number;
  gpsCount: number;
  commentsCount: number;
  unknownOptionalCount: number;
  xmpIptcCount: number;
  isClean: boolean;
}

export interface ImageMetadataAnalysisResult {
  technical: ImageTechnicalInfo;
  verification: ImageVerificationInfo;
  items: ImageMetadataItem[];
  // Itens categorizados para renderização de alta precisão
  privacyItems: ImageMetadataItem[];
  provenanceItems: ImageMetadataItem[];
  softwareItems: ImageMetadataItem[];
  metadataItems: ImageMetadataItem[];
  commentItems: ImageMetadataItem[];
  xmpIptcItems: ImageMetadataItem[];
  unknownOptionalItems: ImageMetadataItem[];
  technicalItems: ImageMetadataItem[];
}

export interface ImageMetadataEditForm {
  title: string;
  artist: string; // Autor / Criador
  description: string;
  copyright: string;
  keywords: string;
  comment: string;
  creationDate?: string;
}

export interface ImageCleanReport {
  cleanedFile: File;
  originalSha256: string;
  cleanedSha256: string;
  originalSize: number;
  cleanedSize: number;
  originalWidth: number;
  originalHeight: number;
  cleanedWidth: number;
  cleanedHeight: number;
  dimensionsPreserved: boolean;
  isLosslessPayloadPreserved: boolean;
  idatPayloadHashBefore?: string;
  idatPayloadHashAfter?: string;
  isIdatPayloadPreserved?: boolean;
  itemsBeforeCount: number;
  itemsAfterCount: number;
  removedItems: {
    key: string;
    label: string;
    value: string;
    source: string;
    offsetHex?: string;
    category: ImageMetadataCategory;
  }[];
  analysisAfterClean: ImageMetadataAnalysisResult;
  isFullyClean: boolean;
  cleaningStatusSummary: {
    exifRemaining: number;
    gpsRemaining: number;
    xmpRemaining: number;
    iptcRemaining: number;
    softwareRemaining: number;
    commentsRemaining: number;
    provenanceRemaining: number;
    unknownOptionalRemaining: number;
  };
}

export interface ImageWriteResult {
  finalEditedFile: File;
  cleanedSha256: string;
  finalSha256: string;
  cleanedSize: number;
  finalSize: number;
  analysisAfterWrite: ImageMetadataAnalysisResult;
  savedFields: { key: string; label: string; value: string }[];
  idatPayloadHashBefore?: string;
  idatPayloadHashAfter?: string;
  isIdatPayloadPreserved?: boolean;
  validationStatus: "VALIDATED" | "NOT_VALIDATED";
  rawUtf8Search?: {
    term: string;
    found: boolean;
    offset?: number;
  }[];
  reanalysisVerification: {
    iTxTCount: number;
    titleMatch: boolean;
    authorMatch: boolean;
    copyrightMatch: boolean;
    keywordsMatch: boolean;
    creationDateMatch: boolean;
    recheckedTitle?: string;
    recheckedAuthor?: string;
    recheckedCopyright?: string;
    recheckedKeywords?: string;
    recheckedCreationDate?: string;
    allMatched: boolean;
  };
}
