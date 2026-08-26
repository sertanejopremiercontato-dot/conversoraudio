import React from "react";
import { ShieldCheck, Zap, Star, Laptop, MousePointerClick } from "lucide-react";

export const VideoBenefitsV2: React.FC = () => {
  const benefits = [
    {
      title: "100% Privado",
      description: "Seus vídeos nunca saem do seu computador. Privacidade total garantida.",
      icon: <ShieldCheck className="w-5 h-5 text-[#6366F1]" />,
      bg: "bg-[#EEF2FF]",
      border: "border-[#C7D2FE]"
    },
    {
      title: "Extração Rápida",
      description: "Tecnologia otimizada para extrair áudio de vídeos rapidamente, sem comprometer a qualidade.",
      icon: <Zap className="w-5 h-5 text-[#2563EB]" />,
      bg: "bg-[#EFF6FF]",
      border: "border-[#BFDBFE]"
    },
    {
      title: "Qualidade Profissional",
      description: "Extração em MP3 até 320 kbps e formatos sem perda como AAC, FLAC e WAV.",
      icon: <Star className="w-5 h-5 text-[#8B5CF6]" />,
      bg: "bg-[#FAF5FF]",
      border: "border-[#EDE9FE]"
    },
    {
      title: "Compatível com Tudo",
      description: "Suporta MP4, MOV, WebM, AVI, MKV, 3GP e outros formatos populares.",
      icon: <Laptop className="w-5 h-5 text-[#0284C7]" />,
      bg: "bg-[#F0F9FF]",
      border: "border-[#BAE6FD]"
    },
    {
      title: "Fácil de Usar",
      description: "Interface intuitiva e simples. Extraia o áudio em poucos cliques.",
      icon: <MousePointerClick className="w-5 h-5 text-[#DB2777]" />,
      bg: "bg-[#FDF2F8]",
      border: "border-[#FBCFE8]"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5" id="v2-video-benefits">
      {benefits.map((item, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between space-y-3.5 shadow-xs hover:border-[#CBD5E1] hover:shadow-sm transition-all duration-200"
        >
          <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center shrink-0 shadow-2xs`}>
            {item.icon}
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-[13px] font-extrabold text-[#0F172A] tracking-tight">
              {item.title}
            </h4>
            <p className="text-[11.5px] text-[#64748B] leading-relaxed font-normal">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
