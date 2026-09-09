import React, {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BadgeCheck,
  Flame,
  Users,
} from "lucide-react-native";
import {
  router,
} from "expo-router";
import {
  useSelector,
} from "react-redux";

import api from "../../services/api";
import type { RootState } from "../../store/store";
import { trackEvent } from "../../utils/analytics";
import {
  FollowButton,
} from "../profile/FollowButton";
import {
  Avatar,
} from "../ui/Avatar";

interface Creator {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
  isVerified?: boolean;
  followerCount?: number;
}

const formatNumber =
  (value?: number) => {
    const num =
      Number(value) || 0;

    if (num >= 1000000) {
      return `${(
        num / 1000000
      ).toFixed(1)}M`;
    }

    if (num >= 1000) {
      return `${(
        num / 1000
      ).toFixed(1)}K`;
    }

    return String(num);
  };

export const PopularCreatorsCarousel =
  () => {
    const {
      user: currentUser,
    } = useSelector(
      (state: RootState) =>
        state.auth,
    );

    const [
      creators,
      setCreators,
    ] = useState<
      Creator[]
    >([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(() => {
      let mounted =
        true;

      const fetchCreators =
        async () => {
          try {
            const response =
              await api.get(
                "/api/users/popular?limit=10",
              );

            if (
              mounted &&
              response.data
                ?.success
            ) {
              setCreators(
                response.data
                  .data || [],
              );
            }
          } catch (
            error
          ) {
            console.error(
              "Failed to fetch popular creators",
              error,
            );
          } finally {
            if (mounted) {
              setLoading(
                false,
              );
            }
          }
        };

      void fetchCreators();

      return () => {
        mounted = false;
      };
    }, [
      currentUser,
    ]);

    if (loading) {
      return (
        <View
          style={
            styles.loading
          }
        >
          <ActivityIndicator
            size="large"
            color="#a855f7"
          />
        </View>
      );
    }

    if (
      creators.length ===
      0
    ) {
      return null;
    }

    const openProfile =
      async (
        creator: Creator,
      ) => {
        try {
          await trackEvent(
            "recommendation_click",
            creator._id,
            {
              source:
                "popular_creators",
              username:
                creator.username,
            },
          );
        } catch {
          // Analytics must never block navigation.
        }

        router.push(
          `/app/profile/${creator._id}` as any,
        );
      };

    return (
      <View
        style={
          styles.container
        }
        accessibilityRole="summary"
      >
        <View
          style={
            styles.heading
          }
        >
          <Flame
            size={20}
            color="#f97316"
          />

          <Text
            style={
              styles.headingText
            }
          >
            Popular Creators
          </Text>
        </View>

        <FlatList
          data={
            creators
          }
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.listContent
          }
          ItemSeparatorComponent={() => (
            <View
              style={
                styles.separator
              }
            />
          )}
          keyExtractor={(
            item,
          ) =>
            item._id}
          renderItem={({
            item,
            index,
          }) => (
            <View
              style={
                styles.cardWrapper
              }
            >
              <View
                style={
                  styles.card
                }
              >
                <Pressable
                  onPress={() =>
                    void openProfile(
                      item,
                    )
                  }
                  style={
                    styles.profileArea
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`View ${item.username || "creator"} profile`}
                >
                  <View
                    style={
                      styles.rankBadge
                    }
                  >
                    <Text
                      style={
                        styles.rankText
                      }
                    >
                      #
                      {index +
                        1}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.avatarContainer
                    }
                  >
                    <View
                      style={
                        styles.avatarRing
                      }
                    >
                      <Avatar
                        src={
                          item.profilePicture ||
                          item.avatar
                        }
                        alt={
                          item.username
                        }
                        size="lg"
                        fallback={
                          item.username
                            ?.charAt(
                              0,
                            )
                            ?.toUpperCase() ||
                          "U"
                        }
                      />
                    </View>

                    {item.isVerified ? (
                      <View
                        style={
                          styles.verifiedBadge
                        }
                      >
                        <BadgeCheck
                          size={22}
                          color="#3b82f6"
                          fill="rgba(59,130,246,0.10)"
                        />
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={
                      styles.fullName
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {item.fullName ||
                      item.username ||
                      "Creator"}
                  </Text>

                  <Text
                    style={
                      styles.username
                    }
                    numberOfLines={
                      1
                    }
                  >
                    @
                    {item.username ||
                      "creator"}
                  </Text>

                  <View
                    style={
                      styles.followersPill
                    }
                  >
                    <Users
                      size={14}
                      color="#64748b"
                    />

                    <Text
                      style={
                        styles.followersText
                      }
                    >
                      {formatNumber(
                        item.followerCount,
                      )}
                    </Text>
                  </View>
                </Pressable>

                <View
                  style={
                    styles.followButton
                  }
                >
                  <FollowButton
                    userId={
                      item._id
                    }
                    targetUser={
                      item
                    }
                  />
                </View>
              </View>
            </View>
          )}
        />
      </View>
    );
  };

const styles =
  StyleSheet.create({
    loading: {
      width: "100%",
      minHeight: 120,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    container: {
      width: "100%",
      marginBottom: 24,
    },

    heading: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      paddingHorizontal: 8,
      marginBottom: 12,
    },

    headingText: {
      fontSize: 20,
      fontWeight: "800",
      color: "#0f172a",
    },

    listContent: {
      paddingHorizontal: 8,
      paddingBottom: 8,
    },

    separator: {
      width: 12,
    },

    cardWrapper: {
      width: 180,
    },

    card: {
      minHeight: 260,
      borderRadius: 24,

      padding: 16,

      alignItems:
        "center",

      backgroundColor:
        "#ffffff",

      borderWidth: 1,
      borderColor:
        "#e2e8f0",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },

    profileArea: {
      width: "100%",
      alignItems:
        "center",
      position:
        "relative",
    },

    rankBadge: {
      position:
        "absolute",
      left: -5,
      top: -21,

      width: 32,
      height: 32,

      borderRadius: 16,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "#f8fafc",

      borderWidth: 2,
      borderColor:
        "#e2e8f0",

      zIndex: 5,
    },

    rankText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#64748b",
    },

    avatarContainer: {
      position:
        "relative",
      marginTop: 2,
      marginBottom: 10,
    },

    avatarRing: {
      width: 84,
      height: 84,
      borderRadius: 42,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderWidth: 4,
      borderColor:
        "#f8fafc",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.10,
      shadowRadius: 10,
      elevation: 3,
    },

    verifiedBadge: {
      position:
        "absolute",
      right: -1,
      bottom: -1,

      width: 28,
      height: 28,

      borderRadius: 14,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "#f8fafc",
    },

    fullName: {
      width: "100%",
      textAlign:
        "center",
      fontSize: 14,
      fontWeight: "800",
      color: "#0f172a",
    },

    username: {
      width: "100%",
      marginTop: 2,
      marginBottom: 12,

      textAlign:
        "center",
      fontSize: 11,
      color: "#64748b",
    },

    followersPill: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,

      paddingHorizontal: 10,
      paddingVertical: 5,

      borderRadius: 999,

      backgroundColor:
        "#f8fafc",

      marginBottom: 14,
    },

    followersText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#64748b",
    },

    followButton: {
      width: "100%",
      marginTop: "auto",
    },
  });

export default PopularCreatorsCarousel;