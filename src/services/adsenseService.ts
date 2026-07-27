import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export const PUBLISHER_ID = "ca-pub-8846628306821055";
export const MASKED_PUBLISHER_ID = "ca-pub-8846******21055";
export const OFFICIAL_DOMAIN = "https://multiconverte.com.br";
export const EXPECTED_ADS_TXT_URL = "https://multiconverte.com.br/ads.txt";
export const OFFICIAL_ADS_TXT_LINE = "google.com, pub-8846628306821055, DIRECT, f08c47fec0942fa0";

export type AdSenseReviewStatus =
  | "Não configurado"
  | "Código instalado"
  | "Aguardando verificação"
  | "Aguardando revisão"
  | "Aprovado"
  | "Reprovado"
  | "Verificação manual necessária";

export interface AdSenseConfig {
  adsenseEnabled: boolean;
  publisherId: string;
  domain: string;
  mode: string;
  reviewStatus: AdSenseReviewStatus;
  notes: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_ADSENSE_CONFIG: AdSenseConfig = {
  adsenseEnabled: true,
  publisherId: PUBLISHER_ID,
  domain: OFFICIAL_DOMAIN,
  mode: "Anúncios automáticos",
  reviewStatus: "Aguardando verificação",
  notes: "Snippet do Google AdSense gerenciado e ativado para monetização.",
};

/**
 * Real-time subscription to AdSense monetization configuration in Firestore
 */
export function subscribeAdSenseConfig(callback: (config: AdSenseConfig) => void): () => void {
  const docRef = doc(db, "site_settings", "adsense");
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const config: AdSenseConfig = {
          adsenseEnabled: typeof data.adsenseEnabled === "boolean" ? data.adsenseEnabled : true,
          publisherId: PUBLISHER_ID, // Read-only enforce
          domain: OFFICIAL_DOMAIN,
          mode: data.mode || "Anúncios automáticos",
          reviewStatus: (data.reviewStatus as AdSenseReviewStatus) || "Aguardando verificação",
          notes: data.notes || "",
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || "",
          updatedBy: data.updatedBy || "",
        };
        callback(config);
      } else {
        callback(DEFAULT_ADSENSE_CONFIG);
      }
    },
    (err) => {
      console.warn("[ADSENSE SERVICE] Firestore snapshot listener warning:", err);
      callback(DEFAULT_ADSENSE_CONFIG);
    }
  );
}

/**
 * Fetch AdSense configuration from Firestore
 */
export async function getAdSenseConfig(): Promise<AdSenseConfig> {
  try {
    const docRef = doc(db, "site_settings", "adsense");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        adsenseEnabled: typeof data.adsenseEnabled === "boolean" ? data.adsenseEnabled : true,
        publisherId: PUBLISHER_ID,
        domain: OFFICIAL_DOMAIN,
        mode: data.mode || "Anúncios automáticos",
        reviewStatus: (data.reviewStatus as AdSenseReviewStatus) || "Aguardando verificação",
        notes: data.notes || "",
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || "",
        updatedBy: data.updatedBy || "",
      };
    }
  } catch (err) {
    console.warn("[ADSENSE SERVICE] Error loading settings from Firestore:", err);
  }
  return DEFAULT_ADSENSE_CONFIG;
}

/**
 * Save updated AdSense configuration to Firestore
 */
export async function saveAdSenseConfig(config: Partial<AdSenseConfig>, userId?: string): Promise<void> {
  try {
    const docRef = doc(db, "site_settings", "adsense");
    const payload = {
      adsenseEnabled: config.adsenseEnabled ?? true,
      publisherId: PUBLISHER_ID,
      domain: OFFICIAL_DOMAIN,
      mode: config.mode || "Anúncios automáticos",
      reviewStatus: config.reviewStatus || "Aguardando verificação",
      notes: config.notes || "",
      updatedAt: serverTimestamp(),
      updatedBy: userId || "",
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err: any) {
    console.error("[ADSENSE SERVICE] Save error:", err);
    handleFirestoreError(err, OperationType.WRITE, "site_settings/adsense");
  }
}

/**
 * Dynamic initialization of the Google AdSense script tag.
 * Only loads on public pages when adsenseEnabled === true.
 * Strictly ignores administrative routes (/admin, /admin-login) and prevents duplication.
 */
export function initializeAdSenseScript(enabled: boolean): void {
  if (typeof window === "undefined" || !document || !document.head) {
    return;
  }

  const path = window.location.pathname.toLowerCase();
  const isAdminRoute = path === "/admin" || path === "/admin-login" || path.startsWith("/admin/");

  // Locate existing AdSense script if any
  const existingScript = document.querySelector('script[src*="adsbygoogle.js"]');

  // If on admin route or disabled -> remove script if present & return
  if (isAdminRoute || !enabled) {
    if (existingScript) {
      try {
        existingScript.remove();
        console.log("[ADSENSE SERVICE] AdSense script removed (admin route or disabled).");
      } catch (e) {
        // Silent fail
      }
    }
    return;
  }

  // If enabled and on public route -> ensure script is injected once
  if (!existingScript) {
    try {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-adsense-script", "true");
      document.head.appendChild(script);
      console.log(`[ADSENSE SERVICE] AdSense script injected successfully for client ${PUBLISHER_ID}`);
    } catch (err) {
      console.warn("[ADSENSE SERVICE] Script injection warning:", err);
    }
  }
}

/**
 * Check local ads.txt file status
 */
export async function checkLocalAdsTxt(): Promise<{
  found: boolean;
  validLine: boolean;
  content: string;
}> {
  try {
    const res = await fetch("/ads.txt");
    if (res.ok) {
      const text = await res.text();
      const hasLine = text.includes("pub-8846628306821055") || text.includes(PUBLISHER_ID);
      return {
        found: true,
        validLine: hasLine,
        content: text.trim(),
      };
    }
  } catch (e) {
    // Silent catch
  }
  return {
    found: false,
    validLine: false,
    content: "",
  };
}
