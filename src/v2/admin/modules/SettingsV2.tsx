import React, { useState, useEffect } from "react";
import { 
  Settings, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Layers, 
  CheckCircle2, 
  Server,
  Zap,
  EyeOff,
  Eye,
  Check,
  AlertCircle
} from "lucide-react";
import { SupportQrManagerV2 } from "./SupportQrManagerV2";
import { isOwnerExcluded, setOwnerExcluded } from "../../integrations/analytics";

export const SettingsV2: React.FC = () => {
  const [excluded, setExcluded] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setExcluded(isOwnerExcluded());
  }, []);

  const handleToggleExclusion = (enable: boolean) => {
    setOwnerExcluded(enable);
    setExcluded(enable);
    setFeedback(
      enable 
        ? "Exclusão ativada! Este navegador não enviará métricas públicas." 
        : "Métricas permitidas para este navegador durante testes."
    );
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl" id="v2-admin-settings">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Configurações & Diagnóstico do Sistema (V2)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Parâmetros operacionais, controle de autotráfego e integridade dos serviços
          </p>
        </div>
      </div>

      {/* Autotráfego / Exclusão do Navegador do Proprietário */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Excluir este navegador das métricas públicas
            </h4>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
            excluded 
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          }`}>
            {excluded ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            Status: {excluded ? "Ativado (Não gera tráfego)" : "Desativado (Gera tráfego)"}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Garante que suas visitas ao site público (conversores, players, páginas públicas) não inflem os números de sessões, visualizações, conversões ou downloads nas métricas oficiais da plataforma.
        </p>

        {feedback && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {excluded ? (
            <button
              onClick={() => handleToggleExclusion(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Permitir métricas neste navegador (Para testes temporários)
            </button>
          ) : (
            <button
              onClick={() => handleToggleExclusion(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Excluir este navegador das métricas (Recomendado)
            </button>
          )}
        </div>
      </div>

      {/* Seção Principal: Ajude o Desenvolvedor (QR Code de Apoio) */}
      <SupportQrManagerV2 />

      {/* Diagnostic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Engine */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Motor de Processamento de Áudio
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Tecnologia Primária:</span>
              <strong className="text-slate-900 dark:text-white">Web Audio API / OfflineAudioContext</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Taxas de Amostragem (Hz):</span>
              <strong className="text-slate-900 dark:text-white">22.050, 44.100, 48.000, 96.000</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Canais Suportados:</span>
              <strong className="text-slate-900 dark:text-white">Mono (1) / Estéreo (2)</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Limite de Arquivo Recomendado:</span>
              <strong className="text-slate-900 dark:text-white">Até 250 MB por arquivo</strong>
            </div>
          </div>
        </div>

        {/* Security & Isolation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Segurança & Isolamento
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Isolamento V1 / V2:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Isolado
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Autenticação Administrativa:</span>
              <strong className="text-slate-900 dark:text-white">Firebase Auth (RBAC)</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Armazenamento de Anúncios:</span>
              <strong className="text-slate-900 dark:text-white">Firestore (Coleção &apos;ads&apos;)</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Privacidade dos Dados de Usuários:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Arquivos 100% no Cliente</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
