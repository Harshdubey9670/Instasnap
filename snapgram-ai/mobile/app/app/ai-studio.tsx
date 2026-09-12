// FILE: mobile/app/app/ai-studio.tsx

import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Eye,
  Hash,
  Languages,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

import {
  generateAltText,
  generateBio,
  generateCaption,
  generateHashtags,
  generatePostIdeas,
  moderateContent,
  detectFakeAccount,
  suggestUsernames,
  translateText,
} from "../../src/services/aiService";
import { useToast } from "../../src/components/ui/Toast";

type LoadingMap = Record<string, boolean>;

const tabs = [
  {
    id: "captions",
    label: "Captions & Hashtags",
    icon: Sparkles,
  },
  {
    id: "bio",
    label: "Bio & Usernames",
    icon: User,
  },
  {
    id: "strategy",
    label: "Content Strategy",
    icon: Lightbulb,
  },
  {
    id: "translator",
    label: "Translator & Alt-Text",
    icon: Languages,
  },
  {
    id: "safety",
    label: "Safety & Moderation",
    icon: ShieldAlert,
  },
] as const;

type ActiveTab =
  (typeof tabs)[number]["id"];

export default function AiStudioScreen() {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] =
    useState<ActiveTab>("captions");
  const [copiedKey, setCopiedKey] =
    useState<string | null>(null);
  const [loadingStates, setLoadingStates] =
    useState<LoadingMap>({});

  const [topic, setTopic] =
    useState("Fitness");
  const [tone, setTone] =
    useState("Witty");
  const [generatedCaption, setGeneratedCaption] =
    useState("");
  const [hashtags, setHashtags] =
    useState<string[]>([]);

  const [niche, setNiche] =
    useState("Tech & AI");
  const [generatedBio, setGeneratedBio] =
    useState("");
  const [name, setName] =
    useState("Alex");
  const [suggestedHandles, setSuggestedHandles] =
    useState<string[]>([]);

  const [category, setCategory] =
    useState("Digital Creator");
  const [postIdeas, setPostIdeas] =
    useState<string[]>([]);

  const [translateInput, setTranslateInput] =
    useState("");
  const [targetLang, setTargetLang] =
    useState("Spanish");
  const [translatedResult, setTranslatedResult] =
    useState("");

  const [imageDesc, setImageDesc] =
    useState("");
  const [altTextResult, setAltTextResult] =
    useState("");

  const [moderationText, setModerationText] =
    useState("");
  const [moderationResult, setModerationResult] =
    useState<any>(null);
  const [fakeAccountResult, setFakeAccountResult] =
    useState<any>(null);

  const setLoading = (
    key: string,
    value: boolean,
  ) => {
    setLoadingStates((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const copyToClipboard = async (
    value: string,
    key: string,
  ) => {
    try {
      await Clipboard.setStringAsync(value);
      setCopiedKey(key);

      setTimeout(() => {
        setCopiedKey((current) =>
          current === key
            ? null
            : current,
        );
      }, 2000);
    } catch {
      showToast(
        "error",
        "Copy Failed",
        "Unable to copy text.",
      );
    }
  };

  const handleGenerateCaption = async () => {
    setLoading("caption", true);

    try {
      const [captionResponse, hashtagResponse] =
        await Promise.all([
          generateCaption(topic, tone),
          generateHashtags(topic),
        ]);

      setGeneratedCaption(
        captionResponse.data?.caption || "",
      );

      setHashtags(
        hashtagResponse.data?.hashtags || [],
      );

      showToast(
        "success",
        "Caption generated successfully",
        "",
      );
    } catch {
      showToast(
        "error",
        "Failed to generate caption",
        "",
      );
    } finally {
      setLoading("caption", false);
    }
  };

  const handleGenerateBio = async () => {
    setLoading("bio", true);

    try {
      const [bioResponse, usernamesResponse] =
        await Promise.all([
          generateBio(niche, tone),
          suggestUsernames(name, niche),
        ]);

      setGeneratedBio(
        bioResponse.data?.bio || "",
      );

      setSuggestedHandles(
        usernamesResponse.data?.usernames ||
          [],
      );

      showToast(
        "success",
        "Bio generated successfully",
        "",
      );
    } catch {
      showToast(
        "error",
        "Failed to generate bio",
        "",
      );
    } finally {
      setLoading("bio", false);
    }
  };

  const handleGenerateStrategy = async () => {
    setLoading("strategy", true);

    try {
      const response =
        await generatePostIdeas(category);

      setPostIdeas(
        response.data?.ideas || [],
      );

      showToast(
        "success",
        "Strategy generated successfully",
        "",
      );
    } catch {
      showToast(
        "error",
        "Failed to generate strategy",
        "",
      );
    } finally {
      setLoading("strategy", false);
    }
  };

  const handleTranslate = async () => {
    if (!translateInput.trim()) {
      showToast(
        "error",
        "Enter some text",
        "",
      );
      return;
    }

    setLoading("translate", true);

    try {
      const response = await translateText(
        translateInput.trim(),
        targetLang,
      );

      setTranslatedResult(
        response.data?.translatedText ||
          "",
      );

      showToast(
        "success",
        "Translation complete",
        "",
      );
    } catch {
      showToast(
        "error",
        "Failed to translate",
        "",
      );
    } finally {
      setLoading("translate", false);
    }
  };

  const handleGenerateAltText = async () => {
    if (!imageDesc.trim()) {
      showToast(
        "error",
        "Enter an image description",
        "",
      );
      return;
    }

    setLoading("altText", true);

    try {
      const response =
        await generateAltText(
          imageDesc.trim(),
        );

      setAltTextResult(
        response.data?.altText || "",
      );

      showToast(
        "success",
        "Alt text generated",
        "",
      );
    } catch {
      showToast(
        "error",
        "Failed to generate alt text",
        "",
      );
    } finally {
      setLoading("altText", false);
    }
  };

  const handleModeration = async () => {
    if (!moderationText.trim()) {
      showToast(
        "error",
        "Enter text to analyze",
        "",
      );
      return;
    }

    setLoading("moderation", true);

    try {
      const [moderationResponse, fakeResponse] =
        await Promise.all([
          moderateContent(
            moderationText.trim(),
          ),
          detectFakeAccount(),
        ]);

      setModerationResult(
        moderationResponse.data,
      );

      setFakeAccountResult(
        fakeResponse.data,
      );

      showToast(
        "success",
        "Analysis complete",
        "",
      );
    } catch {
      showToast(
        "error",
        "Failed to run analysis",
        "",
      );
    } finally {
      setLoading("moderation", false);
    }
  };

  const renderSectionHeader = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
  ) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        {icon}
      </View>

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        {!!subtitle && (
          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <FlatList
      horizontal
      data={tabs}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        styles.tabsContent
      }
      renderItem={({ item }) => {
        const Icon = item.icon;
        const isActive =
          item.id === activeTab;

        return (
          <Pressable
            onPress={() =>
              setActiveTab(item.id)
            }
            style={[
              styles.tabButton,
              isActive &&
                styles.tabButtonActive,
            ]}
          >
            <Icon
              size={15}
              color={
                isActive
                  ? "#a855f7"
                  : "#64748b"
              }
            />

            <Text
              style={[
                styles.tabText,
                isActive &&
                  styles.tabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      }}
    />
  );

  const renderButton = (
    title: string,
    onPress: () => void,
    loading: boolean,
  ) => (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.primaryButton,
        loading &&
          styles.disabledButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#ffffff"
        />
      ) : null}

      <Text style={styles.primaryButtonText}>
        {loading ? "Processing..." : title}
      </Text>
    </Pressable>
  );

  const renderCaptionsTab = () => (
    <View>
      {renderSectionHeader(
        <Sparkles
          size={20}
          color="#a855f7"
        />,
        "Generate AI Caption",
        "Create captions and hashtags from your topic.",
      )}

      <View style={styles.card}>
        <Text style={styles.label}>
          Post Topic / Niche
        </Text>

        <TextInput
          value={topic}
          onChangeText={setTopic}
          style={styles.input}
          placeholder="Fitness"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>
          Tone & Vibe
        </Text>

        <View style={styles.choiceRow}>
          {[
            "Witty",
            "Professional",
            "Motivational",
            "Aesthetic",
          ].map((item) => {
            const active = tone === item;

            return (
              <Pressable
                key={item}
                onPress={() =>
                  setTone(item)
                }
                style={[
                  styles.choice,
                  active &&
                    styles.choiceActive,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    active &&
                      styles.choiceTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {renderButton(
          "Generate Caption & Hashtags",
          () =>
            void handleGenerateCaption(),
          Boolean(loadingStates.caption),
        )}
      </View>

      {generatedCaption ? (
        <View style={styles.card}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultLabel}>
              AI Generated Caption
            </Text>

            <Pressable
              onPress={() =>
                void copyToClipboard(
                  generatedCaption,
                  "caption",
                )
              }
              style={styles.copyButton}
            >
              {copiedKey === "caption" ? (
                <Check
                  size={15}
                  color="#22c55e"
                />
              ) : (
                <Copy
                  size={15}
                  color="#64748b"
                />
              )}

              <Text style={styles.copyText}>
                {copiedKey === "caption"
                  ? "Copied"
                  : "Copy"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.resultText}>
            {generatedCaption}
          </Text>
        </View>
      ) : null}

      {hashtags.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.resultLabel}>
            Recommended Hashtags
          </Text>

          <View style={styles.chipsWrap}>
            {hashtags.map((item, index) => (
              <View
                key={`${item}-${index}`}
                style={styles.hashChip}
              >
                <Hash
                  size={13}
                  color="#a855f7"
                />
                <Text
                  style={styles.hashChipText}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderBioTab = () => (
    <View>
      {renderSectionHeader(
        <User
          size={20}
          color="#a855f7"
        />,
        "Bio & Username Studio",
        "Generate a profile bio and username ideas.",
      )}

      <View style={styles.card}>
        <Text style={styles.label}>
          Your Name
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Alex"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>
          Niche / Main Interest
        </Text>

        <TextInput
          value={niche}
          onChangeText={setNiche}
          style={styles.input}
          placeholder="Tech & AI"
          placeholderTextColor="#94a3b8"
        />

        {renderButton(
          "Generate Bio & Usernames",
          () =>
            void handleGenerateBio(),
          Boolean(loadingStates.bio),
        )}
      </View>

      {generatedBio ? (
        <View style={styles.card}>
          <Text style={styles.resultLabel}>
            Suggested Profile Bio
          </Text>

          <Text style={styles.resultBoxText}>
            {generatedBio}
          </Text>
        </View>
      ) : null}

      {suggestedHandles.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.resultLabel}>
            Suggested Usernames
          </Text>

          <View style={styles.handleList}>
            {suggestedHandles.map(
              (handle, index) => {
                const key =
                  `handle-${index}`;

                return (
                  <View
                    key={key}
                    style={styles.handleRow}
                  >
                    <Text
                      style={
                        styles.handleText
                      }
                    >
                      @{handle}
                    </Text>

                    <Pressable
                      onPress={() =>
                        void copyToClipboard(
                          `@${handle}`,
                          key,
                        )
                      }
                    >
                      {copiedKey === key ? (
                        <Check
                          size={15}
                          color="#22c55e"
                        />
                      ) : (
                        <Copy
                          size={15}
                          color="#64748b"
                        />
                      )}
                    </Pressable>
                  </View>
                );
              },
            )}
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderStrategyTab = () => (
    <View>
      {renderSectionHeader(
        <Lightbulb
          size={20}
          color="#eab308"
        />,
        "Content Strategy",
        "Generate post ideas for your creator category.",
      )}

      <View style={styles.card}>
        <Text style={styles.label}>
          Category
        </Text>

        <TextInput
          value={category}
          onChangeText={setCategory}
          style={styles.input}
          placeholder="Digital Creator"
          placeholderTextColor="#94a3b8"
        />

        {renderButton(
          "Generate Content Strategy",
          () =>
            void handleGenerateStrategy(),
          Boolean(loadingStates.strategy),
        )}
      </View>

      {postIdeas.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.resultLabel}>
            AI Content Ideas
          </Text>

          <View style={styles.ideaList}>
            {postIdeas.map((idea, index) => (
              <View
                key={`idea-${index}`}
                style={styles.ideaRow}
              >
                <View
                  style={
                    styles.ideaNumber
                  }
                >
                  <Text
                    style={
                      styles.ideaNumberText
                    }
                  >
                    {index + 1}
                  </Text>
                </View>

                <Text
                  style={styles.ideaText}
                >
                  {idea}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderTranslatorTab = () => (
    <View>
      {renderSectionHeader(
        <Languages
          size={20}
          color="#2563eb"
        />,
        "Translator & Accessibility",
        "Translate text and create alt text.",
      )}

      <View style={styles.card}>
        <Text style={styles.label}>
          AI Multilingual Translator
        </Text>

        <TextInput
          value={translateInput}
          onChangeText={setTranslateInput}
          style={[
            styles.input,
            styles.multiline,
          ]}
          multiline
          textAlignVertical="top"
          placeholder="Enter text to translate..."
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.choiceRow}>
          {[
            "Spanish",
            "Hindi",
            "French",
            "German",
            "Arabic",
          ].map((language) => {
            const active =
              targetLang === language;

            return (
              <Pressable
                key={language}
                onPress={() =>
                  setTargetLang(language)
                }
                style={[
                  styles.choice,
                  active &&
                    styles.choiceActive,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    active &&
                      styles.choiceTextActive,
                  ]}
                >
                  {language}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {renderButton(
          "Translate Text",
          () => void handleTranslate(),
          Boolean(loadingStates.translate),
        )}

        {translatedResult ? (
          <Text style={styles.resultBoxText}>
            {translatedResult}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          AI Screen-Reader Alt-Text Generator
        </Text>

        <TextInput
          value={imageDesc}
          onChangeText={setImageDesc}
          style={styles.input}
          placeholder="Woman drinking coffee outdoors"
          placeholderTextColor="#94a3b8"
        />

        {renderButton(
          "Generate Alt-Text",
          () =>
            void handleGenerateAltText(),
          Boolean(loadingStates.altText),
        )}

        {altTextResult ? (
          <Text style={styles.resultBoxText}>
            {altTextResult}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const renderSafetyTab = () => (
    <View>
      {renderSectionHeader(
        <ShieldAlert
          size={20}
          color="#ef4444"
        />,
        "AI Safety & Moderation Shield",
        "Analyze content and account risk.",
      )}

      <View style={styles.card}>
        <Text style={styles.label}>
          Text Moderation
        </Text>

        <TextInput
          value={moderationText}
          onChangeText={setModerationText}
          style={[
            styles.input,
            styles.multiline,
          ]}
          multiline
          textAlignVertical="top"
          placeholder="Enter content to analyze..."
          placeholderTextColor="#94a3b8"
        />

        {renderButton(
          "Run Safety Analysis",
          () =>
            void handleModeration(),
          Boolean(loadingStates.moderation),
        )}
      </View>

      {moderationResult ? (
        <View style={styles.card}>
          <View style={styles.resultHeader}>
            <View style={styles.resultHeaderLeft}>
              <AlertTriangle
                size={17}
                color="#ef4444"
              />
              <Text style={styles.resultLabel}>
                Moderation Result
              </Text>
            </View>
          </View>

          <Text style={styles.jsonText}>
            {JSON.stringify(
              moderationResult,
              null,
              2,
            )}
          </Text>
        </View>
      ) : null}

      {fakeAccountResult ? (
        <View style={styles.card}>
          <View style={styles.resultHeaderLeft}>
            <Bot
              size={17}
              color="#a855f7"
            />
            <Text style={styles.resultLabel}>
              Fake Account Detection
            </Text>
          </View>

          <Text style={styles.jsonText}>
            {JSON.stringify(
              fakeAccountResult,
              null,
              2,
            )}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={[activeTab]}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: (insets.top || 20) + 12 },
        ]}
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => router.back()}
              style={styles.backRow}
            >
              <Text style={styles.backText}>
                Back
              </Text>
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Sparkles
                  size={26}
                  color="#ffffff"
                />
              </View>

              <Text style={styles.heroTitle}>
                SnapGram AI Creator Suite
              </Text>

              <Text style={styles.heroSubtitle}>
                Captions, hashtags, bios,
                strategy, translation,
                moderation and accessibility.
              </Text>
            </View>

            {renderTabs()}
          </View>
        }
        renderItem={() => {
          switch (activeTab) {
            case "bio":
              return renderBioTab();
            case "strategy":
              return renderStrategyTab();
            case "translator":
              return renderTranslatorTab();
            case "safety":
              return renderSafetyTab();
            case "captions":
            default:
              return renderCaptionsTab();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  backRow: {
    marginBottom: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
  },

  backText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },

  hero: {
    marginBottom: 18,
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  heroTitle: {
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "800",
    color: "#0f172a",
  },

  heroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },

  tabsContent: {
    paddingBottom: 18,
    gap: 8,
  },

  tabButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  tabButtonActive: {
    backgroundColor: "rgba(168,85,247,0.10)",
    borderColor: "rgba(168,85,247,0.35)",
  },

  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },

  tabTextActive: {
    color: "#a855f7",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
  },

  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  label: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },

  input: {
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    paddingHorizontal: 13,
    fontSize: 14,
    marginBottom: 13,
  },

  multiline: {
    minHeight: 100,
    paddingTop: 12,
  },

  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 13,
  },

  choice: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  choiceActive: {
    backgroundColor: "rgba(168,85,247,0.10)",
    borderColor: "#a855f7",
  },

  choiceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },

  choiceTextActive: {
    color: "#a855f7",
  },

  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 2,
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  resultHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  resultLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#a855f7",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  copyText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },

  resultText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#0f172a",
    fontWeight: "500",
  },

  resultBoxText: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 13,
    fontSize: 14,
    lineHeight: 21,
    color: "#0f172a",
    fontWeight: "500",
  },

  chipsWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  hashChip: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(168,85,247,0.08)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.20)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  hashChipText: {
    fontSize: 12,
    color: "#a855f7",
    fontWeight: "600",
  },

  handleList: {
    gap: 8,
    marginTop: 10,
  },

  handleRow: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  handleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },

  ideaList: {
    marginTop: 10,
    gap: 8,
  },

  ideaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  ideaNumber: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: "rgba(168,85,247,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  ideaNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#a855f7",
  },

  ideaText: {
    flex: 1,
    paddingTop: 3,
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
  },

  jsonText: {
    marginTop: 12,
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 17,
    color: "#334155",
  },
});