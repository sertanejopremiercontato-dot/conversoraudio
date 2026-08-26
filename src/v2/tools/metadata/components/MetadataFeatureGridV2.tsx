import React from "react";
import { Eye, Tag, Activity, Cpu, Smartphone, ShieldCheck } from "lucide-react";

export const MetadataFeatureGridV2: React.FC = () => {
  const features = [
    {
      title: "Remove dados ocultos",
      description: "Elimina informações internas e rastros de origem que outras ferramentas não detectam.",
      icon: <Eye className="w-5 h-5 text-[#EC4899]" />,
      bg: "bg-[#FDF2F8]",
      border: "border-[#FCE7F3]",
      iconBorder: "border-[#FBCFE8]"
    },
    {
      title: "Limpa tags invisíveis",
      description: "Remove campos ID3v2, RIFF, Vorbis, comentários, letras e todos os metadados ocultos.",
      icon: <Tag className="w-5 h-5 text-[#8B5CF6]" />,
      bg: "bg-[#F5F3FF]",
      border: "border-[#EDE9FE]",
      iconBorder: "border-[#DDD6FE]"
    },
    {
      title: "Preserva o áudio original",
      description: "O conteúdo sonoro é mantido 100% idêntico, sem reencode ou perda de qualidade.",
      icon: <Activity className="w-5 h-5 text-[#0284C7]" />,
      bg: "bg-[#F0F9FF]",
      border: "border-[#E0F2FE]",
      iconBorder: "border-[#BAE6FD]"
    },
    {
      title: "Apaga rastros de IA",
      description: "Remove marcas e assinaturas de ferramentas e modelos de IA usados na criação.",
      icon: <Cpu className="w-5 h-5 text-[#D97706]" />,
      bg: "bg-[#FFFBEB]",
      border: "border-[#FEF3C7]",
      iconBorder: "border-[#FDE68A]"
    },
    {
      title: "Mantém compatibilidade",
      description: "Garante máximo suporte em todos os players e plataformas após a limpeza.",
      icon: <Smartphone className="w-5 h-5 text-[#059669]" />,
      bg: "bg-[#ECFDF5]",
      border: "border-[#D1FAE5]",
      iconBorder: "border-[#A7F3D0]"
    },
    {
      title: "Gera verificação",
      description: "Cria hash criptográfico para provar a integridade do arquivo após o processo.",
      icon: <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />,
      bg: "bg-[#FAF5FF]",
      border: "border-[#F3E8FF]",
      iconBorder: "border-[#E9D5FF]"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 h-full content-between" id="v2-metadata-feature-grid">
      {features.map((item, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E2EBF8] rounded-2xl p-4 sm:p-4.5 flex items-start gap-3.5 shadow-[0_2px_10px_rgba(11,31,68,0.02)] hover:border-[#BFDBFE] hover:shadow-[0_4px_16px_rgba(29,104,242,0.06)] transition-all duration-200"
        >
          <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.iconBorder} flex items-center justify-center shrink-0 shadow-2xs`}>
            {item.icon}
          </div>
          <div className="space-y-1 min-w-0">
            <h4 className="text-xs sm:text-[13px] font-extrabold text-[#0B1F44] tracking-tight">
              {item.title}
            </h4>
            <p className="text-[11.5px] sm:text-xs text-[#5C6F84] leading-relaxed font-normal">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
