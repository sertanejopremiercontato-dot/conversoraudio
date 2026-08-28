import fs from "fs";
import path from "path";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, increment } from "firebase/firestore/lite";

console.log("[TELEMETRY-EVENT] function loaded");

// Safe load firebase config
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {
  console.error("[TELEMETRY-EVENT] Failed to read firebase config:", err);
}

function getDb() {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error("Firebase configuration unavailable");
  }

  const app = getApps().length === 0 ? initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId
  }) : getApps()[0];

  return getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
}

// User Agent parser
function parseUserAgentDetails(ua: string): {
  isBot: boolean;
  category: "Desktop" | "Mobile" | "Tablet" | "Outro";
  os: string;
  browser: string;
} {
  const lower = (ua || "").toLowerCase();

  // Bot detection
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headlesschrome|bingbot|yahoo|duckduckbot|baiduspider|yandexbot/i.test(lower);

  // Category
  let category: "Desktop" | "Mobile" | "Tablet" | "Outro" = "Desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(lower)) {
    category = "Tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(lower)) {
    category = "Mobile";
  }

  // OS
  let os = "Outro";
  if (lower.includes("windows nt 10.0") || lower.includes("windows nt 11.0")) os = "Windows 10/11";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod")) os = "iOS";
  else if (lower.includes("macintosh") || lower.includes("mac os x")) os = "macOS";
  else if (lower.includes("linux")) os = "Linux";
  else if (lower.includes("cros")) os = "Chrome OS";

  // Browser
  let browser = "Outro";
  if (lower.includes("edg/")) browser = "Microsoft Edge";
  else if (lower.includes("opr/") || lower.includes("opera/")) browser = "Opera";
  else if (lower.includes("samsungbrowser/")) browser = "Samsung Internet";
  else if (lower.includes("chrome/") && !lower.includes("edg/")) browser = "Google Chrome";
  else if (lower.includes("safari/") && !lower.includes("chrome/")) browser = "Safari";
  else if (lower.includes("firefox/")) browser = "Firefox";

  return { isBot, category, os, browser };
}

const COUNTRY_MAP: Record<string, string> = {
  BR: "Brasil",
  US: "Estados Unidos",
  PT: "Portugal",
  ES: "Espanha",
  AR: "Argentina",
  MX: "México",
  FR: "França",
  DE: "Alemanha",
  GB: "Reino Unido",
  UK: "Reino Unido",
  IT: "Itália",
  CL: "Chile",
  CO: "Colômbia",
  UY: "Uruguai",
  PY: "Paraguai",
  CA: "Canadá",
  AO: "Angola",
  MZ: "Moçambique",
  JP: "Japão",
  AU: "Austrália",
  IN: "Índia"
};

const BRAZIL_STATE_MAP: Record<string, string> = {
  SP: "São Paulo",
  RJ: "Rio de Janeiro",
  MG: "Minas Gerais",
  RS: "Rio Grande do Sul",
  PR: "Paraná",
  SC: "Santa Catarina",
  BA: "Bahia",
  PE: "Pernambuco",
  CE: "Ceará",
  GO: "Goiás",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  PA: "Pará",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  AM: "Amazonas",
  RN: "Rio Grande do Norte",
  PB: "Paraíba",
  AL: "Alagoas",
  PI: "Piauí",
  SE: "Sergipe",
  RO: "Rondônia",
  TO: "Tocantins",
  AC: "Acre",
  AP: "Amapá",
  RR: "Roraima"
};

function extractGeoHeaders(req: any): { country: string; region: string; city: string } {
  const headers = req.headers || {};

  // Country
  const rawCountry = (
    headers["x-vercel-ip-country"] ||
    headers["cf-ipcountry"] ||
    headers["x-appengine-country"] ||
    headers["x-client-geo-location"] ||
    headers["x-country-code"] ||
    headers["x-real-ip-country"] ||
    ""
  ).toString().trim().toUpperCase();

  const country = COUNTRY_MAP[rawCountry] || (rawCountry.length === 2 ? rawCountry : rawCountry || "");

  // Region / State
  let rawRegion = (
    headers["x-vercel-ip-country-region"] ||
    headers["cf-region-code"] ||
    headers["x-appengine-region"] ||
    headers["x-region"] ||
    ""
  ).toString().trim().toUpperCase();

  if (rawCountry === "BR" && BRAZIL_STATE_MAP[rawRegion]) {
    rawRegion = BRAZIL_STATE_MAP[rawRegion];
  }

  // City
  let rawCity = (
    headers["x-vercel-ip-city"] ||
    headers["cf-ipcity"] ||
    headers["x-appengine-city"] ||
    headers["x-city"] ||
    ""
  ).toString().trim();

  if (rawCity) {
    try {
      rawCity = decodeURIComponent(rawCity);
    } catch {}
  }

  return {
    country,
    region: rawRegion,
    city: rawCity
  };
}

// Helper: Verifica se a requisição originou de ambiente de desenvolvimento/preview ou navegador excluído
function isDevOrPreviewRequest(req: any): boolean {
  try {
    const headers = req.headers || {};
    const host = String(headers["x-forwarded-host"] || headers["host"] || "").toLowerCase();
    const origin = String(headers["origin"] || "").toLowerCase();
    const referer = String(headers["referer"] || "").toLowerCase();

    const devKeywords = [
      "localhost",
      "127.0.0.1",
      "ai.studio",
      "aistudio",
      "webcontainer",
      "github.dev",
      "stackblitz",
      ".run.app"
    ];

    for (const kw of devKeywords) {
      if (host.includes(kw) || origin.includes(kw) || referer.includes(kw)) {
        return true;
      }
    }
  } catch {}
  return false;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  if (res.setHeader) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Only POST is supported" });
  }

  try {
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "INVALID_JSON" });
      }
    }

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "BAD_REQUEST" });
    }

    const {
      type,
      path: rawPath,
      tool: rawTool,
      eventName: rawEvent,
      bannerId: rawBannerId,
      bannerTitle: rawBannerTitle,
      placement: rawPlacement,
      isNewSession,
      isOwnerExcluded,
      trafficSource: rawTrafficSource,
      referrerDomain: rawReferrerDomain,
      utmSource: rawUtmSource,
      utmCampaign: rawUtmCampaign,
      fileCount: rawFileCount,
      downloadActions: rawDownloadActions
    } = body;

    const pathStr = typeof rawPath === "string" ? rawPath.trim() : "";
    
    // 1. Privacy & Scope: Never track admin or preview routes as public metrics
    if (pathStr.includes("/admin") || pathStr.includes("/preview")) {
      return res.status(200).json({ success: true, ignored: true });
    }

    // 2. Ignore Dev / AI Studio preview / localhost / Owner browser traffic
    if (isOwnerExcluded || isDevOrPreviewRequest(req)) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const userAgentStr = String(req.headers?.["user-agent"] || "");
    const { isBot, category, os, browser } = parseUserAgentDetails(userAgentStr);
    
    if (isBot) {
      return res.status(200).json({ success: true, ignoredBot: true });
    }

    const db = getDb();
    const todayStr = new Date().toISOString().substring(0, 10);
    const dailyDocRef = doc(db, "site_metrics", `daily_${todayStr}`);
    const totalDocRef = doc(db, "site_metrics", "total");

    const updates: Record<string, any> = {
      date: todayStr,
      schemaVersion: 2,
      updatedAt: new Date().toISOString()
    };

    // 1. Page Views (Incrementa ESTRITAMENTE em page_view)
    if (type === "page_view" || !type) {
      updates.pageViews = increment(1);
      if (pathStr) {
        const cleanPathKey = pathStr.replace(/[^a-zA-Z0-9_-]/g, "_") || "home";
        updates[`routes.${cleanPathKey}`] = increment(1);
      }
    }

    // 2. Sessão Única (Incrementa ESTRITAMENTE 1x por sessão: Sessão, Dispositivo, OS, Navegador, Geo e Origem)
    if (isNewSession) {
      updates.sessions = increment(1);

      // Devices, OS, Browsers (1x por sessão)
      if (category) {
        const deviceKey = category.replace(/[^a-zA-Z0-9_-]/g, "_");
        updates[`devices.${deviceKey}`] = increment(1);
      }
      if (os) {
        const osKey = os.replace(/[^a-zA-Z0-9_-]/g, "_");
        updates[`os.${osKey}`] = increment(1);
      }
      if (browser) {
        const browserKey = browser.replace(/[^a-zA-Z0-9_-]/g, "_");
        updates[`browsers.${browserKey}`] = increment(1);
      }

      // Geolocation from real infrastructure headers (1x por sessão)
      const geo = extractGeoHeaders(req);
      if (geo.country) {
        const cleanCountry = geo.country.replace(/[^a-zA-Z0-9_-]/g, "_");
        updates[`countries.${cleanCountry}`] = increment(1);
        if (geo.region) {
          const cleanRegion = `${cleanCountry}_${geo.region}`.replace(/[^a-zA-Z0-9_-]/g, "_");
          updates[`regions.${cleanRegion}`] = increment(1);
        }
        if (geo.city) {
          const cleanCity = `${cleanCountry}_${geo.city}`.replace(/[^a-zA-Z0-9_-]/g, "_");
          updates[`cities.${cleanCity}`] = increment(1);
        }
      } else {
        updates[`countries.Nao_disponivel`] = increment(1);
      }

      // Traffic Sources & UTMs (1x por sessão)
      if (rawTrafficSource && typeof rawTrafficSource === "string") {
        const sourceKey = rawTrafficSource.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Direto";
        updates[`trafficSources.${sourceKey}`] = increment(1);
      }
      if (rawReferrerDomain && typeof rawReferrerDomain === "string") {
        const refKey = rawReferrerDomain.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Direto";
        updates[`referrers.${refKey}`] = increment(1);
      }
      if (rawUtmSource && typeof rawUtmSource === "string") {
        const utmKey = (rawUtmCampaign || rawUtmSource).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
        if (utmKey) {
          updates[`utms.${utmKey}`] = increment(1);
        }
      }
    }

    // 3. Tool Usage (NUNCA incrementa geo/device/traffic)
    const toolKey = typeof rawTool === "string" ? rawTool.trim().replace(/[^a-zA-Z0-9_-]/g, "_") : "";
    if (toolKey) {
      updates[`tools.${toolKey}`] = increment(1);
    }

    // 4. Conversions (NUNCA incrementa geo/device/traffic)
    const isConversion = type === "conversion" || (typeof rawEvent === "string" && (
      rawEvent.includes("conversion_completed") || 
      rawEvent.includes("convert_success") || 
      rawEvent.includes("conversion_success") ||
      rawEvent.includes("extraction_completed") ||
      rawEvent.includes("processing_completed")
    ));

    if (isConversion) {
      updates.conversions = increment(1);
      if (toolKey) {
        updates[`toolConversions.${toolKey}`] = increment(1);
      }
    }

    // 5. Downloads (NUNCA incrementa geo/device/traffic)
    const isDownload = type === "download" || (typeof rawEvent === "string" && rawEvent.includes("download"));
    if (isDownload) {
      const actionsCount = Number(rawDownloadActions || 1);
      const filesCount = Number(rawFileCount || 1);
      
      updates.downloads = increment(actionsCount);
      updates.filesDownloaded = increment(filesCount);
      
      if (toolKey) {
        updates[`toolDownloads.${toolKey}`] = increment(actionsCount);
        updates[`toolFilesDownloaded.${toolKey}`] = increment(filesCount);
      }
    }

    // 6. Banners - Real Impressions (NUNCA incrementa geo/device/traffic)
    if (type === "banner_impression" && rawBannerId) {
      const bannerKey = String(rawBannerId).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      if (bannerKey) {
        updates[`bannerImpressions.${bannerKey}`] = increment(1);
        updates[`bannerLastImpression.${bannerKey}`] = new Date().toISOString();
        if (rawBannerTitle && typeof rawBannerTitle === "string") {
          updates[`bannerNames.${bannerKey}`] = rawBannerTitle.substring(0, 80);
        }
        if (rawPlacement && typeof rawPlacement === "string") {
          updates[`bannerPlacements.${bannerKey}`] = rawPlacement.substring(0, 40);
        }
      }
    }

    // 7. Banners - Real Clicks (NUNCA incrementa geo/device/traffic)
    if (type === "banner_click" && rawBannerId) {
      const bannerKey = String(rawBannerId).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      if (bannerKey) {
        updates[`bannerClicks.${bannerKey}`] = increment(1);
        updates[`bannerLastClick.${bannerKey}`] = new Date().toISOString();
        if (rawBannerTitle && typeof rawBannerTitle === "string") {
          updates[`bannerNames.${bannerKey}`] = rawBannerTitle.substring(0, 80);
        }
        if (rawPlacement && typeof rawPlacement === "string") {
          updates[`bannerPlacements.${bannerKey}`] = rawPlacement.substring(0, 40);
        }
      }
    }

    // 8. Custom Technical Events
    if (rawEvent && typeof rawEvent === "string") {
      const eventKey = rawEvent.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      if (eventKey) {
        updates[`events.${eventKey}`] = increment(1);
      }
    }

    await Promise.allSettled([
      setDoc(dailyDocRef, updates, { merge: true }),
      setDoc(totalDocRef, { ...updates, date: "total" }, { merge: true })
    ]);

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[TELEMETRY-EVENT] Error processing event:", err);
    return res.status(200).json({ success: false, error: err.message });
  }
}
