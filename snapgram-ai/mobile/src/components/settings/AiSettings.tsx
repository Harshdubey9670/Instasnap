import React from "react";
import {
  Text,
  StyleSheet,
  View,
} from "react-native";
import {
  BrainCircuit,
  Bot,
  Sparkles,
} from "lucide-react-native";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  optimisticUpdateSetting,
  updateSettings,
} from "../../store/authSlice";
import type {
  RootState,
  AppDispatch,
} from "../../store/store";

import {
  useToast,
} from "../ui/Toast";
import {
  SettingToggle,
} from "./SettingToggle";
import {
  useTheme,
} from "../../contexts/ThemeContext";

const AiSettings =
  () => {
    const {
      settings,
    } = useSelector(
      (state: RootState) =>
        state.auth,
    );

    const dispatch =
      useDispatch<AppDispatch>();

    const {
      toast,
    } = useToast();

    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme ===
      "dark";

    const handleUpdate =
      async (
        category: string,
        key: string,
        value: boolean,
      ) => {
        const updates = {
          [category]: {
            [key]: value,
          },
        };

        dispatch(
          optimisticUpdateSetting(
            updates,
          ),
        );

        try {
          await dispatch(
            updateSettings(
              updates,
            ),
          ).unwrap();
        } catch {
          toast({
            variant:
              "error",
            title:
              "Error",
            description:
              "Failed to update AI setting",
          });
        }
      };

    const aiEnabled =
      settings
        ?.ai
        ?.enableAiFeatures ??
      true;

    return (
      <View
        style={
          styles.container
        }
      >
        <View>
          <View
            style={
              styles.headingRow
            }
          >
            <Sparkles
              size={24}
              color="#a855f7"
            />

            <Text
              style={[
                styles.title,
                {
                  color:
                    dark
                      ? "#f8fafc"
                      : "#0f172a",
                },
              ]}
            >
              AI Features
            </Text>
          </View>

          <Text
            style={[
              styles.description,
              {
                color:
                  dark
                    ? "#94a3b8"
                    : "#64748b",
              },
            ]}
          >
            Supercharge your experience with NovaVerse artificial intelligence.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                dark
                  ? "#130a1c"
                  : "#ffffff",
              borderColor:
                "rgba(168,85,247,0.22)",
            },
          ]}
        >
          <View
            style={
              styles.globalBox
            }
          >
            <View
              style={
                styles.botIcon
              }
            >
              <Bot
                size={24}
                color="#ffffff"
              />
            </View>

            <View
              style={
                styles.globalCopy
              }
            >
              <Text
                style={[
                  styles.itemTitle,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              >
                Global AI Toggle
              </Text>

              <Text
                style={[
                  styles.itemDescription,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
              >
                Turn all generative AI features on or off at once.
              </Text>

              <SettingToggle
                label="Enable AI Features"
                checked={
                  aiEnabled
                }
                onChange={(
                  value,
                ) =>
                  handleUpdate(
                    "ai",
                    "enableAiFeatures",
                    value,
                  )
                }
              />
            </View>
          </View>

          <View
            style={[
              styles.capabilities,
              !aiEnabled &&
                styles.disabledCapabilities,
            ]}
          >
            <View
              style={
                styles.sectionHeading
              }
            >
              <BrainCircuit
                size={20}
                color="#ec4899"
              />

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              >
                Capabilities
              </Text>
            </View>

            <SettingToggle
              label="AI Caption Generator"
              description="Get smart caption suggestions based on your image analysis."
              checked={
                settings
                  ?.ai
                  ?.aiCaptionGenerator ??
                true
              }
              disabled={
                !aiEnabled
              }
              onChange={(
                value,
              ) =>
                handleUpdate(
                  "ai",
                  "aiCaptionGenerator",
                  value,
                )
              }
            />

            <SettingToggle
              label="Smart Recommendations"
              description="Use AI to analyze your behavior and suggest better content."
              checked={
                settings
                  ?.ai
                  ?.aiRecommendations ??
                true
              }
              disabled={
                !aiEnabled
              }
              onChange={(
                value,
              ) =>
                handleUpdate(
                  "ai",
                  "aiRecommendations",
                  value,
                )
              }
            />

            <SettingToggle
              label="AI Memories & Highlights"
              description="Automatically generate yearly highlight videos and memory recaps."
              checked={
                settings
                  ?.ai
                  ?.aiMemories ??
                true
              }
              disabled={
                !aiEnabled
              }
              onChange={(
                value,
              ) =>
                handleUpdate(
                  "ai",
                  "aiMemories",
                  value,
                )
              }
            />
          </View>
        </View>
      </View>
    );
  };

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      gap: 20,
      paddingBottom: 32,
    },

    headingRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    title: {
      fontSize: 26,
      fontWeight: "800",
    },

    description: {
      marginTop: 5,
      fontSize: 14,
      lineHeight: 20,
    },

    card: {
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      overflow:
        "hidden",
    },

    globalBox: {
      flexDirection:
        "row",
      gap: 14,
      padding: 14,
      borderRadius: 16,
      backgroundColor:
        "rgba(168,85,247,0.10)",
    },

    botIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#a855f7",
    },

    globalCopy: {
      flex: 1,
    },

    itemTitle: {
      fontSize: 15,
      fontWeight: "800",
    },

    itemDescription: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
    },

    capabilities: {
      marginTop: 18,
    },

    disabledCapabilities: {
      opacity: 0.45,
    },

    sectionHeading: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      paddingBottom: 10,
      marginBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
    },
  });

export default AiSettings;