import { Request, Response } from 'express';
import { LibreOfficeService } from '../services/libreOfficeService.js';
import { HealthCheckResponse } from '../types.js';

export async function handleHealthCheck(req: Request, res: Response): Promise<void> {
  const loHealth = await LibreOfficeService.checkHealth();

  const healthResponse: HealthCheckResponse = {
    status: loHealth.soffice ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    services: {
      worker: true,
      container: true,
      libreOffice: loHealth.soffice,
      writer: loHealth.writer,
      calc: loHealth.calc,
    },
    limits: {
      maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
      timeoutMs: parseInt(process.env.CONVERSION_TIMEOUT_MS || '90000', 10),
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_CONVERSIONS || '2', 10),
    },
  };

  const statusCode = loHealth.soffice ? 200 : 503;
  res.status(statusCode).json(healthResponse);
}
