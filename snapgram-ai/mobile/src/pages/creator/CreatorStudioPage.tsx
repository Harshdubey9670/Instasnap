import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  BarChart3,
  Film,
  Users,
  Layers,
  Sparkles,
  TrendingUp,
  Eye,
  Clock,
  ArrowLeft,
  Calendar,
} from "lucide-react-native";
import {
  getOverviewStats,
  getInsights,
  getAudienceAnalytics,
  getContentPerformance,
  getDraftsAndScheduled,
} from "../../services/creatorService";

export default function CreatorStudioPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "audience" | "manager">("overview");
  const [timeframe, setTimeframe] = useState("30d");
  const [loading, setLoading] = useState(true);

  // States
  const [overview, setOverview] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [audience, setAudience] = useState<any>(null);
  const [content, setContent] = useState<any>({ posts: [], reels: [], stories: [] });
  const [draftsAndScheduled, setDraftsAndScheduled] = useState<any>({ drafts: [], scheduled: [] });

  useEffect(() => {
    fetchData();
  }, [timeframe, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const [ovData, insData] = await Promise.all([
          getOverviewStats(timeframe),
          getInsights(timeframe),
        ]);
        setOverview(ovData.data?.summary || null);
        setInsights(insData.data?.timeSeries || []);
      } else if (activeTab === "content") {
        const cntData = await getContentPerformance("all");
        setContent(cntData.data || { posts: [], reels: [], stories: [] });
      } else if (activeTab === "audience") {
        const audData = await getAudienceAnalytics();
        setAudience(audData.data || null);
      } else if (activeTab === "manager") {
        const mgrData = await getDraftsAndScheduled();
        setDraftsAndScheduled(mgrData.data || { drafts: [], scheduled: [] });
      }
    } catch (err) {
      console.error("Failed to load Creator Studio data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={20} color="#f8fafc" />
          </Pressable>
          <View style={styles.iconCircle}>
            <Sparkles size={18} color="#f43f5e" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Creator Studio</Text>
            <Text style={styles.headerSubtitle}>Audience reach & performance analytics</Text>
          </View>
        </View>

        {/* Timeframe Chips */}
        <View style={styles.timeframeRow}>
          {["7d", "30d", "90d"].map((tf) => (
            <Pressable
              key={tf}
              onPress={() => setTimeframe(tf)}
              style={[styles.tfPill, timeframe === tf && styles.tfPillActive]}
            >
              <Text style={[styles.tfText, timeframe === tf && styles.tfTextActive]}>{tf}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {[
          { id: "overview", label: "Dashboard", icon: BarChart3 },
          { id: "content", label: "Content Insights", icon: Film },
          { id: "audience", label: "Audience Analytics", icon: Users },
          { id: "manager", label: "Drafts & Scheduled", icon: Layers },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setActiveTab(t.id as any)}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
            >
              <Icon size={14} color={isActive ? "#f43f5e" : "#94a3b8"} />
              <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#f43f5e" />
        </View>
      ) : activeTab === "overview" && overview ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Summary Metric Cards */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>ESTIMATED REACH</Text>
                <TrendingUp size={16} color="#10b981" />
              </View>
              <Text style={styles.metricValue}>{overview.reach?.toLocaleString() || "0"}</Text>
              <Text style={styles.metricFoot}>+14.2% vs previous period</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>IMPRESSIONS</Text>
                <Eye size={16} color="#3b82f6" />
              </View>
              <Text style={styles.metricValue}>{overview.impressions?.toLocaleString() || "0"}</Text>
              <Text style={styles.metricFoot}>+18.6% engagement growth</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>WATCH TIME</Text>
                <Clock size={16} color="#a855f7" />
              </View>
              <Text style={styles.metricValue}>{overview.watchTimeHours || 0} hrs</Text>
              <Text style={styles.metricFoot}>+9.4% video retention</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>PROFILE VISITS</Text>
                <Users size={16} color="#f59e0b" />
              </View>
              <Text style={styles.metricValue}>{overview.profileVisits?.toLocaleString() || "0"}</Text>
              <Text style={styles.metricFoot}>+22.1% conversion rate</Text>
            </View>
          </View>

          {/* Performance Trajectory Bar Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Performance Trajectory</Text>
            <View style={styles.barsContainer}>
              {insights.slice(-7).map((item, idx) => {
                const heightVal = Math.min(100, Math.max(20, (item.impressions || 10) / 10));
                return (
                  <View key={idx} style={styles.barColumn}>
                    <View style={[styles.barVisual, { height: `${heightVal}%` }]} />
                    <Text style={styles.barLabel}>{item.date?.slice(5) || `D${idx + 1}`}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : activeTab === "manager" ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.managerSection}>
            <Text style={styles.sectionTitle}>Drafts ({draftsAndScheduled.drafts?.length || 0})</Text>
            {draftsAndScheduled.drafts?.length === 0 ? (
              <Text style={styles.emptyNotice}>No saved drafts</Text>
            ) : (
              draftsAndScheduled.drafts.map((d: any) => (
                <View key={d._id} style={styles.draftItem}>
                  <Text style={styles.draftTitle}>{d.caption || "Untitled Draft"}</Text>
                  <Text style={styles.draftDate}>Created: {new Date(d.createdAt).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>

          <View style={[styles.managerSection, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Scheduled Releases ({draftsAndScheduled.scheduled?.length || 0})</Text>
            {draftsAndScheduled.scheduled?.length === 0 ? (
              <Text style={styles.emptyNotice}>No scheduled posts</Text>
            ) : (
              draftsAndScheduled.scheduled.map((s: any) => (
                <View key={s._id} style={styles.draftItem}>
                  <Text style={styles.draftTitle}>{s.caption || "Scheduled Post"}</Text>
                  <Text style={styles.draftDate}>Releasing: {new Date(s.scheduledAt).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centerBox}>
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>Section insights loaded</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  headerSubtitle: { color: "#64748b", fontSize: 11 },
  timeframeRow: { flexDirection: "row", gap: 4 },
  tfPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#1e293b" },
  tfPillActive: { backgroundColor: "#f43f5e" },
  tfText: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  tfTextActive: { color: "#fff" },
  tabsScroll: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  tabsContainer: { paddingHorizontal: 12, alignItems: "center", gap: 6 },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#1e293b",
  },
  tabChipActive: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  tabChipText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  tabChipTextActive: { color: "#f43f5e", fontWeight: "700" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  contentScroll: { flex: 1, padding: 14 },
  metricsGrid: { gap: 10, marginBottom: 16 },
  metricCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  metricCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "700" },
  metricValue: { color: "#f8fafc", fontSize: 22, fontWeight: "800", marginVertical: 4 },
  metricFoot: { color: "#10b981", fontSize: 11 },
  chartCard: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16 },
  chartTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "700", marginBottom: 16 },
  barsContainer: { height: 120, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  barColumn: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 6 },
  barVisual: { width: 14, backgroundColor: "#f43f5e", borderRadius: 4 },
  barLabel: { color: "#64748b", fontSize: 9 },
  managerSection: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16 },
  sectionTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "700", marginBottom: 10 },
  emptyNotice: { color: "#64748b", fontSize: 12 },
  draftItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#334155" },
  draftTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "700" },
  draftDate: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
});
