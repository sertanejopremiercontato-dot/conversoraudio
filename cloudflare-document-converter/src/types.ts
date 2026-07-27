export type DocumentType = 'word' | 'excel';

export interface FileValidationResult {
  isValid: boolean;
  docType?: DocumentType;
  extension?: string;
  mimeType?: string;
  error?: string;
}

export interface ConversionJobOptions {
  requestId: string;
  originalFilename: string;
  fileBuffer: Buffer;
  docType: DocumentType;
}

export interface ConversionResult {
  success: boolean;
  pdfBuffer?: Buffer;
  pageCount?: number;
  durationMs: number;
  error?: string;
  statusCode?: number;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    worker: boolean;
    container: boolean;
    libreOffice: boolean;
    writer: boolean;
    calc: boolean;
  };
  limits: {
    maxFileSizeMb: number;
    timeoutMs: number;
    maxConcurrent: number;
  };
}
