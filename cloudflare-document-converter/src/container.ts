import express from 'express';
import cors from 'cors';
import { handleHealthCheck } from './routes/health.js';
import { handleWordToPdf } from './routes/wordToPdf.js';
import { handleExcelToPdf } from './routes/excelToPdf.js';
import { TemporaryFilesService } from './services/temporaryFilesService.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const defaultOrigins = [
  'https://multiconverte.com.br',
  'https://www.multiconverte.com.br',
  'http://localhost:5173',
  'http://localhost:3000',
];

const originsList = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || originsList.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Origem não permitida bloqueada: ${origin}`);
        callback(new Error('Origem não permitida pela política CORS.'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['Content-Disposition', 'X-Conversion-Duration-Ms', 'X-PDF-Page-Count'],
  })
);

// Health check endpoint
app.get('/health', handleHealthCheck);

// Conversion endpoints
app.post('/convert/word-to-pdf', handleWordToPdf);
app.post('/convert/excel-to-pdf', handleExcelToPdf);

// Root fallback
app.get('/', (req, res) => {
  res.json({
    name: 'MultiConverte Cloudflare Document Converter API',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      wordToPdf: 'POST /convert/word-to-pdf',
      excelToPdf: 'POST /convert/excel-to-pdf',
    },
  });
});

// Periodic task: Clean up abandoned /tmp directories older than 15 minutes
setInterval(() => {
  TemporaryFilesService.cleanupAbandonedDirectories(15);
}, 5 * 60 * 1000);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Container] Erro não tratado na aplicação:', err);
  res.status(500).json({
    error: 'Erro interno no servidor de conversão.',
    message: err?.message || 'Erro desconhecido',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 MultiConverte Document Converter escutando em http://${HOST}:${PORT}`);
  console.log(`🔒 Origens CORS permitidas: ${originsList.join(', ')}`);
  console.log(`=======================================================`);
});
