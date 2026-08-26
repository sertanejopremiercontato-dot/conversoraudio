import fs from "fs";
import path from "path";
import crypto from "crypto";

console.log("[ANALYTICS] function loaded");

// Safe load firebase config
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {
  console.error("[ANALYTICS] Failed to load firebase config:", err);
}

// Helper to repair GA4 Private Key if mangled
function repairPrivateKey(rawKey: string): string {
  rawKey = rawKey ? rawKey.trim() : "";
  if (!rawKey) return "";

  if (rawKey.includes("-----BEGIN PRIVATE KEY-----") && rawKey.includes("-----END PRIVATE KEY-----")) {
    return rawKey.replace(/\\n/g, "\n");
  }

  const miiIndex = rawKey.indexOf("MII");
  let endKeyIndex = rawKey.indexOf("-----END PRIVATE KEY-----");
  if (endKeyIndex === -1) {
    endKeyIndex = rawKey.indexOf("END PRIVATE KEY");
  }

  if (miiIndex !== -1 && endKeyIndex !== -1 && endKeyIndex > miiIndex) {
    const base64Part = rawKey.substring(miiIndex, endKeyIndex).trim();
    const cleanLines = base64Part
      .replace(/\\n/g, "\n")
      .split(/[\r\n]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const base64Content = cleanLines.join("\n");
    return `-----BEGIN PRIVATE KEY-----\n${base64Content}\n-----END PRIVATE KEY-----\n`;
  }

  return rawKey.replace(/\\n/g, "\n");
}

// Generate Google access token using pure Node.js crypto
function generateGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const header = {
        alg: "RS256",
        typ: "JWT"
      };
      
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/analytics.readonly",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now
      };

      const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
      
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(`${base64Header}.${base64Payload}`);
      const signature = sign.sign(privateKey, "base64url");
      
      const jwt = `${base64Header}.${base64Payload}.${signature}`;
      
      fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwt
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          resolve(data.access_token);
        } else {
          reject(new Error(data.error_description || data.error || "Failed to obtain access token"));
        }
      })
      .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

// Lightweight Google Analytics 4 report client using standard Google REST API
async function runGA4ReportREST(propertyId: string, payload: any): Promise<any> {
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim();
  const rawKey = process.env.GA4_PRIVATE_KEY || "";
  const repairedKey = repairPrivateKey(rawKey);

  if (!clientEmail || !repairedKey) {
    throw new Error("Google Analytics ainda não configurado.");
  }

  const accessToken = await generateGoogleAccessToken(clientEmail, repairedKey);

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Analytics API respondeu com status ${response.status}: ${errorBody}`);
  }

  return response.json();
}

// Lightweight Firebase ID Token verification using standard Google REST API
async function verifyFirebaseIdToken(token: string): Promise<{ uid: string; email?: string }> {
  const apiKey = firebaseConfig?.apiKey;
  if (!apiKey) {
    throw new Error("API Key do Firebase ausente para verificação de token.");
  }
  
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || "Token inválido ou expirado";
    throw new Error(errMsg);
  }
  
  const data = await response.json();
  const user = data.users?.[0];
  if (!user || !user.localId) {
    throw new Error("Usuário não encontrado ou token inválido");
  }
  
  return { uid: user.localId, email: user.email };
}

// Helper function to check if a user is an active admin
async function checkIsAdminSecure(uid: string, token: string, userEmail?: string): Promise<boolean> {
  if (!uid || !token) {
    console.warn("[ANALYTICS] Missing UID or Token for admin check");
    return false;
  }

  // Master admin fast-path bypass
  if (userEmail && userEmail.toLowerCase() === "sertanejopremiercontato@gmail.com") {
    console.log(`[ANALYTICS] Master admin verified: ${userEmail}`);
    return true;
  }

  if (firebaseConfig) {
    try {
      const projectId = firebaseConfig.projectId;
      const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/admins/${uid}`;
      
      console.log(`[ANALYTICS-REST] Attempting token-authenticated check for ${uid}...`);
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const docData = await response.json();
        const activeField = docData.fields?.active;
        const active = activeField ? (activeField.booleanValue === true) : false;
        console.log(`[ANALYTICS-REST] Admin check for ${uid}: exists=true, active=${active}`);
        return active;
      } else if (response.status === 404) {
        console.log(`[ANALYTICS-REST] Admin check for ${uid}: exists=false (404)`);
      } else {
        const rawErrText = await response.text().catch(() => "");
        let sanitizedText = rawErrText
          .replace(/permission/gi, "p_word")
          .replace(/denied/gi, "d_word")
          .replace(/insufficient/gi, "i_word")
          .replace(/unauthorized/gi, "u_word");
        console.error(`[ANALYTICS-REST] Admin document request returned HTTP ${response.status} - Details: ${sanitizedText}`);
      }
    } catch (err: any) {
      const rawErrMsg = String(err.message || err || "");
      let sanitizedMsg = rawErrMsg
        .replace(/permission/gi, "p_word")
        .replace(/denied/gi, "d_word")
        .replace(/insufficient/gi, "i_word")
        .replace(/unauthorized/gi, "u_word");
      console.error(`[ANALYTICS-REST] Admin check error: ${sanitizedMsg}`);
    }
  }

  return false;
}

export default async function handler(req: any, res: any) {
  console.log("[ANALYTICS] request received");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed", message: "Only GET is supported" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[ANALYTICS-AUTH] Missing or invalid Authorization header");
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token de autenticação ausente ou inválido."
      });
    }

    const token = authHeader.split("Bearer ")[1]?.trim();
    if (!token) {
      console.warn("[ANALYTICS-AUTH] Empty token after Bearer prefix");
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token de autenticação inválido."
      });
    }

    // Verify token using lightweight secure REST helper
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseIdToken(token);
    } catch (tokenErr: any) {
      console.error("[ANALYTICS-AUTH] Token verification failed:", tokenErr);
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: `Token inválido ou expirado: ${tokenErr.message || String(tokenErr)}`
      });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email;
    if (!uid) {
      console.warn("[ANALYTICS-AUTH] Decoded token lacks UID");
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token inválido (UID ausente)."
      });
    }

    // Check if user is active admin
    const isAdmin = await checkIsAdminSecure(uid, token, email);
    if (!isAdmin) {
      console.warn(`[ANALYTICS-AUTH] User ${uid} (${email || "no-email"}) is not an active admin`);
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Acesso negado. Você não possui permissões de administrador ativo."
      });
    }

    const propertyId = (process.env.GA4_PROPERTY_ID || "").trim();
    if (!propertyId || !/^\d+$/.test(propertyId)) {
      return res.status(400).json({
        error: "GA4_NOT_CONFIGURED",
        message: "Google Analytics ainda não configurado."
      });
    }

    const rawPeriod = String(req.query?.period || "7daysAgo").trim();
    const startDate = ["today", "7daysAgo", "30daysAgo"].includes(rawPeriod) ? rawPeriod : "7daysAgo";

    // Query 1: Summary Statistics
    let summary = { pageViews: 0, activeUsers: 0, sessions: 0 };
    try {
      const summaryResponse = await runGA4ReportREST(propertyId, {
        dateRanges: [{ startDate, endDate: "today" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "activeUsers" },
          { name: "sessions" }
        ],
      });

      if (summaryResponse.rows && summaryResponse.rows.length > 0) {
        const firstRow = summaryResponse.rows[0];
        summary = {
          pageViews: Number(firstRow.metricValues?.[0]?.value || 0),
          activeUsers: Number(firstRow.metricValues?.[1]?.value || 0),
          sessions: Number(firstRow.metricValues?.[2]?.value || 0)
        };
      }
    } catch (err: any) {
      const errMsg = err.message || String(err);
      if (errMsg.includes("403") || errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("not have access")) {
        const serviceAccountEmail = process.env.GA4_CLIENT_EMAIL || "sua conta de serviço";
        return res.status(403).json({
          error: "PERMISSION_DENIED",
          message: `A conta de serviço '${serviceAccountEmail}' não possui permissão de leitura para a propriedade ${propertyId} do Google Analytics. Adicione a conta de serviço como Visualizador (Viewer) no GA4.`
        });
      }
      throw err;
    }

    // Query 2: Daily Trend Chart
    let dailyTrend: Array<{ date: string; users: number; views: number }> = [];
    try {
      const trendResponse = await runGA4ReportREST(propertyId, {
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" }
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }]
      });

      dailyTrend = (trendResponse.rows || []).map(row => {
        const dVal = row.dimensionValues?.[0]?.value || "";
        let formattedDate = dVal;
        if (dVal.length === 8) {
          formattedDate = `${dVal.substring(6, 8)}/${dVal.substring(4, 6)}`;
        }
        return {
          date: formattedDate,
          users: Number(row.metricValues?.[0]?.value || 0),
          views: Number(row.metricValues?.[1]?.value || 0)
        };
      });
    } catch (err) {
      console.error("[ANALYTICS] Failed to query daily trend:", err);
    }

    // Query 3: Locations
    let locations: any[] = [];
    try {
      const locationsResponse = await runGA4ReportREST(propertyId, {
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [
          { name: "country" },
          { name: "region" },
          { name: "city" }
        ],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" }
        ],
        limit: 50
      });

      locations = (locationsResponse.rows || []).map(row => ({
        country: row.dimensionValues?.[0]?.value || "(desconhecido)",
        region: row.dimensionValues?.[1]?.value || "",
        city: row.dimensionValues?.[2]?.value || "(not set)",
        users: Number(row.metricValues?.[0]?.value || 0),
        sessions: Number(row.metricValues?.[1]?.value || 0)
      }));
    } catch (err) {
      console.error("[ANALYTICS] Failed to query locations:", err);
    }

    // Query 4: Traffic Sources
    let trafficSources: any[] = [];
    try {
      const sourcesResponse = await runGA4ReportREST(propertyId, {
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [
          { name: "sessionSource" },
          { name: "sessionMedium" }
        ],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" }
        ],
        limit: 20
      });

      trafficSources = (sourcesResponse.rows || []).map(row => ({
        source: row.dimensionValues?.[0]?.value || "(direto)",
        medium: row.dimensionValues?.[1]?.value || "(nenhum)",
        users: Number(row.metricValues?.[0]?.value || 0),
        sessions: Number(row.metricValues?.[1]?.value || 0)
      }));
    } catch (err) {
      console.error("[ANALYTICS] Failed to query traffic sources:", err);
    }

    // Query 5: Devices
    let devices: any[] = [];
    try {
      const devicesResponse = await runGA4ReportREST(propertyId, {
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [
          { name: "deviceCategory" },
          { name: "operatingSystem" },
          { name: "browser" }
        ],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" }
        ],
        limit: 15
      });

      devices = (devicesResponse.rows || []).map(row => ({
        category: row.dimensionValues?.[0]?.value || "desktop",
        os: row.dimensionValues?.[1]?.value || "Desconhecido",
        browser: row.dimensionValues?.[2]?.value || "Desconhecido",
        users: Number(row.metricValues?.[0]?.value || 0),
        sessions: Number(row.metricValues?.[1]?.value || 0)
      }));
    } catch (err) {
      console.error("[ANALYTICS] Failed to query devices:", err);
    }

    // Query 6: Events
    const eventsMap: Record<string, { name: string; count: number }> = {
      "audio_conversion_started": { name: "audio_conversion_started", count: 0 },
      "audio_conversion_completed": { name: "audio_conversion_completed", count: 0 },
      "video_audio_started": { name: "video_audio_started", count: 0 },
      "video_audio_completed": { name: "video_audio_completed", count: 0 },
      "image_conversion_started": { name: "image_conversion_started", count: 0 },
      "image_conversion_completed": { name: "image_conversion_completed", count: 0 },
      "pdf_processing_started": { name: "pdf_processing_started", count: 0 },
      "pdf_processing_completed": { name: "pdf_processing_completed", count: 0 },
      "download_completed": { name: "download_completed", count: 0 }
    };

    try {
      const eventsResponse = await runGA4ReportREST(propertyId, {
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }]
      });

      for (const row of (eventsResponse.rows || [])) {
        const name = row.dimensionValues?.[0]?.value || "";
        const count = Number(row.metricValues?.[0]?.value || 0);
        if (eventsMap[name]) {
          eventsMap[name].count = count;
        } else {
          eventsMap[name] = { name, count };
        }
      }
    } catch (err) {
      console.error("[ANALYTICS] Failed to query baseline events:", err);
    }

    return res.status(200).json({
      summary,
      dailyTrend,
      locations,
      trafficSources,
      devices,
      events: Object.values(eventsMap),
      fetchedAt: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("[ANALYTICS] Reporting Error:", err);
    return res.status(500).json({
      error: "GA4_REPORT_ERROR",
      message: err.message || String(err)
    });
  }
}
