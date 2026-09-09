import api from "./api";

type RequestPayload = Record<string, unknown>;
type QueryParams = Record<string, unknown>;

export const getDashboardMetrics = async () => {
  const response = await api.get("/api/admin/metrics");
  return response.data;
};

export const getUsersList = async (
  params: QueryParams = {},
) => {
  const response = await api.get("/api/admin/users", {
    params,
  });
  return response.data;
};

export const updateUserStatus = async (
  userId: string,
  payload: RequestPayload,
) => {
  const response = await api.put(
    `/api/admin/users/${userId}`,
    payload,
  );
  return response.data;
};

export const getModerationQueue = async () => {
  const response = await api.get("/api/admin/reports");
  return response.data;
};

export const resolveReport = async (
  reportId: string,
  payload: RequestPayload,
) => {
  const response = await api.put(
    `/api/admin/reports/${reportId}`,
    payload,
  );
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await api.get("/api/admin/audit-logs");
  return response.data;
};

export const broadcastNotification = async (
  payload: RequestPayload,
) => {
  const response = await api.post(
    "/api/admin/broadcast-notification",
    payload,
  );
  return response.data;
};

export const getSystemConfig = async () => {
  const response = await api.get("/api/admin/system-config");
  return response.data;
};

export const updateSystemConfig = async (
  payload: RequestPayload,
) => {
  const response = await api.put(
    "/api/admin/system-config",
    payload,
  );
  return response.data;
};
