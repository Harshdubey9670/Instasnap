import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  bulkContentAction,
  downloadAnalyticsReport,
  getAudienceAnalytics,
  getContentPerformance,
  getDraftsAndScheduled,
  getInsights,
  getOverviewStats,
} from "../../src/services/creatorService";
import { useTheme } from "../../src/contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────
type Tab = "overview" | "content" | "audience" | "manager";
type Timeframe = "7d" | "30d" | "90d" | "1y";
type ContentFilter = "all" | "posts" | "reels" | "stories";

interface OverviewSummary {
  reach: number;
  impressions: number;
  watchTimeHours: number;
  profileVisits: number;
}

interface InsightPoint {
  date: string;
  impressions: number;
}

interface ContentItem {
  id: string;
  contentType: string;
  caption?: string;
  mediaUrl?: string;
  likesCount?: number;
  viewersCount?: number;
  commentsCount?: number;
  savesCount?: number;
  sharesCount?: number;
  impressions?: number;
  viewsCount?: number;
}

interface GenderBreakdown {
  gender: string;
  percentage: number;
}

interface AgeDistribution {
  range: string;
  percentage: number;
}

interface TopLocation {
  location: string;
  percentage: number;
}

interface PeakHour {
  hour: string;
  activity: number;
}

interface AudienceData {
  genderBreakdown: GenderBreakdown[];
  ageDistribution: AgeDistribution[];
  topLocations: TopLocation[];
  peakActiveHours: PeakHour[];
}

interface DraftOrScheduled {
  id: string;
  caption?: string;
  mediaUrl?: string;
  updatedAt?: string;
  scheduledAt?: string;
}

// ─── Tabs config ──────────────────────────────────────────────
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "overview", label: "Dashboard", emoji: "📊" },
  { id: "content", label: "Content Insights", emoji: "🎬" },
  { id: "audience", label: "Audience Analytics", emoji: "👥" },
  { id: "manager", label: "Drafts & Scheduled", emoji: "📁" },
];

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "1y", label: "1 Year" },
];

const CONTENT_FILTERS: ContentFilter[] = ["all", "posts", "reels", "stories"];

// ─── Theme helper ─────────────────────────────────────────────
function getThemeColors(isDark: boolean) {
  return {
    bg: isDark ? "#0f172a" : "#f8fafc",
    surface: isDark ? "#1e293b" : "#ffffff",
    surfaceHover: isDark ? "#334155" : "#f1f5f9",
    border: isDark ? "#334155" : "#e2e8f0",
    textPrimary: isDark ? "#f1f5f9" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    secondary: "#ec4899",
    emerald: "#10b981",
    amber: "#f59e0b",
    blue: "#3b82f6",
    teal: "#14b8a6",
    rose: "#f43f5e",
  };
}

type Colors = ReturnType<typeof getThemeColors>;

// ─── Reusable components ──────────────────────────────────────
function SectionCard({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: Colors;
}) {
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {title ? (
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function ProgressBar({
  label,
  value,
  accent,
  colors,
}: {
  label: string;
  value: number;
  accent: string;
  colors: Colors;
}) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressMeta}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.progressValue, { color: colors.textSecondary }]}>
          {value}%
        </Text>
      </View>
      <View
        style={[styles.progressTrack, { backgroundColor: colors.surfaceHover }]}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${value}%`, backgroundColor: accent },
          ]}
        />
      </View>
    </View>
  );
}

function Skeleton({ colors }: { colors: Colors }) {
  return (
    <View style={styles.skeletonWrap}>
      {[1, 2, 3, 4].map((i) => (
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
  overview,
  insights,
  timeframe,
  colors,
  onExport,
}: {
  overview: OverviewSummary;
  insights: InsightPoint[];
  timeframe: Timeframe;
  colors: Colors;
  onExport: () => void;
}) {
  const maxVal = Math.max(...insights.map((i) => i.impressions), 1);
  const last14 = insights.slice(-14);

  const summaryCards = [
    {
      label: "Estimated Reach",
      value: overview.reach.toLocaleString(),
      sub: `+14.2% vs previous ${timeframe}`,
      accent: colors.emerald,
      emoji: "📈",
    },
    {
      label: "Impressions",
      value: overview.impressions.toLocaleString(),
      sub: `+18.6% vs previous ${timeframe}`,
      accent: colors.blue,
      emoji: "👁️",
    },
    {
      label: "Watch Time",
      value: `${overview.watchTimeHours} hrs`,
      sub: "+9.4% video retention",
      accent: colors.primary,
      emoji: "⏱️",
    },
    {
      label: "Profile Visits",
      value: overview.profileVisits.toLocaleString(),
      sub: "+22.1% conversion rate",
      accent: colors.amber,
      emoji: "👤",
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Summary grid — 2 per row */}
      <View style={styles.overviewGrid}>
        {summaryCards.map((card) => (
          <View
            key={card.label}
            style={[
              styles.overviewCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.overviewCardTop}>
              <Text style={[styles.overviewCardLabel, { color: colors.textSecondary }]}>
                {card.label}
              </Text>
              <Text style={styles.overviewCardEmoji}>{card.emoji}</Text>
            </View>
            <Text style={[styles.overviewCardValue, { color: card.accent }]}>
              {card.value}
            </Text>
            <Text style={[styles.overviewCardSub, { color: card.accent }]}>
              {card.sub}
            </Text>
          </View>
        ))}
      </View>

      {/* Impressions bar chart */}
      <SectionCard title="📊 Performance Trajectory" colors={colors}>
        <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
          Daily Impressions
        </Text>
        <View style={styles.barChartWrap}>
          {last14.map((item, idx) => {
            const heightPct = Math.max(
              8,
              Math.floor((item.impressions / maxVal) * 100),
            );
            return (
              <View key={idx} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${heightPct}%` as any,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {item.date.slice(5)}
                </Text>
              </View>
            );
          })}
        </View>
      </SectionCard>

      {/* Export CSV */}
      <TouchableOpacity
        style={[styles.exportBtn, { backgroundColor: colors.primary }]}
        onPress={onExport}
        activeOpacity={0.85}
      >
        <Text style={styles.exportBtnText}>⬇️  Export CSV</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Content Tab ─────────────────────────────────────────────
function ContentTab({
  content,
  filter,
  onFilterChange,
  colors,
}: {
  content: { posts: ContentItem[]; reels: ContentItem[]; stories: ContentItem[] };
  filter: ContentFilter;
  onFilterChange: (f: ContentFilter) => void;
  colors: Colors;
}) {
  const allItems = [
    ...content.posts,
    ...content.reels,
    ...content.stories,
  ].filter((item) => {
    if (filter === "all") return true;
    if (filter === "posts") return item.contentType === "post";
    if (filter === "reels") return item.contentType === "reel";
    if (filter === "stories") return item.contentType === "story";
    return true;
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {CONTENT_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => onFilterChange(f)}
            style={[
              styles.filterBtn,
              {
                backgroundColor:
                  filter === f ? colors.primary : colors.surfaceHover,
                borderColor:
                  filter === f ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: filter === f ? "#fff" : colors.textSecondary },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {allItems.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No content found
          </Text>
        </View>
      ) : (
        <FlatList
          data={allItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentGrid}
          columnWrapperStyle={styles.contentRow}
          renderItem={({ item }) => (
            <View
              style={[
                styles.contentCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.contentThumb}>
                {item.mediaUrl ? (
                  <Image
                    source={{ uri: item.mediaUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.contentThumbFallback}>🖼️</Text>
                )}
                <View style={styles.contentTypeBadge}>
                  <Text style={styles.contentTypeText}>
                    {item.contentType}
                  </Text>
                </View>
              </View>

              <View style={styles.contentBody}>
                <Text
                  style={[styles.contentCaption, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.caption || "No caption"}
                </Text>
                <View style={styles.contentStats}>
                  <Text style={styles.contentStat}>
                    ❤️ {item.likesCount ?? item.viewersCount ?? 0}
                  </Text>
                  <Text style={styles.contentStat}>
                    💬 {item.commentsCount ?? 0}
                  </Text>
                  <Text style={styles.contentStat}>
                    🔖 {item.savesCount ?? item.sharesCount ?? 0}
                  </Text>
                  <Text style={styles.contentStat}>
                    👁️ {item.impressions ?? item.viewsCount ?? 0}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ─── Audience Tab ─────────────────────────────────────────────
function AudienceTab({
  audience,
  colors,
}: {
  audience: AudienceData;
  colors: Colors;
}) {
  const maxActivity = Math.max(...audience.peakActiveHours.map((h) => h.activity), 1);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionCard title="👫 Gender Breakdown" colors={colors}>
        {audience.genderBreakdown.map((g) => (
          <ProgressBar
            key={g.gender}
            label={g.gender}
            value={g.percentage}
            accent={colors.primary}
            colors={colors}
          />
        ))}
      </SectionCard>

      <SectionCard title="🎂 Age Distribution" colors={colors}>
        {audience.ageDistribution.map((a) => (
          <ProgressBar
            key={a.range}
            label={`${a.range} years`}
            value={a.percentage}
            accent={colors.secondary}
            colors={colors}
          />
        ))}
      </SectionCard>

      <SectionCard title="📍 Top Locations" colors={colors}>
        {audience.topLocations.map((l) => (
          <ProgressBar
            key={l.location}
            label={l.location}
            value={l.percentage}
            accent={colors.emerald}
            colors={colors}
          />
        ))}
      </SectionCard>

      <SectionCard title="⏰ Most Active Times" colors={colors}>
        <View style={styles.barChartWrap}>
          {audience.peakActiveHours.map((h) => {
            const heightPct = Math.max(
              8,
              Math.floor((h.activity / maxActivity) * 100),
            );
            return (
              <View key={h.hour} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${heightPct}%` as any,
                        backgroundColor: colors.amber,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {h.hour}
                </Text>
              </View>
            );
          })}
        </View>
      </SectionCard>
    </ScrollView>
  );
}

// ─── Manager Tab (Drafts & Scheduled) ─────────────────────────
function ManagerTab({
  drafts,
  scheduled,
  selectedIds,
  onToggleSelect,
  onBulkArchive,
  onBulkDelete,
  colors,
}: {
  drafts: DraftOrScheduled[];
  scheduled: DraftOrScheduled[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  colors: Colors;
}) {
  const selectedCount = selectedIds.size;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Bulk toolbar */}
      <View
        style={[
          styles.bulkBar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.bulkCount, { color: colors.textPrimary }]}>
          {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
        </Text>
        <View style={styles.bulkActions}>
          <TouchableOpacity
            style={[
              styles.bulkBtn,
              {
                backgroundColor: colors.amber + "20",
                borderColor: colors.amber,
                opacity: selectedCount === 0 ? 0.4 : 1,
              },
            ]}
            onPress={onBulkArchive}
            disabled={selectedCount === 0}
          >
            <Text style={[styles.bulkBtnText, { color: colors.amber }]}>
              📦 Archive
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.bulkBtn,
              {
                backgroundColor: colors.rose + "20",
                borderColor: colors.rose,
                opacity: selectedCount === 0 ? 0.4 : 1,
              },
            ]}
            onPress={onBulkDelete}
            disabled={selectedCount === 0}
          >
            <Text style={[styles.bulkBtnText, { color: colors.rose }]}>
              🗑️ Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Drafts */}
      <SectionCard title={`📝 Drafts (${drafts.length})`} colors={colors}>
        {drafts.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No drafts saved.
          </Text>
        ) : (
          drafts.map((draft) => {
            const isSelected = selectedIds.has(draft.id);
            return (
              <TouchableOpacity
                key={draft.id}
                onPress={() => onToggleSelect(draft.id)}
                style={[
                  styles.managerRow,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "15"
                      : colors.surfaceHover,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 18 }}>
                  {isSelected ? "☑️" : "⬜"}
                </Text>
                <View
                  style={[
                    styles.managerThumb,
                    { backgroundColor: colors.border },
                  ]}
                >
                  {draft.mediaUrl ? (
                    <Image
                      source={{ uri: draft.mediaUrl }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <View style={styles.managerMeta}>
                  <Text
                    style={[styles.managerCaption, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {draft.caption || "Untitled Draft"}
                  </Text>
                  <Text style={[styles.managerDate, { color: colors.textSecondary }]}>
                    Updated{" "}
                    {draft.updatedAt
                      ? new Date(draft.updatedAt).toLocaleDateString()
                      : "—"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </SectionCard>

      {/* Scheduled */}
      <SectionCard title={`📅 Scheduled (${scheduled.length})`} colors={colors}>
        {scheduled.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No content currently scheduled.
          </Text>
        ) : (
          scheduled.map((sch) => {
            const isSelected = selectedIds.has(sch.id);
            return (
              <TouchableOpacity
                key={sch.id}
                onPress={() => onToggleSelect(sch.id)}
                style={[
                  styles.managerRow,
                  {
                    backgroundColor: isSelected
                      ? colors.secondary + "15"
                      : colors.surfaceHover,
                    borderColor: isSelected ? colors.secondary : colors.border,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 18 }}>
                  {isSelected ? "☑️" : "⬜"}
                </Text>
                <View
                  style={[
                    styles.managerThumb,
                    { backgroundColor: colors.border },
                  ]}
                >
                  {sch.mediaUrl ? (
                    <Image
                      source={{ uri: sch.mediaUrl }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <View style={styles.managerMeta}>
                  <Text
                    style={[styles.managerCaption, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {sch.caption || "Scheduled post"}
                  </Text>
                  <Text style={[styles.managerDate, { color: colors.secondary }]}>
                    Releases:{" "}
                    {sch.scheduledAt
                      ? new Date(sch.scheduledAt).toLocaleString()
                      : "—"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </SectionCard>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function CreatorStudioScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const colors = getThemeColors(isDark);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Data
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [insights, setInsights] = useState<InsightPoint[]>([]);
  const [content, setContent] = useState<{
    posts: ContentItem[];
    reels: ContentItem[];
    stories: ContentItem[];
  }>({ posts: [], reels: [], stories: [] });
  const [audience, setAudience] = useState<AudienceData | null>(null);
  const [draftsAndScheduled, setDraftsAndScheduled] = useState<{
    drafts: DraftOrScheduled[];
    scheduled: DraftOrScheduled[];
  }>({ drafts: [], scheduled: [] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const [ovData, insData] = await Promise.all([
          getOverviewStats(timeframe),
          getInsights(timeframe),
        ]);
        setOverview(ovData.data.summary);
        setInsights(insData.data.timeSeries ?? []);
      } else if (activeTab === "content") {
        const cntData = await getContentPerformance(contentFilter);
        setContent(cntData.data ?? { posts: [], reels: [], stories: [] });
      } else if (activeTab === "audience") {
        const audData = await getAudienceAnalytics();
        setAudience(audData.data);
      } else if (activeTab === "manager") {
        const mgrData = await getDraftsAndScheduled();
        setDraftsAndScheduled(
          mgrData.data ?? { drafts: [], scheduled: [] },
        );
      }
    } catch (err) {
      console.error("Failed to load Creator Studio data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, timeframe, contentFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Whenever contentFilter changes, refetch content tab
  useEffect(() => {
    if (activeTab === "content") void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentFilter]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleBulkAction = useCallback(
    (action: "archive" | "delete") => {
      if (selectedIds.size === 0) return;
      Alert.alert(
        "Confirm",
        `Are you sure you want to ${action} ${selectedIds.size} item${selectedIds.size !== 1 ? "s" : ""}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes",
            style: action === "delete" ? "destructive" : "default",
            onPress: async () => {
              try {
                await bulkContentAction({
                  action,
                  ids: Array.from(selectedIds),
                  contentType: "post",
                });
                setSelectedIds(new Set());
                void fetchData();
              } catch {
                Alert.alert("Error", "Bulk action failed");
              }
            },
          },
        ],
      );
    },
    [selectedIds, fetchData],
  );

  const renderContent = () => {
    if (loading) return <Skeleton colors={colors} />;

    switch (activeTab) {
      case "overview":
        return overview ? (
          <OverviewTab
            overview={overview}
            insights={insights}
            timeframe={timeframe}
            colors={colors}
            onExport={downloadAnalyticsReport}
          />
        ) : null;

      case "content":
        return (
          <ContentTab
            content={content}
            filter={contentFilter}
            onFilterChange={(f) => {
              setContentFilter(f);
            }}
            colors={colors}
          />
        );

      case "audience":
        return audience ? (
          <AudienceTab audience={audience} colors={colors} />
        ) : null;

      case "manager":
        return (
          <ManagerTab
            drafts={draftsAndScheduled.drafts}
            scheduled={draftsAndScheduled.scheduled}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onBulkArchive={() => handleBulkAction("archive")}
            onBulkDelete={() => handleBulkAction("delete")}
            colors={colors}
          />
        );
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
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            ✨ Creator Studio
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Audience reach, content performance, drafts & scheduling
          </Text>
        </View>

        {/* Timeframe selector (only on overview tab) */}
        {activeTab === "overview" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeframeRow}
          >
            {TIMEFRAMES.map((tf) => (
              <TouchableOpacity
                key={tf.id}
                onPress={() => setTimeframe(tf.id)}
                style={[
                  styles.timeframeBtn,
                  {
                    backgroundColor:
                      timeframe === tf.id ? colors.primary : colors.surfaceHover,
                    borderColor:
                      timeframe === tf.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeframeBtnText,
                    {
                      color:
                        timeframe === tf.id ? "#fff" : colors.textSecondary,
                    },
                  ]}
                >
                  {tf.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Tabs */}
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
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={styles.tabEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: active ? colors.primary : colors.textSecondary,
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
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  headerSub: { fontSize: 12 },

  // Timeframe
  timeframeRow: { gap: 8, paddingTop: 4 },
  timeframeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  timeframeBtnText: { fontSize: 12, fontWeight: "700" },

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
  skeletonWrap: { gap: 16 },
  skeletonCard: { height: 100, borderRadius: 16, borderWidth: 1 },

  // Section card
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 14 },

  // Overview grid
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  overviewCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  overviewCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  overviewCardLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, flex: 1 },
  overviewCardEmoji: { fontSize: 16 },
  overviewCardValue: { fontSize: 26, fontWeight: "900" },
  overviewCardSub: { fontSize: 10, marginTop: 4, fontWeight: "600" },

  // Bar chart
  chartSubtitle: { fontSize: 11, marginBottom: 10 },
  barChartWrap: {
    flexDirection: "row",
    height: 120,
    alignItems: "flex-end",
    gap: 3,
  },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: { fontSize: 8, marginTop: 4, textAlign: "center" },

  // Export
  exportBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  exportBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // Content filter
  filterBar: { paddingBottom: 12, gap: 8 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterBtnText: { fontSize: 12, fontWeight: "700" },

  // Content grid
  contentGrid: { paddingBottom: 20 },
  contentRow: { gap: 12, marginBottom: 12 },
  contentCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  contentThumb: {
    height: 110,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  contentThumbFallback: { fontSize: 28 },
  contentTypeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contentTypeText: { color: "#fff", fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  contentBody: { padding: 10 },
  contentCaption: { fontSize: 11, marginBottom: 8 },
  contentStats: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  contentStat: { fontSize: 10 },

  // Empty
  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontSize: 13, textAlign: "center" },

  // Progress bar
  progressRow: { marginBottom: 12 },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  progressLabel: { fontSize: 12, fontWeight: "600" },
  progressValue: { fontSize: 12, fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },

  // Bulk toolbar
  bulkBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  bulkCount: { fontSize: 13, fontWeight: "700" },
  bulkActions: { flexDirection: "row", gap: 10 },
  bulkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  bulkBtnText: { fontSize: 12, fontWeight: "700" },

  // Manager rows
  managerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  managerThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
  },
  managerMeta: { flex: 1 },
  managerCaption: { fontSize: 13, fontWeight: "700" },
  managerDate: { fontSize: 11, marginTop: 2 },
});
