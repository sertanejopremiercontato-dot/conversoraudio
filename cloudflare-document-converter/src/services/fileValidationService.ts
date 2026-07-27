import { FileValidationResult, DocumentType } from '../types.js';

const MAX_FILE_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10)) * 1024 * 1024;

const WORD_EXTENSIONS = ['.doc', '.docx'];
const EXCEL_EXTENSIONS = ['.xls', '.xlsx'];

export class FileValidationService {
  static validate(
    buffer: Buffer,
    originalFilename: string,
    expectedDocType: DocumentType
  ): FileValidationResult {
    // 1. Check buffer existence & empty check
    if (!buffer || buffer.length === 0) {
      return { isValid: false, error: 'O arquivo enviado está vazio.' };
    }

    // 2. Check max file size
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        error: `O arquivo (${sizeMb} MB) excede o limite máximo permitido de ${process.env.MAX_FILE_SIZE_MB || 20} MB.`,
      };
    }

    // 3. Path traversal & filename sanitization
    const sanitizedFilename = originalFilename.replace(/[\/\\]/g, '_').trim();
    if (!sanitizedFilename || sanitizedFilename.includes('..')) {
      return { isValid: false, error: 'Nome de arquivo inválido ou inseguro.' };
    }

    // 4. Extension check
    const lowerName = sanitizedFilename.toLowerCase();
    const extensionMatch = lowerName.match(/\.([a-z0-9]+)$/i);
    const ext = extensionMatch ? extensionMatch[0] : '';

    if (expectedDocType === 'word' && !WORD_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        error: `Formato inválido para documento Word. Extensões aceitas: ${WORD_EXTENSIONS.join(', ')}`,
      };
    }

    if (expectedDocType === 'excel' && !EXCEL_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        error: `Formato inválido para planilha Excel. Extensões aceitas: ${EXCEL_EXTENSIONS.join(', ')}`,
      };
    }

    // 5. Magic Bytes validation
    // PK\x03\x04 (ZIP container for .docx / .xlsx)
    const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    // \xD0\xCF\x11\xE0 (OLE container for legacy .doc / .xls)
    const isOle = buffer.length >= 8 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

    if (ext === '.docx' || ext === '.xlsx') {
      if (!isZip) {
        return { isValid: false, error: 'O arquivo não possui uma estrutura válida de pacote Office (OpenXML/ZIP).' };
      }
    } else if (ext === '.doc' || ext === '.xls') {
      if (!isOle && !isZip) {
        return { isValid: false, error: 'O arquivo não possui uma assinatura OLE/Compound File válida.' };
      }
    }

    return {
      isValid: true,
      docType: expectedDocType,
      extension: ext,
      mimeType: ext === '.docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : ext === '.doc'
        ? 'application/msword'
        : ext === '.xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/vnd.ms-excel',
    };
  }
}
