import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface TempDirectoryContext {
  conversionId: string;
  conversionDir: string;
  outputDir: string;
  profileDir: string;
  inputFilePath: string;
}

export class TemporaryFilesService {
  /**
   * Creates isolated directory structure in /tmp for a single conversion request.
   */
  static createTempContext(extension: string): TempDirectoryContext {
    const conversionId = uuidv4();
    const baseTmp = '/tmp';

    const conversionDir = path.join(baseTmp, `conversion-${conversionId}`);
    const outputDir = path.join(conversionDir, 'output');
    const profileDir = path.join(baseTmp, `profile-${conversionId}`);

    // Ensure directories exist
    fs.mkdirSync(conversionDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(profileDir, { recursive: true });

    const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
    const inputFilePath = path.join(conversionDir, `input${safeExt}`);

    return {
      conversionId,
      conversionDir,
      outputDir,
      profileDir,
      inputFilePath,
    };
  }

  /**
   * Safely cleans up all files and directories for a conversion context.
   */
  static cleanupContext(context: TempDirectoryContext | null): void {
    if (!context) return;

    try {
      if (fs.existsSync(context.conversionDir)) {
        fs.rmSync(context.conversionDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`[TempFiles] Erro ao limpar diretório de conversão ${context.conversionDir}:`, err);
    }

    try {
      if (fs.existsSync(context.profileDir)) {
        fs.rmSync(context.profileDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`[TempFiles] Erro ao limpar perfil LibreOffice ${context.profileDir}:`, err);
    }
  }

  /**
   * Scans /tmp and removes conversion / profile directories older than 15 minutes.
   */
  static cleanupAbandonedDirectories(maxAgeMinutes: number = 15): void {
    const baseTmp = '/tmp';
    if (!fs.existsSync(baseTmp)) return;

    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    const now = Date.now();

    try {
      const files = fs.readdirSync(baseTmp);
      for (const file of files) {
        if (file.startsWith('conversion-') || file.startsWith('profile-')) {
          const fullPath = path.join(baseTmp, file);
          try {
            const stats = fs.statSync(fullPath);
            if (now - stats.mtimeMs > maxAgeMs) {
              console.log(`[TempFiles] Removendo diretório abandonado: ${fullPath}`);
              fs.rmSync(fullPath, { recursive: true, force: true });
            }
          } catch {
            // Ignore stat errors if file was removed concurrently
          }
        }
      }
    } catch (err) {
      console.error('[TempFiles] Erro na varredura de limpezas abandonadas:', err);
    }
  }
}
