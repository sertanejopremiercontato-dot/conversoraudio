import React, { useState, useEffect } from "react";
import { MonetizationConfigV2 } from "../types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Save, 
  ShieldCheck, 
  Code, 
  FileText,
  Loader2 
} from "lucide-react";

interface MonetizationManagerV2Props {
  monetization: MonetizationConfigV2 | null;
  onRefresh: () => void;
}

export const MonetizationManagerV2: React.FC<MonetizationManagerV2Props> = ({
  monetization,
  onRefresh
}) => {
  const [adsenseEnabled, setAdsenseEnabled] = useState(monetization?.adsenseEnabled ?? true);
  const [publisherId, setPublisherId] = useState(monetization?.publisherId || "ca-pub-8846628306821055");
  const [domain, setDomain] = useState(monetization?.domain || "");
  const [notes, setNotes] = useState(monetization?.notes || "");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (monetization) {
      setAdsenseEnabled(monetization.adsenseEnabled);
      if (monetization.publisherId) setPublisherId(monetization.publisherId);
      if (monetization.domain) setDomain(monetization.domain);
      if (monetization.notes) setNotes(monetization.notes);
    }
  }, [monetization]);

  const cleanPubId = publisherId.startsWith("pub-") 
    ? `ca-${publisherId}` 
    : publisherId.startsWith("ca-pub-") 
    ? publisherId 
    : `ca-pub-${publisherId}`;

  const snippetCode = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cleanPubId}" crossorigin="anonymous"></script>`;
  const metaTagCode = `<meta name="google-adsense-account" content="${cleanPubId}">`;
  const adsTxtLine = `google.com, ${cleanPubId.replace("ca-", "")}, DIRECT, f08c47fec0942fa0`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      const docRef = doc(db, "site_settings", "adsense");
      const payload = {
        adsenseEnabled,
        publisherId: cleanPubId,
        domain: domain.trim(),
        notes: notes.trim(),
        verificationSnippet: snippetCode,
        verificationMetaTag: metaTagCode,
        verificationAdsTxtLine: adsTxtLine,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });
      onRefresh();
      setSuccess("Configurações de monetização salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar monetização:", err);
      setError(err.message || "Erro ao salvar dados no Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl" id="v2-admin-monetization-manager">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Google AdSense & Monetização
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle de publisher ID, snippet oficial e verificação de propriedade
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Configuração Ativa</span>
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="adsense-active-toggle"
            checked={adsenseEnabled}
            onChange={(e) => setAdsenseEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
          <label htmlFor="adsense-active-toggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            Ativar veiculação de anúncios Google AdSense na plataforma
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Publisher ID (ID do Editor)
            </label>
            <input
              type="text"
              required
              value={publisherId}
              onChange={(e) => setPublisherId(e.target.value)}
              placeholder="ca-pub-8846628306821055"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Domínio Associado
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="https://meudominio.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Snippets / Tags preview & Copy boxes */}
        <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Códigos de Verificação Gerados
          </h4>

          {/* Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-500" />
                <span>Script Oficial do AdSense</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(snippetCode, "snippet")}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "snippet" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "snippet" ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto select-all">
              {snippetCode}
            </pre>
          </div>

          {/* Meta Tag */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-500" />
                <span>Meta Tag de Conta</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(metaTagCode, "metatag")}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "metatag" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "metatag" ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto select-all">
              {metaTagCode}
            </pre>
          </div>

          {/* ads.txt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Linha para ads.txt</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(adsTxtLine, "adstxt")}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "adstxt" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "adstxt" ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto select-all">
              {adsTxtLine}
            </pre>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Monetização</span>
          </button>
        </div>
      </form>
    </div>
  );
};
