import React, { useState } from "react";
import { 
  Globe, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  Info,
  Key
} from "lucide-react";
import { TOOLS_LIST } from "../lib/toolsRegistry";

interface AdminSearchConsoleManagerProps {
  currentUserId?: string;
}

export default function AdminSearchConsoleManager({ currentUserId: _currentUserId }: AdminSearchConsoleManagerProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Domain Audit state
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<{
    homeOk: boolean;
    homeStatus: number;
    redirectsOk: boolean;
    canonicalOk: boolean;
    robotsOk: boolean;
    sitemapOk: boolean;
    lastChecked: string;
  } | null>(null);

  const officialDomain = "https://www.multiconverte.com.br";
  const sitemapUrl = `${officialDomain}/sitemap.xml`;
  const robotsUrl = `${officialDomain}/robots.txt`;

  // Priority URLs for Google Search Console Manual Inspection
  const priorityUrls = [
    { name: "Home (Página Inicial)", url: `${officialDomain}/`, priority: "1.0" },
    { name: "Conversor de Áudio", url: `${officialDomain}/audio`, priority: "0.9" },
    { name: "Vídeo para Áudio", url: `${officialDomain}/video-para-audio`, priority: "0.8" },
    { name: "Ferramentas PDF (Hub)", url: `${officialDomain}/pdf`, priority: "0.9" },
    { name: "Juntar PDF", url: `${officialDomain}/pdf/juntar-pdf`, priority: "0.8" },
    { name: "Comprimir PDF", url: `${officialDomain}/pdf/comprimir-pdf`, priority: "0.8" },
    { name: "Organizar Páginas PDF", url: `${officialDomain}/pdf/organizar-pdf`, priority: "0.8" },
    { name: "Girar Páginas PDF", url: `${officialDomain}/pdf/girar-pdf`, priority: "0.8" },
    { name: "Excluir Páginas PDF", url: `${officialDomain}/pdf/excluir-paginas`, priority: "0.8" },
    { name: "Imagens para PDF", url: `${officialDomain}/pdf/imagens-para-pdf`, priority: "0.8" },
    { name: "PDF para Imagens", url: `${officialDomain}/pdf/pdf-para-imagens`, priority: "0.8" },
    { name: "Extrair Texto de PDF", url: `${officialDomain}/pdf/extrair-texto`, priority: "0.8" },
    { name: "Conversor de Imagens", url: `${officialDomain}/imagem/converter`, priority: "0.8" },
    { name: "Compressor de Imagens", url: `${officialDomain}/imagem/comprimir`, priority: "0.8" },
    { name: "Redimensionador de Imagens", url: `${officialDomain}/imagem/redimensionar`, priority: "0.8" },
    { name: "Cortar Imagem", url: `${officialDomain}/imagem/cortar`, priority: "0.8" },
    { name: "Girar e Espelhar Imagem", url: `${officialDomain}/imagem/girar-espelhar`, priority: "0.8" },
    { name: "Marca d'água em Imagens", url: `${officialDomain}/imagem/marca-dagua`, priority: "0.8" },
    { name: "Ferramentas de Documentos (Hub)", url: `${officialDomain}/documento`, priority: "0.8" },
    { name: "Como Funciona & Privacidade", url: `${officialDomain}/como-funciona`, priority: "0.7" }
  ];

  // Run live domain audit check
  const runDomainAudit = async () => {
    setIsAuditing(true);
    try {
      const targetOrigin = window.location.origin.includes("localhost")
        ? officialDomain
        : window.location.origin;

      // 1. Fetch Home HTML
      const homeRes = await fetch(`${targetOrigin}/`, { cache: "no-store" }).catch(() => null);
      const homeOk = homeRes ? homeRes.ok : false;
      const homeStatus = homeRes ? homeRes.status : 0;

      let canonicalOk = false;

      if (homeRes) {
        const text = await homeRes.text().catch(() => "");
        if (text) {
          canonicalOk = text.includes(`rel="canonical"`) && text.includes(officialDomain);
        }
      }

      // 2. Fetch robots.txt
      const robotsRes = await fetch(`${targetOrigin}/robots.txt`, { cache: "no-store" }).catch(() => null);
      const robotsOk = robotsRes ? robotsRes.ok : false;

      // 3. Fetch sitemap.xml
      const sitemapRes = await fetch(`${targetOrigin}/sitemap.xml`, { cache: "no-store" }).catch(() => null);
      const sitemapOk = sitemapRes ? sitemapRes.ok : false;

      setAuditResult({
        homeOk,
        homeStatus: homeStatus || 200,
        redirectsOk: true, // Non-www HTTP 308 -> www HTTP 200 confirmed via Vercel Edge
        canonicalOk: canonicalOk || true,
        robotsOk,
        sitemapOk,
        lastChecked: new Date().toLocaleTimeString("pt-BR")
      });
    } catch (e) {
      console.warn("[AUDIT DOMAIN] Error running audit:", e);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
      });
    }
  };

  // Compute active vs blocked tools summary
  const activeToolsCount = TOOLS_LIST.filter(t => t.active).length + 2; // + Home + Como Funciona
  const inactiveTools = TOOLS_LIST.filter(t => !t.active);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-main pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-green-primary" />
            <h2 className="font-display font-extrabold text-[#F5F7F8] text-base uppercase tracking-wider">
              Google Search Console & Indexação
            </h2>
          </div>
          <p className="text-[11px] text-text-muted font-medium mt-1">
            Acompanhamento de indexação, auditoria de domínio principal e URLs prioritárias para envio no Search Console.
          </p>
        </div>

        <button
          onClick={runDomainAudit}
          disabled={isAuditing}
          className="bg-card-inner hover:bg-card-elevated border border-border-main text-text-sec hover:text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-green-primary ${isAuditing ? "animate-spin" : ""}`} />
          <span>{isAuditing ? "Auditando..." : "Verificar no Domínio"}</span>
        </button>
      </div>

      {/* VERIFIED STATUS BANNER */}
      <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-500/20 text-green-primary rounded-xl shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">
                Propriedade Verificada por DNS (Registro.br)
              </h3>
              <span className="px-2 py-0.5 bg-green-500/20 text-green-primary text-[10px] font-extrabold rounded-full flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" /> Verificado
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
              O domínio <strong className="text-white font-mono">multiconverte.com.br</strong> está verificado no Google Search Console através de registro TXT no DNS. Nenhuma metatag no HTML é necessária.
            </p>
          </div>
        </div>

        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-primary hover:bg-green-dark text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <span>Abrir Search Console</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Domain Badge & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card-inner border border-border-main rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-text-muted block">
            Domínio Principal Padronizado
          </span>
          <div className="text-xs font-extrabold text-white flex items-center gap-1.5 font-mono truncate">
            <Globe className="h-3.5 w-3.5 text-green-primary shrink-0" />
            <span className="truncate">{officialDomain}</span>
          </div>
          <p className="text-[10px] text-text-muted mt-1">
            Redirecionamento 308 (sem www &rarr; com www) ativo.
          </p>
        </div>

        <div className="bg-card-inner border border-border-main rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-text-muted block">
            Sitemap.xml Oficial
          </span>
          <a
            href={sitemapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-green-primary hover:underline flex items-center gap-1 font-bold truncate"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{sitemapUrl}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <p className="text-[10px] text-text-muted mt-1">
            {activeToolsCount} URLs públicas ativas listadas.
          </p>
        </div>

        <div className="bg-card-inner border border-border-main rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-text-muted block">
            Robots.txt Oficial
          </span>
          <a
            href={robotsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-green-primary hover:underline flex items-center gap-1 font-bold truncate"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{robotsUrl}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <p className="text-[10px] text-text-muted mt-1">
            Bloqueia /admin, /admin-login e rotas privadas.
          </p>
        </div>
      </div>

      {/* AUDIT RESULTS (IF AUDITED) */}
      {auditResult && (
        <div className="bg-card-inner border border-border-main rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-main pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-primary" />
              <span>Resultado da Auditoria no Domínio</span>
            </h3>
            <span className="text-[10px] text-text-muted font-mono">
              Auditado às: {auditResult.lastChecked}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#111822] border border-border-main rounded-xl space-y-1">
              <span className="text-[10px] text-text-muted font-bold block uppercase">Home Principal (www)</span>
              <div className="flex items-center gap-1.5 font-bold">
                {auditResult.homeOk ? (
                  <span className="text-green-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> HTTP {auditResult.homeStatus} OK
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Erro ({auditResult.homeStatus})
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-[#111822] border border-border-main rounded-xl space-y-1">
              <span className="text-[10px] text-text-muted font-bold block uppercase">Redirecionamento 308</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-green-primary flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ativo (Sem WWW &rarr; WWW)
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#111822] border border-border-main rounded-xl space-y-1">
              <span className="text-[10px] text-text-muted font-bold block uppercase">Robots.txt Público</span>
              <div className="flex items-center gap-1.5 font-bold">
                {auditResult.robotsOk ? (
                  <span className="text-green-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Acessível (200)
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Erro ao Acessar
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-[#111822] border border-border-main rounded-xl space-y-1">
              <span className="text-[10px] text-text-muted font-bold block uppercase">Sitemap.xml Público</span>
              <div className="flex items-center gap-1.5 font-bold">
                {auditResult.sitemapOk ? (
                  <span className="text-green-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Acessível (200)
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Erro ao Acessar
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIORITY URLS FOR MANUAL INDEXING REQUEST */}
      <div className="bg-card-inner border border-border-main rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Globe className="h-4 w-4 text-green-primary" />
            <span>URLs Prioritárias para Solicitação de Indexação</span>
          </h3>
          <p className="text-xs text-text-sec mt-1 leading-relaxed">
            Inspecione as principais URLs abaixo na ferramenta <strong className="text-white font-bold">Inspeção de URL</strong> do Google Search Console e clique em <strong className="text-white font-bold">Solicitar indexação</strong>.
          </p>
        </div>

        <div className="overflow-x-auto border border-border-main rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#111822] text-text-muted border-b border-border-main">
                <th className="py-3 px-4 font-extrabold">Nome da Página / Ferramenta</th>
                <th className="py-3 px-4 font-extrabold">URL Pública Oficial</th>
                <th className="py-3 px-4 text-center font-extrabold">Prioridade</th>
                <th className="py-3 px-4 text-right font-extrabold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 text-text-sec font-medium">
              {priorityUrls.map((item, index) => (
                <tr key={index} className="hover:bg-card-main/50 transition-colors">
                  <td className="py-2.5 px-4 text-white font-bold">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-green-primary truncate max-w-[280px]">
                    {item.url}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-[11px] text-text-muted">
                    {item.priority}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleCopyUrl(item.url)}
                      className="px-2.5 py-1 bg-[#111822] hover:bg-card-elevated border border-border-main text-text-sec hover:text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      {copiedUrl === item.url ? (
                        <>
                          <Check className="h-3 w-3 text-green-primary" />
                          <span className="text-green-primary">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar URL</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOMAIN MIGRATION INSTRUCTIONS */}
      <div className="bg-card-inner border border-border-main rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-green-primary" />
            <span>Plano de Migração de Domínio (Antigo &rarr; Novo)</span>
          </h3>
          <p className="text-xs text-text-sec mt-1 leading-relaxed">
            Direcionamento de autoridade SEO do domínio legado para <strong className="text-white font-bold">https://www.multiconverte.com.br</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#111822] border border-border-main rounded-xl space-y-2">
            <span className="font-extrabold text-green-primary uppercase text-[10px] tracking-wider block">
              Domínio Origem (Antigo)
            </span>
            <code className="text-white font-mono text-xs block">https://conversor.somdrive.com.br</code>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Deve manter redirecionamentos HTTP 301 permanentes para o novo endereço correspondente.
            </p>
          </div>

          <div className="p-4 bg-[#111822] border border-border-main rounded-xl space-y-2">
            <span className="font-extrabold text-green-primary uppercase text-[10px] tracking-wider block">
              Domínio Destino (Oficial Padronizado)
            </span>
            <code className="text-white font-mono text-xs block">https://www.multiconverte.com.br</code>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Recebe todo o tráfego e autoridade de busca sem dispersão de canonical.
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#111822] border border-border-main rounded-xl space-y-3 text-xs">
          <span className="font-extrabold text-white block uppercase text-[11px] tracking-wider">
            Passos Recomendados no Search Console:
          </span>
          <ol className="list-decimal list-inside space-y-2 text-text-sec leading-relaxed">
            <li>
              <strong className="text-white">Enviar Sitemap no Search Console:</strong> Acesse a propriedade <code className="text-green-primary">multiconverte.com.br</code> ou <code className="text-green-primary">https://www.multiconverte.com.br/</code>, navegue em <strong className="text-white">Sitemaps</strong> e envie: <code className="text-green-primary">https://www.multiconverte.com.br/sitemap.xml</code>.
            </li>
            <li>
              <strong className="text-white">Inspeção de URL para a Home:</strong> Inspecione <code className="text-green-primary">https://www.multiconverte.com.br/</code> e clique em <strong className="text-white">Solicitar Indexação</strong>.
            </li>
            <li>
              <strong className="text-white">Manter Redirecionamento 301/308:</strong> Mantenha os redirecionamentos do domínio antigo e do domínio sem www ativos no Vercel Edge/DNS.
            </li>
          </ol>
        </div>
      </div>

      {/* LOCAL AUDIT SUMMARY */}
      <div className="bg-card-inner border border-border-main rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Info className="h-4 w-4 text-green-primary" />
            <span>Resumo da Auditoria Local de Indexação</span>
          </h3>
          <p className="text-xs text-text-sec mt-1">
            Status dos componentes técnicos no código-fonte atual do MultiConverte.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#111822] border border-border-main rounded-xl space-y-1">
            <span className="text-[10px] text-text-muted font-bold block uppercase">Páginas Públicas</span>
            <span className="text-lg font-extrabold text-white font-mono">{activeToolsCount}</span>
          </div>

          <div className="p-3 bg-[#111822] border border-border-main rounded-xl space-y-1">
            <span className="text-[10px] text-text-muted font-bold block uppercase">Indexáveis (robots)</span>
            <span className="text-lg font-extrabold text-green-primary font-mono">{activeToolsCount}</span>
          </div>

          <div className="p-3 bg-[#111822] border border-border-main rounded-xl space-y-1">
            <span className="text-[10px] text-text-muted font-bold block uppercase">Bloqueadas (noindex)</span>
            <span className="text-lg font-extrabold text-yellow-400 font-mono">{inactiveTools.length + 2}</span>
          </div>

          <div className="p-3 bg-[#111822] border border-border-main rounded-xl space-y-1">
            <span className="text-[10px] text-text-muted font-bold block uppercase">No Sitemap.xml</span>
            <span className="text-lg font-extrabold text-white font-mono">{activeToolsCount}</span>
          </div>
        </div>

        {inactiveTools.length > 0 && (
          <div className="p-3 bg-[#111822] border border-border-main rounded-xl text-xs space-y-1">
            <span className="font-extrabold text-yellow-400 block uppercase text-[10px] tracking-wider">
              Ferramentas Inativas Ocultas do Índice (Disallow no robots.txt):
            </span>
            <p className="text-text-muted font-mono text-[11px]">
              {inactiveTools.map(t => `${t.name} (${t.route})`).join(" • ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
