import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Slot, usePathname } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../src/contexts/ThemeContext";
import { useSocketContext } from "../../src/contexts/SocketContext";
import type { RootState, AppDispatch } from "../../src/store/store";
import {
  setUnreadNotificationsCount,
  incrementUnreadCount,
  fetchSettings,
} from "../../src/store/authSlice";
import api from "../../src/services/api";

import { Navbar } from "../../src/components/navigation/Navbar";
import { MobileNav } from "../../src/components/navigation/MobileNav";
import { AiAssistantDrawer } from "../../src/components/ai/AiAssistantDrawer";
import { primary, secondary } from "../../src/theme/colors";

export default function AppLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Shared scrollY value — passed to Navbar for scroll-hide animation
  const scrollY = useRef(new Animated.Value(0)).current;

  const { socket } = useSocketContext();
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  // Fetch initial unread notification count & user settings
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get("/api/notifications/unread");
        if (res.data?.success) {
          dispatch(setUnreadNotificationsCount(res.data.count));
        }
      } catch (err) {
        console.error("Failed to fetch unread notifications count", err);
      }
    };
    void fetchUnreadCount();
    void dispatch(fetchSettings());
  }, [dispatch]);

  // Real-time socket event listeners for notifications
  useEffect(() => {
    if (!socket || !authUser) return;

    const handleNotificationCountUpdate = (data: any) => {
      if (data?.delta > 0) {
        dispatch(incrementUnreadCount());
      }
    };

    const handleFollowRequest = () => dispatch(incrementUnreadCount());
    const handleFollowAccepted = () => dispatch(incrementUnreadCount());
    const handleNewNotification = () => dispatch(incrementUnreadCount());

    socket.on("notification_count_update", handleNotificationCountUpdate);
    socket.on("follow_request", handleFollowRequest);
    socket.on("follow_accepted", handleFollowAccepted);
    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("notification_count_update", handleNotificationCountUpdate);
      socket.off("follow_request", handleFollowRequest);
      socket.off("follow_accepted", handleFollowAccepted);
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, authUser, dispatch]);

  const bgBase = isDark ? "#0a0510" : "#f8fafc";

  // Pages that hide the top Navbar (Navbar already self-manages visibility for /app)
  const isFeedPage = pathname === "/app" || pathname === "/app/";

  return (
    <View style={[styles.root, { backgroundColor: bgBase }]}>
      {/* ── Ambient background blobs — matches web UserLayout glow orbs ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top-left purple orb */}
        <View
          style={[
            styles.blob,
            {
              top: -80,
              left: -80,
              width: 300,
              height: 300,
              backgroundColor: primary[500],
              opacity: isDark ? 0.08 : 0.06,
            },
          ]}
        />
        {/* Centre-right pink orb */}
        <View
          style={[
            styles.blob,
            {
              top: "40%",
              right: -80,
              width: 300,
              height: 300,
              backgroundColor: secondary[500],
              opacity: isDark ? 0.08 : 0.06,
            },
          ]}
        />
      </View>

      {/* Top Navbar — receives scrollY for scroll-hide animation */}
      {isFeedPage && <Navbar scrollY={scrollY} />}

      {/* Main Screen Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Floating AI Assistant Copilot Button & Drawer */}
      {Boolean(authUser) && <AiAssistantDrawer />}

      {/* Bottom Navigation Bar */}
      <MobileNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    overflow: "hidden",   // clips blob overflow
  },
  content: {
    flex: 1,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
});
