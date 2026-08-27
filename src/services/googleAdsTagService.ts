import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export type GoogleTagStatus = "NÃO CONFIGURADA" | "CONFIGURADA" | "CARREGADA" | "ERRO" | "DUPLICADA";

export interface GoogleAdsTagConfig {
  tagId: string; // e.g. "AW-359672935" or "GT-XXXXXX"
  snippet: string; // Complete snippet code
  enabled: boolean;
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface GoogleTagDiagnostics {
  status: GoogleTagStatus;
  statusLabel: string;
  configuredTagId: string | null;
  detectedTagId: string | null;
  scriptPresent: boolean;
  scriptCount: number;
  dataLayerActive: boolean;
  gtagFunctionActive: boolean;
  idMatches: boolean;
  instancesCount: number;
  applicationScope: string;
  loadingMode: string;
  details: string[];
  errorMessage?: string | null;
  lastChecked: string;
}

// Memory singleton to avoid multiple registrations
let currentSubscribedTagId: string | null = null;

/**
 * Validates a Google Tag ID format (e.g. AW-123456789, GT-XXXXXX, G-XXXXXX, GTM-XXXXXX).
 * Strictly rejects ca-pub-... (AdSense Publisher IDs).
 */
export function validateGoogleAdsTagId(input: string): {
  isValid: boolean;
  normalizedId: string;
  error?: string;
} {
  const clean = (input || "").trim();
  if (!clean) {
    return { isValid: false, normalizedId: "", error: "ID da Tag do Google não pode estar vazio." };
  }

  // Reject AdSense IDs immediately with explicit clarification
  if (clean.toLowerCase().startsWith("ca-pub-") || clean.toLowerCase().startsWith("pub-")) {
    return {
      isValid: false,
      normalizedId: clean,
      error: "Identificador inválido: 'ca-pub-' pertence ao Google AdSense (exibição de anúncios) e não pode ser usado como Tag do Google Ads."
    };
  }

  // Check valid Google Tag format (e.g. AW-123456789, GT-XXXXXX, G-XXXXXX, GTM-XXXXXX)
  const tagRegex = /^(AW|GT|G|GTM)-[A-Za-z0-9_-]+$/i;
  if (!tagRegex.test(clean)) {
    return {
      isValid: false,
      normalizedId: clean,
      error: "Formato de ID inválido. Use um ID oficial da Google Tag (ex: AW-123456789, GT-XXXXXX ou G-XXXXXX)."
    };
  }

  return {
    isValid: true,
    normalizedId: clean.toUpperCase()
  };
}

/**
 * Parses, securely validates, and extracts Google Tag ID and parameters from a full snippet code.
 * Rejects foreign domains, dangerous code, and AdSense codes.
 */
export function extractGoogleAdsTagIdFromSnippet(snippet: string): {
  isValid: boolean;
  extractedId?: string;
  normalizedId?: string;
  error?: string;
} {
  const clean = (snippet || "").trim();
  if (!clean) {
    return { isValid: false, error: "O código da Tag do Google está vazio." };
  }

  // 1. Strictly Reject AdSense Codes
  if (
    clean.includes("ca-pub-") ||
    clean.includes("pagead2.googlesyndication.com") ||
    clean.includes("adsbygoogle")
  ) {
    return {
      isValid: false,
      error: "Código rejeitado: Este código pertence ao Google AdSense (anúncios). A Tag do Google Ads deve ser obtida no Google Ads ou Google Tag Manager."
    };
  }

  // 2. Security Validation: Reject dangerous or unauthorized scripts
  const dangerousPatterns = [
    /<iframe/i,
    /<img/i,
    /<link/i,
    /eval\s*\(/i,
    /document\.write/i,
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(clean)) {
      return {
        isValid: false,
        error: "Código não reconhecido como uma Tag oficial do Google. Por motivos de segurança, código arbitrário ou não reconhecido é rejeitado."
      };
    }
  }

  // 3. Security Validation: Check external script URLs (must strictly be from googletagmanager.com or google-analytics.com)
  const srcMatches = clean.matchAll(/src\s*=\s*['"]([^'"]+)['"]/gi);
  for (const match of srcMatches) {
    const srcUrl = match[1] || "";
    try {
      const parsedUrl = new URL(srcUrl.startsWith("//") ? `https:${srcUrl}` : srcUrl);
      const allowedHosts = ["googletagmanager.com", "www.googletagmanager.com", "google-analytics.com", "www.google-analytics.com"];
      if (!allowedHosts.includes(parsedUrl.hostname.toLowerCase())) {
        return {
          isValid: false,
          error: `Código não reconhecido como uma Tag oficial do Google. O domínio '${parsedUrl.hostname}' não é permitido.`
        };
      }
    } catch {
      // If relative or invalid URL that isn't googletagmanager
      if (!srcUrl.includes("googletagmanager.com")) {
        return {
          isValid: false,
          error: "Código não reconhecido como uma Tag oficial do Google."
        };
      }
    }
  }

  // 4. Extract Google Tag ID using multiple official patterns
  // Pattern A: googletagmanager.com/gtag/js?id=(AW-...|GT-...|G-...|GTM-...)
  const urlMatch = clean.match(/googletagmanager\.com\/(?:gtag|gtm)\.js\?[^'"]*id=([A-Za-z0-9_-]+)/i);
  
  // Pattern B: gtag('config', 'AW-...') or gtag("config", "GT-...")
  const configMatch = clean.match(/gtag\(\s*['"]config['"]\s*,\s*['"]([A-Za-z0-9_-]+)['"]/i);

  // Pattern C: GTM container bootstrap 'GTM-XXXXXXX'
  const gtmMatch = clean.match(/['"](GTM-[A-Za-z0-9_-]+)['"]/i);

  const foundId = (urlMatch && urlMatch[1]) || (configMatch && configMatch[1]) || (gtmMatch && gtmMatch[1]);

  if (!foundId) {
    return {
      isValid: false,
      error: "Código não reconhecido como uma Tag oficial do Google. Não foi possível identificar um ID válido (ex: AW-XXXXXXXXX, GT-XXXXXX ou G-XXXXXX)."
    };
  }

  // Validate the extracted ID
  const validation = validateGoogleAdsTagId(foundId);
  if (!validation.isValid) {
    return {
      isValid: false,
      extractedId: foundId,
      error: validation.error || "ID extraído do snippet é inválido."
    };
  }

  return {
    isValid: true,
    extractedId: validation.normalizedId,
    normalizedId: validation.normalizedId
  };
}

/**
 * Generates the official, standard Google Ads Global Site Tag snippet
 */
export function generateOfficialGoogleAdsSnippet(tagId: string): string {
  const cleanId = tagId.trim().toUpperCase();
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${cleanId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${cleanId}');
</script>`;
}

/**
 * Injects and initializes the Google Tag globally into the DOM (<head>)
 * Guarantees a single instance, avoids duplicates, and sets up window.dataLayer / window.gtag.
 */
export function initializeGoogleAdsTag(tagId: string): boolean {
  if (typeof document === "undefined" || !document.head) return false;

  const validation = validateGoogleAdsTagId(tagId);
  if (!validation.isValid) {
    console.warn("[GOOGLE TAG] Cannot initialize invalid ID:", tagId, validation.error);
    return false;
  }

  const cleanId = validation.normalizedId;

  try {
    // 1. Ensure window.dataLayer is initialized
    (window as any).dataLayer = (window as any).dataLayer || [];

    // 2. Ensure window.gtag function is initialized
    if (typeof (window as any).gtag !== "function") {
      (window as any).gtag = function () {
        (window as any).dataLayer.push(arguments);
      };
      (window as any).gtag("js", new Date());
    }

    // 3. Track installed Google Tag IDs in a window Set to prevent duplicate config calls
    if (!(window as any).__google_tags_configured) {
      (window as any).__google_tags_configured = new Set<string>();
    }

    // 4. Check for existing GTM / gtag.js scripts in <head>
    const existingScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
    
    if (existingScripts.length === 0) {
      // Create and inject the single script tag into <head>
      const script = document.createElement("script");
      script.id = "google-tag-manager-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanId)}`;
      script.setAttribute("data-google-tag-id", cleanId);
      document.head.appendChild(script);
    } else {
      // Re-use existing script tag, update primary ID attribute if missing
      const firstScript = existingScripts[0] as HTMLScriptElement;
      if (!firstScript.getAttribute("data-google-tag-id")) {
        firstScript.setAttribute("data-google-tag-id", cleanId);
      }
      // If there are duplicate scripts created by accident elsewhere, clean them up safely
      for (let i = 1; i < existingScripts.length; i++) {
        try {
          existingScripts[i].remove();
        } catch (e) {}
      }
    }

    // 5. Configure the Google Tag if not already configured in this session
    if (!(window as any).__google_tags_configured.has(cleanId)) {
      (window as any).gtag("config", cleanId);
      (window as any).__google_tags_configured.add(cleanId);
      (window as any).__current_google_ads_tag_id = cleanId;
      console.log(`[GOOGLE TAG] Configured Google Tag: ${cleanId}`);
    }

    currentSubscribedTagId = cleanId;
    return true;
  } catch (err) {
    console.error("[GOOGLE TAG] Error during initialization:", err);
    return false;
  }
}

/**
 * Removes the Google Ads Tag from DOM and runtime
 */
export function removeGoogleAdsTag(): void {
  if (typeof document === "undefined") return;

  try {
    const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
    scripts.forEach((s) => {
      s.remove();
    });

    if ((window as any).__google_tags_configured) {
      (window as any).__google_tags_configured.clear();
    }
    (window as any).__current_google_ads_tag_id = null;
    currentSubscribedTagId = null;
    console.log("[GOOGLE TAG] Tag removed from runtime.");
  } catch (e) {
    console.warn("[GOOGLE TAG] Error removing tag:", e);
  }
}

/**
 * Run comprehensive technical diagnostics for the Google Tag in current browser session
 */
export function runGoogleTagDiagnostics(configuredTagId?: string | null): GoogleTagDiagnostics {
  const lastChecked = new Date().toLocaleTimeString("pt-BR");
  const details: string[] = [];

  if (typeof document === "undefined") {
    return {
      status: "NÃO CONFIGURADA",
      statusLabel: "Não configurada",
      configuredTagId: null,
      detectedTagId: null,
      scriptPresent: false,
      scriptCount: 0,
      dataLayerActive: false,
      gtagFunctionActive: false,
      idMatches: false,
      instancesCount: 0,
      applicationScope: "Todas as páginas públicas",
      loadingMode: "Global",
      details: ["Ambiente SSR ou DOM indisponível."],
      lastChecked
    };
  }

  // 1. Audit scripts in DOM
  const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
  const scriptCount = scripts.length;
  let detectedTagId: string | null = (window as any).__current_google_ads_tag_id || null;

  scripts.forEach((s) => {
    const src = s.getAttribute("src") || "";
    const match = src.match(/[?&]id=([A-Za-z0-9_-]+)/);
    if (match) detectedTagId = match[1];
    const dataId = s.getAttribute("data-google-tag-id");
    if (dataId) detectedTagId = dataId;
  });

  // 2. Audit window.dataLayer and window.gtag
  const dataLayerActive = Array.isArray((window as any).dataLayer);
  const gtagFunctionActive = typeof (window as any).gtag === "function";

  const targetId = configuredTagId ? configuredTagId.trim().toUpperCase() : null;

  // If no tag is configured
  if (!targetId) {
    return {
      status: "NÃO CONFIGURADA",
      statusLabel: "Não configurada",
      configuredTagId: null,
      detectedTagId,
      scriptPresent: scriptCount > 0,
      scriptCount,
      dataLayerActive,
      gtagFunctionActive,
      idMatches: false,
      instancesCount: scriptCount,
      applicationScope: "Todas as páginas públicas",
      loadingMode: "Global",
      details: ["Nenhum código ou ID salvo no banco de dados."],
      lastChecked
    };
  }

  // Check duplication
  if (scriptCount > 1) {
    details.push(`Atenção: Detectadas ${scriptCount} tags googletagmanager.com injetadas no <head>.`);
    return {
      status: "DUPLICADA",
      statusLabel: "Duplicada",
      configuredTagId: targetId,
      detectedTagId,
      scriptPresent: true,
      scriptCount,
      dataLayerActive,
      gtagFunctionActive,
      idMatches: detectedTagId === targetId,
      instancesCount: scriptCount,
      applicationScope: "Todas as páginas públicas",
      loadingMode: "Global",
      details,
      errorMessage: `Mais de uma instalação da Google Tag detectada (${scriptCount} instâncias no DOM).`,
      lastChecked
    };
  }

  // Check ID matching
  const idMatches = !!detectedTagId && detectedTagId.toUpperCase() === targetId.toUpperCase();

  // Check if loaded and active in the current application
  if ((scriptCount === 1 || (window as any).__google_tags_configured?.has(targetId)) && dataLayerActive && gtagFunctionActive && idMatches) {
    details.push("Script oficial presente no <head>.");
    details.push("Instância única sem duplicações.");
    details.push("window.dataLayer ativo.");
    details.push("função gtag() inicializada.");
    details.push(`ID validado e correspondente (${targetId}).`);

    return {
      status: "CARREGADA",
      statusLabel: "Carregada",
      configuredTagId: targetId,
      detectedTagId,
      scriptPresent: true,
      scriptCount: 1,
      dataLayerActive: true,
      gtagFunctionActive: true,
      idMatches: true,
      instancesCount: 1,
      applicationScope: "Todas as páginas públicas",
      loadingMode: "Global",
      details,
      lastChecked
    };
  }

  // If saved in Firestore but not yet initialized in DOM
  if (targetId && !detectedTagId && scriptCount === 0) {
    details.push(`Tag salva no Firestore com ID ${targetId}. Pronta para carregamento global.`);
    return {
      status: "CONFIGURADA",
      statusLabel: "Configurada",
      configuredTagId: targetId,
      detectedTagId: null,
      scriptPresent: false,
      scriptCount: 0,
      dataLayerActive,
      gtagFunctionActive,
      idMatches: false,
      instancesCount: 0,
      applicationScope: "Todas as páginas públicas",
      loadingMode: "Global",
      details,
      lastChecked
    };
  }

  // Fallback: Configuration Error
  details.push(
    `Falha na verificação: scriptPresent=${scriptCount > 0}, dataLayer=${dataLayerActive}, gtag=${gtagFunctionActive}, idMatches=${idMatches}`
  );

  return {
    status: "ERRO",
    statusLabel: "Erro",
    configuredTagId: targetId,
    detectedTagId,
    scriptPresent: scriptCount > 0,
    scriptCount,
    dataLayerActive,
    gtagFunctionActive,
    idMatches,
    instancesCount: scriptCount,
    applicationScope: "Todas as páginas públicas",
    loadingMode: "Global",
    details,
    errorMessage: !idMatches 
      ? `O ID detectado no navegador (${detectedTagId || "nenhum"}) não corresponde ao ID salvo (${targetId}).`
      : "A tag não pôde ser completamente carregada ou inicializada no navegador.",
    lastChecked
  };
}

/**
 * Fetch Google Ads Tag Config from Firestore
 */
export async function getGoogleAdsTagConfig(): Promise<GoogleAdsTagConfig | null> {
  try {
    const docRef = doc(db, "site_settings", "google_ads");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        tagId: data.tagId || "",
        snippet: data.snippet || "",
        enabled: data.enabled !== undefined ? !!data.enabled : true,
        notes: data.notes || "",
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy
      };
    }
    return null;
  } catch (err) {
    console.error("[GOOGLE TAG] Error fetching config from Firestore:", err);
    return null;
  }
}

/**
 * Save Google Ads Tag Config to Firestore
 */
export async function saveGoogleAdsTagConfig(config: {
  snippet: string;
  tagId?: string;
  enabled?: boolean;
  notes?: string;
  userEmail?: string;
}): Promise<{ success: boolean; extractedId?: string; error?: string }> {
  const cleanSnippet = (config.snippet || "").trim();
  if (!cleanSnippet) {
    return { success: false, error: "Por favor, cole o código completo da Tag do Google." };
  }

  // Parse and validate snippet
  const snippetAnalysis = extractGoogleAdsTagIdFromSnippet(cleanSnippet);
  if (!snippetAnalysis.isValid || !snippetAnalysis.extractedId) {
    return {
      success: false,
      error: snippetAnalysis.error || "Código não reconhecido como uma Tag oficial do Google."
    };
  }

  const cleanId = snippetAnalysis.extractedId;

  try {
    const docRef = doc(db, "site_settings", "google_ads");
    const payload = {
      tagId: cleanId,
      snippet: cleanSnippet,
      enabled: config.enabled !== undefined ? config.enabled : true,
      notes: config.notes || "",
      updatedAt: new Date().toISOString(),
      updatedBy: config.userEmail || "admin"
    };

    await setDoc(docRef, payload, { merge: true });

    // Immediately initialize in DOM if enabled
    if (payload.enabled) {
      initializeGoogleAdsTag(cleanId);
    } else {
      removeGoogleAdsTag();
    }

    return { success: true, extractedId: cleanId };
  } catch (err: any) {
    console.error("[GOOGLE TAG] Error saving config to Firestore:", err);
    return { success: false, error: err.message || "Falha ao salvar no Firestore." };
  }
}

/**
 * Delete / Remove Google Ads Tag Config from Firestore
 */
export async function deleteGoogleAdsTagConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, "site_settings", "google_ads");
    await deleteDoc(docRef);
    removeGoogleAdsTag();
    return { success: true };
  } catch (err: any) {
    console.error("[GOOGLE TAG] Error deleting config from Firestore:", err);
    return { success: false, error: err.message || "Falha ao remover do Firestore." };
  }
}

/**
 * Real-time subscription to Google Ads Tag config from Firestore
 */
export function subscribeGoogleAdsTagConfig(
  callback: (config: GoogleAdsTagConfig | null) => void
): () => void {
  try {
    const docRef = doc(db, "site_settings", "google_ads");
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const cfg: GoogleAdsTagConfig = {
            tagId: data.tagId || "",
            snippet: data.snippet || "",
            enabled: data.enabled !== undefined ? !!data.enabled : true,
            notes: data.notes || "",
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy
          };
          if (cfg.enabled && cfg.tagId) {
            initializeGoogleAdsTag(cfg.tagId);
          } else {
            removeGoogleAdsTag();
          }
          callback(cfg);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn("[GOOGLE TAG] Subscription warning:", err);
        callback(null);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("[GOOGLE TAG] Subscription failed:", err);
    return () => {};
  }
}

