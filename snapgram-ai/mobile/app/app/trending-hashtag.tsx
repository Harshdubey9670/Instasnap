// FILE: mobile/app/app/trending-hashtags.tsx

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Flame,
  Hash,
  Search,
  TrendingUp,
} from "lucide-react-native";

import api from "../../src/services/api";

type TrendingTag = {
  tag: string;
  count: number;
  searchVolume?: number;
  growth: number;
};

const formatNumber = (num: number = 0) => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }

  return String(num);
};

export default function TrendingHashtagsScreen() {
  const [hashtags, setHashtags] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get(
          "/api/posts/trending-hashtags?limit=30",
        );

        if (res.data?.success) {
          setHashtags(
            Array.isArray(res.data.data)
              ? res.data.data
              : [],
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch trending hashtags",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchTrending();
  }, []);

  const topThree = hashtags.slice(0, 3);
  const remaining = hashtags.slice(3);

  const openTag = (tag: string) => {
    router.push(`/app/hashtag/${tag}`);
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={remaining}
        keyExtractor={(item) => item.tag}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft
                  size={24}
                  color="#64748b"
                />
              </Pressable>

              <View style={styles.headerIcon}>
                <TrendingUp
                  size={24}
                  color="#ffffff"
                />
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title}>
                  Trending
                </Text>

                <Text style={styles.subtitle}>
                  Discover what's happening right now
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color="#a855f7"
                />
              </View>
            ) : hashtags.length === 0 ? (
              <View style={styles.emptyCard}>
                <Hash
                  size={46}
                  color="#64748b"
                />
                <Text style={styles.emptyTitle}>
                  No hashtags yet
                </Text>
                <Text style={styles.emptyDescription}>
                  Hashtags appear when people post with #tags in their captions.
                </Text>
              </View>
            ) : (
              <View>
                <View style={styles.topGrid}>
                  {topThree.map((item, index) => {
                    const positive = item.growth >= 0;

                    return (
                      <Pressable
                        key={item.tag}
                        onPress={() =>
                          openTag(item.tag)
                        }
                        style={[
                          styles.topCard,
                          index === 0 &&
                            styles.firstTopCard,
                        ]}
                      >
                        <View style={styles.topCardBgIcon}>
                          <Hash
                            size={92}
                            color="#a855f7"
                          />
                        </View>

                        <View style={styles.topRow}>
                          <View
                            style={[
                              styles.rankCircle,
                              index === 0 &&
                                styles.rankGold,
                              index === 1 &&
                                styles.rankSilver,
                              index === 2 &&
                                styles.rankBronze,
                            ]}
                          >
                            <Text
                              style={styles.rankText}
                            >
                              #{index + 1}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.growthPill,
                              positive
                                ? styles.growthPositive
                                : styles.growthNegative,
                            ]}
                          >
                            {positive ? (
                              <ArrowUpRight
                                size={13}
                                color="#16a34a"
                              />
                            ) : (
                              <ArrowDownRight
                                size={13}
                                color="#dc2626"
                              />
                            )}

                            <Text
                              style={[
                                styles.growthText,
                                {
                                  color: positive
                                    ? "#16a34a"
                                    : "#dc2626",
                                },
                              ]}
                            >
                              {Math.abs(
                                item.growth,
                              )}
                              %
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={styles.tagTitle}
                          numberOfLines={1}
                        >
                          #{item.tag}
                        </Text>

                        <View style={styles.statRow}>
                          <Activity
                            size={16}
                            color="#64748b"
                          />

                          <Text style={styles.statValue}>
                            {formatNumber(
                              item.count,
                            )}
                          </Text>

                          <Text style={styles.statText}>
                            posts
                          </Text>
                        </View>

                        <View style={styles.statRow}>
                          <Search
                            size={16}
                            color="#64748b"
                          />

                          <Text style={styles.statValue}>
                            {formatNumber(
                              item.searchVolume ||
                                0,
                            )}
                          </Text>

                          <Text style={styles.statText}>
                            est. volume
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {remaining.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <Flame
                      size={20}
                      color="#f97316"
                    />
                    <Text
                      style={styles.sectionTitle}
                    >
                      More Trending Topics
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const positive = item.growth >= 0;
          const globalRank = index + 4;

          return (
            <Pressable
              onPress={() => openTag(item.tag)}
              style={styles.listItem}
            >
              <View style={styles.rankNumberWrap}>
                <Text style={styles.rankNumber}>
                  {globalRank}
                </Text>
              </View>

              <View style={styles.hashBox}>
                <Hash
                  size={22}
                  color="#0f172a"
                />
              </View>

              <View style={styles.listMain}>
                <Text
                  style={styles.listTitle}
                  numberOfLines={1}
                >
                  #{item.tag}
                </Text>

                <View style={styles.inlineStats}>
                  <View style={styles.inlineItem}>
                    <Activity
                      size={13}
                      color="#64748b"
                    />
                    <Text style={styles.inlineText}>
                      {formatNumber(
                        item.count,
                      )}{" "}
                      posts
                    </Text>
                  </View>

                  <View style={styles.separatorDot} />

                  <View style={styles.inlineItem}>
                    <Search
                      size={13}
                      color="#64748b"
                    />
                    <Text style={styles.inlineText}>
                      {formatNumber(
                        item.searchVolume ||
                          0,
                      )}{" "}
                      vol
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.growthRight}>
                <Text
                  style={styles.weeklyText}
                >
                  Weekly
                </Text>

                <View
                  style={[
                    styles.growthPill,
                    positive
                      ? styles.growthPositive
                      : styles.growthNegative,
                  ]}
                >
                  {positive ? (
                    <ArrowUpRight
                      size={13}
                      color="#16a34a"
                    />
                  ) : (
                    <ArrowDownRight
                      size={13}
                      color="#dc2626"
                    />
                  )}

                  <Text
                    style={[
                      styles.growthText,
                      {
                        color: positive
                          ? "#16a34a"
                          : "#dc2626",
                      },
                    ]}
                  >
                    {Math.abs(
                      item.growth,
                    )}
                    %
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748b",
  },

  loadingContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCard: {
    padding: 34,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  emptyDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
    textAlign: "center",
  },

  topGrid: {
    gap: 12,
  },

  topCard: {
    position: "relative",
    overflow: "hidden",
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 200,
  },

  firstTopCard: {
    borderColor: "rgba(168,85,247,0.35)",
  },

  topCardBgIcon: {
    position: "absolute",
    right: -14,
    top: -10,
    opacity: 0.06,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rankCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  rankGold: {
    backgroundColor: "rgba(234,179,8,0.18)",
  },

  rankSilver: {
    backgroundColor: "rgba(148,163,184,0.18)",
  },

  rankBronze: {
    backgroundColor: "rgba(249,115,22,0.18)",
  },

  rankText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },

  growthPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  growthPositive: {
    backgroundColor: "rgba(34,197,94,0.10)",
  },

  growthNegative: {
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  growthText: {
    fontSize: 12,
    fontWeight: "800",
  },

  tagTitle: {
    marginTop: 18,
    fontSize: 23,
    fontWeight: "800",
    color: "#0f172a",
  },

  statRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },

  statText: {
    fontSize: 14,
    color: "#64748b",
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },

  listItem: {
    minHeight: 84,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
  },

  rankNumberWrap: {
    width: 30,
    alignItems: "center",
    marginRight: 4,
  },

  rankNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
  },

  hashBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  listMain: {
    flex: 1,
    minWidth: 0,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },

  inlineStats: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  inlineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  inlineText: {
    fontSize: 11,
    color: "#64748b",
  },

  separatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
  },

  growthRight: {
    marginLeft: 8,
    alignItems: "flex-end",
  },

  weeklyText: {
    marginBottom: 5,
    fontSize: 10,
    color: "#64748b",
  },
});