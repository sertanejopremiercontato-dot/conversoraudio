import { useEffect, useState } from "react";
import { SEO_PAGES_REGISTRY, SeoRouteKeyV2, PageSeoMetadata } from "./seoPages";
import { SITE_URL, SEO_DEFAULTS } from "./seoConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * Cache em memória dos overrides de SEO para evitar chamadas duplicadas
 */
const seoOverridesMemoryCache: Record<string, Partial<PageSeoMetadata> | null> = {};

/**
 * Helper para setar ou criar meta tags no DOM
 */
function setMetaTag(attributeName: string, attributeValue: string, content: string) {
  if (typeof document === "undefined") return;
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

/**
 * Helper para setar ou criar link canonical
 */
function setCanonical(url: string) {
  if (typeof document === "undefined") return;
  let element = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", url);
}

/**
 * Helper para injetar dados estruturados JSON-LD Schema.org
 */
function setJsonLd(id: string, data: Record<string, any>) {
  if (typeof document === "undefined") return;
  let script = document.getElementById(id) as HTMLScriptElement;
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data, null, 2);
}

/**
 * Aplica metadados no documento HTML
 */
function applySeoToDom(seo: PageSeoMetadata) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // 1. Document Title
  document.title = seo.title;

  // 2. Standard Meta Tags
  setMetaTag("name", "description", seo.description);
  if (seo.keywords && seo.keywords.length > 0) {
    setMetaTag("name", "keywords", seo.keywords.join(", "));
  }
  setMetaTag("name", "robots", seo.robots || SEO_DEFAULTS.defaultRobots);

  // 3. Canonical URL
  const canonicalFull = seo.canonicalPath.startsWith("http")
    ? seo.canonicalPath
    : `${SITE_URL}${seo.canonicalPath === "/" ? "" : seo.canonicalPath}`;
  setCanonical(canonicalFull);

  // 4. Open Graph Meta Tags
  setMetaTag("property", "og:type", seo.ogType || "website");
  setMetaTag("property", "og:site_name", SEO_DEFAULTS.siteName);
  setMetaTag("property", "og:title", seo.ogTitle || seo.title);
  setMetaTag("property", "og:description", seo.ogDescription || seo.description);
  setMetaTag("property", "og:url", canonicalFull);
  
  const ogImgUrl = seo.ogImage || SEO_DEFAULTS.defaultOgImage;
  const absoluteOgImg = ogImgUrl.startsWith("http") ? ogImgUrl : `${SITE_URL}${ogImgUrl.startsWith("/") ? "" : "/"}${ogImgUrl}`;
  setMetaTag("property", "og:image", absoluteOgImg);

  // 5. Twitter Card
  setMetaTag("name", "twitter:card", seo.twitterCard || "summary_large_image");
  setMetaTag("name", "twitter:title", seo.ogTitle || seo.title);
  setMetaTag("name", "twitter:description", seo.ogDescription || seo.description);
  setMetaTag("name", "twitter:image", absoluteOgImg);

  // 6. JSON-LD Schema
  if (seo.jsonLd) {
    setJsonLd("seo-v2-schema-jsonld", seo.jsonLd);
  } else {
    const existingScript = document.getElementById("seo-v2-schema-jsonld");
    if (existingScript) {
      existingScript.remove();
    }
  }
}

/**
 * Hook de SEO da V2.
 * Prioridade:
 * 1. customData (se passado explicitamente via prop)
 * 2. Override persistido no Firestore (coleção `seo_configs/{routeKey}`)
 * 3. Default estático do código (`SEO_PAGES_REGISTRY[routeKey]`)
 */
export function useSeoV2(routeKey: SeoRouteKeyV2 = "home", customData?: Partial<PageSeoMetadata>) {
  const [firestoreOverride, setFirestoreOverride] = useState<Partial<PageSeoMetadata> | null>(() => {
    return seoOverridesMemoryCache[routeKey] || null;
  });

  // Busca override no Firestore se não estiver em cache
  useEffect(() => {
    let isMounted = true;

    const fetchOverride = async () => {
      // Se for admin, não busca override
      if (routeKey === "admin") return;

      if (seoOverridesMemoryCache[routeKey] !== undefined) {
        if (isMounted) setFirestoreOverride(seoOverridesMemoryCache[routeKey]);
        return;
      }

      try {
        const docRef = doc(db, "seo_configs", routeKey);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<PageSeoMetadata>;
          seoOverridesMemoryCache[routeKey] = data;
          if (isMounted) setFirestoreOverride(data);
        } else {
          seoOverridesMemoryCache[routeKey] = null;
          if (isMounted) setFirestoreOverride(null);
        }
      } catch (err) {
        // Falha graciosa mantendo padrão do código
        seoOverridesMemoryCache[routeKey] = null;
      }
    };

    fetchOverride();

    return () => {
      isMounted = false;
    };
  }, [routeKey]);

  // Aplica SEO no DOM imediatamente e sempre que houver atualização
  useEffect(() => {
    const baseData = SEO_PAGES_REGISTRY[routeKey] || SEO_PAGES_REGISTRY.home;
    const effectiveSeo: PageSeoMetadata = {
      ...baseData,
      ...(firestoreOverride || {}),
      ...(customData || {})
    };

    applySeoToDom(effectiveSeo);
  }, [routeKey, firestoreOverride, customData]);
}

export { SEO_PAGES_REGISTRY } from "./seoPages";
