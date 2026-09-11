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
  ArrowLeft,
  Film,
  UploadCloud,
  Sparkles,
  Sliders,
  CheckCircle2,
  Clock,
  Play,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../services/api";

const { width } = Dimensions.get("window");

const FILTERS = [
  { id: "none", name: "Normal" },
  { id: "vintage", name: "Vintage" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "cinematic", name: "Cinematic" },
  { id: "bw", name: "B & W" },
  { id: "warm", name: "Warm Glow" },
];

export default function CreateReelPage() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [speed, setSpeed] = useState(1.0);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [caption, setCaption] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [publishStatus, setPublishStatus] = useState<"published" | "draft">("published");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI captions
  const [aiCaptions, setAiCaptions] = useState<any[]>([]);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);

  const handleGenerateAiCaptions = async () => {
    setGeneratingCaptions(true);
    try {
      const res = await api.post("/api/reels/generate-captions", { captionStyle: "Pop" });
      if (res.data.success) {
        setAiCaptions(res.data.data.captions || []);
      }
    } catch {
      Alert.alert("Error", "Failed to generate AI captions");
    } finally {
      setGeneratingCaptions(false);
    }
  };

  const handlePublishReel = async () => {
    if (!videoUrl.trim()) {
      Alert.alert("Required", "Please provide a video URL");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        caption,
        video: {
          url: videoUrl,
          duration: 30,
        },
        status: publishStatus,
        collaborators: collaborators ? collaborators.split(",").map((c) => c.trim()) : [],
        editingMetadata: {
          speed,
          filter: selectedFilter,
        },
        aiCaptions,
      };

      const res = await api.post("/api/reels", payload);
      if (res.data.success) {
        Alert.alert("Success", publishStatus === "draft" ? "Saved as Draft!" : "Reel Published! 🎉", [
          { text: "OK", onPress: () => router.push("/app/reels" as any) },
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to publish reel");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: (insets.top || 20) + 8 }]}>
        <Pressable
          onPress={() => {
            if (step > 0) {
              setStep((prev) => (prev - 1) as any);
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/app/reels");
            }
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#f8fafc" />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <Film size={20} color="#f43f5e" />
          <Text style={styles.headerTitle}>Reels Studio</Text>
        </View>

        {step === 1 ? (
          <Pressable onPress={() => setStep(2)} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Next</Text>
          </Pressable>
        ) : step === 2 ? (
          <Pressable onPress={handlePublishReel} disabled={isSubmitting} style={styles.nextBtn}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.nextBtnText}>Share</Text>
            )}
          </Pressable>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {/* STEP 0: Input Video URL */}
      {step === 0 && (
        <View style={styles.step0Box}>
          <View style={styles.uploadIconCircle}>
            <UploadCloud size={40} color="#f43f5e" />
          </View>
          <Text style={styles.step0Title}>Select Video for Reel</Text>
          <Text style={styles.step0Subtitle}>Enter video URL or MP4 file stream</Text>

          <TextInput
            style={styles.videoUrlInput}
            placeholder="Paste video URL (.mp4)..."
            placeholderTextColor="#64748b"
            value={videoUrl}
            onChangeText={setVideoUrl}
          />

          <Pressable
            onPress={() => {
              if (!videoUrl.trim()) {
                Alert.alert("Required", "Please paste a video URL");
                return;
              }
              setStep(1);
            }}
            style={styles.proceedBtn}
          >
            <Text style={styles.proceedBtnText}>Continue to Editing</Text>
          </Pressable>
        </View>
      )}

      {/* STEP 1: Video Preview & Edit Controls */}
      {step === 1 && (
        <ScrollView
          style={styles.studioBody}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 40 }}
        >
          <View style={styles.videoPreviewCard}>
            <View style={styles.previewBox}>
              <Film size={48} color="#f43f5e" />
              <Text style={styles.previewVideoUrl} numberOfLines={1}>
                {videoUrl}
              </Text>
            </View>

            {/* AI Captions Overlay preview */}
            {aiCaptions.length > 0 && (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionOverlayText}>🔥 {aiCaptions[0]?.text || "AI Captions Active"}</Text>
              </View>
            )}
          </View>

          {/* Speed Controls */}
          <View style={styles.studioSection}>
            <Text style={styles.sectionLabel}>Playback Speed ({speed}x)</Text>
            <View style={styles.speedRow}>
              {[0.5, 1.0, 1.5, 2.0].map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSpeed(s)}
                  style={[styles.speedPill, speed === s && styles.speedPillActive]}
                >
                  <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>{s}x</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Filters */}
          <View style={styles.studioSection}>
            <Text style={styles.sectionLabel}>Visual Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setSelectedFilter(f.id)}
                  style={[styles.filterPill, selectedFilter === f.id && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, selectedFilter === f.id && styles.filterTextActive]}>
                    {f.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* AI Captions Generator Button */}
          <View style={styles.studioSection}>
            <Pressable
              onPress={handleGenerateAiCaptions}
              disabled={generatingCaptions}
              style={styles.aiCaptionBtn}
            >
              <Sparkles size={16} color="#fff" />
              <Text style={styles.aiCaptionBtnText}>
                {generatingCaptions ? "Generating Captions..." : "Auto-Generate AI Captions"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* STEP 2: Details & Publish */}
      {step === 2 && (
        <ScrollView
          style={styles.publishBody}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 40 }}
        >
          <Text style={styles.inputLabel}>Caption & Hashtags</Text>
          <TextInput
            style={[styles.textArea, { height: 100 }]}
            multiline
            placeholder="Write a catchy reel caption, #tags..."
            placeholderTextColor="#64748b"
            value={caption}
            onChangeText={setCaption}
          />

          <Text style={styles.inputLabel}>Tag Collaborators</Text>
          <TextInput
            style={styles.singleInput}
            placeholder="e.g. @alex, @maria"
            placeholderTextColor="#64748b"
            value={collaborators}
            onChangeText={setCollaborators}
          />

          <Text style={styles.inputLabel}>Publish Status</Text>
          <View style={styles.statusRow}>
            {(["published", "draft"] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setPublishStatus(s)}
                style={[styles.statusPill, publishStatus === s && styles.statusPillActive]}
              >
                <Text style={[styles.statusText, publishStatus === s && styles.statusTextActive]}>
                  {s === "published" ? "Publish Immediately" : "Save as Draft"}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backBtnText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  nextBtn: { backgroundColor: "#f43f5e", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  nextBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  step0Box: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  uploadIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  step0Title: { color: "#f8fafc", fontSize: 20, fontWeight: "800" },
  step0Subtitle: { color: "#64748b", fontSize: 13, marginTop: 4, marginBottom: 20 },
  videoUrlInput: {
    width: "100%",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    color: "#f8fafc",
    fontSize: 13,
    marginBottom: 16,
  },
  proceedBtn: {
    backgroundColor: "#f43f5e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  proceedBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  studioBody: { flex: 1, padding: 16 },
  videoPreviewCard: {
    width: "100%",
    aspectRatio: 9 / 12,
    backgroundColor: "#000",
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  previewBox: { alignItems: "center", gap: 8, paddingHorizontal: 20 },
  previewVideoUrl: { color: "#94a3b8", fontSize: 11, maxWidth: width * 0.7 },
  captionOverlay: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  captionOverlayText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  studioSection: { marginBottom: 18 },
  sectionLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  speedRow: { flexDirection: "row", gap: 10 },
  speedPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    alignItems: "center",
  },
  speedPillActive: { backgroundColor: "#f43f5e" },
  speedText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
  speedTextActive: { color: "#fff", fontWeight: "700" },
  filterRow: { gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#1e293b",
  },
  filterPillActive: { backgroundColor: "#f43f5e" },
  filterText: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#fff", fontWeight: "700" },
  aiCaptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    borderRadius: 14,
  },
  aiCaptionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  publishBody: { flex: 1, padding: 16 },
  inputLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  textArea: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    color: "#f8fafc",
    fontSize: 13,
    textAlignVertical: "top",
  },
  singleInput: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    color: "#f8fafc",
    fontSize: 13,
  },
  statusRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  statusPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    alignItems: "center",
  },
  statusPillActive: { backgroundColor: "#f43f5e" },
  statusText: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  statusTextActive: { color: "#fff", fontWeight: "700" },
});
