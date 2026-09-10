import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
  usePathname,
} from "expo-router";
import {
  Compass,
  Film,
  Heart,
  Home,
  Menu,
  PlusSquare,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";

import type { RootState } from "../../store/store";
import { Avatar } from "../ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";
import { getColors, logoGradient, primary } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({
  className: _className,
}: SidebarProps) => {
  const pathname = usePathname();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const colors = getColors(isDark);

  const {
    unreadNotificationsCount,
    user,
  } = useSelector(
    (state: RootState) => state.auth,
  );

  const navItems = [
    {
      label: "Home",
      icon: Home,
      path: "/app",
    },
    {
      label: "Explore",
      icon: Compass,
      path: "/app/explore",
    },
    {
      label: "Reels",
      icon: Film,
      path: "/app/reels",
    },
    {
      label: "Chat",
      icon: Send,
      path: "/app/chat",
    },
    {
      label: "Notifications",
      icon: Heart,
      path: "/app/notifications",
      badge: unreadNotificationsCount,
    },
    {
      label: "Create",
      icon: PlusSquare,
      path: "/app/camera",
    },
    {
      label: "AI Studio",
      icon: Sparkles,
      path: "/app/ai",
    },
    {
      label: "Secure Vault",
      icon: ShieldCheck,
      path: "/app/vault",
    },
    {
      label: "Profile",
      icon: User,
      path: "/app/profile",
      isProfile: true,
    },
  ];

  const isActive = (path: string) =>
    path === "/app"
      ? pathname === "/app"
      : pathname?.startsWith(path);

  // ── Derived colours from token system ──────────────────────────────────────
  const sidebarBg        = colors.bgBase;
  const sidebarBorder    = colors.borderSoft;
  const activeItemBg     = colors.bgSurface;  // ✅ dark: #130a1c (not white!)
  const navTextColor     = colors.textSecondary;
  const navTextActiveColor = colors.textPrimary;
  const activeIconColor  = colors.textPrimary; // ✅ theme-aware
  const inactiveIconColor = colors.textSecondary;
  const bottomBorderColor = colors.borderSoft;
  const badgeBorder      = isDark ? colors.bgBase : "#ffffff";

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: sidebarBg,
          borderRightColor: sidebarBorder,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Brand Logo — gradient text matching web ─────────────────────── */}
        <View style={styles.logoContainer}>
          {/*
            Web uses: bg-gradient-to-r from-yellow-400 via-rose-500 to-purple-600
            We approximate with a LinearGradient overlay behind a masked Text.
            Since MaskedView requires a native module build, we use a simpler
            approach: a Row of coloured characters or a gradient badge.
          */}
          <LinearGradient
            colors={[...logoGradient] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>InstaSnap</Text>
          </LinearGradient>
        </View>

        {/* ── Nav Items ───────────────────────────────────────────────────── */}
        <View style={styles.navigation}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Pressable
                key={`${item.label}-${item.path}`}
                onPress={() => router.push(item.path as any)}
                style={({ pressed }) => [
                  styles.navItem,
                  active && {
                    ...styles.navItemActive,
                    backgroundColor: activeItemBg,
                    shadowOpacity: isDark ? 0.5 : 0.04,
                  },
                  pressed && styles.navItemPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
              >
                <View style={styles.iconContainer}>
                  {item.isProfile ? (
                    <Avatar
                      src={user?.profilePicture || user?.avatar}
                      size="sm"
                      fallback={
                        user?.username?.charAt(0) || "U"
                      }
                    />
                  ) : (
                    <Icon
                      size={24}
                      color={active ? activeIconColor : inactiveIconColor}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  )}

                  {/* Notification badge */}
                  {item.badge && item.badge > 0 ? (
                    <View
                      style={[
                        styles.notificationBadge,
                        { borderColor: badgeBorder },
                      ]}
                    >
                      <Text style={styles.notificationBadgeText}>
                        {item.badge > 99 ? "99+" : item.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.navText,
                    { color: active ? navTextActiveColor : navTextColor },
                    active && styles.navTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── More / Settings ─────────────────────────────────────────────── */}
        <View
          style={[
            styles.bottomSection,
            { borderTopColor: bottomBorderColor },
          ]}
        >
          <Pressable
            onPress={() => router.push("/app/settings")}
            style={({ pressed }) => [
              styles.navItem,
              isActive("/app/settings") && {
                ...styles.navItemActive,
                backgroundColor: activeItemBg,
                shadowOpacity: isDark ? 0.5 : 0.04,
              },
              pressed && styles.navItemPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="More Options"
          >
            <View style={styles.iconContainer}>
              <Menu
                size={24}
                color={
                  isActive("/app/settings")
                    ? activeIconColor
                    : inactiveIconColor
                }
                strokeWidth={isActive("/app/settings") ? 2.5 : 2}
              />
            </View>

            <Text
              style={[
                styles.navText,
                {
                  color: isActive("/app/settings")
                    ? navTextActiveColor
                    : navTextColor,
                },
                isActive("/app/settings") && styles.navTextActive,
              ]}
            >
              More
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    flexShrink: 0,
    borderRightWidth: 1,
    // backgroundColor and borderRightColor set dynamically above
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 16,
  },

  logoContainer: {
    paddingHorizontal: 4,
    marginBottom: 24,
  },

  logoGradient: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },

  logoText: {
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
    fontFamily: fonts.outfitBlack,
    color: "#ffffff",               // white text on gradient bg
    letterSpacing: -0.5,
  },

  navigation: {
    gap: 6,
    flex: 1,
  },

  navItem: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 16,
  },

  navItemActive: {
    // backgroundColor set dynamically (theme-aware)
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    // shadowOpacity set dynamically (0.5 dark / 0.04 light)
    shadowRadius: 8,
    elevation: 2,
  },

  navItemPressed: {
    opacity: 0.75,
  },

  iconContainer: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  navText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    // color set dynamically above
  },

  navTextActive: {
    fontFamily: fonts.bold,
  },

  notificationBadge: {
    position: "absolute",
    top: -8,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    // borderColor set dynamically (theme-aware badge outline)
  },

  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: fonts.black,
  },

  bottomSection: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    // borderTopColor set dynamically above
  },
});