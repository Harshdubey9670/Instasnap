import React, { useEffect } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Resolves /profile/u/:username → redirects to /profile/:id
 * Used by @mention links in captions.
 */
const UsernameLookupPage = () => {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const colors = {
    bg: dark ? "#0d0a14" : "#f8f5ff",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
  };

  useEffect(() => {
    const resolve = async () => {
      try {
        const res = await api.get(`/api/users/username/${username}`);
        if (res.data.success) {
          router.replace(`/app/profile/${res.data.data._id}` as any);
        } else {
          router.replace("/app" as any);
        }
      } catch {
        router.replace("/app" as any);
      }
    };
    if (username) resolve();
  }, [username]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Looking up @{username}...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  text: { fontSize: 14 },
});

export default UsernameLookupPage;
