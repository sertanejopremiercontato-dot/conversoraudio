import React from "react";
import { 
  UploadCloud, 
  Sliders, 
  Zap, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";

export const HowItWorksStepsV2: React.FC = () => {
  const steps = [
    {
      stepNumber: 1,
      title: "Envie seu arquivo",
      description: "Envie o arquivo do seu dispositivo com segurança arrastando ou selecionando.",
      icon: <UploadCloud className="w-5 h-5 text-[#1D68F2]" />
    },
    {
      stepNumber: 2,
      title: "Escolha a opção",
      description: "Selecione o formato de saída, qualidade do áudio ou a ação desejada.",
      icon: <Sliders className="w-5 h-5 text-[#1D68F2]" />
    },
    {
      stepNumber: 3,
      title: "Processamos para você",
      description: "Nossa ferramenta processa seu arquivo rapidamente 100% no seu navegador.",
      icon: <Zap className="w-5 h-5 text-[#1D68F2]" />
    },
    {
      stepNumber: 4,
      title: "Baixe o resultado",
      description: "Faça o download imediato do arquivo pronto para usar com qualidade máxima.",
      icon: <Download className="w-5 h-5 text-[#1D68F2]" />
    }
  ];

  return (
    <section className="space-y-6" id="como-funciona">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D68F2]/10 border border-[#BFDBFE] text-[#1D68F2] text-[11px] font-extrabold tracking-wider uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>COMO FUNCIONA</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F44] tracking-tight">
          Muito simples em 4 passos
        </h2>

        <p className="text-xs sm:text-sm text-[#5C6F84] font-medium leading-relaxed max-w-2xl mx-auto">
          Processamento descomplicado, rápido e com privacidade garantida do início ao fim.
        </p>
      </div>

      {/* 4 Connected Step Cards */}
      <div className="bg-white border border-[#E4ECF7] rounded-[24px] p-6 sm:p-8 shadow-[0_2px_14px_rgba(11,31,68,0.03)] relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {steps.map((step, idx) => (
            <div key={step.stepNumber} className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 relative group">
              
              {/* Step indicator and Icon Badge */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1D68F2] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                  {step.stepNumber}
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0 shadow-2xs">
                  {step.icon}
                </div>
              </div>

              {/* Step Title & Details */}
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0B1F44] tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs text-[#5C6F84] leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>

              {/* Status pill */}
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Passo {step.stepNumber}</span>
              </div>
            </div>
          ))}

        </div>

        {/* Bottom Banner inside Como Funciona */}
        <div className="mt-8 pt-6 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8FAFC] rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#0B1F44]">
                Processamento Seguro no Próprio Navegador
              </p>
              <p className="text-[11px] text-[#5C6F84]">
                Nenhum arquivo de áudio ou documento é enviado para a nuvem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#059669]">
            <span className="px-2.5 py-1 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]">
              ✓ Criptografia Local
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]">
              ✓ Sem Retenção
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
