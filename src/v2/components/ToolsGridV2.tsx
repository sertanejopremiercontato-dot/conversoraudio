import React from "react";
import { AppRouteV2 } from "../routes";
import { 
  Music, 
  Tag, 
  Video, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  ArrowRight
} from "lucide-react";

interface ToolsGridV2Props {
  onNavigate: (route: AppRouteV2) => void;
}

interface ToolItem {
  id: string;
  route: AppRouteV2;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  textColor: string;
  hoverBorder: string;
}

const TOOLS_LIST: ToolItem[] = [
  {
    id: "audio-converter",
    route: "audio",
    title: "Conversor de Áudio",
    description: "Converta arquivos de áudio entre diversos formatos com qualidade e rapidez.",
    icon: <Music className="w-6 h-6 text-white" />,
    iconBg: "bg-gradient-to-tr from-[#1D68F2] to-[#3B82F6] shadow-[0_8px_20px_rgba(29,104,242,0.3)]",
    textColor: "text-[#1D68F2]",
    hoverBorder: "hover:border-[#1D68F2]/50"
  },
  {
    id: "metadata-editor",
    route: "audioMetadata",
    title: "Editor de Metadados",
    description: "Edite título, artista, álbum, capa e outros campos. Descubra e remova dados ocultos.",
    icon: <Tag className="w-6 h-6 text-white" />,
    iconBg: "bg-gradient-to-tr from-[#E11D48] to-[#FB7185] shadow-[0_8px_20px_rgba(225,29,72,0.3)]",
    textColor: "text-[#E11D48]",
    hoverBorder: "hover:border-[#E11D48]/50"
  },
  {
    id: "video-to-audio",
    route: "videoToAudio",
    title: "Vídeo para Áudio",
    description: "Extraia o áudio de vídeos em MP4, MOV, MKV e outros formatos suportados.",
    icon: <Video className="w-6 h-6 text-white" />,
    iconBg: "bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] shadow-[0_8px_20px_rgba(124,58,237,0.3)]",
    textColor: "text-[#7C3AED]",
    hoverBorder: "hover:border-[#7C3AED]/50"
  },
  {
    id: "pdf-tools",
    route: "pdf",
    title: "Ferramentas PDF",
    description: "Converta, junte, divida, comprima e organize seus arquivos PDF.",
    icon: <FileText className="w-6 h-6 text-white" />,
    iconBg: "bg-gradient-to-tr from-[#EA580C] to-[#F97316] shadow-[0_8px_20px_rgba(234,88,12,0.3)]",
    textColor: "text-[#EA580C]",
    hoverBorder: "hover:border-[#EA580C]/50"
  },
  {
    id: "image-tools",
    route: "image",
    title: "Ferramentas de Imagem",
    description: "Converta, redimensione e edite suas imagens online com qualidade profissional.",
    icon: <ImageIcon className="w-6 h-6 text-white" />,
    iconBg: "bg-gradient-to-tr from-[#059669] to-[#10B981] shadow-[0_8px_20px_rgba(5,150,105,0.3)]",
    textColor: "text-[#059669]",
    hoverBorder: "hover:border-[#059669]/50"
  },
  {
    id: "document-tools",
    route: "document",
    title: "Documentos",
    description: "Converta e trabalhe com os formatos de documentos realmente suportados pelo aplicativo.",
    icon: <FileSpreadsheet className="w-6 h-6 text-white" />,
    iconBg: "bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] shadow-[0_8px_20px_rgba(2,132,199,0.3)]",
    textColor: "text-[#0284C7]",
    hoverBorder: "hover:border-[#0284C7]/50"
  }
];

export const ToolsGridV2: React.FC<ToolsGridV2Props> = ({ onNavigate }) => {
  return (
    <section className="space-y-7 pt-4 pb-2" id="ferramentas-principais">
      {/* Centered Section Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F44] tracking-tight">
          Ferramentas Principais
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6F84] font-medium">
          Soluções completas para todas as suas necessidades
        </p>
      </div>

      {/* 6-Card Desktop Grid (As seen in Reference top.png) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {TOOLS_LIST.map((tool) => {
          return (
            <div
              key={tool.id}
              onClick={() => onNavigate(tool.route)}
              className={`bg-white border border-[#E2E8F0] ${tool.hoverBorder} rounded-[24px] md:rounded-[28px] p-6 sm:p-7 flex flex-col justify-between space-y-4 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-[0_2px_14px_rgba(11,31,68,0.03)] hover:shadow-[0_12px_28px_rgba(11,31,68,0.07)] hover:-translate-y-1 text-left`}
              id={`tool-card-${tool.id}`}
            >
              {/* Top Row: Circular Vibrant Icon */}
              <div className="flex items-center justify-between">
                <div className={`w-13 h-13 rounded-full ${tool.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                  {tool.icon}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 flex-1 pt-1">
                <h3 className="text-lg font-black text-[#0B1F44] tracking-tight group-hover:text-[#0B1F44] transition-colors leading-snug">
                  {tool.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#5C6F84] leading-relaxed font-medium">
                  {tool.description}
                </p>
              </div>

              {/* Bottom CTA Action Link */}
              <div className="pt-2 flex items-center gap-1.5 text-xs sm:text-[13px] font-extrabold tracking-wide">
                <span className={`${tool.textColor} group-hover:underline`}>
                  Acessar ferramenta
                </span>
                <ArrowRight className={`w-3.5 h-3.5 ${tool.textColor} group-hover:translate-x-1 transition-transform`} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

