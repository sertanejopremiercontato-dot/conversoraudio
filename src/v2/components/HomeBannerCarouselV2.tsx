import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppRouteV2 } from "../routes";
import { HomeBannerV2 } from "../admin/types";
import { 
  collection, 
  query, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../../firebase";
import { 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

interface HomeBannerCarouselV2Props {
  onNavigate?: (route: AppRouteV2) => void;
}

const LOCAL_STORAGE_BANNERS_KEY = "conversor_audio_v2_home_banners";

export const HomeBannerCarouselV2: React.FC<HomeBannerCarouselV2Props> = ({ onNavigate }) => {
  const [banners, setBanners] = useState<HomeBannerV2[]>(() => {
    // Leitura inicial síncrona de cache se houver
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_BANNERS_KEY);
        if (cached) {
          const parsed: HomeBannerV2[] = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            return parsed.filter((b) => b.active && b.imageUrl).sort((a, b) => (a.order || 0) - (b.order || 0));
          }
        }
      } catch (e) {}
    }
    return [];
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listener em tempo real (Source of Truth no Firestore collection "home_banners")
  useEffect(() => {
    let isMounted = true;

    try {
      const q = query(collection(db, "home_banners"));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          if (!isMounted) return;

          if (snap.empty) {
            // Nenhum banner existente ou todos foram excluídos
            setBanners([]);
            localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify([]));
            return;
          }

          const items: HomeBannerV2[] = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: data.name || data.title || "Banner",
                title: data.name || data.title || "Banner",
                imageUrl: data.imageUrl || "",
                storagePath: data.storagePath || "",
                linkUrl: data.linkUrl || data.destinationUrl || "",
                destinationUrl: data.linkUrl || data.destinationUrl || "",
                order: Number(data.order !== undefined ? data.order : 1),
                active: data.active !== undefined ? !!data.active : true,
                altText: data.altText || data.name || "Banner",
              };
            })
            .filter((b) => b.active && b.imageUrl);

          items.sort((a, b) => a.order - b.order);

          setBanners(items);
          localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(items));
        },
        (err) => {
          console.warn("[HomeBannerCarouselV2] onSnapshot erro, mantendo cache local:", err);
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      console.error("[HomeBannerCarouselV2] Falha ao iniciar listener:", err);
    }
  }, []);

  const totalSlides = banners.length;

  // Garante que o currentIndex seja sempre válido quando a quantidade de banners mudar
  useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) {
      setCurrentIndex(0);
    }
  }, [totalSlides, currentIndex]);

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Autoplay com pausa ao passar o mouse
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    autoplayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 6000); // 6 segundos por banner

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isPaused, nextSlide, totalSlides]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Clique no Banner
  const handleBannerClick = (banner: HomeBannerV2) => {
    const link = banner.linkUrl || banner.destinationUrl;
    if (!link) return;

    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else if (onNavigate) {
      const cleanRoute = link.replace(/^\//, "") as AppRouteV2;
      onNavigate(cleanRoute);
    }
  };

  // SE NÃO HOUVER BANNERS CADASTRADOS, NÃO INVENTAR BANNER FAKE NEM HARDCODED
  if (totalSlides === 0) {
    return null;
  }

  return (
    <section 
      className="w-full max-w-[1320px] mx-auto mb-6 sm:mb-8 md:mb-10"
      id="v2-home-banner-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 
        Container Oficial 1320x323 px
        Proporção: 1320 / 323 (~4.087 : 1)
        Responsivo sem deformação com object-fit: cover
      */}
      <div 
        className="relative w-full rounded-[20px] sm:rounded-[24px] md:rounded-[28px] overflow-hidden bg-slate-900 shadow-[0_8px_30px_rgba(11,31,68,0.10)] border border-[#E2EBF8] aspect-[16/7] sm:aspect-[21/8] md:aspect-[1320/323] max-h-[360px] group transition-all"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full h-full">
          {banners.map((banner, idx) => {
            const isActive = idx === currentIndex;
            const hasLink = !!(banner.linkUrl || banner.destinationUrl);

            return (
              <div
                key={banner.id || idx}
                onClick={() => hasLink && handleBannerClick(banner)}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                } ${hasLink ? "cursor-pointer" : ""}`}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.altText || banner.name || "Banner"}
                  className="w-full h-full object-cover select-none"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
                {/* Subtle edge overlay for contrast and crisp display */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* ========================================================
            CONTROLES DE NAVEGAÇÃO (SETAS LATERAIS DISCRETAS)
            ======================================================== */}
        {totalSlides > 1 && (
          <>
            {/* Seta Esquerda */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Banner anterior"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-[#0B1F44] backdrop-blur-md border border-white/60 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Seta Direita */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Próximo banner"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-[#0B1F44] backdrop-blur-md border border-white/60 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* ========================================================
                INDICADORES DE BOLINHAS (DOTS)
                ======================================================== */}
            <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/10">
              {banners.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(dotIdx);
                  }}
                  aria-label={`Ir para banner ${dotIdx + 1}`}
                  className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                    dotIdx === currentIndex 
                      ? "w-5 sm:w-6 bg-white shadow-xs" 
                      : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  );
};
