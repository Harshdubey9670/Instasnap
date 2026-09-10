import React, { useState, useRef, useEffect } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import { Bell, Plus } from "lucide-react-native";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootState } from "../../store/store";
import { useTheme } from "../../contexts/ThemeContext";
import { CreateMenuModal } from "./CreateMenuModal";
import { CreatePostModal } from "../post/CreatePostModal";
import { getColors, heroGradient, secondary } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

interface NavbarProps {
  scrollContainerRef?: React.RefObject<any>;
  /**
   * Animated.Value driven by the parent FlatList/ScrollView's onScroll event.
   * Used to hide the Navbar on scroll-down (matching web framer-motion behaviour).
   */
  scrollY?: Animated.Value;
}

export const Navbar = ({
  scrollContainerRef: _scrollContainerRef,
  scrollY,
}: NavbarProps) => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const colors = getColors(isDark);

  const { unreadNotificationsCount } = useSelector(
    (state: RootState) => state.auth,
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // ── Scroll-hide animation (mirrors web framer-motion y: "-100%") ────────────
  const NAVBAR_HEIGHT = 56 + insets.top;

  // When scrollY is provided, use diffClamp to translate the bar up when scrolling down
  const scrollHideAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  // Alternative approach: track scroll direction via the scrollY prop
  const translateY = scrollY
    ? Animated.diffClamp(scrollY, 0, NAVBAR_HEIGHT).interpolate({
        inputRange: [0, NAVBAR_HEIGHT],
        outputRange: [0, -NAVBAR_HEIGHT],
        extrapolate: "clamp",
      })
    : scrollHideAnim;

  // ── Notification ping animation (mirrors web CSS animate-ping) ───────────────
  const pingScale = useRef(new Animated.Value(1)).current;
  const pingOpacity = useRef(new Animated.Value(0.75)).current;
  const pingAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (unreadNotificationsCount > 0) {
      // Stop any existing animation
      pingAnimation.current?.stop();

      // Create expanding + fading ring loop — matching CSS animate-ping
      pingAnimation.current = Animated.loop(
        Animated.parallel([
          Animated.timing(pingScale, {
            toValue: 2.4,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pingOpacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );
      pingAnimation.current.start();

      return () => {
        pingAnimation.current?.stop();
        // Reset for next cycle
        pingScale.setValue(1);
        pingOpacity.setValue(0.75);
      };
    } else {
      pingAnimation.current?.stop();
      pingScale.setValue(1);
      pingOpacity.setValue(0.75);
    }
  }, [unreadNotificationsCount, pingScale, pingOpacity]);

  // Navbar is displayed only on the main feed page
  const isFeed = pathname === "/app" || pathname === "/app/";
  if (!isFeed) return null;

  // ── Derived colours from token system ────────────────────────────────────────
  const bgBase      = colors.bgBase;           // dark: #0a0510  light: #f8fafc
  const borderColor = colors.borderSoft;       // dark: #2d1b3b  light: #e2e8f0
  const textColor   = colors.textPrimary;
  const dotBorder   = colors.bgBase;           // creates the "cut-out" ring effect

  return (
    <>
      {/* ── Animated Navbar container (slides up on scroll-down) ─────────── */}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: bgBase,
            borderBottomColor: borderColor,
            paddingTop: insets.top,
            height: NAVBAR_HEIGHT,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.content}>

          {/* ── Left: Create Button with Gradient Squircle ────────────────── */}
          <Pressable
            onPress={() => setIsMenuOpen(true)}
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create New"
          >
            <LinearGradient
              colors={[...heroGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createGradient}
            >
              {/* strokeWidth 2.5 — matches web */}
              <Plus size={24} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>

          {/* ── Centre: Brand Title ───────────────────────────────────────── */}
          <View pointerEvents="none" style={styles.brandContainer}>
            <Text style={[styles.brand, { color: textColor }]}>
              InstaSnap
            </Text>
          </View>

          {/* ── Right: Notification Bell & Messages ─────────────────────────── */}
          <View style={styles.rightActions}>
            <Pressable
              onPress={() => router.push("/app/notifications")}
              style={({ pressed }) => [
                styles.notificationButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`View notifications${
                unreadNotificationsCount > 0
                  ? ` (${unreadNotificationsCount} unread)`
                  : ""
              }`}
            >
              <Bell size={24} color={textColor} strokeWidth={2} />

              {/* Ping dot — animated ring + static inner dot */}
              {unreadNotificationsCount > 0 && (
                <View style={styles.dotWrapper}>
                  {/* Outer expanding ring (animate-ping equivalent) */}
                  <Animated.View
                    style={[
                      styles.notificationDot,
                      styles.notificationPing,
                      {
                        borderColor: dotBorder,
                        transform: [{ scale: pingScale }],
                        opacity: pingOpacity,
                      },
                    ]}
                  />
                  {/* Static inner solid dot */}
                  <View
                    style={[
                      styles.notificationDot,
                      { borderColor: dotBorder },
                    ]}
                  />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </Animated.View>

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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 400,
    elevation: 10,
    borderBottomWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    // backgroundColor, borderBottomColor, paddingTop, height — set dynamically
  },
  content: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  createButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  createGradient: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  brandContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  brand: {
    fontSize: 22,
    fontFamily: fonts.outfitBlack,
    letterSpacing: -0.4,
    // color set dynamically above
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    position: "relative",
  },
  dotWrapper: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 10,
    height: 10,
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ec4899",   // secondary-500 — matches web
    borderWidth: 1.5,
    position: "absolute",
    top: 0,
    left: 0,
  },
  notificationPing: {
    backgroundColor: "rgba(236, 72, 153, 0.75)",  // secondary-500 at 75% opacity
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
});

export default Navbar;