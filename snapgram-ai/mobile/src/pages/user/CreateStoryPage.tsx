import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
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
  X,
  UploadCloud,
  Type,
  Sparkles,
  Music2,
  Check,
  Send,
  Eye,
  Lock,
} from "lucide-react-native";
import api from "../../services/api";

const { width, height } = Dimensions.get("window");

const PRESET_FILTERS = [
  { id: "none", label: "Normal" },
  { id: "vintage", label: "Vintage" },
  { id: "grayscale", label: "B&W" },
  { id: "warm", label: "Warm" },
  { id: "cyber", label: "Cyber" },
];

export default function CreateStoryPage() {
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [privacy, setPrivacy] = useState<"public" | "followers" | "close_friends">("public");
  const [isUploading, setIsUploading] = useState(false);

  // Text overlay
  const [overlayText, setOverlayText] = useState("");
  const [showTextModal, setShowTextModal] = useState(false);

  // AI Prompt
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  const handleGenerateAiStory = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAi(true);
    try {
      const res = await api.post("/api/stories/ai-generate", { prompt: aiPrompt });
      if (res.data.success && res.data.data?.mediaUrl) {
        setMediaUrl(res.data.data.mediaUrl);
        setShowAiModal(false);
        setAiPrompt("");
      }
    } catch {
      Alert.alert("Error", "Failed to generate AI story");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handlePublishStory = async () => {
    if (!mediaUrl.trim()) {
      Alert.alert("Required", "Please provide a media URL or generate with AI");
      return;
    }

    setIsUploading(true);
    try {
      const payload = {
        media: [{ url: mediaUrl, type: "image" }],
        stickers: overlayText
          ? [{ type: "text", data: { text: overlayText, position: { x: 50, y: 50 } } }]
          : [],
        status: "published",
        privacy,
      };

      const res = await api.post("/api/stories", payload);
      if (res.data.success) {
        Alert.alert("Success", "Story added! ✨", [
          { text: "OK", onPress: () => router.push("/app/stories" as any) },
        ]);
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to post story");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>Create Story</Text>
        <Pressable
          onPress={handlePublishStory}
          disabled={isUploading}
          style={styles.publishBtn}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishBtnText}>Share</Text>
          )}
        </Pressable>
      </View>

      {/* Story Canvas Container */}
      <View style={styles.canvas}>
        {mediaUrl ? (
          <Image
            source={{ uri: mediaUrl }}
            style={[
              styles.storyImg,
              selectedFilter === "grayscale" && { tintColor: "#999" },
            ]}
          />
        ) : (
          <View style={styles.placeholderBox}>
            <UploadCloud size={48} color="#f43f5e" />
            <Text style={styles.placeholderTitle}>Add Story Media</Text>
            <Text style={styles.placeholderSubtitle}>Enter image URL or use AI to generate</Text>
            <TextInput
              style={styles.urlInput}
              placeholder="Paste image/media URL..."
              placeholderTextColor="#64748b"
              value={mediaUrl}
              onChangeText={setMediaUrl}
            />
            <Pressable onPress={() => setShowAiModal(true)} style={styles.aiBtn}>
              <Sparkles size={16} color="#fff" />
              <Text style={styles.aiBtnText}>Generate with AI</Text>
            </Pressable>
          </View>
        )}

        {/* Text Overlay Preview */}
        {overlayText ? (
          <Pressable
            onPress={() => setShowTextModal(true)}
            style={styles.textOverlayBubble}
          >
            <Text style={styles.textOverlayContent}>{overlayText}</Text>
          </Pressable>
        ) : null}

        {/* Floating Controls Sidebar */}
        <View style={styles.floatingSidebar}>
          <Pressable onPress={() => setShowTextModal(true)} style={styles.toolIconBtn}>
            <Type size={20} color="#ffffff" />
          </Pressable>
          <Pressable onPress={() => setShowAiModal(true)} style={styles.toolIconBtn}>
            <Sparkles size={20} color="#f59e0b" />
          </Pressable>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.bottomControls}>
        <Text style={styles.filterTitle}>Filters</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {PRESET_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setSelectedFilter(f.id)}
              style={[styles.filterChip, selectedFilter === f.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, selectedFilter === f.id && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Privacy Selector */}
        <View style={styles.privacyRow}>
          {(["public", "followers", "close_friends"] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPrivacy(p)}
              style={[styles.privacyPill, privacy === p && styles.privacyPillActive]}
            >
              <Text style={[styles.privacyText, privacy === p && styles.privacyTextActive]}>
                {p === "close_friends" ? "Close Friends" : p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Text Modal */}
      <Modal visible={showTextModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalCardTitle}>Add Overlay Text</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Type your story text..."
              placeholderTextColor="#64748b"
              value={overlayText}
              onChangeText={setOverlayText}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowTextModal(false)} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Modal */}
      <Modal visible={showAiModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalCardTitle}>AI Story Generator</Text>
            <Text style={styles.modalCardSubtitle}>Describe what story scene or background you want</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Neon cyberpunk city street at sunset..."
              placeholderTextColor="#64748b"
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAiModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleGenerateAiStory}
                disabled={generatingAi}
                style={styles.doneBtn}
              >
                {generatingAi ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.doneBtnText}>Generate</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: { padding: 4 },
  headerTitle: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  publishBtn: {
    backgroundColor: "#f43f5e",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publishBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  canvas: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#111827",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  storyImg: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholderBox: { alignItems: "center", padding: 24, width: "100%" },
  placeholderTitle: { color: "#ffffff", fontSize: 18, fontWeight: "800", marginTop: 12 },
  placeholderSubtitle: { color: "#64748b", fontSize: 12, marginTop: 4, marginBottom: 16 },
  urlInput: {
    width: "100%",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    color: "#ffffff",
    fontSize: 13,
    marginBottom: 12,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f43f5e",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  aiBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  textOverlayBubble: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    maxWidth: "80%",
  },
  textOverlayContent: { color: "#ffffff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  floatingSidebar: {
    position: "absolute",
    right: 14,
    top: 20,
    gap: 12,
  },
  toolIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bottomControls: { paddingHorizontal: 16, paddingBottom: 16 },
  filterTitle: { color: "#94a3b8", fontSize: 11, fontWeight: "700", marginBottom: 6 },
  filterRow: { gap: 8, marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },
  filterChipActive: { backgroundColor: "#f43f5e" },
  filterChipText: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { color: "#ffffff" },
  privacyRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  privacyPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#1e293b",
  },
  privacyPillActive: { backgroundColor: "#f43f5e" },
  privacyText: { color: "#94a3b8", fontSize: 11, fontWeight: "600" },
  privacyTextActive: { color: "#ffffff", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#1e293b", borderRadius: 20, padding: 20 },
  modalCardTitle: { color: "#ffffff", fontSize: 16, fontWeight: "800", marginBottom: 4 },
  modalCardSubtitle: { color: "#94a3b8", fontSize: 12, marginBottom: 12 },
  modalTextInput: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    color: "#ffffff",
    fontSize: 13,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#334155" },
  cancelBtnText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
  doneBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: "#f43f5e" },
  doneBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
});
