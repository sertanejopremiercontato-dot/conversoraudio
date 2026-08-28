import { useState, useEffect, useCallback } from "react";
import { auth } from "../../../firebase";

export interface AnalyticsSummaryV2 {
  pageViews: number;
  activeUsers: number;
  sessions: number;
  conversions: number;
  downloads: number;
  conversionRate?: string;
}

export interface AnalyticsDailyTrendV2 {
  date: string;
  users: number;
  views: number;
  sessions?: number;
  conversions?: number;
  downloads?: number;
}

export interface AnalyticsTopPageV2 {
  path: string;
  views: number;
  users: number;
}

export interface AnalyticsToolRankingV2 {
  tool: string;
  toolName: string;
  views: number;
  conversions: number;
  downloads: number;
  conversionRate?: string;
  totalOps?: number;
}

export interface AnalyticsBannerItemV2 {
  id: string;
  name: string;
  status: "active" | "inactive";
  placement: string;
  imageUrl?: string;
  linkUrl?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  lastImpressionAt?: string | null;
  lastClickAt?: string | null;
}

export interface AnalyticsCountryItemV2 {
  country: string;
  count: number;
  users?: number;
  sessions?: number;
  percentage: string;
}

export interface AnalyticsRegionItemV2 {
  region: string;
  country: string;
  count: number;
  users?: number;
  sessions?: number;
  percentage: string;
}

export interface AnalyticsCityItemV2 {
  city: string;
  country: string;
  count: number;
  users?: number;
  sessions?: number;
  percentage: string;
}

export interface AnalyticsFunnelV2 {
  sessions: number;
  toolOpens: number;
  conversions: number;
  downloads: number;
  openRate: string;
  conversionRate: string;
  downloadRate: string;
}

export interface AnalyticsLocationRowV2 {
  city: string;
  region: string;
  country: string;
  users: number;
  sessions: number;
}

export interface AnalyticsLocationDataV2 {
  countries: AnalyticsCountryItemV2[];
  regions: AnalyticsRegionItemV2[];
  cities: AnalyticsCityItemV2[];
  table?: AnalyticsLocationRowV2[];
  hasCountryData: boolean;
  hasRegionData: boolean;
  hasCityData: boolean;
}

export interface AnalyticsTrafficSourceV2 {
  source: string;
  medium: string;
  users: number;
  sessions: number;
  percentage?: string;
}

export interface AnalyticsUtmV2 {
  campaign: string;
  count: number;
}

export interface AnalyticsDeviceItemV2 {
  category: string;
  count: number;
  sessions?: number;
  percentage: string;
}

export interface AnalyticsBrowserItemV2 {
  browser: string;
  count: number;
  sessions?: number;
  percentage: string;
}

export interface AnalyticsOsItemV2 {
  os: string;
  count: number;
  sessions?: number;
  percentage: string;
}

export interface AnalyticsEventV2 {
  name: string;
  count: number;
  toolCounts?: Record<string, number>;
}

export interface AnalyticsDataV2 {
  summary: AnalyticsSummaryV2;
  funnel?: AnalyticsFunnelV2;
  dailyTrend: AnalyticsDailyTrendV2[];
  topPages: AnalyticsTopPageV2[];
  toolsRanking?: AnalyticsToolRankingV2[];
  banners?: AnalyticsBannerItemV2[];
  bannersRanking?: AnalyticsBannerItemV2[];
  locations: AnalyticsLocationDataV2;
  trafficSources: AnalyticsTrafficSourceV2[];
  utms?: AnalyticsUtmV2[];
  devices: AnalyticsDeviceItemV2[];
  browsers?: AnalyticsBrowserItemV2[];
  operatingSystems?: AnalyticsOsItemV2[];
  events: AnalyticsEventV2[];
  ga4Configured?: boolean;
  telemetryConfigured?: boolean;
  source?: string;
  app_version?: string;
  fetchedAt: string;
}

export type AnalyticsPeriodV2 = "today" | "7daysAgo" | "30daysAgo" | "total";

export function useAnalyticsV2() {
  const [period, setPeriod] = useState<AnalyticsPeriodV2>("7daysAgo");
  const [data, setData] = useState<AnalyticsDataV2 | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async (selectedPeriod?: AnalyticsPeriodV2) => {
    const activePeriod = selectedPeriod || period;
    setLoading(true);
    setError(null);

    try {
      if (typeof (auth as any).authStateReady === "function") {
        await (auth as any).authStateReady();
      }

      let idToken = "";
      const currentUser = auth.currentUser;
      if (currentUser) {
        idToken = await currentUser.getIdToken();
      }

      const headers: Record<string, string> = {};
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const response = await fetch(`/api/admin/analytics-v2?period=${activePeriod}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "GA4_NOT_CONFIGURED") {
          setIsConfigured(false);
          setData(null);
          setError("Google Analytics / Telemetria ainda não configurada no servidor.");
          return;
        }
        throw new Error(errorData.message || errorData.error || `Erro HTTP ${response.status}`);
      }

      const result: AnalyticsDataV2 = await response.json();
      setData(result);
      setIsConfigured(true);
    } catch (err: any) {
      console.warn("[V2 Analytics] Falha ao carregar métricas da V2:", err);
      setError(err.message || String(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const changePeriod = (newPeriod: AnalyticsPeriodV2) => {
    setPeriod(newPeriod);
    fetchAnalytics(newPeriod);
  };

  return {
    period,
    data,
    loading,
    error,
    isConfigured,
    changePeriod,
    refresh: () => fetchAnalytics(period),
  };
}
