import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { HeroIllustration3D, HeroIllustrationType } from "./HeroIllustration3D";

interface HeroBadge {
  label: string;
  icon?: React.ReactNode;
}

interface HeroCta {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface HeroV2Props {
  pillTag?: string;
  title: React.ReactNode;
  description: string;
  badges: HeroBadge[];
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  illustrationType: HeroIllustrationType;
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

export const HeroV2: React.FC<HeroV2Props> = ({
  pillTag,
  title,
  description,
  badges,
  primaryCta,
  secondaryCta,
  illustrationType,
  backButton
}) => {
  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-r from-[#EBF3FE] via-[#F4F9FF] to-[#E9F3FE] border border-[#E0ECFA] rounded-[24px] md:rounded-[28px] p-6 md:p-10 shadow-[0_4px_24px_rgba(29,104,242,0.03)]"
      id="v2-unified-hero"
    >
      {/* Background Decorative Gradient Waves & Lighting Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-white/60 blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 rounded-full bg-[#38BDF8]/10 blur-2xl pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left Column: Typography, Badges, CTAs */}
        <div className="space-y-4 md:space-y-5 max-w-2xl text-center lg:text-left flex-1">
          {/* Optional Back Button */}
          {backButton && (
            <div>
              <button
                type="button"
                onClick={backButton.onClick}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D68F2] hover:text-[#1554C7] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{backButton.label}</span>
              </button>
            </div>
          )}

          {/* Top Pill Tag */}
          {pillTag && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D68F2]/10 border border-[#1D68F2]/20 text-[#1D68F2] text-[11px] font-bold tracking-wide">
              <Sparkles className="w-3 h-3 text-[#1D68F2]" />
              <span>{pillTag}</span>
            </div>
          )}

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B1F44] tracking-tight leading-[1.15]">
            {title}
          </h1>

          {/* Subtitle Description */}
          <p className="text-sm md:text-[15px] text-[#5C6F84] leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
            {description}
          </p>

          {/* Highlight Badges */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
            {badges.map((badge, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-[#E0ECFA] text-[#0B1F44] text-xs font-semibold shadow-2xs"
              >
                {badge.icon}
                <span>{badge.label}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              {primaryCta && (
                <button
                  type="button"
                  onClick={primaryCta.onClick}
                  className="px-5 py-2.5 md:py-3 rounded-xl bg-[#1D68F2] hover:bg-[#1554C7] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-[0_4px_14px_rgba(29,104,242,0.3)] hover:shadow-[0_6px_18px_rgba(29,104,242,0.4)] transition-all cursor-pointer"
                >
                  {primaryCta.icon}
                  <span>{primaryCta.label}</span>
                </button>
              )}

              {secondaryCta && (
                <button
                  type="button"
                  onClick={secondaryCta.onClick}
                  className="px-5 py-2.5 md:py-3 rounded-xl bg-white hover:bg-[#F8FAFD] text-[#1D68F2] border border-[#1D68F2]/30 text-xs md:text-sm font-bold flex items-center gap-2 shadow-2xs hover:border-[#1D68F2] transition-all cursor-pointer"
                >
                  {secondaryCta.icon}
                  <span>{secondaryCta.label}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: 3D Illustration */}
        <div className="shrink-0 flex items-center justify-center">
          <HeroIllustration3D type={illustrationType} />
        </div>
      </div>
    </section>
  );
};
