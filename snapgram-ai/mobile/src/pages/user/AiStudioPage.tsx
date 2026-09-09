import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Sparkles, Hash, User, Lightbulb, Languages,
  ShieldAlert, Copy, Check, Wand2, Eye, AlertTriangle, Bot,
} from "lucide-react-native";

import {
  generateCaption,
  generateHashtags,
  generateBio,
  suggestUsernames,
  generatePostIdeas,
  translateText,
  moderateContent,
  generateAltText,
} from "../../services/aiService";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { useTheme } from "../../contexts/ThemeContext";

const TABS = [
  { id: "captions", label: "Captions", icon: Sparkles },
  { id: "bio", label: "Bio & Names", icon: User },
  { id: "strategy", label: "Strategy", icon: Lightbulb },
  { id: "translator", label: "Translator", icon: Languages },
  { id: "safety", label: "Safety", icon: ShieldAlert },
];

const TONES = ["Witty", "Inspirational", "Professional", "Casual", "Humorous", "Romantic"];
const LANGUAGES = ["Spanish", "French", "German", "Japanese", "Arabic", "Hindi", "Portuguese", "Italian"];
const CATEGORIES = ["Digital Creator", "Fitness", "Food & Travel", "Fashion", "Tech & AI", "Business"];

const AiStudioPage = () => {
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const [activeTab, setActiveTab] = useState("captions");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // 1. Captions
  const [topic, setTopic] = useState("Fitness");
  const [tone, setTone] = useState("Witty");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  // 2. Bio
  const [niche, setNiche] = useState("Tech & AI");
  const [generatedBio, setGeneratedBio] = useState("");
  const [name, setName] = useState("Alex");
  const [suggestedHandles, setSuggestedHandles] = useState<string[]>([]);
  // 3. Strategy
  const [category, setCategory] = useState("Digital Creator");
  const [postIdeas, setPostIdeas] = useState<string[]>([]);
  // 4. Translator
  const [translateInput, setTranslateInput] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish");
  const [translatedResult, setTranslatedResult] = useState("");
  const [imageDesc, setImageDesc] = useState("");
  const [altTextResult, setAltTextResult] = useState("");
  // 5. Safety
  const [moderationText, setModerationText] = useState("");
  const [moderationResult, setModerationResult] = useState<any>(null);

  const colors = {
    bg: dark ? "#0d0a14" : "#f8f5ff",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    card: dark ? "#1a0d27" : "#fff",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    inputBg: dark ? "#1e112c" : "#f1f5f9",
    inputBorder: dark ? "#2d1b3b" : "#e2e8f0",
    tabActive: "#a855f7",
    tabBg: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)",
    resultBg: dark ? "#1e112c" : "#f8f5ff",
  };

  const setLoading = (key: string, val: boolean) => setLoadingStates((p) => ({ ...p, [key]: val }));

  const copyToClipboard = async (text: string, idx: number) => {
    await Clipboard.setStringAsync(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ variant: "success", title: "Copied!", description: "Text copied to clipboard." });
  };

  const handleGenerateCaption = async () => {
    setLoading("caption", true);
    try {
      const [cRes, hRes] = await Promise.all([
        generateCaption(topic, tone),
        generateHashtags(topic),
      ]);
      setGeneratedCaption(cRes.data.caption);
      setHashtags(hRes.data.hashtags || []);
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to generate caption." });
    } finally {
      setLoading("caption", false);
    }
  };

  const handleGenerateBio = async () => {
    setLoading("bio", true);
    try {
      const [bRes, uRes] = await Promise.all([
        generateBio(niche, "engaging"),
        suggestUsernames(name, niche),
      ]);
      setGeneratedBio(bRes.data.bio);
      setSuggestedHandles(uRes.data.usernames || []);
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to generate bio." });
    } finally {
      setLoading("bio", false);
    }
  };

  const handleGenerateStrategy = async () => {
    setLoading("strategy", true);
    try {
      const res = await generatePostIdeas(category);
      setPostIdeas(res.data.ideas || []);
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to generate ideas." });
    } finally {
      setLoading("strategy", false);
    }
  };

  const handleTranslate = async () => {
    setLoading("translate", true);
    try {
      const res = await translateText(translateInput, targetLang);
      setTranslatedResult(res.data.translation);
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to translate." });
    } finally {
      setLoading("translate", false);
    }
  };

  const handleModerate = async () => {
    setLoading("moderate", true);
    try {
      const res = await moderateContent(moderationText);
      setModerationResult(res.data);
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to moderate content." });
    } finally {
      setLoading("moderate", false);
    }
  };

  const renderChipRow = (items: string[], selected: string, onSelect: (v: string) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
      {items.map((item) => (
        <Pressable
          key={item}
          style={[styles.chip, { backgroundColor: selected === item ? colors.primary : colors.tabBg }]}
          onPress={() => onSelect(item)}
        >
          <Text style={[styles.chipText, { color: selected === item ? "#fff" : colors.textSecondary }]}>{item}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderResult = (text: string, idx: number) => (
    <View style={[styles.resultBox, { backgroundColor: colors.resultBg, borderColor: colors.cardBorder }]}>
      <Text style={[styles.resultText, { color: colors.text }]}>{text}</Text>
      <Pressable style={styles.copyBtn} onPress={() => copyToClipboard(text, idx)}>
        {copiedIndex === idx ? <Check size={14} color={colors.primary} /> : <Copy size={14} color={colors.textSecondary} />}
        <Text style={[styles.copyText, { color: copiedIndex === idx ? colors.primary : colors.textSecondary }]}>
          {copiedIndex === idx ? "Copied" : "Copy"}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
          <Bot size={20} color="#fff" />
        </View>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>AI Studio</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Powered by AI</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={styles.tabsContent}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.tabBg }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon size={14} color={activeTab === tab.id ? colors.tabActive : colors.textSecondary} />
              <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.tabActive : colors.textSecondary }, activeTab === tab.id && { fontWeight: "700" }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Tab Content */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled">
          {activeTab === "captions" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>✨ Caption & Hashtag Generator</Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Topic</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Fitness, Travel, Food..."
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tone</Text>
              {renderChipRow(TONES, tone, setTone)}
              <Button variant="gradient" onPress={handleGenerateCaption} isLoading={loadingStates.caption} style={styles.generateBtn}>
                Generate Caption
              </Button>
              {generatedCaption && renderResult(generatedCaption, 0)}
              {hashtags.length > 0 && (
                <View style={styles.hashtagRow}>
                  {hashtags.map((h, i) => (
                    <Pressable key={i} style={[styles.hashTag, { backgroundColor: colors.tabBg }]} onPress={() => copyToClipboard(h, 100 + i)}>
                      <Text style={[styles.hashTagText, { color: colors.primary }]}>{h}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === "bio" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>👤 Bio & Username Generator</Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Your Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Alex"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Niche</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                value={niche}
                onChangeText={setNiche}
                placeholder="e.g. Tech & AI, Fashion..."
                placeholderTextColor={colors.textSecondary}
              />
              <Button variant="gradient" onPress={handleGenerateBio} isLoading={loadingStates.bio} style={styles.generateBtn}>
                Generate Bio & Handles
              </Button>
              {generatedBio && renderResult(generatedBio, 1)}
              {suggestedHandles.length > 0 && (
                <View style={styles.handlesGrid}>
                  {suggestedHandles.map((h, i) => (
                    <Pressable key={i} style={[styles.handleChip, { backgroundColor: colors.tabBg }]} onPress={() => copyToClipboard(h, 200 + i)}>
                      <Text style={[styles.handleText, { color: colors.text }]}>@{h}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === "strategy" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>💡 Content Strategy</Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Creator Category</Text>
              {renderChipRow(CATEGORIES, category, setCategory)}
              <Button variant="gradient" onPress={handleGenerateStrategy} isLoading={loadingStates.strategy} style={styles.generateBtn}>
                Generate Post Ideas
              </Button>
              {postIdeas.map((idea, i) => (
                <View key={i} style={[styles.ideaItem, { backgroundColor: colors.resultBg, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.ideaNum, { color: colors.primary }]}>{i + 1}</Text>
                  <Text style={[styles.ideaText, { color: colors.text }]} numberOfLines={4}>{idea}</Text>
                  <Pressable onPress={() => copyToClipboard(idea, 300 + i)} hitSlop={8}>
                    {copiedIndex === 300 + i ? <Check size={14} color={colors.primary} /> : <Copy size={14} color={colors.textSecondary} />}
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {activeTab === "translator" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>🌐 AI Translator</Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Text to Translate</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                value={translateInput}
                onChangeText={setTranslateInput}
                placeholder="Enter text to translate..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Target Language</Text>
              {renderChipRow(LANGUAGES, targetLang, setTargetLang)}
              <Button variant="gradient" onPress={handleTranslate} isLoading={loadingStates.translate} style={styles.generateBtn}>
                Translate
              </Button>
              {translatedResult && renderResult(translatedResult, 2)}
            </View>
          )}

          {activeTab === "safety" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>🛡️ Content Moderation</Text>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Text to Check</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                value={moderationText}
                onChangeText={setModerationText}
                placeholder="Enter text to moderate..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
              <Button variant="gradient" onPress={handleModerate} isLoading={loadingStates.moderate} style={styles.generateBtn}>
                Analyze Content
              </Button>
              {moderationResult && (
                <View style={[styles.moderationResult, {
                  backgroundColor: moderationResult.isSafe ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  borderColor: moderationResult.isSafe ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                }]}>
                  <Text style={{ color: moderationResult.isSafe ? "#22c55e" : "#ef4444", fontWeight: "700", fontSize: 15, marginBottom: 6 }}>
                    {moderationResult.isSafe ? "✅ Safe Content" : "⚠️ Flagged Content"}
                  </Text>
                  {moderationResult.categories?.map((cat: string, i: number) => (
                    <Text key={i} style={{ color: colors.textSecondary, fontSize: 13 }}>• {cat}</Text>
                  ))}
                  {moderationResult.reason && (
                    <Text style={{ color: colors.text, fontSize: 13, marginTop: 6 }}>{moderationResult.reason}</Text>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  pageSubtitle: { fontSize: 12, marginTop: 1 },
  tabsRow: { flexGrow: 0 },
  tabsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  tabText: { fontSize: 13 },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16 },
  card: {
    borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: {
    height: 44, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, fontSize: 14, marginBottom: 4,
  },
  textarea: {
    minHeight: 80, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingTop: 10, fontSize: 14, textAlignVertical: "top",
  },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontSize: 13 },
  generateBtn: { marginTop: 16, height: 46, borderRadius: 12 },
  resultBox: {
    borderRadius: 12, padding: 14, borderWidth: 1, marginTop: 14,
  },
  resultText: { fontSize: 14, lineHeight: 22 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, alignSelf: "flex-end" },
  copyText: { fontSize: 12, fontWeight: "600" },
  hashtagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  hashTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  hashTagText: { fontSize: 12, fontWeight: "600" },
  handlesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  handleChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  handleText: { fontSize: 13, fontWeight: "600" },
  ideaItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12,
    borderRadius: 12, borderWidth: 1, marginTop: 8,
  },
  ideaNum: { fontSize: 14, fontWeight: "900", width: 20 },
  ideaText: { flex: 1, fontSize: 13, lineHeight: 20 },
  moderationResult: { borderRadius: 12, padding: 14, borderWidth: 1, marginTop: 14 },
});

export default AiStudioPage;
