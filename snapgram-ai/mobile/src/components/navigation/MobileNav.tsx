import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import {
  Film,
  Home,
  Search,
  ShieldCheck,
  User,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootState } from "../../store/store";
import { useTheme } from "../../contexts/ThemeContext";
import { Avatar } from "../ui/Avatar";
import { getColors, primary } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

interface NavItem {
  name: string;
  path: string;
  icon: typeof Home | typeof Search | typeof Film | typeof ShieldCheck | typeof User;
  exact?: boolean;
  isProfile?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home",    icon: Home,       path: "/app",         exact: true },
  { name: "Search",  icon: Search,     path: "/app/explore" },
  { name: "Reels",   icon: Film,       path: "/app/reels" },
  { name: "Vault",   icon: ShieldCheck,path: "/app/vault" },
  { name: "Profile", icon: User,       path: "/app/profile", isProfile: true },
];

export const MobileNav = () => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const colors = getColors(isDark);

  const { user: authUser } = useSelector(
    (state: RootState) => state.auth,
  );

  const hiddenPages = [
    "/spotlight",
    "/app/camera",
    "/app/story/create",
    "/app/reels/create",
  ];

  const shouldHide = hiddenPages.some((page) =>
    pathname?.includes(page),
  );

  // ── Active tab detection ───────────────────────────────────────────────────
  const activeIndex = NAV_ITEMS.findIndex((item) =>
    item.exact
      ? pathname === item.path || pathname === `${item.path}/`
      : pathname?.startsWith(item.path),
  );

  // ── Spring animated bubble position ───────────────────────────────────────
  // Mirrors framer-motion layoutId="mobile-nav-bubble" spring behaviour
  const bubbleIndexAnim = useRef(new Animated.Value(Math.max(activeIndex, 0))).current;
  const { width: screenWidth } = Dimensions.get("window");
  const TAB_COUNT = NAV_ITEMS.length;
  const TAB_WIDTH = Math.min(screenWidth, 520) / TAB_COUNT;
  const BUBBLE_W = 44;
  const BUBBLE_H = 32;

  useEffect(() => {
    if (activeIndex >= 0) {
      Animated.spring(bubbleIndexAnim, {
        toValue: activeIndex,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex, bubbleIndexAnim]);

  if (shouldHide) return null;

  const bubbleTranslateX = bubbleIndexAnim.interpolate({
    inputRange: NAV_ITEMS.map((_, i) => i),
    outputRange: NAV_ITEMS.map(
      (_, i) => i * TAB_WIDTH + (TAB_WIDTH - BUBBLE_W) / 2,
    ),
    extrapolate: "clamp",
  });

  // ── Colours from token system ──────────────────────────────────────────────
  const bgBase      = colors.bgBase;
  const borderColor = colors.borderSoft;
  // ✅ Use primary-500 (#a855f7) for BOTH light AND dark — matches web exactly
  const activeColor   = primary[500];
  const inactiveColor = colors.textSecondary;
  const activeBubbleBg = isDark
    ? "rgba(168, 85, 247, 0.20)"
    : "rgba(168, 85, 247, 0.12)";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgBase,
          borderTopColor: borderColor,
          paddingBottom: Math.max(insets.bottom, 4),
          height: 58 + Math.max(insets.bottom, 4),
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel="Mobile navigation"
    >
      {/* Spring-animated shared bubble behind all tabs */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sharedBubble,
          {
            width: BUBBLE_W,
            height: BUBBLE_H,
            backgroundColor: activeBubbleBg,
            transform: [{ translateX: bubbleTranslateX }],
          },
        ]}
      />

      {/* Nav items */}
      <View style={[styles.nav, { maxWidth: Math.min(screenWidth, 520) }]}>
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeIndex === index;

          if (item.isProfile) {
            return (
              <Pressable
                key={item.name}
                onPress={() => router.push(item.path as any)}
                style={({ pressed }) => [
                  styles.navItem,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={item.name}
              >
                <View
                  style={[
                    styles.profileWrapper,
                    {
                      borderColor: isActive ? activeColor : "transparent",
                      borderWidth: isActive ? 2 : 0,
                    },
                  ]}
                >
                  <Avatar
                    src={authUser?.profilePicture || authUser?.avatar}
                    size="xs"
                    fallback={authUser?.username?.charAt(0)?.toUpperCase() || "U"}
                  />
                </View>

                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? activeColor : inactiveColor,
                      fontFamily: isActive ? fonts.bold : fonts.semibold,
                    },
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }

          const Icon = item.icon;

          return (
            <Pressable
              key={item.name}
              onPress={() => router.push(item.path as any)}
              style={({ pressed }) => [
                styles.navItem,
                pressed && styles.pressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.name}
            >
              {/* Icon box — bubble bg is the shared animated View above */}
              <View style={styles.iconBox}>
                <Icon
                  size={20}
                  color={isActive ? activeColor : inactiveColor}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>

              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? activeColor : inactiveColor,
                    fontFamily: isActive ? fonts.bold : fonts.semibold,
                  },
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 500,
    elevation: 20,
    borderTopWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: "hidden",
  },
  sharedBubble: {
    position: "absolute",
    top: 13,           // vertically centres the bubble at icon level
    left: 0,
    borderRadius: 16,
  },
  nav: {
    height: 58,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },
  navItem: {
    flex: 1,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    // background handled by the shared animated bubble above
  },
  profileWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    padding: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    // color and fontFamily set dynamically
  },
  pressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
});

export default MobileNav;