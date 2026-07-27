import { Request, Response } from 'express';
import fs from 'fs';
import formidable from 'formidable';
import { FileValidationService } from '../services/fileValidationService.js';
import { TemporaryFilesService, TempDirectoryContext } from '../services/temporaryFilesService.js';
import { ConversionQueueService } from '../services/conversionQueueService.js';
import { LibreOfficeService } from '../services/libreOfficeService.js';

export async function handleExcelToPdf(req: Request, res: Response): Promise<void> {
  const requestId = req.headers['x-request-id'] as string || `excel-${Date.now()}`;
  console.log(`[ExcelToPdf] Nova requisição de conversão [ID: ${requestId}]`);

  // 1. Acquire concurrency slot
  if (!ConversionQueueService.acquireSlot()) {
    res.status(429).json({
      error: 'Servidor ocupado. Muitas conversões ocorrendo simultaneamente. Tente novamente em instantes.',
      code: 'CONCURRENCY_LIMIT_EXCEEDED',
    });
    return;
  }

  let tempContext: TempDirectoryContext | null = null;

  try {
    // 2. Parse multipart form data
    const maxFileSizeMb = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10);
    const form = formidable({
      maxFileSize: maxFileSizeMb * 1024 * 1024,
      multiples: false,
      uploadDir: '/tmp',
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      res.status(400).json({ error: 'Nenhum arquivo enviado. Utilize o campo "file" no multipart/form-data.' });
      return;
    }

    const originalFilename = uploadedFile.originalFilename || 'planilha.xlsx';
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);

    // Clean up initial formidable upload file
    try {
      fs.unlinkSync(uploadedFile.filepath);
    } catch {}

    // 3. Validate file
    const validation = FileValidationService.validate(fileBuffer, originalFilename, 'excel');
    if (!validation.isValid) {
      res.status(400).json({ error: validation.error || 'Arquivo Excel inválido.' });
      return;
    }

    // 4. Create isolated temporary context
    tempContext = TemporaryFilesService.createTempContext(validation.extension || '.xlsx');
    fs.writeFileSync(tempContext.inputFilePath, fileBuffer);

    // 5. Execute LibreOffice Calc conversion
    const result = await LibreOfficeService.convertToPdf(tempContext);

    if (!result.success || !result.pdfBuffer) {
      res.status(result.statusCode || 500).json({
        error: result.error || 'Falha ao converter planilha Excel para PDF.',
      });
      return;
    }

    // 6. Return binary PDF stream
    const pdfFilename = originalFilename.replace(/\.[^/.]+$/, '') + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(pdfFilename)}"`);
    res.setHeader('Content-Length', result.pdfBuffer.length.toString());
    res.setHeader('X-Conversion-Duration-Ms', result.durationMs.toString());
    if (result.pageCount) {
      res.setHeader('X-PDF-Page-Count', result.pageCount.toString());
    }

    res.send(result.pdfBuffer);
    console.log(`[ExcelToPdf] Requisição [ID: ${requestId}] finalizada e PDF retornado com sucesso.`);
  } catch (err: any) {
    console.error(`[ExcelToPdf] Erro na requisição [ID: ${requestId}]:`, err);
    res.status(500).json({
      error: `Erro interno no servidor de conversão: ${err?.message || 'Falha no processamento'}`,
    });
  } finally {
    // 7. Cleanup temp files and release concurrency slot
    TemporaryFilesService.cleanupContext(tempContext);
    ConversionQueueService.releaseSlot();
  }
}
