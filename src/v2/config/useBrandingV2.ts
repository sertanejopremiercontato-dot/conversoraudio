import { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { BrandingConfigV2 } from "../admin/types";

const LOCAL_STORAGE_BRANDING_KEY = "conversor_audio_v2_branding";

export const DEFAULT_BRANDING: BrandingConfigV2 = {
  siteName: "Conversor Audio",
  logoUrl: "",
  logoAlt: "Conversor Audio Online",
  logoDesktopWidth: 220,
  logoDesktopMaxHeight: 64,
  logoMobileWidth: 160,
  logoMobileMaxHeight: 48,
};

export function useBrandingV2(): {
  branding: BrandingConfigV2;
  loading: boolean;
} {
  const [branding, setBranding] = useState<BrandingConfigV2>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_BRANDING_KEY);
        if (cached) {
          return { ...DEFAULT_BRANDING, ...JSON.parse(cached) };
        }
      } catch (e) {}
    }
    return DEFAULT_BRANDING;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const docRef = doc(db, "site_settings", "branding");

    // Escuta em tempo real as atualizações de branding
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.exists()) {
          const data = snapshot.data();
          const config: BrandingConfigV2 = {
            siteName: data.siteName || DEFAULT_BRANDING.siteName,
            logoUrl: data.logoUrl || "",
            logoStoragePath: data.logoStoragePath || "",
            logoAlt: data.logoAlt || DEFAULT_BRANDING.logoAlt,
            logoDesktopWidth: Number(data.logoDesktopWidth) || DEFAULT_BRANDING.logoDesktopWidth,
            logoDesktopMaxHeight: Number(data.logoDesktopMaxHeight) || DEFAULT_BRANDING.logoDesktopMaxHeight,
            logoMobileWidth: Number(data.logoMobileWidth) || DEFAULT_BRANDING.logoMobileWidth,
            logoMobileMaxHeight: Number(data.logoMobileMaxHeight) || DEFAULT_BRANDING.logoMobileMaxHeight,
            updatedAt: data.updatedAt || "",
          };

          setBranding(config);
          try {
            localStorage.setItem(LOCAL_STORAGE_BRANDING_KEY, JSON.stringify(config));
          } catch (e) {}
        }
        setLoading(false);
      },
      (error) => {
        console.warn("[useBrandingV2] Aviso ao ouvir site_settings/branding:", error);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { branding, loading };
}
