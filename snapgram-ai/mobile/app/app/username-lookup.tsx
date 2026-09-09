// FILE: mobile/app/app/username-lookup.tsx

import React, { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import api from "../../src/services/api";

export default function UsernameLookupScreen() {
  const { username } =
    useLocalSearchParams<{
      username?: string;
    }>();

  useEffect(() => {
    const resolveUsername = async () => {
      if (!username) {
        router.replace("/app");
        return;
      }

      try {
        const res = await api.get(
          `/api/users/username/${username}`,
        );

        if (res.data?.success && res.data?.data?._id) {
          router.replace(
            `/app/profile/${res.data.data._id}`,
          );
        } else {
          router.replace("/app");
        }
      } catch {
        router.replace("/app");
      }
    };

    void resolveUsername();
  }, [username]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator
        size="large"
        color="#a855f7"
      />

      <Text style={styles.text}>
        Looking up @{username || "user"}...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 24,
  },

  text: {
    marginTop: 14,
    fontSize: 14,
    color: "#64748b",
  },
});