import React from "react";
import { useSeoHead } from "../../lib/useSeoHead";
import { FileSpreadsheet, FileText, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface DocumentHubProps {
  onNavigate?: (path: string) => void;
}

export default function DocumentHub({ onNavigate }: DocumentHubProps) {
  useSeoHead("documentHub");

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 bg-[#E0F2FE] border border-[#BAE6FD] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0284C7]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hub de Ferramentas de Documentos</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A]" id="document-hub-title">
          Ferramentas de Documentos Online Grátis
        </h1>

        <p className="text-xs md:text-sm text-[#475569] leading-relaxed max-w-xl mx-auto font-medium">
          Converta e organize arquivos de documentos com ferramentas simples, rápidas e 100% privadas no seu navegador.
        </p>
      </div>

      {/* Grid of Available Document Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Card: Extrair Texto de PDF */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#0284C7]/50 p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all"
          onClick={() => onNavigate?.("/pdf/extrair-texto")}
          id="card-pdf-extract-text"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#E0F2FE] rounded-2xl border border-[#BAE6FD] text-[#0284C7] inline-block group-hover:scale-105 transition-transform">
              <FileText className="h-6 w-6" />
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 bg-[#E0F2FE] text-[#0284C7] font-bold text-[10px] rounded-full uppercase tracking-wider mb-2">
                PDF & Documentos
              </div>
              <h3 className="font-display text-lg font-bold text-[#0F172A] group-hover:text-[#0284C7] transition-colors">
                Extrair Texto de PDF
              </h3>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed font-medium">
                Extraia o texto contido em documentos PDF por página, de forma rápida, com opção de cópia e download em TXT.
              </p>
            </div>

            <ul className="text-[11px] text-[#475569] space-y-1.5 pt-2 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Visualização organizada por página
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Cópia rápida de trechos
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Download em TXT e DOC
              </li>
            </ul>
          </div>

          <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:translate-x-1 transition-transform">
            <span>Extrair Texto</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Card: Ferramentas de PDF Gerais */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#0284C7]/50 p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all"
          onClick={() => onNavigate?.("/pdf")}
          id="card-pdf-general-tools"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#E0F2FE] rounded-2xl border border-[#BAE6FD] text-[#0284C7] inline-block group-hover:scale-105 transition-transform">
              <FileText className="h-6 w-6" />
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 bg-[#E0F2FE] text-[#0284C7] font-bold text-[10px] rounded-full uppercase tracking-wider mb-2">
                Suíte de PDF
              </div>
              <h3 className="font-display text-lg font-bold text-[#0F172A] group-hover:text-[#0284C7] transition-colors">
                Ferramentas PDF
              </h3>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed font-medium">
                Junte, comprima, organize e converta imagens em PDF diretamente no navegador.
              </p>
            </div>

            <ul className="text-[11px] text-[#475569] space-y-1.5 pt-2 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Juntar e organizar arquivos PDF
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Comprimir tamanho sem perda de qualidade
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0284C7] rounded-full" />
                Converter fotos e imagens em PDF
              </li>
            </ul>
          </div>

          <div className="pt-6 flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:translate-x-1 transition-transform">
            <span>Acessar Ferramentas PDF</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>
      </div>

      {/* Security Disclaimer */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-center space-x-3 max-w-3xl mx-auto text-center shadow-xs">
        <ShieldCheck className="h-5 w-5 text-[#0284C7] shrink-0" />
        <p className="text-xs text-[#475569] font-medium leading-relaxed">
          🔒 Seus documentos não são salvos em nenhum servidor. O processamento ocorre no seu computador.
        </p>
      </div>
    </div>
  );
}
