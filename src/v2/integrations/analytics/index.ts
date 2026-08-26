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
 * Helper para obter/gerar Session ID anônimo sem armazenar qualquer PII
 */
function getAnonymousSessionData(): { sessionId: string; isNewSession: boolean } {
  try {
    if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
      return { sessionId: "server_session", isNewSession: false };
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const SESS_KEY = "mc_anon_sess_id";
    const TRACKED_KEY = `mc_sess_tracked_${todayStr}`;

    let sessionId = sessionStorage.getItem(SESS_KEY);
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      sessionStorage.setItem(SESS_KEY, sessionId);
    }

    const wasTrackedToday = sessionStorage.getItem(TRACKED_KEY);
    const isNewSession = !wasTrackedToday;
    if (isNewSession) {
      sessionStorage.setItem(TRACKED_KEY, "1");
    }

    return { sessionId, isNewSession };
  } catch {
    return { sessionId: "fallback_session", isNewSession: false };
  }
}

/**
 * Extrai fonte de tráfego e parâmetros UTM seguros
 */
function getSafeTrafficSource(): { referrerDomain: string; trafficSource: string; utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  try {
    if (typeof window === "undefined") {
      return { referrerDomain: "Direto", trafficSource: "Direto" };
    }

    const referrer = document.referrer || "";
    let referrerDomain = "Direto";
    let trafficSource = "Direto";

    if (referrer) {
      try {
        const refUrl = new URL(referrer);
        const host = refUrl.hostname.toLowerCase();
        
        if (host === window.location.hostname.toLowerCase()) {
          referrerDomain = "Interno";
          trafficSource = "Direto";
        } else if (host.includes("google.")) {
          referrerDomain = "Google";
          trafficSource = "Google (Busca Orgânica)";
        } else if (host.includes("bing.")) {
          referrerDomain = "Bing";
          trafficSource = "Bing (Busca Orgânica)";
        } else if (host.includes("yahoo.")) {
          referrerDomain = "Yahoo";
          trafficSource = "Yahoo";
        } else if (host.includes("duckduckgo.")) {
          referrerDomain = "DuckDuckGo";
          trafficSource = "DuckDuckGo";
        } else if (
          host.includes("facebook.") || 
          host.includes("instagram.") || 
          host.includes("t.co") || 
          host.includes("twitter.") || 
          host.includes("x.com") || 
          host.includes("tiktok.") || 
          host.includes("youtube.") || 
          host.includes("whatsapp.") || 
          host.includes("linkedin.")
        ) {
          referrerDomain = host;
          trafficSource = "Redes Sociais";
        } else {
          referrerDomain = host;
          trafficSource = `Referência (${host})`;
        }
      } catch {
        referrerDomain = "Externo";
        trafficSource = "Referência Externa";
      }
    }

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source")?.substring(0, 50) || undefined;
    const utmMedium = params.get("utm_medium")?.substring(0, 50) || undefined;
    const utmCampaign = params.get("utm_campaign")?.substring(0, 50) || undefined;

    if (utmSource) {
      trafficSource = `Campanha: ${utmSource}`;
    }

    return {
      referrerDomain,
      trafficSource,
      utmSource,
      utmMedium,
      utmCampaign
    };
  } catch {
    return { referrerDomain: "Direto", trafficSource: "Direto" };
  }
}

/**
 * Cache em memória para evitar disparo duplicado de impressões no mesmo ciclo
 */
const recentImpressions = new Set<string>();

/**
 * Helper para envio não-bloqueante de telemetria ao backend da plataforma
 */
function sendTelemetryBeacon(payload: Record<string, any>): void {
  try {
    if (typeof window === "undefined") return;
    
    // Não contabiliza rotas administrativas
    const path = window.location.pathname || "";
    if (path.includes("/admin")) return;

    const { sessionId, isNewSession } = getAnonymousSessionData();
    const traffic = getSafeTrafficSource();

    const fullPayload = {
      ...payload,
      sessionId,
      isNewSession,
      referrerDomain: traffic.referrerDomain,
      trafficSource: traffic.trafficSource,
      utmSource: traffic.utmSource,
      utmMedium: traffic.utmMedium,
      utmCampaign: traffic.utmCampaign
    };

    const dataString = JSON.stringify(fullPayload);

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
 * Registra impressão real de banner (>= 50% visível na tela)
 */
export function trackBannerImpression(bannerId: string, bannerTitle?: string, placement: string = "home_carousel"): void {
  try {
    if (typeof window === "undefined" || !bannerId) return;

    const cacheKey = `${bannerId}_${placement}`;
    if (recentImpressions.has(cacheKey)) {
      return;
    }

    recentImpressions.add(cacheKey);
    // Libera após 30 segundos se o usuário rolar de novo
    setTimeout(() => {
      recentImpressions.delete(cacheKey);
    }, 30000);

    sendTelemetryBeacon({
      type: "banner_impression",
      bannerId,
      bannerTitle: bannerTitle || bannerId,
      placement
    });

    if (process.env.NODE_ENV === "development") {
      console.debug(`[Analytics V2 Banner Impression]: ${bannerId} (${placement})`);
    }
  } catch {}
}

/**
 * Registra clique real de banner publicitário/promocional
 */
export function trackBannerClick(bannerId: string, bannerTitle?: string, placement: string = "home_carousel"): void {
  try {
    if (typeof window === "undefined" || !bannerId) return;

    sendTelemetryBeacon({
      type: "banner_click",
      bannerId,
      bannerTitle: bannerTitle || bannerId,
      placement
    });

    if (process.env.NODE_ENV === "development") {
      console.debug(`[Analytics V2 Banner Click]: ${bannerId} (${placement})`);
    }
  } catch {}
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

    // Registra timestamp do tracking para evitar duplicidade com chamadas legadas
    (window as any).__last_v2_pv = { path, time: Date.now() };

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
