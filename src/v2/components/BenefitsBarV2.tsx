import React from "react";
import { 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Smartphone, 
  Cloud
} from "lucide-react";

export interface BenefitItem {
  id?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconBorder?: string;
  iconColor?: string;
}

interface BenefitsBarV2Props {
  items?: BenefitItem[];
  variant?: string;
}

const DEFAULT_BENEFITS: BenefitItem[] = [
  {
    id: "secure-private",
    title: "Seguro e Privado",
    description: "Seus arquivos são protegidos e removidos automaticamente.",
    icon: <ShieldCheck className="w-5 h-5 text-[#1D68F2]" />,
    iconBg: "bg-[#EFF6FF]",
    iconBorder: "border-[#BFDBFE]",
    iconColor: "text-[#1D68F2]"
  },
  {
    id: "fast-efficient",
    title: "Rápido e Eficiente",
    description: "Processamento ultrarrápido direto no seu navegador.",
    icon: <Zap className="w-5 h-5 text-[#10B981] fill-[#10B981]/20" />,
    iconBg: "bg-[#ECFDF5]",
    iconBorder: "border-[#A7F3D0]",
    iconColor: "text-[#10B981]"
  },
  {
    id: "guaranteed-quality",
    title: "Qualidade Garantida",
    description: "Conversões com a melhor qualidade de áudio e vídeo.",
    icon: <Sparkles className="w-5 h-5 text-[#8B5CF6]" />,
    iconBg: "bg-[#F5F3FF]",
    iconBorder: "border-[#DDD6FE]",
    iconColor: "text-[#8B5CF6]"
  },
  {
    id: "any-device",
    title: "Funciona em Qualquer Dispositivo",
    description: "Acesse de onde estiver, no celular, tablet ou computador.",
    icon: <Smartphone className="w-5 h-5 text-[#F59E0B]" />,
    iconBg: "bg-[#FFFBEB]",
    iconBorder: "border-[#FDE68A]",
    iconColor: "text-[#F59E0B]"
  },
  {
    id: "no-install",
    title: "Sem Instalação",
    description: "Tudo online. Você só precisa de um navegador.",
    icon: <Cloud className="w-5 h-5 text-[#0284C7]" />,
    iconBg: "bg-[#F0F9FF]",
    iconBorder: "border-[#BAE6FD]",
    iconColor: "text-[#0284C7]"
  }
];

export const BenefitsBarV2: React.FC<BenefitsBarV2Props> = ({ 
  items = DEFAULT_BENEFITS,
  variant
}) => {
  const displayItems = items || DEFAULT_BENEFITS;
  const isFew = displayItems.length <= 3;

  return (
    <section className="w-full" id="v2-benefits-bar">
      <div className="bg-white border border-[#E2E8F0] rounded-[24px] md:rounded-[28px] p-5 sm:p-6 md:p-7 shadow-[0_2px_16px_rgba(11,31,68,0.03)]">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFew ? "lg:grid-cols-3" : "lg:grid-cols-5"} gap-5 lg:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-[#F1F5F9]`}>
          {displayItems.map((benefit, idx) => (
            <div 
              key={benefit.id || idx}
              className={`flex items-start gap-3.5 pt-4 sm:pt-0 ${idx > 0 ? "lg:pl-6" : ""}`}
            >
              {/* Circular Icon Container matching top.png */}
              <div className={`w-11 h-11 rounded-full ${benefit.iconBg || "bg-[#EFF6FF]"} ${benefit.iconBorder || "border-[#BFDBFE]"} border flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
                {benefit.icon || <ShieldCheck className="w-5 h-5 text-[#1D68F2]" />}
              </div>

              {/* Texts */}
              <div className="space-y-1 text-left">
                <h4 className="text-[13px] sm:text-sm font-black text-[#0B1F44] tracking-tight leading-snug">
                  {benefit.title}
                </h4>
                <p className="text-[11.5px] sm:text-xs text-[#5C6F84] leading-relaxed font-medium">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

