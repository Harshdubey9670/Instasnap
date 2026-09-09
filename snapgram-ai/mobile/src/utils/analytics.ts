import api from "../services/api";

type AnalyticsMetadata = Record<string, unknown>;

export const trackEvent = (
  eventType: string,
  targetId: string | null = null,
  metadata: AnalyticsMetadata = {},
): void => {
  void api
    .post("/api/analytics/track", {
      eventType,
      targetId,
      metadata,
    })
    .catch(() => {
      // Analytics failures must never interrupt the user experience.
    });
};
