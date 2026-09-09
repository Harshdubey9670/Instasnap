import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  Camera,
  SwitchCamera,
  Zap,
  ZapOff,
  Sparkles,
  X,
  Send,
  Download,
  Lock,
  ArrowLeft,
  Check,
} from "lucide-react-native";
import api from "../../services/api";

const { width, height } = Dimensions.get("window");

const AR_LENSES = [
  { id: "normal", name: "Normal", color: "#f43f5e" },
  { id: "vintage", name: "Vintage", color: "#d97706" },
  { id: "cyberpunk", name: "Cyberpunk", color: "#06b6d4" },
  { id: "bw", name: "B&W", color: "#64748b" },
  { id: "warm", name: "Summer", color: "#f59e0b" },
  { id: "neon", name: "Neon", color: "#ec4899" },
];

export default function CameraPage() {
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [flashMode, setFlashMode] = useState<"off" | "on">("off");
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [selectedLens, setSelectedLens] = useState(AR_LENSES[0]);

  // Capture State
  const [capturedMedia, setCapturedMedia] = useState<any>(null);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);

  const handleSimulateCapture = () => {
    const defaultUrl =
      mode === "photo"
        ? "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000"
        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000";

    const finalUrl = photoUrlInput.trim() || defaultUrl;
    setCapturedMedia({ url: finalUrl, type: mode });
  };

  const handleShareToFeed = async () => {
    if (!capturedMedia) return;
    setIsUploading(true);
    try {
      const payload = {
        caption,
        media: [{ url: capturedMedia.url, type: capturedMedia.type }],
      };
      const res = await api.post("/api/posts", payload);
      if (res.data.success) {
        Alert.alert("Success", "Photo shared to Feed! ✨", [
          { text: "View Feed", onPress: () => router.push("/app" as any) },
        ]);
      }
    } catch {
      Alert.alert("Error", "Failed to share post");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!capturedMedia) return;
    setIsSavingToVault(true);
    try {
      await api.post("/api/vault/memories", {
        title: caption || "Camera Snap",
        mediaUrl: capturedMedia.url,
        isPrivate: true,
      });
      Alert.alert("Saved", "Locked securely in your Private Memories Vault! 🔐");
    } catch {
      Alert.alert("Error", "Failed to save to vault");
    } finally {
      setIsSavingToVault(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {capturedMedia ? (
        /* Preview / Post-Capture View */
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedMedia.url }} style={styles.capturedImage} />

          {/* Top Actions */}
          <View style={styles.previewHeader}>
            <Pressable onPress={() => setCapturedMedia(null)} style={styles.iconCircle}>
              <X size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={handleSaveToVault} disabled={isSavingToVault} style={styles.vaultBtn}>
              <Lock size={16} color="#fff" />
              <Text style={styles.vaultBtnText}>{isSavingToVault ? "Locking..." : "Vault"}</Text>
            </Pressable>
          </View>

          {/* Bottom Share Bar */}
          <View style={styles.previewBottomBar}>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="#94a3b8"
              value={caption}
              onChangeText={setCaption}
            />
            <Pressable
              onPress={handleShareToFeed}
              disabled={isUploading}
              style={styles.shareFeedBtn}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Send size={16} color="#fff" />
                  <Text style={styles.shareFeedText}>Post</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        /* Active Viewfinder View */
        <View style={styles.viewfinder}>
          {/* Top Controls */}
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconCircle}>
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <View style={styles.topRightControls}>
              <Pressable
                onPress={() => setFlashMode((prev) => (prev === "off" ? "on" : "off"))}
                style={styles.iconCircle}
              >
                {flashMode === "on" ? <Zap size={20} color="#f59e0b" /> : <ZapOff size={20} color="#fff" />}
              </Pressable>
              <Pressable
                onPress={() => setCameraFacing((prev) => (prev === "user" ? "environment" : "user"))}
                style={styles.iconCircle}
              >
                <SwitchCamera size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Viewfinder Center Simulation */}
          <View style={styles.centerFocus}>
            <Camera size={56} color="#f43f5e" />
            <Text style={styles.viewfinderNotice}>
              Camera Stream Active ({cameraFacing === "user" ? "Front" : "Rear"})
            </Text>
            <TextInput
              style={styles.urlInputSim}
              placeholder="Simulate with custom image URL (optional)"
              placeholderTextColor="#64748b"
              value={photoUrlInput}
              onChangeText={setPhotoUrlInput}
            />
          </View>

          {/* AR Lenses Carousel */}
          <View style={styles.lensesRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lensesScroll}>
              {AR_LENSES.map((lens) => (
                <Pressable
                  key={lens.id}
                  onPress={() => setSelectedLens(lens)}
                  style={[
                    styles.lensItem,
                    selectedLens.id === lens.id && { borderColor: lens.color, borderWidth: 2 },
                  ]}
                >
                  <View style={[styles.lensCircle, { backgroundColor: lens.color }]} />
                  <Text style={styles.lensText}>{lens.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Bottom Capture Panel */}
          <View style={styles.bottomPanel}>
            {/* Mode Switcher */}
            <View style={styles.modeRow}>
              <Pressable onPress={() => setMode("photo")}>
                <Text style={[styles.modeText, mode === "photo" && styles.modeTextActive]}>PHOTO</Text>
              </Pressable>
              <Pressable onPress={() => setMode("video")}>
                <Text style={[styles.modeText, mode === "video" && styles.modeTextActive]}>VIDEO</Text>
              </Pressable>
            </View>

            {/* Shutter Button */}
            <Pressable onPress={handleSimulateCapture} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  viewfinder: { flex: 1, justifyContent: "space-between", paddingVertical: 10 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  topRightControls: { flexDirection: "row", gap: 10 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  centerFocus: { alignItems: "center", paddingHorizontal: 24 },
  viewfinderNotice: { color: "#f8fafc", fontSize: 13, fontWeight: "700", marginTop: 12 },
  urlInputSim: {
    width: "100%",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 12,
    padding: 10,
    color: "#ffffff",
    fontSize: 12,
    marginTop: 14,
    textAlign: "center",
  },
  lensesRow: { paddingVertical: 10 },
  lensesScroll: { paddingHorizontal: 16, gap: 12 },
  lensItem: {
    alignItems: "center",
    padding: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  lensCircle: { width: 32, height: 32, borderRadius: 16, marginBottom: 4 },
  lensText: { color: "#ffffff", fontSize: 10, fontWeight: "600" },
  bottomPanel: { alignItems: "center", paddingBottom: 20 },
  modeRow: { flexDirection: "row", gap: 24, marginBottom: 16 },
  modeText: { color: "#64748b", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  modeTextActive: { color: "#ffffff" },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ffffff",
  },
  previewContainer: { flex: 1, position: "relative" },
  capturedImage: { width: "100%", height: "100%", resizeMode: "cover" },
  previewHeader: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vaultBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  vaultBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  previewBottomBar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  captionInput: { flex: 1, color: "#fff", fontSize: 13, paddingHorizontal: 8 },
  shareFeedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f43f5e",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  shareFeedText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
