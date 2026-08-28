import { shouldTrackAnalytics } from "../v2/integrations/analytics";

/**
 * Google Analytics 4 (GA4) Integration Utilities
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = (import.meta as any).env.VITE_GA4_MEASUREMENT_ID || (import.meta as any).env.VITE_GA_MEASUREMENT_ID || "";

/**
 * Dynamically loads the GA4 script tag and initializes gtag.
 * Configures default consent settings and disables automatic page view tracking.
 */
export function initGA() {
  if (!GA_MEASUREMENT_ID) {
    console.log("[GA4] VITE_GA4_MEASUREMENT_ID not configured. GA4 tracking is disabled.");
    return;
  }

  // Avoid double injection
  if (window.gtag) {
    return;
  }

  try {
    // 1. Create the Google Tag Manager script element
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // 2. Setup standard window properties
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    // 3. Set up default consent settings (denied by default, unless already stored as granted)
    const savedConsent = localStorage.getItem("conversoraudio_ga_consent") || localStorage.getItem("multiconverte_ga_consent") || localStorage.getItem("multiconvert_ga_consent");
    const defaultConsent = savedConsent === "granted" ? "granted" : "denied";

    window.gtag("consent", "default", {
      analytics_storage: defaultConsent,
      ad_storage: defaultConsent,
      ad_user_data: defaultConsent,
      ad_personalization: defaultConsent,
    });

    // 4. Initialize gtag configuration
    window.gtag("js", new Date());

    // Disable automatic page view tracking (we do this manually to support SPA routing properly)
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
    });

    console.log(`[GA4] Successfully initialized GA4 with measurement ID: ${GA_MEASUREMENT_ID} (Consent default: ${defaultConsent})`);
  } catch (err) {
    console.error("[GA4] Failed to initialize Google Analytics:", err);
  }
}

/**
 * Updates the user's consent choice and saves it to localStorage.
 */
export function updateGAConsent(status: "granted" | "denied") {
  localStorage.setItem("conversoraudio_ga_consent", status);
  try {
    localStorage.removeItem("multiconverte_ga_consent");
    localStorage.removeItem("multiconvert_ga_consent");
  } catch (e) {}
  if (window.gtag) {
    try {
      window.gtag("consent", "update", {
        analytics_storage: status,
        ad_storage: status,
        ad_user_data: status,
        ad_personalization: status,
      });
      console.log(`[GA4] Consent state updated to: ${status}`);
    } catch (err) {
      console.error("[GA4] Failed to update GA4 consent state:", err);
    }
  }
}

/**
 * Helper para envio não-bloqueante de telemetria ao backend da plataforma (/api/telemetry/event)
 */
function sendInternalTelemetryBeacon(payload: Record<string, any>): void {
  try {
    if (typeof window === "undefined") return;

    if (!shouldTrackAnalytics()) return;

    const path = window.location.pathname || "";
    if (path.includes("/admin") || path.includes("/preview")) return;

    const dataString = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([dataString], { type: "application/json" });
      navigator.sendBeacon("/api/telemetry/event", blob);
    } else {
      fetch("/api/telemetry/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: dataString,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Falha silenciosa e não-bloqueante
  }
}

/**
 * Manually registers a page view in Google Analytics and internal platform telemetry.
 */
export function trackPageView(title: string, path: string) {
  // 1. GA4 tracking (opcional se configurado)
  if (GA_MEASUREMENT_ID && window.gtag) {
    try {
      window.gtag("event", "page_view", {
        page_title: title,
        page_location: `${window.location.origin}${path}`,
        page_path: path,
      });
      console.log(`[GA4] Tracked Page View: ${path} (${title})`);
    } catch (err) {
      console.error("[GA4] Error tracking page view:", err);
    }
  }

  // 2. Telemetria interna real da plataforma (com prevenção de duplicidade com V2)
  try {
    if (path.includes("/admin") || path.includes("/preview")) {
      return;
    }

    const lastV2 = (window as any).__last_v2_pv;
    const isDuplicate = lastV2 && lastV2.path === path && (Date.now() - lastV2.time) < 2000;

    if (!isDuplicate) {
      (window as any).__last_v2_pv = { path, time: Date.now() };
      sendInternalTelemetryBeacon({
        type: "page_view",
        path,
        title: title || "Conversor de Áudio & Mídia Online",
      });
    }
  } catch {
    // Telemetria nunca interrompe a aplicação
  }
}

/**
 * Sends a custom event to GA4 and internal platform telemetry, cleansing any potentially sensitive input arguments.
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  // Scrub potential personally identifiable info (PII) before sending
  const cleanParams: Record<string, any> = {};
  const safeKeys = ["tool_name", "removal_mode", "input_format", "output_format", "quality", "quality_mode", "background_type", "refinement_used", "acceleration_type", "file_count", "files_count", "processed_count", "failed_count", "rotation_type", "flip_type", "auto_orientation", "watermark_type", "preset_name", "repeat_mode", "success", "ad_id", "ad_position", "format", "tool", "category"];
  const piiKeywords = ["email", "filename", "file_name", "content", "ip", "token", "uid", "user", "username", "password", "key", "secret", "auth", "name"];

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    const isExplicitlySafe = safeKeys.includes(lowerKey);
    const isSensitive = !isExplicitlySafe && piiKeywords.some((keyword) => lowerKey.includes(keyword));

    if (!isSensitive && (typeof value === "string" || typeof value === "number" || typeof value === "boolean")) {
      cleanParams[key] = value;
    }
  }

  // 1. GA4 tracking (opcional se configurado)
  if (GA_MEASUREMENT_ID && window.gtag) {
    try {
      window.gtag("event", eventName, cleanParams);
      console.log(`[GA4] Tracked Event "${eventName}":`, cleanParams);
    } catch (err) {
      console.error(`[GA4] Error tracking event "${eventName}":`, err);
    }
  }

  // 2. Telemetria interna real da plataforma (site_metrics)
  try {
    let eventType = "tool_event";
    if (
      eventName.includes("conversion_completed") ||
      eventName.includes("converted") ||
      eventName.includes("convert_success") ||
      eventName.includes("completed_remote")
    ) {
      eventType = "conversion";
    } else if (
      eventName.includes("download") ||
      eventName.includes("downloaded") ||
      eventName.includes("download_clicked")
    ) {
      eventType = "download";
    }

    let inferredTool = typeof cleanParams.tool === "string" ? cleanParams.tool : typeof cleanParams.tool_name === "string" ? cleanParams.tool_name : "";
    if (!inferredTool) {
      if (eventName.startsWith("audio_")) inferredTool = "audio";
      else if (eventName.startsWith("video_")) inferredTool = "videoToAudio";
      else if (eventName.startsWith("pdf_") || eventName.startsWith("images_to_pdf")) inferredTool = "pdf";
      else if (eventName.startsWith("image_")) inferredTool = "image";
      else if (eventName.startsWith("word_to_pdf")) inferredTool = "wordToPdf";
      else if (eventName.startsWith("excel_to_pdf")) inferredTool = "excelToPdf";
    }

    sendInternalTelemetryBeacon({
      type: eventType,
      eventName,
      tool: inferredTool || undefined,
      output_format: cleanParams.output_format || cleanParams.format,
      input_format: cleanParams.input_format,
      file_count: cleanParams.files_count || cleanParams.file_count || cleanParams.processed_count,
      quality: cleanParams.quality || cleanParams.quality_mode,
      app_version: "v1",
    });
  } catch {
    // Telemetria não bloqueia execução
  }
}
