import React, {
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
} from "expo-router";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import {
  User,
  Lock,
  ShieldAlert,
  Bell,
  Moon,
  Eye,
  Languages,
  HelpCircle,
  Info,
  Clock,
  MessageSquare,
  Database,
  Bot,
  ChevronRight,
  ChevronLeft,
  Search,
  LogOut,
} from "lucide-react-native";

import type { RootState } from "../../src/store/store";
import {
  logout,
} from "../../src/store/authSlice";
import {
  Input,
} from "../../src/components/ui/Input";

import AccountSettings from "../../src/components/settings/AccountSettings";
import PrivacySettings from "../../src/components/settings/PrivacySettings";
import SecuritySettings from "../../src/components/settings/SecuritySettings";
import NotificationSettings from "../../src/components/settings/NotificationSettings";
import AppearanceSettings from "../../src/components/settings/AppearanceSettings";
import AccessibilitySettings from "../../src/components/settings/AccessibilitySettings";
import LanguageSettings from "../../src/components/settings/LanguageSettings";
import HelpSettings from "../../src/components/settings/HelpSettings";
import AboutSettings from "../../src/components/settings/AboutSettings";
import TimeManagementSettings from "../../src/components/settings/TimeManagementSettings";
import ChatSettings from "../../src/components/settings/ChatSettings";
import MediaVaultSettings from "../../src/components/settings/MediaVaultSettings";
import AiSettings from "../../src/components/settings/AiSettings";

type SettingsCategoryId =
  | "account"
  | "privacy"
  | "security"
  | "notifications"
  | "appearance"
  | "accessibility"
  | "language"
  | "help"
  | "about"
  | "time"
  | "chat"
  | "media"
  | "ai";

type SettingsCategory = {
  id: SettingsCategoryId;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  keywords: string[];
};

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: "account",
    label: "Account",
    description:
      "Manage your profile, email, password, and account information.",
    icon: User,
    component: AccountSettings,
    keywords: [
      "username",
      "email",
      "phone",
      "password",
      "personal",
      "profile",
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    description:
      "Control who can interact with you and see your activity.",
    icon: Lock,
    component: PrivacySettings,
    keywords: [
      "private",
      "activity",
      "status",
      "blocked",
      "followers",
    ],
  },
  {
    id: "security",
    label: "Security",
    description:
      "Protect your account, sessions, and authentication.",
    icon: ShieldAlert,
    component: SecuritySettings,
    keywords: [
      "password",
      "2fa",
      "two factor",
      "login",
      "sessions",
      "authentication",
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    description:
      "Manage push notifications, alerts, and notification preferences.",
    icon: Bell,
    component: NotificationSettings,
    keywords: [
      "push",
      "email",
      "pause",
      "quiet",
      "alert",
      "notifications",
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    description:
      "Customize the visual appearance of SnapGram.",
    icon: Moon,
    component: AppearanceSettings,
    keywords: [
      "dark",
      "light",
      "theme",
      "appearance",
      "mode",
      "display",
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description:
      "Adjust accessibility and readability preferences.",
    icon: Eye,
    component: AccessibilitySettings,
    keywords: [
      "contrast",
      "screen reader",
      "accessibility",
      "font",
      "visibility",
      "text",
    ],
  },
  {
    id: "language",
    label: "Language",
    description:
      "Choose your preferred app language.",
    icon: Languages,
    component: LanguageSettings,
    keywords: [
      "translate",
      "translation",
      "english",
      "spanish",
      "language",
    ],
  },
  {
    id: "help",
    label: "Help",
    description:
      "Get support, report problems, and find answers.",
    icon: HelpCircle,
    component: HelpSettings,
    keywords: [
      "support",
      "faq",
      "report",
      "problem",
      "help",
    ],
  },
  {
    id: "about",
    label: "About",
    description:
      "View app information, legal details, and policies.",
    icon: Info,
    component: AboutSettings,
    keywords: [
      "version",
      "terms",
      "privacy policy",
      "legal",
      "about",
    ],
  },
  {
    id: "time",
    label: "Time Management",
    description:
      "Manage daily limits, reminders, and screen-time controls.",
    icon: Clock,
    component: TimeManagementSettings,
    keywords: [
      "daily",
      "limit",
      "reminder",
      "break",
      "screen time",
      "time",
    ],
  },
  {
    id: "chat",
    label: "Chat & Messages",
    description:
      "Configure direct messages, replies, and chat behavior.",
    icon: MessageSquare,
    component: ChatSettings,
    keywords: [
      "dm",
      "message",
      "reply",
      "story",
      "request",
      "chat",
    ],
  },
  {
    id: "media",
    label: "Media & Vault",
    description:
      "Manage media quality, downloads, uploads, and Vault settings.",
    icon: Database,
    component: MediaVaultSettings,
    keywords: [
      "download",
      "save",
      "quality",
      "upload",
      "data",
      "cellular",
      "vault",
      "media",
    ],
  },
  {
    id: "ai",
    label: "AI Features",
    description:
      "Configure AI-powered features, suggestions, captions, and bots.",
    icon: Bot,
    component: AiSettings,
    keywords: [
      "ai",
      "suggestions",
      "captions",
      "filters",
      "smart",
      "bot",
      "assistant",
    ],
  },
];

const SettingsPage = () => {
  const dispatch = useDispatch();

  const settingsLoading = useSelector(
    (state: RootState) =>
      state.auth.settingsLoading,
  );

  const [activeTab, setActiveTab] =
    useState<SettingsCategoryId>("account");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showList, setShowList] =
    useState(true);

  const filteredCategories = useMemo(() => {
    const normalized =
      searchQuery
        .trim()
        .toLowerCase();

    if (!normalized) {
      return SETTINGS_CATEGORIES;
    }

    return SETTINGS_CATEGORIES.filter(
      (category) => {
        const labelMatch =
          category.label
            .toLowerCase()
            .includes(normalized);

        const descriptionMatch =
          category.description
            .toLowerCase()
            .includes(normalized);

        const keywordMatch =
          category.keywords.some(
            (keyword) =>
              keyword
                .toLowerCase()
                .includes(normalized),
          );

        return (
          labelMatch ||
          descriptionMatch ||
          keywordMatch
        );
      },
    );
  }, [searchQuery]);

  const activeCategory =
    SETTINGS_CATEGORIES.find(
      (category) =>
        category.id === activeTab,
    ) || SETTINGS_CATEGORIES[0];

  const ActiveComponent =
    activeCategory.component;

  const handleSelectCategory = (
    categoryId: SettingsCategoryId,
  ) => {
    setActiveTab(categoryId);
    setShowList(false);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    try {
      dispatch(logout());
      router.replace("/auth/login");
    } catch (error) {
      console.error(
        "Failed to logout:",
        error,
      );
    }
  };

  const handleBackToApp = () => {
    router.replace("/app");
  };

  return (
    <View style={styles.screen}>
      {/* ─────────────────────────────
          MOBILE CATEGORY LIST
         ───────────────────────────── */}
      {showList ? (
        <View style={styles.listContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable
                onPress={
                  handleBackToApp
                }
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed &&
                    styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Back to app"
              >
                <ChevronLeft
                  size={24}
                  color="#0f172a"
                />
              </Pressable>

              <Text
                style={
                  styles.headerTitle
                }
              >
                Settings
              </Text>

              <View
                style={
                  styles.headerSpacer
                }
              />
            </View>

            <View
              style={
                styles.searchWrapper
              }
            >
              <Search
                size={19}
                color="#64748b"
                style={
                  styles.searchIcon
                }
              />

              <Input
                placeholder="Search settings..."
                value={
                  searchQuery
                }
                onChangeText={
                  setSearchQuery
                }
                autoCapitalize="none"
                autoCorrect={false}
                style={
                  styles.searchInput
                }
              />
            </View>
          </View>

          {/* Category List */}
          <ScrollView
            contentContainerStyle={
              styles.categoryScrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            {filteredCategories.length ===
            0 ? (
              <View
                style={
                  styles.emptySearch
                }
              >
                <Search
                  size={34}
                  color="#94a3b8"
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No settings found
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  Try another search term.
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  SETTINGS
                </Text>

                <View
                  style={
                    styles.categoryList
                  }
                >
                  {filteredCategories.map(
                    (category) => {
                      const Icon =
                        category.icon;

                      const isActive =
                        activeTab ===
                        category.id;

                      return (
                        <Pressable
                          key={
                            category.id
                          }
                          onPress={() =>
                            handleSelectCategory(
                              category.id,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.categoryRow,
                            isActive &&
                              styles.categoryRowActive,
                            pressed &&
                              styles.pressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`${category.label} settings`}
                        >
                          <View
                            style={[
                              styles.categoryIconWrapper,
                              isActive &&
                                styles.categoryIconWrapperActive,
                            ]}
                          >
                            <Icon
                              size={21}
                              color={
                                isActive
                                  ? "#ffffff"
                                  : "#64748b"
                              }
                              strokeWidth={
                                2
                              }
                            />
                          </View>

                          <View
                            style={
                              styles.categoryTextWrapper
                            }
                          >
                            <Text
                              style={[
                                styles.categoryLabel,
                                isActive &&
                                  styles.categoryLabelActive,
                              ]}
                            >
                              {
                                category.label
                              }
                            </Text>

                            <Text
                              style={
                                styles.categoryDescription
                              }
                              numberOfLines={
                                2
                              }
                            >
                              {
                                category.description
                              }
                            </Text>
                          </View>

                          <ChevronRight
                            size={20}
                            color={
                              isActive
                                ? "#a855f7"
                                : "#94a3b8"
                            }
                          />
                        </Pressable>
                      );
                    },
                  )}
                </View>

                {/* Account actions */}
                <View
                  style={
                    styles.bottomSection
                  }
                >
                  <Pressable
                    onPress={
                      handleLogout
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.logoutRow,
                      pressed &&
                        styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Log out"
                  >
                    <View
                      style={
                        styles.logoutIconWrapper
                      }
                    >
                      <LogOut
                        size={20}
                        color="#ef4444"
                      />
                    </View>

                    <Text
                      style={
                        styles.logoutText
                      }
                    >
                      Log Out
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      ) : (
        /* ─────────────────────────────
           MOBILE SETTINGS DETAIL
           ───────────────────────────── */
        <View style={styles.detailContainer}>
          {/* Detail Header */}
          <View
            style={
              styles.detailHeader
            }
          >
            <Pressable
              onPress={() =>
                setShowList(true)
              }
              style={({ pressed }) => [
                styles.headerButton,
                pressed &&
                  styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Back to settings"
            >
              <ChevronLeft
                size={24}
                color="#0f172a"
              />
            </Pressable>

            <View
              style={
                styles.detailHeaderText
              }
            >
              <Text
                style={
                  styles.detailTitle
                }
                numberOfLines={1}
              >
                {
                  activeCategory.label
                }
              </Text>

              <Text
                style={
                  styles.detailSubtitle
                }
                numberOfLines={1}
              >
                {
                  activeCategory.description
                }
              </Text>
            </View>
          </View>

          {/* Detail Content */}
          <ScrollView
            style={
              styles.detailScroll
            }
            contentContainerStyle={
              styles.detailContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            {settingsLoading ? (
              <View
                style={
                  styles.loadingContainer
                }
              >
                <View
                  style={
                    styles.loadingCircle
                  }
                >
                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Loading...
                  </Text>
                </View>
              </View>
            ) : (
              <ActiveComponent />
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default SettingsPage;

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    listContainer: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
      backgroundColor:
        "rgba(248,250,252,0.98)",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    headerTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 14,
    },

    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    headerSpacer: {
      width: 42,
      height: 42,
    },

    headerTitle: {
      flex: 1,
      marginHorizontal: 12,
      textAlign:
        "center",
      fontSize: 24,
      lineHeight: 30,
      fontWeight:
        "800",
      color:
        "#0f172a",
    },

    searchWrapper: {
      position:
        "relative",
      justifyContent:
        "center",
    },

    searchIcon: {
      position:
        "absolute",
      left: 13,
      zIndex: 3,
    },

    searchInput: {
      paddingLeft: 40,
      backgroundColor:
        "#ffffff",
      borderColor:
        "#e2e8f0",
      borderRadius: 14,
    },

    categoryScrollContent: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 36,
    },

    sectionLabel: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight:
        "800",
      letterSpacing: 1.2,
      color:
        "#94a3b8",
      marginBottom: 10,
      paddingHorizontal: 4,
    },

    categoryList: {
      gap: 8,
    },

    categoryRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      minHeight: 78,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderRadius: 18,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },

    categoryRowActive: {
      backgroundColor:
        "rgba(168,85,247,0.08)",
      borderColor:
        "rgba(168,85,247,0.22)",
    },

    categoryIconWrapper: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f1f5f9",
      marginRight: 12,
    },

    categoryIconWrapperActive: {
      backgroundColor:
        "#a855f7",
      shadowColor:
        "#a855f7",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 4,
    },

    categoryTextWrapper: {
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },

    categoryLabel: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight:
        "700",
      color:
        "#0f172a",
      marginBottom: 3,
    },

    categoryLabelActive: {
      color:
        "#7c3aed",
    },

    categoryDescription: {
      fontSize: 12,
      lineHeight: 17,
      color:
        "#64748b",
    },

    bottomSection: {
      marginTop: 22,
      paddingTop: 18,
      borderTopWidth: 1,
      borderTopColor:
        "#e2e8f0",
    },

    logoutRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      minHeight: 58,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "rgba(239,68,68,0.15)",
    },

    logoutIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(239,68,68,0.08)",
      marginRight: 12,
    },

    logoutText: {
      fontSize: 15,
      fontWeight:
        "700",
      color:
        "#ef4444",
    },

    emptySearch: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingVertical: 80,
      paddingHorizontal: 20,
    },

    emptyTitle: {
      marginTop: 14,
      fontSize: 17,
      fontWeight:
        "700",
      color:
        "#0f172a",
      textAlign:
        "center",
    },

    emptyDescription: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color:
        "#64748b",
      textAlign:
        "center",
    },

    detailContainer: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    detailHeader: {
      minHeight: 76,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    detailHeaderText: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },

    detailTitle: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight:
        "800",
      color:
        "#0f172a",
    },

    detailSubtitle: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 17,
      color:
        "#64748b",
    },

    detailScroll: {
      flex: 1,
    },

    detailContent: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 48,
    },

    loadingContainer: {
      flex: 1,
      minHeight: 300,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingCircle: {
      minWidth: 120,
      minHeight: 52,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    loadingText: {
      fontSize: 14,
      fontWeight:
        "600",
      color:
        "#64748b",
    },

    pressed: {
      opacity: 0.75,
    },
  });