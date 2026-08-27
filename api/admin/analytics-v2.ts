import fs from "fs";
import path from "path";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore/lite";

console.log("[ANALYTICS-V2-API] function loaded");

// Safe load firebase config
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {
  console.error("[ANALYTICS-V2-API] Failed to read firebase config:", err);
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

function extractMetricsMap(docData: any, prefix: string): Record<string, any> {
  const result: Record<string, any> = {};
  if (!docData || typeof docData !== "object") return result;

  if (docData[prefix] && typeof docData[prefix] === "object") {
    for (const [key, value] of Object.entries(docData[prefix])) {
      result[key] = value;
    }
  }

  const dottedPrefix = `${prefix}.`;
  for (const [key, value] of Object.entries(docData)) {
    if (key.startsWith(dottedPrefix)) {
      const cleanKey = key.substring(dottedPrefix.length);
      result[cleanKey] = value;
    }
  }

  return result;
}

function getToolReadableName(toolKey: string): string {
  const map: Record<string, string> = {
    audio_converter: "Conversor de Áudio Principal",
    video_to_audio: "Extrair Áudio de Vídeo",
    audio_cutter: "Cortar / Aparar Áudio",
    audio_joiner: "Juntar / Combinar Áudios",
    audio_compressor: "Comprimir / Reduzir Áudio",
    audio_metadata: "Editor de Tags ID3 / Metadados",
    audio_effects: "Efeitos & Equalizador",
    pdf_hub: "Central de PDF",
    image_hub: "Central de Imagens",
    document_hub: "Central de Documentos",
    home: "Página Inicial"
  };
  return map[toolKey] || toolKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function formatCountryName(cKey: string): string {
  if (!cKey || cKey === "Nao_identificada" || cKey === "Unknown") {
    return "Não identificada";
  }
  const clean = cKey.replace(/_/g, " ");
  return clean;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  if (res.setHeader) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Only GET is supported" });
  }

  try {
    const rawPeriod = String(req.query?.period || "7daysAgo").trim();
    const period = ["today", "7daysAgo", "30daysAgo", "total"].includes(rawPeriod) ? rawPeriod : "7daysAgo";

    const db = getDb();
    
    let summary = {
      pageViews: 0,
      activeUsers: 0,
      sessions: 0,
      conversions: 0,
      downloads: 0,
      filesDownloaded: 0,
      conversionRate: "0%"
    };

    let dailyTrend: Array<{ date: string; users: number; views: number; sessions: number; conversions: number; downloads: number }> = [];
    let topPagesMap: Record<string, number> = {};
    let toolsRankingMap: Record<string, { views: number; conversions: number; downloads: number; filesDownloaded: number }> = {};
    let bannerStatsMap: Record<string, { impressions: number; clicks: number; name?: string; placement?: string; lastImpressionAt?: string; lastClickAt?: string }> = {};
    let trafficSourcesMap: Record<string, number> = {};
    let utmsMap: Record<string, number> = {};
    let devicesMap: Record<string, number> = {};
    let osMap: Record<string, number> = {};
    let browsersMap: Record<string, number> = {};
    let countriesMap: Record<string, number> = {};
    let regionsMap: Record<string, number> = {};
    let citiesMap: Record<string, number> = {};
    let eventsMap: Record<string, number> = {};

    // 1. Fetch site_metrics docs
    const metricsColl = collection(db, "site_metrics");
    const snap = await getDocs(metricsColl);
    
    const allDailyDocs: Array<{ id: string; date: string; data: any }> = [];

    snap.forEach((d) => {
      if (d.id.startsWith("daily_")) {
        const dateStr = d.id.replace("daily_", "");
        allDailyDocs.push({ id: d.id, date: dateStr, data: d.data() });
      }
    });

    allDailyDocs.sort((a, b) => a.date.localeCompare(b.date));

    let daysBack = 7;
    if (period === "today") daysBack = 0;
    else if (period === "7daysAgo") daysBack = 7;
    else if (period === "30daysAgo") daysBack = 30;
    else if (period === "total") daysBack = 9999;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffStr = cutoffDate.toISOString().substring(0, 10);

    const filteredDocs = period === "total" 
      ? allDailyDocs 
      : allDailyDocs.filter(d => d.date >= cutoffStr);

    for (const item of filteredDocs) {
      const d = item.data;
      const pViews = Number(d.pageViews || 0);
      const pConv = Number(d.conversions || 0);
      const pDown = Number(d.downloads || 0);
      const pFiles = Number(d.filesDownloaded || pDown || 0);
      const pSess = Number(d.sessions || 0);

      summary.pageViews += pViews;
      summary.conversions += pConv;
      summary.downloads += pDown;
      summary.filesDownloaded += pFiles;
      summary.sessions += pSess;

      const formattedDate = item.date.length === 10 ? `${item.date.substring(8, 10)}/${item.date.substring(5, 7)}` : item.date;
      dailyTrend.push({
        date: formattedDate,
        users: Math.max(pViews > 0 ? 1 : 0, Math.round(pViews * 0.75)),
        views: pViews,
        sessions: pSess > 0 ? pSess : Math.max(pViews > 0 ? 1 : 0, Math.round(pViews * 0.85)),
        conversions: pConv,
        downloads: pDown
      });

      // Routes / Pages
      const docRoutes = extractMetricsMap(d, "routes");
      for (const [rKey, count] of Object.entries(docRoutes)) {
        let cleanPath = rKey.replace(/_/g, "/");
        if (cleanPath === "/home" || cleanPath === "home") cleanPath = "/";
        const actualPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
        topPagesMap[actualPath] = (topPagesMap[actualPath] || 0) + Number(count || 0);
      }

      // Tools Usage
      const docTools = extractMetricsMap(d, "tools");
      for (const [tKey, count] of Object.entries(docTools)) {
        if (!toolsRankingMap[tKey]) {
          toolsRankingMap[tKey] = { views: 0, conversions: 0, downloads: 0, filesDownloaded: 0 };
        }
        toolsRankingMap[tKey].views += Number(count || 0);
      }

      const docToolConversions = extractMetricsMap(d, "toolConversions");
      for (const [tKey, count] of Object.entries(docToolConversions)) {
        if (!toolsRankingMap[tKey]) {
          toolsRankingMap[tKey] = { views: 0, conversions: 0, downloads: 0, filesDownloaded: 0 };
        }
        toolsRankingMap[tKey].conversions += Number(count || 0);
      }

      const docToolDownloads = extractMetricsMap(d, "toolDownloads");
      for (const [tKey, count] of Object.entries(docToolDownloads)) {
        if (!toolsRankingMap[tKey]) {
          toolsRankingMap[tKey] = { views: 0, conversions: 0, downloads: 0, filesDownloaded: 0 };
        }
        toolsRankingMap[tKey].downloads += Number(count || 0);
      }

      const docToolFiles = extractMetricsMap(d, "toolFilesDownloaded");
      for (const [tKey, count] of Object.entries(docToolFiles)) {
        if (!toolsRankingMap[tKey]) {
          toolsRankingMap[tKey] = { views: 0, conversions: 0, downloads: 0, filesDownloaded: 0 };
        }
        toolsRankingMap[tKey].filesDownloaded += Number(count || 0);
      }

      // Banners Stats
      const docBannerImpressions = extractMetricsMap(d, "bannerImpressions");
      for (const [bKey, count] of Object.entries(docBannerImpressions)) {
        if (!bannerStatsMap[bKey]) {
          bannerStatsMap[bKey] = { impressions: 0, clicks: 0 };
        }
        bannerStatsMap[bKey].impressions += Number(count || 0);
      }

      const docBannerClicks = extractMetricsMap(d, "bannerClicks");
      for (const [bKey, count] of Object.entries(docBannerClicks)) {
        if (!bannerStatsMap[bKey]) {
          bannerStatsMap[bKey] = { impressions: 0, clicks: 0 };
        }
        bannerStatsMap[bKey].clicks += Number(count || 0);
      }

      const docBannerNames = extractMetricsMap(d, "bannerNames");
      for (const [bKey, name] of Object.entries(docBannerNames)) {
        if (!bannerStatsMap[bKey]) {
          bannerStatsMap[bKey] = { impressions: 0, clicks: 0 };
        }
        if (name) bannerStatsMap[bKey].name = String(name);
      }

      const docBannerPlacements = extractMetricsMap(d, "bannerPlacements");
      for (const [bKey, placement] of Object.entries(docBannerPlacements)) {
        if (!bannerStatsMap[bKey]) {
          bannerStatsMap[bKey] = { impressions: 0, clicks: 0 };
        }
        if (placement) bannerStatsMap[bKey].placement = String(placement);
      }

      const docBannerLastImpression = extractMetricsMap(d, "bannerLastImpression");
      for (const [bKey, ts] of Object.entries(docBannerLastImpression)) {
        if (bannerStatsMap[bKey] && ts) {
          if (!bannerStatsMap[bKey].lastImpressionAt || String(ts) > bannerStatsMap[bKey].lastImpressionAt!) {
            bannerStatsMap[bKey].lastImpressionAt = String(ts);
          }
        }
      }

      const docBannerLastClick = extractMetricsMap(d, "bannerLastClick");
      for (const [bKey, ts] of Object.entries(docBannerLastClick)) {
        if (bannerStatsMap[bKey] && ts) {
          if (!bannerStatsMap[bKey].lastClickAt || String(ts) > bannerStatsMap[bKey].lastClickAt!) {
            bannerStatsMap[bKey].lastClickAt = String(ts);
          }
        }
      }

      // Traffic sources & UTMs
      const docTrafficSources = extractMetricsMap(d, "trafficSources");
      for (const [sKey, count] of Object.entries(docTrafficSources)) {
        const cleanSource = sKey.replace(/_/g, " ");
        trafficSourcesMap[cleanSource] = (trafficSourcesMap[cleanSource] || 0) + Number(count || 0);
      }

      const docUtms = extractMetricsMap(d, "utms");
      for (const [uKey, count] of Object.entries(docUtms)) {
        const cleanUtm = uKey.replace(/_/g, " ");
        utmsMap[cleanUtm] = (utmsMap[cleanUtm] || 0) + Number(count || 0);
      }

      // Devices, OS, Browsers
      const docDevices = extractMetricsMap(d, "devices");
      for (const [devKey, count] of Object.entries(docDevices)) {
        devicesMap[devKey] = (devicesMap[devKey] || 0) + Number(count || 0);
      }

      const docOs = extractMetricsMap(d, "os");
      for (const [osKey, count] of Object.entries(docOs)) {
        osMap[osKey] = (osMap[osKey] || 0) + Number(count || 0);
      }

      const docBrowsers = extractMetricsMap(d, "browsers");
      for (const [brKey, count] of Object.entries(docBrowsers)) {
        browsersMap[brKey] = (browsersMap[brKey] || 0) + Number(count || 0);
      }

      // Locations
      const docCountries = extractMetricsMap(d, "countries");
      for (const [cKey, count] of Object.entries(docCountries)) {
        const countryFormatted = formatCountryName(cKey);
        countriesMap[countryFormatted] = (countriesMap[countryFormatted] || 0) + Number(count || 0);
      }

      const docRegions = extractMetricsMap(d, "regions");
      for (const [rKey, count] of Object.entries(docRegions)) {
        regionsMap[rKey] = (regionsMap[rKey] || 0) + Number(count || 0);
      }

      const docCities = extractMetricsMap(d, "cities");
      for (const [ctKey, count] of Object.entries(docCities)) {
        citiesMap[ctKey] = (citiesMap[ctKey] || 0) + Number(count || 0);
      }

      // Custom Events
      const docEvents = extractMetricsMap(d, "events");
      for (const [eKey, count] of Object.entries(docEvents)) {
        eventsMap[eKey] = (eventsMap[eKey] || 0) + Number(count || 0);
      }
    }

    summary.activeUsers = Math.max(summary.pageViews > 0 ? 1 : 0, Math.round(summary.pageViews * 0.75));
    if (summary.sessions === 0 && summary.pageViews > 0) {
      summary.sessions = Math.max(summary.activeUsers, Math.round(summary.pageViews * 0.85));
    }
    if (summary.pageViews > 0) {
      summary.conversionRate = ((summary.conversions / summary.pageViews) * 100).toFixed(1) + "%";
    }

    // 2. Fetch existing registered banners to exclude deleted/orphan banners
    const registeredBanners: Array<{
      id: string;
      name: string;
      status: "active" | "inactive";
      placement: string;
      imageUrl?: string;
      linkUrl?: string;
      order?: number;
    }> = [];

    try {
      const hbSnap = await getDocs(collection(db, "home_banners"));
      hbSnap.forEach(d => {
        const bData = d.data();
        registeredBanners.push({
          id: d.id,
          name: bData.name || bData.title || "Banner Carrossel",
          status: bData.active !== false ? "active" : "inactive",
          placement: "Carrossel Principal (Home)",
          imageUrl: bData.imageUrl || "",
          linkUrl: bData.linkUrl || bData.destinationUrl || "",
          order: Number(bData.order || 0)
        });
      });
    } catch (e) {
      console.warn("[ANALYTICS-V2-API] Error fetching registered banners:", e);
    }

    // Combine ONLY existing registered banners with real metrics
    const bannersList: Array<{
      id: string;
      name: string;
      status: "active" | "inactive";
      placement: string;
      imageUrl?: string;
      linkUrl?: string;
      impressions: number;
      clicks: number;
      ctr: number;
      lastImpressionAt?: string;
      lastClickAt?: string;
    }> = [];

    for (const reg of registeredBanners) {
      const cleanId = reg.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const stats = bannerStatsMap[cleanId] || bannerStatsMap[reg.id] || { impressions: 0, clicks: 0 };
      const impressions = Number(stats.impressions || 0);
      const clicks = Number(stats.clicks || 0);
      const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

      bannersList.push({
        id: reg.id,
        name: reg.name,
        status: reg.status,
        placement: reg.placement,
        imageUrl: reg.imageUrl,
        linkUrl: reg.linkUrl,
        impressions,
        clicks,
        ctr,
        lastImpressionAt: stats.lastImpressionAt,
        lastClickAt: stats.lastClickAt
      });
    }

    bannersList.sort((a, b) => {
      if (b.impressions !== a.impressions) {
        return b.impressions - a.impressions;
      }
      return b.clicks - a.clicks;
    });

    const topPages = Object.entries(topPagesMap)
      .map(([path, views]) => ({ path, views, users: Math.max(views > 0 ? 1 : 0, Math.round(views * 0.75)) }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const toolsRanking = Object.entries(toolsRankingMap)
      .map(([tool, stats]) => {
        const totalOps = stats.views + stats.conversions + stats.downloads;
        const rate = stats.views > 0 ? ((stats.conversions / stats.views) * 100).toFixed(1) + "%" : "0%";
        return {
          tool,
          toolName: getToolReadableName(tool),
          views: stats.views,
          conversions: stats.conversions,
          downloads: stats.downloads,
          filesDownloaded: stats.filesDownloaded || stats.downloads,
          conversionRate: rate,
          totalOps
        };
      })
      .sort((a, b) => b.totalOps - a.totalOps);

    const totalTrafficSessions = Object.values(trafficSourcesMap).reduce((acc, v) => acc + v, 0) || summary.sessions || 1;
    const trafficSources = Object.entries(trafficSourcesMap)
      .map(([source, count]) => ({
        source,
        medium: source.includes("Orgânica") ? "organic" : source.includes("Campanha") ? "cpc / ref" : "direct",
        users: Math.max(count > 0 ? 1 : 0, Math.round(count * 0.75)),
        sessions: count,
        percentage: `${Math.min(100, Math.round((count / totalTrafficSessions) * 100))}%`
      }))
      .sort((a, b) => b.sessions - a.sessions);

    const utms = Object.entries(utmsMap)
      .map(([campaign, count]) => ({ campaign, count }))
      .sort((a, b) => b.count - a.count);

    const totalDeviceCounts = Object.values(devicesMap).reduce((acc, v) => acc + v, 0) || summary.pageViews || 1;
    const devices = Object.entries(devicesMap)
      .map(([category, count]) => ({
        category,
        count,
        percentage: `${Math.round((count / totalDeviceCounts) * 100)}%`
      }))
      .sort((a, b) => b.count - a.count);

    const totalBrowserCounts = Object.values(browsersMap).reduce((acc, v) => acc + v, 0) || summary.pageViews || 1;
    const browsers = Object.entries(browsersMap)
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: `${Math.round((count / totalBrowserCounts) * 100)}%`
      }))
      .sort((a, b) => b.count - a.count);

    const totalOsCounts = Object.values(osMap).reduce((acc, v) => acc + v, 0) || summary.pageViews || 1;
    const operatingSystems = Object.entries(osMap)
      .map(([os, count]) => ({
        os,
        count,
        percentage: `${Math.round((count / totalOsCounts) * 100)}%`
      }))
      .sort((a, b) => b.count - a.count);

    const totalCountryCounts = Object.values(countriesMap).reduce((acc, v) => acc + v, 0) || 1;
    const countriesList = Object.entries(countriesMap)
      .map(([country, count]) => ({
        country,
        count,
        percentage: `${Math.round((count / totalCountryCounts) * 100)}%`
      }))
      .sort((a, b) => b.count - a.count);

    const regionsList = Object.entries(regionsMap)
      .map(([regKey, count]) => {
        const parts = regKey.split("_");
        const country = parts[0] || "BR";
        const region = parts.slice(1).join(" ") || regKey;
        return { region, country, count };
      })
      .sort((a, b) => b.count - a.count);

    const citiesList = Object.entries(citiesMap)
      .map(([cityKey, count]) => {
        const parts = cityKey.split("_");
        const country = parts[0] || "BR";
        const city = parts.slice(1).join(" ") || cityKey;
        return { city, country, count };
      })
      .sort((a, b) => b.count - a.count);

    const events = Object.entries(eventsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      period,
      summary,
      dailyTrend,
      toolsRanking,
      banners: bannersList,
      trafficSources,
      utms,
      devices,
      browsers,
      operatingSystems,
      locations: {
        countries: countriesList,
        regions: regionsList,
        cities: citiesList,
        hasRegionData: regionsList.length > 0,
        hasCityData: citiesList.length > 0
      },
      topPages,
      events,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[ANALYTICS-V2-API] Error fetching analytics:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
}
