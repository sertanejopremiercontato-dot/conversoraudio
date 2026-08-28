import { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export interface SupportQrConfigV2 {
  supportQrUrl: string;
  supportQrStoragePath?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const LOCAL_STORAGE_SUPPORT_QR_KEY = "conversor_audio_v2_support_qr";

export const DEFAULT_SUPPORT_QR: SupportQrConfigV2 = {
  supportQrUrl: "",
  supportQrStoragePath: "",
  updatedAt: ""
};

export function useSupportQrV2(): {
  supportQr: SupportQrConfigV2;
  loading: boolean;
} {
  const [supportQr, setSupportQr] = useState<SupportQrConfigV2>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_SUPPORT_QR_KEY);
        if (cached) {
          return { ...DEFAULT_SUPPORT_QR, ...JSON.parse(cached) };
        }
      } catch (e) {
        // ignore cache error
      }
    }
    return DEFAULT_SUPPORT_QR;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const docRef = doc(db, "site_settings", "support");

    // Escuta em tempo real as atualizações de site_settings/support
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!isMounted) return;
        if (snapshot.exists()) {
          const data = snapshot.data();
          const config: SupportQrConfigV2 = {
            supportQrUrl: data.supportQrUrl || "",
            supportQrStoragePath: data.supportQrStoragePath || "",
            updatedAt: data.updatedAt || "",
            updatedBy: data.updatedBy || ""
          };

          setSupportQr(config);
          try {
            localStorage.setItem(LOCAL_STORAGE_SUPPORT_QR_KEY, JSON.stringify(config));
          } catch (e) {}
        } else {
          // Documento ainda não criado no Firestore
          setSupportQr(DEFAULT_SUPPORT_QR);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("[useSupportQrV2] Aviso ao ler site_settings/support:", error);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { supportQr, loading };
}
