import React, { useState } from "react";
import { Lock, ArrowLeft, Shield, AlertCircle, Loader2 } from "lucide-react";

interface AdminLoginV2Props {
  onLogin: (email: string, pass: string) => Promise<void>;
  onBack: () => void;
  error?: string | null;
  loading?: boolean;
}

export const AdminLoginV2: React.FC<AdminLoginV2Props> = ({
  onLogin,
  onBack,
  error,
  loading = false
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setLocalError("Preencha seu e-mail e senha para continuar.");
      return;
    }

    try {
      setSubmitting(true);
      await onLogin(cleanEmail, password);
    } catch (err: any) {
      setPassword("");
      setLocalError(err.message || "Falha na autenticação.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Header */}
        <div className="space-y-2 text-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao site</span>
          </button>

          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Painel Administrativo V2
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Acesso restrito para gerenciamento da plataforma
          </p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              E-mail
            </label>
            <input
              type="email"
              required
              autoComplete="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Senha
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {submitting || loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Entrar no Painel</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
