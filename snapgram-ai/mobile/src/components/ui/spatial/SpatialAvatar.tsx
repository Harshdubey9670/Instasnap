import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "../Avatar";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface SpatialAvatarProps {
  src?: string | null;
  alt?: string;
  size?: Size;
  fallback?: React.ReactNode;
  hasStory?: boolean;
  isLive?: boolean;
  isOnline?: boolean;
}

const RING_PADDING: Record<Size, number> = { xs: 2, sm: 2, md: 3, lg: 3, xl: 3 };

// Wraps the existing mobile `Avatar` (which already handles proxying / error
// fallback) with the Spatial story/live gradient ring used across the app.
export const SpatialAvatar: React.FC<SpatialAvatarProps> = ({
  src,
  alt,
  size = "md",
  fallback,
  hasStory = false,
  isLive = false,
  isOnline = false,
}) => {
  if (!hasStory && !isLive) {
    return <Avatar src={src} alt={alt} size={size} fallback={fallback} isOnline={isOnline} />;
  }

  const padding = RING_PADDING[size];
  const colors = isLive
    ? (["#F43F5E", "#E11D48", "#FDA4AF"] as const)
    : (["#FFAEA3", "#EE7565", "#851613"] as const);

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.ring, { padding }]}
    >
      <View style={styles.inner}>
        <Avatar src={src} alt={alt} size={size} fallback={fallback} isOnline={isOnline} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  ring: {
    borderRadius: 999,
  },
  inner: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#851613",
  },
});

export default SpatialAvatar;
