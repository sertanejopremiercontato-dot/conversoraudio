import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export const PUBLISHER_ID = "ca-pub-8846628306821055";
export const MASKED_PUBLISHER_ID = "ca-pub-8846******21055";
export const OFFICIAL_DOMAIN = "https://www.conversoraudio.com.br";
export const EXPECTED_ADS_TXT_URL = "https://www.conversoraudio.com.br/ads.txt";
export const OFFICIAL_ADS_TXT_LINE = "google.com, pub-8846628306821055, DIRECT, f08c47fec0942fa0";
export const OFFICIAL_SNIPPET = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8846628306821055" crossorigin="anonymous"></script>`;
export const OFFICIAL_METATAG = `<meta name="google-adsense-account" content="ca-pub-8846628306821055">`;

export type AdSenseReviewStatus =
  | "Não configurado"
  | "Código instalado"
  | "Aguardando verificação"
  | "Aguardando revisão"
  | "Aprovado"
  | "Reprovado"
  | "Verificação manual necessária";

export type VerificationMethod = "snippet" | "ads_txt" | "metatag";

export interface AdSenseConfig {
  adsenseEnabled: boolean;
  publisherId: string;
  domain: string;
  mode: string;
  reviewStatus: AdSenseReviewStatus;
  notes: string;
  selectedVerificationMethod: VerificationMethod;
  verificationSnippet: string;
  verificationMetaTag: string;
  verificationAdsTxtLine: string;
  preparedForDeploy?: boolean;
  lastVerificationCheck?: string;
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
  selectedVerificationMethod: "snippet",
  verificationSnippet: OFFICIAL_SNIPPET,
  verificationMetaTag: OFFICIAL_METATAG,
  verificationAdsTxtLine: OFFICIAL_ADS_TXT_LINE,
  preparedForDeploy: true
};

/**
 * Validation logic for AdSense JS snippet input
 */
export function validateAdSenseSnippet(snippetInput: string): {
  isValid: boolean;
  error?: string;
  extractedPublisherId?: string;
} {
  const trimmed = snippetInput.trim();
  if (!trimmed) {
    return { isValid: false, error: "Conteúdo não informado." };
  }

  if (!trimmed.includes("<script") || !trimmed.includes("</script>")) {
    return { isValid: false, error: "O snippet deve ser uma tag <script> válida." };
  }

  if (!trimmed.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js")) {
    return { isValid: false, error: "URL do script do AdSense (pagead2.googlesyndication.com) não encontrada." };
  }

  if (!trimmed.includes('crossorigin="anonymous"')) {
    return { isValid: false, error: 'O atributo crossorigin="anonymous" é obrigatório no snippet.' };
  }

  const pubIdMatch = trimmed.match(/ca-pub-\d+/);
  if (!pubIdMatch) {
    return { isValid: false, error: "Publisher ID válido (ca-pub-...) não encontrado no snippet." };
  }

  // Safety check: ensure no unexpected tags or inline scripts
  if (/<iframe|<object|<embed|<svg|onload=|onerror=/i.test(trimmed)) {
    return { isValid: false, error: "Código malicioso ou tags adicionais não permitidas detectadas." };
  }

  return {
    isValid: true,
    extractedPublisherId: pubIdMatch[0]
  };
}

/**
 * Validation logic for AdSense MetaTag input
 */
export function validateAdSenseMetaTag(metaTagInput: string): {
  isValid: boolean;
  error?: string;
  extractedPublisherId?: string;
} {
  const trimmed = metaTagInput.trim();
  if (!trimmed) {
    return { isValid: false, error: "Metatag não informada." };
  }

  if (!trimmed.includes('<meta') || !trimmed.includes('name="google-adsense-account"')) {
    return { isValid: false, error: 'A metatag deve conter name="google-adsense-account".' };
  }

  const contentMatch = trimmed.match(/content=["'](ca-pub-\d+)["']/);
  if (!contentMatch) {
    return { isValid: false, error: 'Atributo content="ca-pub-..." válido não encontrado.' };
  }

  if (/<script|<iframe|<object/i.test(trimmed)) {
    return { isValid: false, error: "A metatag não deve conter tags de execução ou script." };
  }

  return {
    isValid: true,
    extractedPublisherId: contentMatch[1]
  };
}

/**
 * Validation logic for ads.txt line
 */
export function validateAdsTxtLine(lineInput: string): {
  isValid: boolean;
  error?: string;
  extractedPublisherId?: string;
} {
  const trimmed = lineInput.trim();
  if (!trimmed) {
    return { isValid: false, error: "Linha do ads.txt não informada." };
  }

  if (trimmed.includes("<") || trimmed.includes(">")) {
    return { isValid: false, error: "A linha do ads.txt não pode conter tags HTML." };
  }

  const parts = trimmed.split(",").map((p) => p.trim());
  if (parts.length < 3) {
    return { isValid: false, error: "Formato inválido do ads.txt. Esperado: google.com, pub-XXXX, DIRECT, f08c47fec0942fa0" };
  }

  if (parts[0].toLowerCase() !== "google.com") {
    return { isValid: false, error: "Domínio inicial deve ser google.com" };
  }

  const pubMatch = parts[1].match(/pub-\d+/);
  if (!pubMatch) {
    return { isValid: false, error: "Publisher ID no formato pub-XXXXXXXXXXXXXXXX não encontrado." };
  }

  const type = parts[2].toUpperCase();
  if (type !== "DIRECT" && type !== "RESELLER") {
    return { isValid: false, error: "Tipo deve ser DIRECT ou RESELLER." };
  }

  return {
    isValid: true,
    extractedPublisherId: `ca-${pubMatch[0]}`
  };
}

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
          selectedVerificationMethod: (data.selectedVerificationMethod as VerificationMethod) || "snippet",
          verificationSnippet: data.verificationSnippet || OFFICIAL_SNIPPET,
          verificationMetaTag: data.verificationMetaTag || OFFICIAL_METATAG,
          verificationAdsTxtLine: data.verificationAdsTxtLine || OFFICIAL_ADS_TXT_LINE,
          preparedForDeploy: data.preparedForDeploy ?? true,
          lastVerificationCheck: data.lastVerificationCheck || "",
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
        selectedVerificationMethod: (data.selectedVerificationMethod as VerificationMethod) || "snippet",
        verificationSnippet: data.verificationSnippet || OFFICIAL_SNIPPET,
        verificationMetaTag: data.verificationMetaTag || OFFICIAL_METATAG,
        verificationAdsTxtLine: data.verificationAdsTxtLine || OFFICIAL_ADS_TXT_LINE,
        preparedForDeploy: data.preparedForDeploy ?? true,
        lastVerificationCheck: data.lastVerificationCheck || "",
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
      selectedVerificationMethod: config.selectedVerificationMethod || "snippet",
      verificationSnippet: config.verificationSnippet || OFFICIAL_SNIPPET,
      verificationMetaTag: config.verificationMetaTag || OFFICIAL_METATAG,
      verificationAdsTxtLine: config.verificationAdsTxtLine || OFFICIAL_ADS_TXT_LINE,
      preparedForDeploy: config.preparedForDeploy ?? true,
      lastVerificationCheck: config.lastVerificationCheck || new Date().toLocaleString("pt-BR"),
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
 * Dynamic initialization helper for Google AdSense.
 */
export function initializeAdSenseScript(enabled: boolean): void {
  if (typeof window === "undefined" || !document || !document.head) {
    return;
  }

  const existingScript = document.querySelector('script[src*="adsbygoogle.js"]');

  if (enabled && !existingScript) {
    try {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-adsense-script", "true");
      document.head.appendChild(script);
    } catch (err) {
      console.warn("[ADSENSE SERVICE] Script injection warning:", err);
    }
  }
}

/**
 * Check public domain / Home page live verification
 */
export async function checkDomainVerification(): Promise<{
  accessible: boolean;
  publisherIdFound: boolean;
  methodFound: boolean;
  occurrences: number;
  inHead: boolean;
  location: string;
  timestamp: string;
}> {
  const timestamp = new Date().toLocaleString("pt-BR");
  try {
    // Attempt fetch of root HTML
    const res = await fetch("/?t=" + Date.now(), { cache: "no-store" });
    if (res.ok) {
      const html = await res.text();
      const occurrences = (html.match(/ca-pub-8846628306821055/g) || []).length;
      const snippetFound = html.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
      const metaFound = html.includes('name="google-adsense-account"');
      
      const headIndex = html.indexOf("</head>");
      const pubIndex = html.indexOf("ca-pub-8846628306821055");
      const inHead = headIndex > -1 && pubIndex > -1 && pubIndex < headIndex;

      return {
        accessible: true,
        publisherIdFound: occurrences > 0,
        methodFound: snippetFound || metaFound,
        occurrences,
        inHead,
        location: "HTML público (Home)",
        timestamp
      };
    }
  } catch (e) {
    // Fallback: check DOM in current page
  }

  if (typeof document !== "undefined") {
    const headHtml = document.head ? document.head.innerHTML : "";
    const occurrences = (headHtml.match(/ca-pub-8846628306821055/g) || []).length;
    const snippetFound = !!document.querySelector('script[src*="adsbygoogle.js"]');
    const metaFound = !!document.querySelector('meta[name="google-adsense-account"]');

    return {
      accessible: true,
      publisherIdFound: occurrences > 0,
      methodFound: snippetFound || metaFound,
      occurrences,
      inHead: true,
      location: "HTML público (DOM)",
      timestamp
    };
  }

  return {
    accessible: false,
    publisherIdFound: false,
    methodFound: false,
    occurrences: 0,
    inHead: false,
    location: "Indisponível",
    timestamp
  };
}

/**
 * Check local ads.txt file status
 */
export async function checkLocalAdsTxt(): Promise<{
  found: boolean;
  validLine: boolean;
  content: string;
  httpStatus: number;
}> {
  try {
    const res = await fetch("/ads.txt?t=" + Date.now(), { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      const hasLine = text.includes("pub-8846628306821055") || text.includes(PUBLISHER_ID);
      return {
        found: true,
        validLine: hasLine,
        content: text.trim(),
        httpStatus: res.status
      };
    }
    return {
      found: false,
      validLine: false,
      content: "",
      httpStatus: res.status
    };
  } catch (e) {
    // Silent catch
  }
  return {
    found: false,
    validLine: false,
    content: "",
    httpStatus: 0
  };
}
