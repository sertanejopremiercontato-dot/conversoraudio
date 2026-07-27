import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { TempDirectoryContext } from './temporaryFilesService.js';
import { ConversionResult } from '../types.js';

const TIMEOUT_MS = parseInt(process.env.CONVERSION_TIMEOUT_MS || '90000', 10);

export class LibreOfficeService {
  /**
   * Converts a document to PDF using headless LibreOffice soffice CLI.
   */
  static async convertToPdf(context: TempDirectoryContext): Promise<ConversionResult> {
    const startTime = Date.now();

    return new Promise<ConversionResult>((resolve) => {
      const profileUrl = `file://${context.profileDir}`;

      const args = [
        '--headless',
        '--nologo',
        '--nodefault',
        '--nofirststartwizard',
        '--nolockcheck',
        `-env:UserInstallation=${profileUrl}`,
        '--convert-to',
        'pdf',
        '--outdir',
        context.outputDir,
        context.inputFilePath,
      ];

      console.log(`[LibreOffice] Iniciando conversão soffice com argumentos: ${args.join(' ')}`);

      let processInstance: ChildProcess | null = null;
      let isTimedOut = false;

      const timeoutTimer = setTimeout(() => {
        isTimedOut = true;
        console.error(`[LibreOffice] Timeout excedido (${TIMEOUT_MS}ms). Encerrando processo soffice...`);
        if (processInstance) {
          try {
            processInstance.kill('SIGKILL');
          } catch (e) {
            console.error('[LibreOffice] Erro ao matar processo em timeout:', e);
          }
        }
      }, TIMEOUT_MS);

      try {
        processInstance = spawn('soffice', args, {
          env: { ...process.env, HOME: context.profileDir },
        });

        let stderrLogs = '';

        processInstance.stderr?.on('data', (data) => {
          stderrLogs += data.toString();
        });

        processInstance.on('error', (err) => {
          clearTimeout(timeoutTimer);
          const durationMs = Date.now() - startTime;
          console.error('[LibreOffice] Erro ao iniciar soffice:', err);
          resolve({
            success: false,
            durationMs,
            statusCode: 500,
            error: `Erro ao iniciar executável do LibreOffice: ${err.message}`,
          });
        });

        processInstance.on('close', (code) => {
          clearTimeout(timeoutTimer);
          const durationMs = Date.now() - startTime;

          if (isTimedOut) {
            return resolve({
              success: false,
              durationMs,
              statusCode: 504,
              error: `O tempo limite de conversão (${TIMEOUT_MS / 1000}s) foi excedido.`,
            });
          }

          if (code !== 0) {
            console.error(`[LibreOffice] soffice finalizou com código de erro ${code}. Stderr: ${stderrLogs}`);
            return resolve({
              success: false,
              durationMs,
              statusCode: 500,
              error: `O motor de conversão LibreOffice falhou (código ${code}).`,
            });
          }

          // Check output PDF file
          try {
            const files = fs.readdirSync(context.outputDir);
            const pdfFilename = files.find((f) => f.toLowerCase().endsWith('.pdf'));

            if (!pdfFilename) {
              return resolve({
                success: false,
                durationMs,
                statusCode: 500,
                error: 'Nenhum arquivo PDF foi gerado pelo LibreOffice.',
              });
            }

            const pdfPath = path.join(context.outputDir, pdfFilename);
            const pdfBuffer = fs.readFileSync(pdfPath);

            if (!pdfBuffer || pdfBuffer.length === 0) {
              return resolve({
                success: false,
                durationMs,
                statusCode: 500,
                error: 'O arquivo PDF gerado pelo LibreOffice possui 0 bytes.',
              });
            }

            // Verify PDF header magic bytes (%PDF-)
            if (pdfBuffer.length < 5 || pdfBuffer.toString('utf8', 0, 5) !== '%PDF-') {
              return resolve({
                success: false,
                durationMs,
                statusCode: 500,
                error: 'O arquivo gerado não é um PDF válido.',
              });
            }

            // Estimate pages count from /Type /Page occurrences
            const pdfText = pdfBuffer.toString('latin1');
            const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
            const pageCount = pageMatches ? pageMatches.length : 1;

            console.log(`[LibreOffice] Conversão concluída com sucesso em ${durationMs}ms. PDF: ${pdfBuffer.length} bytes, ~${pageCount} páginas.`);

            return resolve({
              success: true,
              pdfBuffer,
              pageCount,
              durationMs,
            });
          } catch (err: any) {
            return resolve({
              success: false,
              durationMs,
              statusCode: 500,
              error: `Erro ao ler resultado do PDF gerado: ${err.message}`,
            });
          }
        });
      } catch (err: any) {
        clearTimeout(timeoutTimer);
        const durationMs = Date.now() - startTime;
        return resolve({
          success: false,
          durationMs,
          statusCode: 500,
          error: `Exceção inesperada no serviço LibreOffice: ${err.message}`,
        });
      }
    });
  }

  /**
   * Healthcheck helper to verify soffice availability.
   */
  static async checkHealth(): Promise<{ soffice: boolean; writer: boolean; calc: boolean }> {
    return new Promise((resolve) => {
      try {
        const proc = spawn('soffice', ['--version']);
        let output = '';

        proc.stdout?.on('data', (d) => {
          output += d.toString();
        });

        proc.on('close', (code) => {
          const available = code === 0 || output.toLowerCase().includes('libreoffice');
          resolve({
            soffice: available,
            writer: available,
            calc: available,
          });
        });

        proc.on('error', () => {
          resolve({ soffice: false, writer: false, calc: false });
        });
      } catch {
        resolve({ soffice: false, writer: false, calc: false });
      }
    });
  }
}
