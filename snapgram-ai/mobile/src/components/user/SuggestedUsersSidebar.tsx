import React, {
  useEffect,
  useState,
} from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import {
  router,
} from "expo-router";
import {
  useSelector,
} from "react-redux";

import {
  Avatar,
} from "../ui/Avatar";
import {
  FollowButton,
} from "../profile/FollowButton";
import api from "../../services/api";
import type {
  RootState,
} from "../../store/store";

interface SuggestedUser {
  _id: string;
  username?: string;
  category?: string;
  profilePicture?: string;
  avatar?: string;
}

export const SuggestedUsersSidebar =
  () => {
    const [
      users,
      setUsers,
    ] = useState<
      SuggestedUser[]
    >([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const {
      user: authUser,
    } = useSelector(
      (state: RootState) =>
        state.auth,
    );

    useEffect(() => {
      let mounted =
        true;

      const fetchUsers =
        async () => {
          try {
            const response =
              await api.get(
                "/api/users/suggested?limit=5",
              );

            if (
              mounted &&
              response.data
                ?.success
            ) {
              setUsers(
                response.data
                  .data || [],
              );
            }
          } catch (
            error
          ) {
            console.error(
              "Failed to fetch suggested users",
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

      void fetchUsers();

      return () => {
        mounted = false;
      };
    }, []);

    /*
     * Original desktop component doesn't render its content until
     * loading is complete. We preserve that behavior without showing
     * a mobile loading skeleton.
     */
    if (loading) {
      return (
        <View
          style={
            styles.loadingPlaceholder
          }
        />
      );
    }

    return (
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {authUser ? (
          <View
            style={
              styles.currentUser
            }
          >
            <Pressable
              onPress={() =>
                router.push(
                  "/app/profile",
                )
              }
              style={
                styles.currentUserProfile
              }
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
            >
              <Avatar
                src={
                  authUser.profilePicture ||
                  authUser.avatar
                }
                alt={
                  authUser.username
                }
                size="md"
                fallback={
                  authUser.username
                    ?.charAt(
                      0,
                    )
                    ?.toUpperCase() ||
                  "U"
                }
              />

              <View
                style={
                  styles.currentUserText
                }
              >
                <Text
                  style={
                    styles.currentUsername
                  }
                  numberOfLines={
                    1
                  }
                >
                  {
                    authUser.username
                  }
                </Text>

                <Text
                  style={
                    styles.currentSubtitle
                  }
                  numberOfLines={
                    1
                  }
                >
                  {authUser.fullName ||
                    authUser.category ||
                    ""}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                /*
                 * The web "Switch" control currently has no handler.
                 * Preserve that behavior rather than inventing account
                 * switching.
                 */
              }}
              accessibilityRole="button"
            >
              <Text
                style={
                  styles.switchText
                }
              >
                Switch
              </Text>
            </Pressable>
          </View>
        ) : null}

        {users.length >
        0 ? (
          <>
            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Suggested for you
              </Text>

              <Pressable
                onPress={() =>
                  router.push(
                    "/app/explore",
                  )
                }
                accessibilityRole="button"
              >
                <Text
                  style={
                    styles.seeAll
                  }
                >
                  See All
                </Text>
              </Pressable>
            </View>

            <View
              style={
                styles.userList
              }
            >
              {users.map(
                (
                  user,
                ) => (
                  <View
                    key={
                      user._id
                    }
                    style={
                      styles.suggestedRow
                    }
                  >
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/app/profile/${user._id}` as any,
                        )
                      }
                      style={
                        styles.suggestedProfile
                      }
                    >
                      <Avatar
                        src={
                          user.profilePicture ||
                          user.avatar
                        }
                        alt={
                          user.username
                        }
                        size="sm"
                        fallback={
                          user.username
                            ?.charAt(
                              0,
                            )
                            ?.toUpperCase() ||
                          "U"
                        }
                      />

                      <View
                        style={
                          styles.userText
                        }
                      >
                        <Text
                          style={
                            styles.username
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            user.username
                          }
                        </Text>

                        <Text
                          style={
                            styles.category
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {user.category ||
                            "Suggested"}
                        </Text>
                      </View>
                    </Pressable>

                    <View
                      style={
                        styles.rowFollow
                      }
                    >
                      <FollowButton
                        userId={
                          user._id
                        }
                        targetUser={
                          user
                        }
                      />
                    </View>
                  </View>
                ),
              )}
            </View>
          </>
        ) : null}

        <View
          style={
            styles.footer
          }
        >
          <View
            style={
              styles.footerLinks
            }
          >
            {[
              "About",
              "Help",
              "Press",
              "API",
              "Jobs",
              "Privacy",
              "Terms",
            ].map(
              (
                item,
              ) => (
                <Pressable
                  key={
                    item
                  }
                  onPress={() => {
                    /*
                     * These are currently plain href="#"
                     * placeholders in the web source. Don't
                     * invent navigation targets here.
                     */
                  }}
                >
                  <Text
                    style={
                      styles.footerLink
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ),
            )}
          </View>

          <Text
            style={
              styles.copyright
            }
          >
            © 2026 INSTASNAP AI
          </Text>
        </View>
      </ScrollView>
    );
  };

const styles =
  StyleSheet.create({
    loadingPlaceholder: {
      width: 320,
      minHeight: 300,
      flexShrink: 0,
    },

    container: {
      width: 320,
      flexShrink: 0,
      backgroundColor:
        "transparent",
    },

    content: {
      paddingVertical: 16,
      paddingLeft: 16,
      paddingRight: 12,
    },

    currentUser: {
      minHeight: 60,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      marginBottom: 22,
    },

    currentUserProfile: {
      flex: 1,
      minWidth: 0,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    currentUserText: {
      flex: 1,
      minWidth: 0,
      marginLeft: 10,
    },

    currentUsername: {
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "800",
      color: "#0f172a",
    },

    currentSubtitle: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 16,
      color: "#64748b",
    },

    switchText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#a855f7",
    },

    sectionHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#64748b",
    },

    seeAll: {
      fontSize: 11,
      fontWeight: "700",
      color: "#0f172a",
    },

    userList: {
      gap: 14,
    },

    suggestedRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    suggestedProfile: {
      flex: 1,
      minWidth: 0,

      flexDirection:
        "row",
      alignItems:
        "center",
    },

    userText: {
      flex: 1,
      minWidth: 0,
      marginLeft: 10,
    },

    username: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700",
      color: "#0f172a",
    },

    category: {
      marginTop: 2,
      fontSize: 10,
      lineHeight: 14,
      color: "#64748b",
    },

    rowFollow: {
      marginLeft: 10,
      flexShrink: 0,
    },

    footer: {
      marginTop: 24,
      paddingTop: 4,
    },

    footerLinks: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      columnGap: 8,
      rowGap: 6,
    },

    footerLink: {
      fontSize: 10,
      color: "#64748b",
    },

    copyright: {
      marginTop: 12,
      fontSize: 9,
      color: "#94a3b8",
    },
  });

export default SuggestedUsersSidebar;