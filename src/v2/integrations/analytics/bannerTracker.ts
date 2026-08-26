import { useEffect, useRef } from "react";
import { trackBannerImpression, trackBannerClick } from "./index";

interface UseBannerTrackerOptions {
  bannerId: string;
  bannerTitle?: string;
  placement?: string;
  enabled?: boolean;
}

/**
 * Hook para observação de visibilidade e registro de impressões reais (>= 50% visível)
 * e cliques de banners publicitários e promocionais.
 */
export function useBannerTracker({
  bannerId,
  bannerTitle,
  placement = "home_carousel",
  enabled = true
}: UseBannerTrackerOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const impressionSentRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !bannerId || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    // Reset ao mudar de bannerId
    impressionSentRef.current = false;
    const el = elementRef.current;
    if (!el) return;

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!impressionSentRef.current) {
            // Requer pelo menos 400ms de permanência visível
            timer = setTimeout(() => {
              if (!impressionSentRef.current) {
                impressionSentRef.current = true;
                trackBannerImpression(bannerId, bannerTitle, placement);
              }
            }, 400);
          }
        } else {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      {
        threshold: [0.5]
      }
    );

    observer.observe(el);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [bannerId, bannerTitle, placement, enabled]);

  const recordClick = () => {
    if (!enabled || !bannerId) return;
    trackBannerClick(bannerId, bannerTitle, placement);
  };

  return {
    elementRef,
    recordClick
  };
}
