import React from "react";
import { 
  Cloud, 
  SlidersHorizontal, 
  Wand2, 
  Download,
  ArrowRight
} from "lucide-react";
import { DEFAULT_HOME_CONTENT } from "../config/homeContent";

export const HowItWorksV2: React.FC = () => {
  const { steps } = DEFAULT_HOME_CONTENT;

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case "upload":
        return <Cloud className="w-5 h-5 text-[#1D68F2]" />;
      case "sliders":
        return <SlidersHorizontal className="w-5 h-5 text-[#10B981]" />;
      case "wand":
        return <Wand2 className="w-5 h-5 text-[#8B5CF6]" />;
      case "download":
      default:
        return <Download className="w-5 h-5 text-[#F59E0B]" />;
    }
  };

  const getCircleBg = (colorTheme: string) => {
    switch (colorTheme) {
      case "blue":
        return "bg-[#1D68F2] text-white shadow-blue-500/30";
      case "green":
        return "bg-[#10B981] text-white shadow-emerald-500/30";
      case "purple":
        return "bg-[#8B5CF6] text-white shadow-purple-500/30";
      case "orange":
      default:
        return "bg-[#F59E0B] text-white shadow-amber-500/30";
    }
  };

  const getIconBg = (colorTheme: string) => {
    switch (colorTheme) {
      case "blue":
        return "bg-[#EFF6FF] border-[#BFDBFE]";
      case "green":
        return "bg-[#ECFDF5] border-[#A7F3D0]";
      case "purple":
        return "bg-[#F5F3FF] border-[#DDD6FE]";
      case "orange":
      default:
        return "bg-[#FFFBEB] border-[#FDE68A]";
    }
  };

  return (
    <section className="space-y-6 pt-4 pb-2" id="como-funciona">
      {/* Section Header */}
      <div className="text-center max-w-xl mx-auto space-y-1">
        <h2 className="text-2xl sm:text-[28px] font-black text-[#0B1F44] tracking-tight">
          Como funciona
        </h2>
      </div>

      {/* 4 Steps Horizontal Flow (As in Reference) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 sm:p-8 shadow-[0_2px_14px_rgba(11,31,68,0.03)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => (
            <div key={item.step} className="flex flex-col space-y-3 relative group">
              
              {/* Step number badge + icon + connector line */}
              <div className="flex items-center gap-3 relative">
                
                {/* Step Number Circle */}
                <div className={`w-8 h-8 rounded-full ${getCircleBg(item.colorTheme)} flex items-center justify-center text-xs font-black shrink-0 shadow-md`}>
                  {item.step}
                </div>

                {/* Step Action Icon */}
                <div className={`w-10 h-10 rounded-2xl ${getIconBg(item.colorTheme)} border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                  {getStepIcon(item.iconName)}
                </div>

                {/* Connector dashed line to next item on desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block flex-1 h-[2px] border-t-2 border-dashed border-[#E2E8F0] mx-2" />
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1 text-left">
                <h3 className="text-sm font-black text-[#0B1F44] tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-[#5C6F84] leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
