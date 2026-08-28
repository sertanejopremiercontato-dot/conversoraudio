/**
 * Conversor Audio V2 - Isolated Analytics Tracking Engine
 * 
 * Responsável por instrumentar pageviews e eventos exclusivos da V2
 * sem acoplamento ou importações da V1.
 * 
 * Regras de Integridade & Privacidade:
 * - Não rastreia rotas /admin ou /preview
 * - Não rastreia ambientes de desenvolvimento (localhost, AI Studio preview, etc.)
 * - Respeita a flag de exclusão do proprietário (analyticsOwnerExcluded)
 * - Associa geolocalização, dispositivo e tecnologia ESTRITAMENTE à SESSÃO ÚNICA (1x por sessão)
 * - Banners, conversões e downloads NUNCA incrementam geolocalização ou dispositivos
 * - Nomes de arquivo, caminhos, UIDs e emails são estritamente descartados
 */

// Lista de parâmetros técnicos permitidos (Safe List)
const ALLOWED_PARAM_KEYS = new Set([
  "app_version",
  "tool",
  "output_format",
  "input_format",
  "file_count",
  "fileCount",
  "downloadActions",
  "is_zip",
  "isZip",
  "bitrate",
  "sample_rate",
  "channels",
  "error_code",
  "status",
  "quality",
  "duration_seconds",
  "durationSeconds"
]);

/**
 * Verifica se o navegador atual pertence ao administrador/proprietário e deve ser excluído
 */
export function isOwnerExcluded(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("analyticsOwnerExcluded") === "true" ||
      localStorage.getItem("conversoraudio_owner_excluded") === "true" ||
      sessionStorage.getItem("analyticsOwnerExcluded") === "true" ||
      localStorage.getItem("v2_admin_auth") === "true"
    );
  } catch {
    return false;
  }
}

/**
 * Ativa ou desativa a exclusão de métricas para o navegador do proprietário
 */
export function setOwnerExcluded(excluded: boolean): void {
  try {
    if (typeof window === "undefined") return;
    if (excluded) {
      localStorage.setItem("analyticsOwnerExcluded", "true");
      sessionStorage.setItem("analyticsOwnerExcluded", "true");
    } else {
      localStorage.removeItem("analyticsOwnerExcluded");
      sessionStorage.removeItem("analyticsOwnerExcluded");
      localStorage.removeItem("conversoraudio_owner_excluded");
    }
  } catch {}
}

/**
 * Verifica se o ambiente atual é preview/dev/localhost/AI Studio
 */
export function isDevOrPreviewEnvironment(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const hostname = (window.location.hostname || "").toLowerCase();
    const pathname = (window.location.pathname || "").toLowerCase();

    if (pathname.includes("/admin") || pathname.includes("/preview")) {
      return true;
    }

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.includes("ai.studio") ||
      hostname.includes("aistudio") ||
      hostname.includes("webcontainer") ||
      hostname.includes("github.dev") ||
      hostname.includes("stackblitz") ||
      hostname.includes(".run.app")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Condição geral para envio de telemetria pública
 */
export function shouldTrackAnalytics(): boolean {
  if (typeof window === "undefined") return false;
  if (isDevOrPreviewEnvironment()) return false;
  if (isOwnerExcluded()) return false;
  return true;
}

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
 * Extrai fonte de tráfego e parâmetros UTM seguros com persistência de first-touch por sessão
 */
function getSafeTrafficSource(): { referrerDomain: string; trafficSource: string; utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  try {
    if (typeof window === "undefined") {
      return { referrerDomain: "Direto", trafficSource: "Direto" };
    }

    // Verifica se já temos a origem gravada nesta sessão (first-touch attribution)
    const FIRST_TOUCH_KEY = "mc_sess_first_touch";
    try {
      const stored = sessionStorage.getItem(FIRST_TOUCH_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

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

    const result = {
      referrerDomain,
      trafficSource,
      utmSource,
      utmMedium,
      utmCampaign
    };

    try {
      sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(result));
    } catch {}

    return result;
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
    
    // Regra Crítica: Nunca rastrear em ambientes dev/preview, rotas admin ou se proprietário estiver excluído
    if (!shouldTrackAnalytics()) {
      return;
    }

    const { sessionId, isNewSession } = getAnonymousSessionData();
    const traffic = getSafeTrafficSource();

    let timeZone: string | undefined = undefined;
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {}

    let clientCategory = "Desktop";
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        clientCategory = "Mobile";
      } else if (window.innerWidth < 1024) {
        clientCategory = "Tablet";
      }
    }

    const fullPayload = {
      ...payload,
      sessionId,
      isNewSession,
      isOwnerExcluded: false,
      timeZone,
      clientCategory,
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
    if (
      eventName.includes("conversion_completed") || 
      eventName.includes("convert_success") || 
      eventName.includes("conversion_success") ||
      eventName.includes("extraction_completed") ||
      eventName.includes("processing_completed")
    ) {
      eventType = "conversion";
    } else if (eventName.includes("download")) {
      eventType = "download";
    }

    sendTelemetryBeacon({
      type: eventType,
      eventName,
      tool: safeParams.tool,
      fileCount: safeParams.file_count || safeParams.fileCount || 1,
      downloadActions: safeParams.downloadActions || 1,
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

/**
 * Registra o início de uma conversão/processamento em uma ferramenta
 */
export function trackConversionStart(tool: string, params?: Record<string, any>): void {
  trackEventV2(`${tool}_started`, {
    tool,
    ...params
  });
}

/**
 * Registra o sucesso real de uma conversão de áudio ou mídia
 */
export function trackConversionSuccess(tool: string, params?: Record<string, any>): void {
  trackEventV2(`${tool}_conversion_completed`, {
    tool,
    ...params
  });
}

/**
 * Registra falha técnica durante o processamento de arquivo
 */
export function trackConversionError(tool: string, errorCode?: string, params?: Record<string, any>): void {
  trackEventV2(`${tool}_conversion_failed`, {
    tool,
    error_code: errorCode || "unknown_error",
    ...params
  });
}

/**
 * Registra o clique de download do arquivo convertido pelo usuário
 */
export function trackDownloadAction(tool: string, params?: { outputFormat?: string; fileCount?: number; isZip?: boolean }): void {
  const count = params?.fileCount || 1;
  trackEventV2(`${tool}_download_clicked`, {
    tool,
    output_format: params?.outputFormat,
    file_count: count,
    downloadActions: 1,
    is_zip: !!params?.isZip
  });
}
