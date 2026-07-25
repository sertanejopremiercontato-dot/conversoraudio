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
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hub de Ferramentas de Documentos</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100" id="document-hub-title">
          Ferramentas de Documentos Online Grátis
        </h1>

        <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
          Converta e organize arquivos de documentos com ferramentas simples, rápidas e 100% privadas no seu navegador.
        </p>
      </div>

      {/* Grid of Available Document Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Card 1: Excel para PDF */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-slate-900/40 rounded-3xl border border-slate-900 p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group cursor-pointer"
          onClick={() => onNavigate?.("/documento/excel-para-pdf")}
          id="card-excel-to-pdf"
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 inline-block">
              <FileSpreadsheet className="h-6 w-6" />
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] rounded-full uppercase tracking-wider mb-2">
                Novo • Planilhas
              </div>
              <h3 className="font-display text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                Excel para PDF
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Converta planilhas Excel (XLSX, XLS, CSV) em PDF, escolha as abas, ajuste orientação, margens e tamanho do papel.
              </p>
            </div>

            <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Ajuste automático para evitar cortes
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Múltiplas abas e renomeação
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Repetição de cabeçalho
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Preserva cores e bordas
              </li>
            </ul>
          </div>

          <div className="pt-6 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Converter Excel</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>

        {/* Card 2: Extrair Texto de PDF */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-slate-900/40 rounded-3xl border border-slate-900 p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group cursor-pointer"
          onClick={() => onNavigate?.("/pdf/extrair-texto")}
          id="card-pdf-extract-text"
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 inline-block">
              <FileText className="h-6 w-6" />
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] rounded-full uppercase tracking-wider mb-2">
                PDF & Documentos
              </div>
              <h3 className="font-display text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                Extrair Texto de PDF
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Extraia o texto contido em documentos PDF por página, de forma rápida, com opção de cópia e download em TXT.
              </p>
            </div>

            <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Visualização organizada por página
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Cópia rápida de trechos
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Download em TXT e DOC
              </li>
            </ul>
          </div>

          <div className="pt-6 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Extrair Texto</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.div>
      </div>

      {/* Security Disclaimer */}
      <div className="bg-slate-950/40 rounded-2xl border border-slate-900/60 p-4 flex items-center justify-center space-x-3 max-w-3xl mx-auto text-center">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
        <p className="text-xs text-slate-300 font-medium leading-relaxed">
          🔒 Seus documentos não são salvos em nenhum servidor. O processamento ocorre no seu computador.
        </p>
      </div>
    </div>
  );
}
