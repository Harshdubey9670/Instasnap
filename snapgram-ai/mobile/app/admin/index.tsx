import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { router } from "expo-router";

import type { RootState } from "../../src/store/store";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  broadcastNotification,
  getAuditLogs,
  getDashboardMetrics,
  getModerationQueue,
  getSystemConfig,
  getUsersList,
  resolveReport,
  updateSystemConfig,
  updateUserStatus,
} from "../../src/services/adminService";

// ─── Types ────────────────────────────────────────────────────
type Tab =
  | "overview"
  | "users"
  | "moderation"
  | "broadcast"
  | "logs"
  | "config";

interface Metrics {
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  totalRevenueUSD: number;
}

interface AdminUser {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  profilePicture?: string;
  role?: string;
  isVerified?: boolean;
  isBanned?: boolean;
}

interface Report {
  _id: string;
  targetType: string;
  reason: string;
  status: string;
  reporter?: { username: string };
}

interface AuditLog {
  _id: string;
  createdAt: string;
  adminUser?: { username: string };
  action: string;
  targetType: string;
  details: string;
}

interface SystemConfig {
  featureFlags: Record<string, boolean>;
  maintenanceMode: boolean;
}

// ─── Tabs ─────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "overview", label: "Analytics", emoji: "📊" },
  { id: "users", label: "Users", emoji: "👥" },
  { id: "moderation", label: "Moderation", emoji: "🛡️" },
  { id: "broadcast", label: "Broadcast", emoji: "📢" },
  { id: "logs", label: "Audit Logs", emoji: "📋" },
  { id: "config", label: "Feature Flags", emoji: "⚙️" },
];

// ─── Theme helper ─────────────────────────────────────────────
function getThemeColors(isDark: boolean) {
  return {
    bg: isDark ? "#0f172a" : "#f8fafc",
    surface: isDark ? "#1e293b" : "#ffffff",
    surfaceHover: isDark ? "#334155" : "#f1f5f9",
    border: isDark ? "#334155" : "#e2e8f0",
    textPrimary: isDark ? "#f1f5f9" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    rose: "#f43f5e",
    emerald: "#10b981",
    purple: "#a855f7",
    blue: "#3b82f6",
    amber: "#f59e0b",
  };
}
type Colors = ReturnType<typeof getThemeColors>;

// ─── Helpers ──────────────────────────────────────────────────
function SectionCard({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: Colors;
  style?: object;
}) {
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function Skeleton({ colors }: { colors: Colors }) {
  return (
    <View style={{ gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.skeletonCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────
function OverviewTab({
  metrics,
  colors,
}: {
  metrics: Metrics;
  colors: Colors;
}) {
  const cards = [
    {
      label: "Total Registered Users",
      value: metrics.totalUsers,
      accent: colors.purple,
      emoji: "👤",
    },
    {
      label: "Total Feed Posts",
      value: metrics.totalPosts,
      accent: "#8b5cf6",
      emoji: "🖼️",
    },
    {
      label: "Pending Reports",
      value: metrics.pendingReports,
      accent: colors.rose,
      emoji: "⚠️",
    },
    {
      label: "Platform Revenue",
      value: `$${(metrics.totalRevenueUSD ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      accent: colors.emerald,
      emoji: "💰",
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.metricsGrid}>
        {cards.map((card) => (
          <SectionCard
            key={card.label}
            colors={colors}
            style={styles.metricCard}
          >
            <Text style={styles.metricEmoji}>{card.emoji}</Text>
            <Text
              style={[styles.metricLabel, { color: colors.textSecondary }]}
            >
              {card.label}
            </Text>
            <Text style={[styles.metricValue, { color: card.accent }]}>
              {card.value}
            </Text>
          </SectionCard>
        ))}
      </View>

      {/* Status pill */}
      <View
        style={[
          styles.statusPill,
          { backgroundColor: colors.emerald + "20", borderColor: colors.emerald + "40" },
        ]}
      >
        <View
          style={[styles.statusDot, { backgroundColor: colors.emerald }]}
        />
        <Text style={[styles.statusText, { color: colors.emerald }]}>
          Platform Operational
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Users Tab ────────────────────────────────────────────────
function UsersTab({
  users,
  colors,
  onToggleBan,
  onToggleVerification,
  onRoleChange,
}: {
  users: AdminUser[];
  colors: Colors;
  onToggleBan: (user: AdminUser) => void;
  onToggleVerification: (user: AdminUser) => void;
  onRoleChange: (user: AdminUser, role: string) => void;
}) {
  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item._id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No users found.
        </Text>
      }
      renderItem={({ item: u }) => (
        <SectionCard colors={colors}>
          {/* User info row */}
          <View style={styles.userInfoRow}>
            <Image
              source={{
                uri: u.profilePicture ?? `https://i.pravatar.cc/100?u=${u._id}`,
              }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userMeta}>
              <Text
                style={[styles.userName, { color: colors.textPrimary }]}
              >
                {u.fullName}
              </Text>
              <Text
                style={[styles.userHandle, { color: colors.textSecondary }]}
              >
                @{u.username}
              </Text>
              <Text
                style={[styles.userEmail, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {u.email}
              </Text>
            </View>
            {/* Status badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: u.isBanned
                    ? colors.rose + "20"
                    : colors.emerald + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: u.isBanned ? colors.rose : colors.emerald },
                ]}
              >
                {u.isBanned ? "Banned" : "Active"}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.userActions}>
            {/* Role toggle */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.surfaceHover,
                  borderColor: colors.border,
                },
              ]}
              onPress={() =>
                onRoleChange(u, u.role === "admin" ? "user" : "admin")
              }
              activeOpacity={0.75}
            >
              <Text
                style={[styles.actionBtnText, { color: colors.textPrimary }]}
              >
                {u.role === "admin" ? "👑 Admin" : "👤 User"}
              </Text>
            </TouchableOpacity>

            {/* Verify toggle */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: u.isVerified
                    ? colors.blue + "20"
                    : colors.surfaceHover,
                  borderColor: u.isVerified ? colors.blue : colors.border,
                },
              ]}
              onPress={() => onToggleVerification(u)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.actionBtnText,
                  { color: u.isVerified ? colors.blue : colors.textSecondary },
                ]}
              >
                {u.isVerified ? "✓ Verified" : "Unverified"}
              </Text>
            </TouchableOpacity>

            {/* Ban toggle */}
            <TouchableOpacity
              style={[
                styles.banBtn,
                {
                  backgroundColor: u.isBanned ? colors.emerald : colors.rose,
                },
              ]}
              onPress={() => onToggleBan(u)}
              activeOpacity={0.8}
            >
              <Text style={styles.banBtnText}>
                {u.isBanned ? "Unban" : "Ban User"}
              </Text>
            </TouchableOpacity>
          </View>
        </SectionCard>
      )}
    />
  );
}

// ─── Moderation Tab ───────────────────────────────────────────
function ModerationTab({
  reports,
  colors,
  onResolve,
}: {
  reports: Report[];
  colors: Colors;
  onResolve: (
    reportId: string,
    action: string,
    removeContent: boolean,
  ) => void;
}) {
  return (
    <FlatList
      data={reports}
      keyExtractor={(item) => item._id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
      ListEmptyComponent={
        <SectionCard colors={colors}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No pending reports in queue. ✅
          </Text>
        </SectionCard>
      }
      renderItem={({ item: rep }) => (
        <SectionCard colors={colors}>
          {/* Header */}
          <View style={styles.reportHeader}>
            <View
              style={[
                styles.reportTypeBadge,
                { backgroundColor: colors.rose + "20" },
              ]}
            >
              <Text style={[styles.reportTypeText, { color: colors.rose }]}>
                Target: {rep.targetType}
              </Text>
            </View>
            <Text
              style={[styles.reportStatus, { color: colors.textSecondary }]}
            >
              {rep.status}
            </Text>
          </View>

          <Text style={[styles.reportReason, { color: colors.textPrimary }]}>
            Reason: "{rep.reason}"
          </Text>
          <Text
            style={[styles.reportReporter, { color: colors.textSecondary }]}
          >
            Reported by: @{rep.reporter?.username ?? "anonymous"}
          </Text>

          {/* Action buttons */}
          <View style={styles.reportActions}>
            <TouchableOpacity
              style={[
                styles.reportBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceHover,
                },
              ]}
              onPress={() => onResolve(rep._id, "dismiss", false)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.reportBtnText, { color: colors.textPrimary }]}
              >
                Dismiss Report
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reportBtn,
                { backgroundColor: colors.rose },
              ]}
              onPress={() => onResolve(rep._id, "content_removed", true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.reportBtnText, { color: "#fff" }]}>
                Remove Content
              </Text>
            </TouchableOpacity>
          </View>
        </SectionCard>
      )}
    />
  );
}

// ─── Broadcast Tab ────────────────────────────────────────────
function BroadcastTab({
  colors,
  onBroadcast,
}: {
  colors: Colors;
  onBroadcast: (title: string, message: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setBroadcasting(true);
    try {
      await onBroadcast(title.trim(), message.trim());
      setTitle("");
      setMessage("");
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionCard colors={colors}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          📢 Platform-Wide Broadcast Notification
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Send announcement to all registered users.
        </Text>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Scheduled System Maintenance"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceHover,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Message
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Message body details..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.surfaceHover,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: colors.purple,
              opacity: broadcasting ? 0.6 : 1,
            },
          ]}
          onPress={handleSend}
          disabled={broadcasting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {broadcasting
              ? "Publishing Broadcast…"
              : "Send Broadcast Notification"}
          </Text>
        </TouchableOpacity>
      </SectionCard>
    </ScrollView>
  );
}

// ─── Audit Logs Tab ───────────────────────────────────────────
function AuditLogsTab({
  logs,
  colors,
}: {
  logs: AuditLog[];
  colors: Colors;
}) {
  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item._id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
      ListEmptyComponent={
        <SectionCard colors={colors}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No audit logs found.
          </Text>
        </SectionCard>
      }
      renderItem={({ item: log }) => (
        <SectionCard colors={colors}>
          <View style={styles.logRow}>
            <View style={styles.logMain}>
              <Text
                style={[styles.logAction, { color: colors.rose }]}
                numberOfLines={1}
              >
                {log.action}
              </Text>
              <Text
                style={[styles.logAdmin, { color: colors.textPrimary }]}
              >
                @{log.adminUser?.username ?? "admin"} → {log.targetType}
              </Text>
              {log.details ? (
                <Text
                  style={[styles.logDetails, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {log.details}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.logTime, { color: colors.textSecondary }]}>
              {new Date(log.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </SectionCard>
      )}
    />
  );
}

// ─── Config Tab ───────────────────────────────────────────────
function ConfigTab({
  config,
  colors,
  onToggleFeature,
  onToggleMaintenance,
}: {
  config: SystemConfig;
  colors: Colors;
  onToggleFeature: (key: string) => void;
  onToggleMaintenance: () => void;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Feature flags */}
      <SectionCard colors={colors}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          ⚙️ Platform Feature Flags
        </Text>

        {Object.entries(config.featureFlags ?? {}).map(([key, val]) => (
          <View
            key={key}
            style={[
              styles.flagRow,
              {
                backgroundColor: colors.surfaceHover,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.flagLabel, { color: colors.textPrimary }]}>
              {key.replace(/([A-Z])/g, " $1").trim()}
            </Text>
            <Switch
              value={val}
              onValueChange={() => onToggleFeature(key)}
              trackColor={{
                false: colors.border,
                true: colors.emerald + "80",
              }}
              thumbColor={val ? colors.emerald : colors.textSecondary}
            />
          </View>
        ))}
      </SectionCard>

      {/* Maintenance mode */}
      <SectionCard colors={colors}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          ⚠️ System Maintenance Mode
        </Text>
        <Text
          style={[styles.sectionSub, { color: colors.textSecondary }]}
        >
          Enabling maintenance mode restricts access to non-admin users.
        </Text>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: config.maintenanceMode
                ? colors.amber
                : colors.surfaceHover,
              borderWidth: config.maintenanceMode ? 0 : 1,
              borderColor: colors.border,
            },
          ]}
          onPress={onToggleMaintenance}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.submitBtnText,
              {
                color: config.maintenanceMode
                  ? "#fff"
                  : colors.textPrimary,
              },
            ]}
          >
            {config.maintenanceMode
              ? "Disable Maintenance Mode"
              : "Enable Maintenance Mode"}
          </Text>
        </TouchableOpacity>
      </SectionCard>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function AdminDashboardScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const colors = getThemeColors(isDark);

  const user = useSelector((state: RootState) => state.auth.user);

  // Admin guard — redirect non-admins
  useEffect(() => {
    if (user && (user as any).role !== "admin") {
      router.replace("/app" as any);
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");

  // Data states
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await getDashboardMetrics();
        setMetrics(res.data);
      } else if (activeTab === "users") {
        const res = await getUsersList({ search: userSearch });
        setUsers(res.data ?? []);
      } else if (activeTab === "moderation") {
        const res = await getModerationQueue();
        setReports(res.data ?? []);
      } else if (activeTab === "logs") {
        const res = await getAuditLogs();
        setLogs(res.data ?? []);
      } else if (activeTab === "config") {
        const res = await getSystemConfig();
        setConfig(res.data);
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, userSearch]);

  useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  // ── User actions ──
  const handleToggleBan = useCallback(
    async (u: AdminUser) => {
      const nextBanned = !u.isBanned;
      await updateUserStatus(u._id, { isBanned: nextBanned });
      void fetchAdminData();
    },
    [fetchAdminData],
  );

  const handleToggleVerification = useCallback(
    async (u: AdminUser) => {
      const nextVerified = !u.isVerified;
      await updateUserStatus(u._id, { isVerified: nextVerified });
      void fetchAdminData();
    },
    [fetchAdminData],
  );

  const handleRoleChange = useCallback(
    async (u: AdminUser, newRole: string) => {
      await updateUserStatus(u._id, { role: newRole });
      void fetchAdminData();
    },
    [fetchAdminData],
  );

  // ── Moderation actions ──
  const handleResolveReport = useCallback(
    async (reportId: string, actionTaken: string, removeContent: boolean) => {
      await resolveReport(reportId, { actionTaken, removeContent });
      void fetchAdminData();
    },
    [fetchAdminData],
  );

  // ── Broadcast ──
  const handleBroadcast = useCallback(
    async (title: string, message: string) => {
      try {
        const res = await broadcastNotification({ title, message });
        Alert.alert(
          "Broadcast Sent",
          (res as any).message ?? "Notification delivered to all users.",
        );
      } catch {
        Alert.alert("Error", "Failed to send broadcast");
      }
    },
    [],
  );

  // ── Config actions ──
  const handleToggleFeature = useCallback(
    async (featureKey: string) => {
      if (!config) return;
      const updatedFlags = {
        ...config.featureFlags,
        [featureKey]: !config.featureFlags[featureKey],
      };
      const res = await updateSystemConfig({ featureFlags: updatedFlags });
      setConfig((res as any).data);
    },
    [config],
  );

  const handleToggleMaintenance = useCallback(async () => {
    if (!config) return;
    const res = await updateSystemConfig({
      maintenanceMode: !config.maintenanceMode,
    });
    setConfig((res as any).data);
  }, [config]);

  // ── Render tab content ──
  const renderContent = () => {
    if (loading) return <Skeleton colors={colors} />;

    switch (activeTab) {
      case "overview":
        return metrics ? (
          <OverviewTab metrics={metrics} colors={colors} />
        ) : null;

      case "users":
        return (
          <View style={{ flex: 1 }}>
            {/* Search bar */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search username, email, name…"
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
            </View>
            <UsersTab
              users={users}
              colors={colors}
              onToggleBan={handleToggleBan}
              onToggleVerification={handleToggleVerification}
              onRoleChange={handleRoleChange}
            />
          </View>
        );

      case "moderation":
        return (
          <ModerationTab
            reports={reports}
            colors={colors}
            onResolve={handleResolveReport}
          />
        );

      case "broadcast":
        return (
          <BroadcastTab colors={colors} onBroadcast={handleBroadcast} />
        );

      case "logs":
        return <AuditLogsTab logs={logs} colors={colors} />;

      case "config":
        return config ? (
          <ConfigTab
            config={config}
            colors={colors}
            onToggleFeature={handleToggleFeature}
            onToggleMaintenance={handleToggleMaintenance}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.rose }]}>
            🛡️ Admin Control Center
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Administration, moderation, roles, audit & feature flags
          </Text>
        </View>
      </View>

      {/* Tab bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabList}
          renderItem={({ item }) => {
            const active = activeTab === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(item.id)}
                style={[
                  styles.tabBtn,
                  active && {
                    backgroundColor: colors.rose + "20",
                    borderColor: colors.rose,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={styles.tabEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: active ? colors.rose : colors.textSecondary,
                      fontWeight: active ? "700" : "500",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },

  // Tab bar
  tabBar: { borderBottomWidth: 1 },
  tabList: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    marginRight: 4,
  },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 13 },

  // Content
  content: { flex: 1, padding: 16 },

  // Skeleton
  skeletonCard: { height: 100, borderRadius: 16, borderWidth: 1, marginBottom: 12 },

  // Section card
  sectionCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 6 },
  sectionSub: { fontSize: 12, marginBottom: 14 },

  // Overview metrics
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  metricCard: { width: "47%", padding: 18 },
  metricEmoji: { fontSize: 22, marginBottom: 8 },
  metricLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  metricValue: { fontSize: 28, fontWeight: "900", marginTop: 6 },

  // Status pill
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },

  // User card
  userInfoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  userMeta: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "700" },
  userHandle: { fontSize: 12, marginTop: 1 },
  userEmail: { fontSize: 11, marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },

  userActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: "700" },
  banBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  banBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 13 },

  // Moderation
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reportTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reportTypeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  reportStatus: { fontSize: 11, fontWeight: "700" },
  reportReason: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  reportReporter: { fontSize: 11, marginBottom: 14 },
  reportActions: { flexDirection: "row", gap: 10 },
  reportBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  reportBtnText: { fontSize: 12, fontWeight: "700" },

  // Broadcast
  inputLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  textArea: { height: 120 },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: { fontWeight: "800", fontSize: 14 },

  // Audit logs
  logRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  logMain: { flex: 1 },
  logAction: { fontSize: 13, fontFamily: "Courier New", fontWeight: "700" },
  logAdmin: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  logDetails: { fontSize: 11, marginTop: 2 },
  logTime: { fontSize: 10, marginTop: 2 },

  // Config feature flags
  flagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  flagLabel: { fontSize: 13, fontWeight: "700", textTransform: "capitalize", flex: 1, marginRight: 12 },

  // Shared
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 12 },
});
