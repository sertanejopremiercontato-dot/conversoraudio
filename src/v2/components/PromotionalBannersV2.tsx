import React from "react";
import { 
  Headphones, 
  Sparkles, 
  ExternalLink, 
  Music, 
  Play, 
  Radio, 
  CheckCircle2 
} from "lucide-react";
import { DEFAULT_HOME_CONTENT, PromoBannerConfig } from "../config/homeContent";
import { useBannerTracker } from "../integrations/analytics/bannerTracker";

interface PromotionalBannersV2Props {
  config?: PromoBannerConfig;
  onOpenPromo?: () => void;
}

export const PromotionalBannersV2: React.FC<PromotionalBannersV2Props> = ({
  config = DEFAULT_HOME_CONTENT.promoBanner
}) => {
  const { elementRef, recordClick } = useBannerTracker({
    bannerId: "promo_spotify_playlist",
    bannerTitle: config.title || "Playlist Spotify Oficial",
    placement: "home_promo",
    enabled: !!config.enabled
  });

  if (!config.enabled) return null;

  return (
    <section 
      ref={elementRef}
      className="w-full my-4" 
      id="v2-promo-banner-section"
    >
      <div className={`relative overflow-hidden rounded-[26px] bg-gradient-to-r ${config.gradientBg} p-6 sm:p-8 md:p-10 text-white shadow-[0_12px_36px_rgba(8,27,75,0.25)] border border-white/10`}>
        
        {/* Subtle decorative background equalizer lines & glowing circles */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#7C3AED]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#1D68F2]/30 rounded-full blur-3xl pointer-events-none" />
        
        {/* Background Equalizer Waveform pattern */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-around pointer-events-none px-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white rounded-full"
              style={{
                height: `${20 + (Math.sin(i * 0.5) * 40 + 40)}%`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* ========================================================
              LEFT SIDE (Desktop): 3D Purple Headphones Artwork
              lg:col-span-3
             ======================================================== */}
          <div className="hidden lg:flex lg:col-span-3 items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Glowing ring */}
              <div className="absolute inset-0 rounded-full bg-[#8B5CF6]/30 blur-xl animate-pulse" />
              
              {/* 3D Headphones Graphic Card */}
              <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-tr from-[#6D28D9] to-[#A78BFA] p-4 flex flex-col items-center justify-center shadow-[0_12px_28px_rgba(109,40,217,0.4)] border border-white/30 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <Headphones className="w-16 h-16 text-white drop-shadow-md" />
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center text-white text-[10px] font-black border-2 border-white shadow-xs">
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              CENTER: Badge, Title, Subtitle and Spotify CTA
              lg:col-span-6
             ======================================================== */}
          <div className="lg:col-span-6 space-y-3.5 text-center lg:text-left">
            
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#34D399] text-[10.5px] font-black tracking-wider uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{config.tag}</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black tracking-tight text-white leading-tight">
              {config.title}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#CBD5E1] font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
              {config.subtitle}
            </p>

            {/* Spotify Green Action Button */}
            <div className="pt-2 flex items-center justify-center lg:justify-start">
              <a
                href={config.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={recordClick}
                className="px-5 py-3 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_4px_16px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.5)] hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center">
                  <Radio className="w-3 h-3 text-white" />
                </div>
                <span>{config.ctaText}</span>
              </a>
            </div>

          </div>

          {/* ========================================================
              RIGHT SIDE: Album Artwork Mockup Card (As in Reference)
              lg:col-span-3
             ======================================================== */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="w-48 sm:w-52 rounded-2xl bg-black/40 backdrop-blur-md p-3 border border-white/20 shadow-2xl hover:scale-105 transition-transform duration-300">
              
              {/* Cover Card Art */}
              <div className="relative aspect-square w-full rounded-xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-black overflow-hidden flex flex-col justify-between p-3 border border-white/10">
                
                {/* Simulated Artist avatars header */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-[#1D68F2] border-2 border-white/60 flex items-center justify-center text-[9px] font-bold text-white">
                      HJ
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#E11D48] border-2 border-white/60 flex items-center justify-center text-[9px] font-bold text-white">
                      JM
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#10B981] border-2 border-white/60 flex items-center justify-center text-[9px] font-bold text-white">
                      GL
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-[#10B981]/20 border border-[#10B981]/40 text-[#34D399] text-[9px] font-black uppercase">
                    HD
                  </span>
                </div>

                {/* Cover Center/Bottom Titles */}
                <div className="pt-4 text-left">
                  <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-widest block">
                    {config.coverTitle}
                  </span>
                  <span className="text-sm sm:text-base font-black tracking-tight text-white block">
                    {config.coverSubtitle}
                  </span>
                </div>

                {/* Bottom Spotify Logo & Wave */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1 text-[10px] text-[#34D399] font-bold">
                    <Radio className="w-3 h-3" />
                    <span>Spotify Official</span>
                  </div>
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
