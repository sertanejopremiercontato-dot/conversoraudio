import React from "react";
import { 
  Settings, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Layers, 
  CheckCircle2, 
  Server,
  Zap
} from "lucide-react";

export const SettingsV2: React.FC = () => {
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
            Parâmetros operacionais, limites de conversão e integridade dos serviços
          </p>
        </div>
      </div>

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
