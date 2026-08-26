import { useState, useEffect, useCallback } from "react";
import { auth } from "../../../firebase";

export interface AnalyticsSummaryV2 {
  pageViews: number;
  activeUsers: number;
  sessions: number;
  conversions: number;
  downloads: number;
}

export interface AnalyticsDailyTrendV2 {
  date: string;
  users: number;
  views: number;
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
}

export interface AnalyticsLocationV2 {
  country: string;
  region: string;
  city: string;
  users: number;
  sessions: number;
}

export interface AnalyticsTrafficSourceV2 {
  source: string;
  medium: string;
  users: number;
  sessions: number;
}

export interface AnalyticsDeviceV2 {
  category: string;
  os: string;
  browser: string;
  users: number;
  sessions: number;
}

export interface AnalyticsEventV2 {
  name: string;
  count: number;
  toolCounts?: Record<string, number>;
}

export interface AnalyticsDataV2 {
  summary: AnalyticsSummaryV2;
  dailyTrend: AnalyticsDailyTrendV2[];
  topPages: AnalyticsTopPageV2[];
  toolsRanking?: AnalyticsToolRankingV2[];
  locations: AnalyticsLocationV2[];
  trafficSources: AnalyticsTrafficSourceV2[];
  devices: AnalyticsDeviceV2[];
  events: AnalyticsEventV2[];
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
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Usuário administrador não autenticado.");
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/admin/analytics-v2?period=${activePeriod}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
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
