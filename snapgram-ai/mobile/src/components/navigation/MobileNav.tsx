import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import {
  Home,
  MessageCircle,
  Search,
  SquarePlus,
  User,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootState } from "../../store/store";
import { useTheme } from "../../contexts/ThemeContext";
import { getApiBaseUrl } from "../../config/env";
import { CreateMenuModal } from "./CreateMenuModal";
import { CreatePostModal } from "../post/CreatePostModal";

const API_BASE = getApiBaseUrl();

function getMediaUrl(url?: string): string {
  if (!url) return "";
  if (url.includes("cloudinary.com") || url.includes("unsplash.com")) {
    return `${API_BASE}/api/proxy/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

interface NavItem {
  name: string;
  path?: string;
  icon: any;
  exact?: boolean;
  isProfile?: boolean;
  isAction?: boolean;
  hasBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home",     icon: Home,          path: "/app",         exact: true },
  { name: "Search",   icon: Search,        path: "/app/explore" },
  { name: "Create",   icon: SquarePlus,    isAction: true },
  { name: "Messages", icon: MessageCircle, path: "/app/chat",    hasBadge: true },
  { name: "Profile",  icon: User,          path: "/app/profile", isProfile: true },
];

export const MobileNav = () => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

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

  // Active tab detection
  const activeIndex = NAV_ITEMS.findIndex((item) =>
    !item.isAction && item.path && (item.exact
      ? pathname === item.path || pathname === `${item.path}/`
      : pathname?.startsWith(item.path)),
  );

  const { width: screenWidth } = Dimensions.get("window");
  const NAV_MAX_WIDTH = Math.min(screenWidth - 32, 400);

  if (shouldHide) return null;

  const activeColor = "#FF6B35";
  const inactiveColor = isDark ? "#A8A29E" : "#1A1A1A";

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.pill,
          {
            width: NAV_MAX_WIDTH,
            backgroundColor: isDark ? "rgba(28, 16, 14, 0.95)" : "rgba(255, 255, 255, 0.95)",
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
          },
        ]}
        accessibilityRole="tablist"
        accessibilityLabel="Mobile navigation"
      >
        <View style={[styles.nav, { width: NAV_MAX_WIDTH }]}>
          {NAV_ITEMS.map((item, index) => {
            const isActive = activeIndex === index;

            if (item.isAction) {
              return (
                <Pressable
                  key={item.name}
                  onPress={() => setIsMenuOpen(true)}
                  style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Create"
                  hitSlop={8}
                >
                  <View style={styles.iconBox}>
                    <SquarePlus size={23} color={inactiveColor} strokeWidth={2} />
                  </View>
                </Pressable>
              );
            }

            if (item.isProfile) {
              const avatarUri =
                authUser?.profilePicture ||
                authUser?.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";

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
                  hitSlop={8}
                >
                  <View
                    style={[
                      styles.profileWrapper,
                      {
                        borderColor: isActive ? "#FF6B35" : "transparent",
                        borderWidth: isActive ? 2 : 1,
                        backgroundColor: "#EBE3D9",
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: getMediaUrl(avatarUri) }}
                      style={styles.profileAvatar}
                    />
                  </View>
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
                hitSlop={8}
              >
                <View style={styles.iconBox}>
                  <Icon
                    size={22}
                    color={isActive ? activeColor : inactiveColor}
                    fill={isActive && item.name === "Home" ? activeColor : "none"}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.hasBadge && (
                    <View style={styles.badgeDot} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <CreateMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenCreatePost={() => {
          setIsMenuOpen(false);
          setIsCreatePostOpen(true);
        }}
      />
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
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
    alignItems: "center",
  },
  pill: {
    height: 62,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.07)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
    justifyContent: "center",
  },
  sharedBubble: {
    position: "absolute",
    top: 15,           // vertically centres the bubble at icon level
    left: 0,
    borderRadius: 16,
  },
  nav: {
    height: 62,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },
  navItem: {
    flex: 1,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    // background handled by the shared animated bubble above
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  profileWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    padding: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  badgeDot: {
    position: "absolute",
    top: 3,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF6B35",
  },
  pressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
});

export default MobileNav;