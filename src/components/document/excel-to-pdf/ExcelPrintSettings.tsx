import React, { useState } from "react";
import {
  PrintSettings,
  PageSizeOption,
  OrientationOption,
  MarginOption,
  ScalingModeOption,
  calculateSmartSettings
} from "../../../utils/document/excelPrintSettings";
import { ParsedSheet } from "../../../services/document/excelReaderService";
import { Sliders, Sparkles, CheckCircle2, Layout, Maximize2, Repeat, FileSpreadsheet } from "lucide-react";

interface ExcelPrintSettingsProps {
  settings: PrintSettings;
  onChange: (updatedSettings: PrintSettings) => void;
  activeSheet?: ParsedSheet;
}

export default function ExcelPrintSettings({
  settings,
  onChange,
  activeSheet
}: ExcelPrintSettingsProps) {
  const [rangeInputError, setRangeInputError] = useState<string | null>(null);

  const smartSuggestion = activeSheet ? calculateSmartSettings(activeSheet, settings.pageSize, settings.margin) : null;

  const applySmartSettings = () => {
    if (!smartSuggestion) return;
    onChange({
      ...settings,
      orientation: smartSuggestion.suggestedOrientation,
      scalingMode: smartSuggestion.suggestedScalingMode,
      repeatHeader: {
        ...settings.repeatHeader,
        enabled: smartSuggestion.suggestedRepeatHeader
      }
    });
  };

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleCustomRangeChange = (val: string) => {
    const uppercaseVal = val.toUpperCase().trim();
    if (uppercaseVal && !/^[A-Z]+\d+:[A-Z]+\d+$/.test(uppercaseVal)) {
      setRangeInputError("Intervalo inválido. Use o formato A1:H50");
    } else {
      setRangeInputError(null);
    }

    updateSetting("printArea", {
      ...settings.printArea,
      customRange: uppercaseVal
    });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-100">
              Configurações de Impressão e Página
            </h3>
            <p className="text-xs text-slate-400">
              Ajuste papel, orientação, margens, escalas e cabeçalhos para o PDF final
            </p>
          </div>
        </div>
      </div>

      {/* Smart Adjustment Banner */}
      {smartSuggestion && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold text-emerald-300 block text-xs">Ajuste Inteligente Recomendado</span>
              <p className="text-slate-300 leading-relaxed mt-0.5">{smartSuggestion.reason}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={applySmartSettings}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 cursor-pointer transition-all shadow-md shadow-emerald-500/20"
          >
            Aplicar Ajuste Inteligente
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tamanho da Página */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Tamanho da Página</label>
          <select
            value={settings.pageSize}
            onChange={(e) => updateSetting("pageSize", e.target.value as PageSizeOption)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="A4">A4 (210 x 297 mm)</option>
            <option value="Carta">Carta (215.9 x 279.4 mm)</option>
            <option value="Oficio">Ofício (215.9 x 355.6 mm)</option>
            <option value="A3">A3 (297 x 420 mm)</option>
          </select>
        </div>

        {/* Orientação */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Orientação</label>
          <select
            value={settings.orientation}
            onChange={(e) => updateSetting("orientation", e.target.value as OrientationOption)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="auto">Automática (Inteligente)</option>
            <option value="portrait">Retrato (Vertical)</option>
            <option value="landscape">Paisagem (Horizontal)</option>
          </select>
        </div>

        {/* Margens */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Margens</label>
          <select
            value={settings.margin}
            onChange={(e) => updateSetting("margin", e.target.value as MarginOption)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="small">Pequenas (8 mm)</option>
            <option value="normal">Normais (15 mm)</option>
            <option value="large">Grandes (25 mm)</option>
          </select>
        </div>

        {/* Escala de Impressão */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Escala de Impressão</label>
          <select
            value={settings.scalingMode}
            onChange={(e) => updateSetting("scalingMode", e.target.value as ScalingModeOption)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="fit_columns">Ajustar colunas na largura da página (Padrão)</option>
            <option value="fit_sheet">Ajustar planilha inteira em 1 página</option>
            <option value="fit_rows">Ajustar linhas na altura da página</option>
            <option value="real">Tamanho real (100%)</option>
            <option value="custom">Escala personalizada (%)</option>
          </select>
        </div>
      </div>

      {/* Custom scale percentage input */}
      {settings.scalingMode === "custom" && (
        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 max-w-xs space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Porcentagem de Escala (10% a 200%)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={200}
              value={settings.customScalePercent}
              onChange={(e) => updateSetting("customScalePercent", Number(e.target.value))}
              className="w-28 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-semibold">%</span>
          </div>
        </div>
      )}

      {/* Advanced Toggles Section */}
      <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cabeçalho e Rodapé */}
        <div className="space-y-3 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.headerFooter.enabled}
                onChange={(e) =>
                  updateSetting("headerFooter", {
                    ...settings.headerFooter,
                    enabled: e.target.checked
                  })
                }
                className="rounded accent-emerald-500 h-4 w-4"
              />
              <span>Incluir Cabeçalho e Rodapé</span>
            </label>
          </div>

          {settings.headerFooter.enabled && (
            <div className="space-y-2 pl-6 pt-2 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.headerFooter.showSheetName}
                    onChange={(e) =>
                      updateSetting("headerFooter", {
                        ...settings.headerFooter,
                        showSheetName: e.target.checked
                      })
                    }
                    className="rounded accent-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Nome da aba no topo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.headerFooter.showPageNumber}
                    onChange={(e) =>
                      updateSetting("headerFooter", {
                        ...settings.headerFooter,
                        showPageNumber: e.target.checked
                      })
                    }
                    className="rounded accent-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Número da página no rodapé</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.headerFooter.showDate}
                    onChange={(e) =>
                      updateSetting("headerFooter", {
                        ...settings.headerFooter,
                        showDate: e.target.checked
                      })
                    }
                    className="rounded accent-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Data da conversão</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.headerFooter.showFilename}
                    onChange={(e) =>
                      updateSetting("headerFooter", {
                        ...settings.headerFooter,
                        showFilename: e.target.checked
                      })
                    }
                    className="rounded accent-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Nome do arquivo</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Repetir Cabeçalho da Tabela & Área de Impressão */}
        <div className="space-y-3 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.repeatHeader.enabled}
              onChange={(e) =>
                updateSetting("repeatHeader", {
                  ...settings.repeatHeader,
                  enabled: e.target.checked
                })
              }
              className="rounded accent-emerald-500 h-4 w-4"
            />
            <span>Repetir primeira linha da tabela em todas as páginas</span>
          </label>

          <div className="pt-2 border-t border-slate-800/60 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Área de Impressão</label>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="printAreaType"
                  value="auto"
                  checked={settings.printArea.type === "auto"}
                  onChange={() =>
                    updateSetting("printArea", { ...settings.printArea, type: "auto" })
                  }
                  className="accent-emerald-500"
                />
                <span>Área usada automaticamente</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="printAreaType"
                  value="custom"
                  checked={settings.printArea.type === "custom"}
                  onChange={() =>
                    updateSetting("printArea", { ...settings.printArea, type: "custom" })
                  }
                  className="accent-emerald-500"
                />
                <span>Intervalo personalizado</span>
              </label>
            </div>

            {settings.printArea.type === "custom" && (
              <div className="space-y-1 pt-1">
                <input
                  type="text"
                  placeholder="Ex: A1:H50"
                  value={settings.printArea.customRange}
                  onChange={(e) => handleCustomRangeChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none uppercase"
                />
                {rangeInputError && <p className="text-[11px] text-red-400">{rangeInputError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
