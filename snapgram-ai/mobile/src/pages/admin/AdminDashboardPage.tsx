import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ShieldAlert,
  BarChart3,
  Users,
  Bell,
  Sliders,
  FileText,
  Search,
  BadgeCheck,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react-native";
import {
  getDashboardMetrics,
  getUsersList,
  updateUserStatus,
  getModerationQueue,
  resolveReport,
  getAuditLogs,
  broadcastNotification,
  getSystemConfig,
  updateSystemConfig,
} from "../../services/adminService";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "moderation" | "broadcast" | "logs" | "config">("overview");
  const [loading, setLoading] = useState(true);

  // States
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);

  const [userSearch, setUserSearch] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, userSearch]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await getDashboardMetrics();
        setMetrics(res.data);
      } else if (activeTab === "users") {
        const res = await getUsersList({ search: userSearch });
        setUsers(res.data || []);
      } else if (activeTab === "moderation") {
        const res = await getModerationQueue();
        setReports(res.data || []);
      } else if (activeTab === "logs") {
        const res = await getAuditLogs();
        setLogs(res.data || []);
      } else if (activeTab === "config") {
        const res = await getSystemConfig();
        setConfig(res.data || null);
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (user: any) => {
    const nextBanned = !user.isBanned;
    await updateUserStatus(user._id, { isBanned: nextBanned });
    fetchAdminData();
  };

  const handleToggleVerification = async (user: any) => {
    const nextVerified = !user.isVerified;
    await updateUserStatus(user._id, { isVerified: nextVerified });
    fetchAdminData();
  };

  const handleResolveReport = async (reportId: string, actionTaken: string, removeContent: boolean) => {
    await resolveReport(reportId, { actionTaken, removeContent });
    fetchAdminData();
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) return;
    setBroadcasting(true);
    try {
      const res = await broadcastNotification({ title: broadcastTitle, message: broadcastMessage });
      Alert.alert("Success", res.message || "Broadcast sent!");
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch {
      Alert.alert("Error", "Failed to send broadcast");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleToggleFeature = async (featureKey: string) => {
    if (!config) return;
    const updatedFlags = { ...config.featureFlags, [featureKey]: !config.featureFlags[featureKey] };
    const res = await updateSystemConfig({ featureFlags: updatedFlags });
    setConfig(res.data);
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
            <ShieldAlert size={18} color="#f43f5e" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin Control Center</Text>
            <Text style={styles.headerSubtitle}>User moderation & feature flags</Text>
          </View>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.greenDot} />
          <Text style={styles.statusText}>Operational</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {[
          { id: "overview", label: "Analytics", icon: BarChart3 },
          { id: "users", label: "Users", icon: Users },
          { id: "moderation", label: "Moderation", icon: ShieldAlert },
          { id: "broadcast", label: "Broadcast", icon: Bell },
          { id: "logs", label: "Audit Logs", icon: FileText },
          { id: "config", label: "Feature Flags", icon: Sliders },
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
      ) : activeTab === "overview" && metrics ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL REGISTERED USERS</Text>
              <Text style={[styles.metricValue, { color: "#f43f5e" }]}>{metrics.totalUsers || 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL FEED POSTS</Text>
              <Text style={[styles.metricValue, { color: "#a855f7" }]}>{metrics.totalPosts || 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>PENDING REPORTS</Text>
              <Text style={[styles.metricValue, { color: "#fb7185" }]}>{metrics.pendingReports || 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>PLATFORM REVENUE</Text>
              <Text style={[styles.metricValue, { color: "#10b981" }]}>
                ${metrics.totalRevenueUSD?.toLocaleString() || "0.00"}
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : activeTab === "users" ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.searchBar}>
            <Search size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search user by username or email..."
              placeholderTextColor="#64748b"
              value={userSearch}
              onChangeText={setUserSearch}
            />
          </View>

          {users.map((u) => (
            <View key={u._id} style={styles.userCard}>
              <Image
                source={{ uri: u.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.fullName || u.username}</Text>
                <Text style={styles.userHandle}>@{u.username} · {u.role || "user"}</Text>
              </View>
              <View style={styles.userActions}>
                <Pressable
                  onPress={() => handleToggleVerification(u)}
                  style={[styles.smallBtn, u.isVerified && { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}
                >
                  <BadgeCheck size={14} color={u.isVerified ? "#3b82f6" : "#94a3b8"} />
                </Pressable>
                <Pressable
                  onPress={() => handleToggleBan(u)}
                  style={[styles.smallBanBtn, u.isBanned && { backgroundColor: "#10b981" }]}
                >
                  <Text style={styles.banBtnText}>{u.isBanned ? "Unban" : "Ban"}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : activeTab === "moderation" ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          {reports.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={{ color: "#64748b", fontSize: 13 }}>No pending reports in queue</Text>
            </View>
          ) : (
            reports.map((rep) => (
              <View key={rep._id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTarget}>Target: {rep.targetType}</Text>
                  <Text style={styles.reportStatus}>Status: {rep.status}</Text>
                </View>
                <Text style={styles.reportReason}>Reason: "{rep.reason}"</Text>
                <View style={styles.reportBtns}>
                  <Pressable
                    onPress={() => handleResolveReport(rep._id, "dismiss", false)}
                    style={styles.dismissBtn}
                  >
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleResolveReport(rep._id, "content_removed", true)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>Remove Content</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : activeTab === "broadcast" ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Platform-Wide Broadcast</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Broadcast Title"
              placeholderTextColor="#64748b"
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
            />
            <TextInput
              style={[styles.formInput, { height: 100, textAlignVertical: "top" }]}
              multiline
              placeholder="Message body details..."
              placeholderTextColor="#64748b"
              value={broadcastMessage}
              onChangeText={setBroadcastMessage}
            />
            <Pressable onPress={handleBroadcast} disabled={broadcasting} style={styles.broadcastSubmitBtn}>
              <Text style={styles.broadcastSubmitText}>
                {broadcasting ? "Broadcasting..." : "Send Broadcast"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : activeTab === "config" && config ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Platform Feature Flags</Text>
            {Object.entries(config.featureFlags || {}).map(([key, val]) => (
              <View key={key} style={styles.flagRow}>
                <Text style={styles.flagKey}>{key.replace(/([A-Z])/g, " $1")}</Text>
                <Pressable
                  onPress={() => handleToggleFeature(key)}
                  style={[styles.flagBtn, val ? styles.flagBtnActive : styles.flagBtnInactive]}
                >
                  <Text style={[styles.flagBtnText, Boolean(val) && { color: "#fff" }]}>
                    {val ? "Enabled" : "Disabled"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centerBox}>
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>Section data loaded</Text>
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
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
  statusText: { color: "#10b981", fontSize: 11, fontWeight: "700" },
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
  metricsGrid: { gap: 10 },
  metricCard: { backgroundColor: "#1e293b", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#334155" },
  metricLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "700" },
  metricValue: { fontSize: 24, fontWeight: "800", marginTop: 4 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 12 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  userInfo: { flex: 1 },
  userName: { color: "#f8fafc", fontSize: 13, fontWeight: "700" },
  userHandle: { color: "#64748b", fontSize: 11, marginTop: 1 },
  userActions: { flexDirection: "row", gap: 6 },
  smallBtn: { padding: 8, backgroundColor: "#0f172a", borderRadius: 8 },
  smallBanBtn: { backgroundColor: "#f43f5e", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  banBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  reportCard: { backgroundColor: "#1e293b", borderRadius: 14, padding: 14, marginBottom: 10 },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  reportTarget: { color: "#f43f5e", fontSize: 11, fontWeight: "700" },
  reportStatus: { color: "#94a3b8", fontSize: 11 },
  reportReason: { color: "#f8fafc", fontSize: 13, fontWeight: "600", marginBottom: 12 },
  reportBtns: { flexDirection: "row", gap: 8 },
  dismissBtn: { flex: 1, paddingVertical: 8, backgroundColor: "#334155", borderRadius: 8, alignItems: "center" },
  dismissBtnText: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  removeBtn: { flex: 1, paddingVertical: 8, backgroundColor: "#f43f5e", borderRadius: 8, alignItems: "center" },
  removeBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  formCard: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16 },
  formTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "700", marginBottom: 14 },
  formInput: { backgroundColor: "#0f172a", borderRadius: 10, padding: 12, color: "#f8fafc", fontSize: 13, marginBottom: 10 },
  broadcastSubmitBtn: { backgroundColor: "#7c3aed", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  broadcastSubmitText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  flagRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#334155" },
  flagKey: { color: "#f8fafc", fontSize: 13, fontWeight: "600" },
  flagBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  flagBtnActive: { backgroundColor: "#10b981" },
  flagBtnInactive: { backgroundColor: "#334155" },
  flagBtnText: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
});
