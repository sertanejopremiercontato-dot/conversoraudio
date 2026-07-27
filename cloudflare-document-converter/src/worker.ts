import { Container, getContainer } from "@cloudflare/containers";

export class DocumentConverterContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "5m";
}

export interface Env {
  ALLOWED_ORIGINS?: string;
  DOCUMENT_CONVERTER?: any;
  CONTAINER_SERVICE?: { fetch: typeof fetch };
  CONTAINER_URL?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    const allowedOrigins = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const defaultOrigins = [
      'https://multiconverte.com.br',
      'https://www.multiconverte.com.br',
      'http://localhost:5173',
      'http://localhost:3000',
    ];

    const allowedList = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;
    const isAllowedOrigin = !origin || allowedList.includes(origin);

    // Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin) {
        return new Response('CORS Origin Not Allowed', { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Helper to route to container
    const fetchFromContainer = async (req: Request): Promise<Response> => {
      if (env.DOCUMENT_CONVERTER) {
        const container = getContainer(env.DOCUMENT_CONVERTER, "document-converter");
        return container.fetch(req);
      }
      if (env.CONTAINER_SERVICE) {
        return env.CONTAINER_SERVICE.fetch(req);
      }
      if (env.CONTAINER_URL) {
        const targetUrl = `${env.CONTAINER_URL}${new URL(req.url).pathname}`;
        return fetch(targetUrl, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
      }
      return new Response(
        JSON.stringify({
          error: 'Serviço de conversão temporariamente indisponível. O container ainda não foi configurado na Cloudflare.',
          code: 'CONTAINER_NOT_CONFIGURED',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    };

    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      try {
        const resp = await fetchFromContainer(request);
        if (resp.status !== 503) {
          return resp;
        }
      } catch {
        // Fallback info response if container binding is not yet active
      }
      return new Response(
        JSON.stringify({ status: 'ok', worker: true, note: 'Worker online. Container binding pending deploy.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Conversion endpoints
    if (
      (url.pathname === '/convert/word-to-pdf' || url.pathname === '/convert/excel-to-pdf') &&
      request.method === 'POST'
    ) {
      if (!isAllowedOrigin) {
        return new Response(JSON.stringify({ error: 'Acesso negado pela política CORS.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        const response = await fetchFromContainer(request);

        // Add security and CORS headers to response
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', origin || '*');
        newHeaders.set('X-Content-Type-Options', 'nosniff');
        newHeaders.set('X-Frame-Options', 'DENY');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            error: 'Falha ao se comunicar com o container do LibreOffice.',
            details: err?.message || 'Erro de conexão',
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Root endpoint
    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({
          service: 'MultiConverte Cloudflare Document Converter Worker',
          status: 'online',
          endpoints: ['GET /health', 'POST /convert/word-to-pdf', 'POST /convert/excel-to-pdf'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
