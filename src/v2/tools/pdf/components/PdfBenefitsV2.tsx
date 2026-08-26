import React from "react";
import { ShieldCheck, Zap, Sparkles, Smartphone, Cloud } from "lucide-react";

export const PdfBenefitsV2: React.FC = () => {
  const benefits = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#EF4444]" />,
      iconBg: "bg-[#FEF2F2] border border-[#FECACA]",
      title: "Seguro e Privado",
      desc: "Seus arquivos são protegidos e removidos automaticamente."
    },
    {
      icon: <Zap className="w-5 h-5 text-[#16A34A] fill-[#16A34A]" />,
      iconBg: "bg-[#F0FDF4] border border-[#BBF7D0]",
      title: "Rápido e Eficiente",
      desc: "Processamento ultrarrápido direto no seu navegador."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#8B5CF6]" />,
      iconBg: "bg-[#F5F3FF] border border-[#DDD6FE]",
      title: "Qualidade Otimizada",
      desc: "Conversões com a melhor fidelidade para seus documentos."
    },
    {
      icon: <Smartphone className="w-5 h-5 text-[#EA580C]" />,
      iconBg: "bg-[#FFF7ED] border border-[#FFEDD5]",
      title: "Funciona em Qualquer Dispositivo",
      desc: "Acesse de onde estiver, no celular, tablet ou computador."
    },
    {
      icon: <Cloud className="w-5 h-5 text-[#2563EB]" />,
      iconBg: "bg-[#EFF6FF] border border-[#BFDBFE]",
      title: "Sem Instalação",
      desc: "Tudo online. Você só precisa de um navegador."
    }
  ];

  return (
    <section 
      className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 sm:p-7 shadow-xs"
      id="v2-pdf-benefits-bar"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-0 lg:divide-x lg:divide-[#F1F5F9]">
        {benefits.map((item, index) => (
          <div 
            key={index}
            className="flex items-center gap-3.5 px-3 lg:px-4 first:pl-0 last:pr-0"
          >
            <div className={`w-11 h-11 rounded-full ${item.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
              {item.icon}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#0F172A] tracking-tight leading-snug">
                {item.title}
              </h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
