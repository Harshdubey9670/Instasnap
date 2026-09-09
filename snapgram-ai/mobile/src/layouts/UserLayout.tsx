import React, { useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Slot, useRouter, usePathname } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../contexts/ThemeContext";
import { useSocketContext } from "../contexts/SocketContext";
import { setUnreadNotificationsCount, incrementUnreadCount, fetchSettings } from "../store/authSlice";
import api from "../services/api";
import type { RootState } from "../store/store";
import { getColors } from "../theme/colors";

export default function UserLayout() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  
  const { socket } = useSocketContext();
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  // Use token system — dark: #0a0510 (was wrong #0f172a), light: #f8fafc
  const colors = getColors(isDark);
  const bgBase = colors.bgBase;

  // Fetch initial unread notification count on mount
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
    fetchUnreadCount();
    // Fetch user settings
    dispatch(fetchSettings() as any);
  }, [dispatch]);

  // Real-time socket event listeners
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

  return (
    <View style={[styles.container, { backgroundColor: bgBase }]}>
      {/* 
        Note: The actual tab navigation (Navbar/Sidebar) is typically handled by 
        app/app/_layout.tsx using expo-router's <Tabs>. This layout acts as a wrapper 
        for global context providers, socket listeners, and background styling.
      */}
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
