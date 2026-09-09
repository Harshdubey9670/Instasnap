import * as Linking from "expo-linking";

import api from "./api";

type RequestPayload = Record<string, unknown>;

export const getOverviewStats = async (
  timeframe = "30d",
) => {
  const response = await api.get("/api/creator/overview", {
    params: { timeframe },
  });
  return response.data;
};

export const getInsights = async (
  timeframe = "30d",
) => {
  const response = await api.get("/api/creator/insights", {
    params: { timeframe },
  });
  return response.data;
};

export const getAudienceAnalytics = async () => {
  const response = await api.get("/api/creator/audience");
  return response.data;
};

export const getContentPerformance = async (
  type = "all",
) => {
  const response = await api.get("/api/creator/content", {
    params: { type },
  });
  return response.data;
};

export const getDraftsAndScheduled = async () => {
  const response = await api.get(
    "/api/creator/content-manager",
  );
  return response.data;
};

export const bulkContentAction = async (
  payload: RequestPayload,
) => {
  const response = await api.post(
    "/api/creator/bulk-action",
    payload,
  );
  return response.data;
};

export const downloadAnalyticsReport = async (): Promise<void> => {
  const exportUrl = api.getUri({
    url: "/api/creator/export",
  });

  await Linking.openURL(exportUrl);
};
