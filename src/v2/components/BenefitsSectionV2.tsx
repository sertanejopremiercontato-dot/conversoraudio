import React from "react";
import { 
  ShieldCheck, 
  Headphones, 
  RefreshCw, 
  Smile, 
  Users 
} from "lucide-react";
import { DEFAULT_HOME_CONTENT } from "../config/homeContent";

export const BenefitsSectionV2: React.FC = () => {
  const { whyChoose } = DEFAULT_HOME_CONTENT;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "shield":
        return <ShieldCheck className="w-5 h-5 text-[#1D68F2]" />;
      case "headset":
        return <Headphones className="w-5 h-5 text-[#6366F1]" />;
      case "refresh":
        return <RefreshCw className="w-5 h-5 text-[#06B6D4]" />;
      case "smile":
        return <Smile className="w-5 h-5 text-[#F59E0B]" />;
      case "users":
      default:
        return <Users className="w-5 h-5 text-[#10B981]" />;
    }
  };

  const getBg = (colorTheme: string) => {
    switch (colorTheme) {
      case "blue":
        return "bg-[#EFF6FF] border-[#BFDBFE]";
      case "indigo":
        return "bg-[#EEF2FF] border-[#C7D2FE]";
      case "cyan":
        return "bg-[#ECFEFF] border-[#A5F3FC]";
      case "amber":
        return "bg-[#FFFBEB] border-[#FDE68A]";
      case "emerald":
      default:
        return "bg-[#ECFDF5] border-[#A7F3D0]";
    }
  };

  return (
    <section className="space-y-6 pt-4 pb-2" id="por-que-escolher">
      {/* Section Title */}
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-[28px] font-black text-[#0B1F44] tracking-tight">
          Por que escolher o Conversor Audio?
        </h2>
      </div>

      {/* 5 Cards Row (As in Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {whyChoose.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[20px] p-5 flex flex-col justify-between space-y-3 transition-all duration-200 shadow-[0_2px_10px_rgba(11,31,68,0.02)] hover:shadow-[0_6px_18px_rgba(11,31,68,0.05)] hover:-translate-y-0.5 group text-left"
          >
            {/* Top Icon */}
            <div className={`w-10 h-10 rounded-2xl ${getBg(item.colorTheme)} border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
              {getIcon(item.iconName)}
            </div>

            {/* Texts */}
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#0B1F44] tracking-tight leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-[#5C6F84] leading-relaxed font-medium">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
