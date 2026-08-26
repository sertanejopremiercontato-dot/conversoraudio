/**
 * Conversor Audio V2 - Isolated Analytics Tracking Engine
 * 
 * Responsável por instrumentar pageviews e eventos exclusivos da V2
 * sem acoplamento ou importações da V1.
 * 
 * Regras de Privacidade:
 * Eventos V2 utilizam uma lista restrita de parâmetros e não enviam os campos pessoais identificados nesta implementação.
 * (Nomes de arquivo, caminhos, UIDs e emails são estritamente descartados).
 */

// Lista de parâmetros técnicos permitidos (Safe List)
const ALLOWED_PARAM_KEYS = new Set([
  "app_version",
  "output_format",
  "input_format",
  "file_count",
  "bitrate",
  "sample_rate",
  "channels",
  "error_code",
  "status",
  "quality"
]);

/**
 * Sanitiza e remove qualquer dado não autorizado ou sensível antes do envio
 */
function sanitizeParams(params?: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {
    app_version: "v2"
  };

  if (!params) return clean;

  for (const [key, value] of Object.entries(params)) {
    if (ALLOWED_PARAM_KEYS.has(key)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        clean[key] = value;
      }
    }
  }

  return clean;
}

/**
 * Helper para envio não-bloqueante de telemetria ao backend da plataforma
 */
function sendTelemetryBeacon(payload: Record<string, any>): void {
  try {
    if (typeof window === "undefined") return;
    
    // Não contabiliza rotas administrativas
    const path = window.location.pathname || "";
    if (path.includes("/admin")) return;

    const dataString = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([dataString], { type: "application/json" });
      navigator.sendBeacon("/api/telemetry/event", blob);
    } else {
      fetch("/api/telemetry/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: dataString,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Falha silenciosa
  }
}

/**
 * Dispara Page View da V2 de forma isolada
 * Instrumenta apenas rotas públicas (ex: /, /audio, /pdf).
 * Rotas administrativas (/admin) NUNCA são enviadas como pageview público.
 */
export function trackPageViewV2(path: string, title?: string): void {
  try {
    if (typeof window === "undefined") return;

    // Regra: Bloquear tracking de rotas do admin
    if (path.includes("/admin")) {
      return;
    }

    const cleanTitle = title || "Conversor de Áudio & Mídia Online (V2)";

    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_title: cleanTitle,
        page_path: path,
        page_location: window.location.href,
        app_version: "v2"
      });
    }

    // Telemetria nativa da plataforma
    sendTelemetryBeacon({
      type: "page_view",
      path,
      title: cleanTitle
    });

    if (process.env.NODE_ENV === "development") {
      console.debug(`[Analytics V2 PageView]: ${path} (${cleanTitle})`);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Analytics V2 PageView Error]:", err);
    }
  }
}

/**
 * Dispara Eventos Customizados de ferramentas da V2
 */
export function trackEventV2(eventName: string, rawParams?: Record<string, any>): void {
  try {
    if (typeof window === "undefined") return;

    const safeParams = sanitizeParams(rawParams);

    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", eventName, safeParams);
    }

    // Identifica tipo de evento para telemetria agregada
    let eventType = "tool_event";
    if (eventName.includes("conversion_completed") || eventName.includes("convert_success")) {
      eventType = "conversion";
    } else if (eventName.includes("download")) {
      eventType = "download";
    }

    sendTelemetryBeacon({
      type: eventType,
      eventName,
      ...safeParams
    });

    if (process.env.NODE_ENV === "development") {
      console.debug(`[Analytics V2 Event]: "${eventName}"`, safeParams);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Analytics V2 Event Error - ${eventName}]:`, err);
    }
  }
}
