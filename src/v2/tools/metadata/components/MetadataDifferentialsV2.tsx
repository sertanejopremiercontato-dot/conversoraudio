import React from "react";
import { ShieldCheck, Sparkles, CheckCircle2, Sliders, Fingerprint } from "lucide-react";

export const MetadataDifferentialsV2: React.FC = () => {
  const items = [
    {
      title: "100% Privado",
      description: "Todo o processamento acontece no seu navegador. Seus arquivos nunca saem do seu dispositivo.",
      icon: <ShieldCheck className="w-5 h-5 text-[#1D68F2]" />,
      bg: "bg-[#EFF6FF]",
      border: "border-[#BFDBFE]"
    },
    {
      title: "Remoção de IA e rastros",
      description: "Elimina marcas ocultas de geradores como Suno, Udio, ElevenLabs e outros.",
      icon: <Sparkles className="w-5 h-5 text-[#8B5CF6]" />,
      bg: "bg-[#F5F3FF]",
      border: "border-[#DDD6FE]"
    },
    {
      title: "Preservação Bit-a-Bit",
      description: "O payload de áudio PCM permanece intacto, sem re-encoding ou compressão.",
      icon: <CheckCircle2 className="w-5 h-5 text-[#059669]" />,
      bg: "bg-[#ECFDF5]",
      border: "border-[#A7F3D0]"
    },
    {
      title: "Tags ID3v2 e RIFF",
      description: "Limpeza completa de ID3v1/v2, RIFF INFO, Vorbis Comments e APE Tags.",
      icon: <Sliders className="w-5 h-5 text-[#0284C7]" />,
      bg: "bg-[#F0F9FF]",
      border: "border-[#BAE6FD]"
    },
    {
      title: "Prova Criptográfica",
      description: "Hash SHA-256 independente para validação e integridade do arquivo final.",
      icon: <Fingerprint className="w-5 h-5 text-[#EC4899]" />,
      bg: "bg-[#FDF2F8]",
      border: "border-[#FBCFE8]"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5" id="v2-metadata-differentials">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E2EBF8] rounded-2xl p-4 flex flex-col justify-between space-y-2.5 shadow-[0_2px_10px_rgba(11,31,68,0.02)] hover:border-[#BFDBFE] hover:shadow-[0_4px_16px_rgba(29,104,242,0.06)] transition-all duration-200"
        >
          <div className={`w-9 h-9 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center shrink-0`}>
            {item.icon}
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-[13px] font-extrabold text-[#0B1F44] tracking-tight">
              {item.title}
            </h4>
            <p className="text-[11px] text-[#5C6F84] leading-relaxed font-normal">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
