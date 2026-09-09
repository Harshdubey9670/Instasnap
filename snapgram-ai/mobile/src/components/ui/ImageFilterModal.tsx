import React, {
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Wand2,
  X,
} from "lucide-react-native";
import { WebView } from "react-native-webview";

import { Button } from "./Button";
import { useTheme } from "../../contexts/ThemeContext";

type FilterPreset = {
  id: string;
  name: string;
  css: string;
};

type ActiveTab =
  | "presets"
  | "custom";

interface ImageFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onApplyFilter: (value: {
    filterStyle: string;
    presetName: string;
  }) => void;
}

export const FILTER_PRESETS: FilterPreset[] =
  [
    {
      id: "normal",
      name: "Normal",
      css: "none",
    },
    {
      id: "clarendon",
      name: "Clarendon",
      css: "contrast(120%) brightness(125%) saturate(135%)",
    },
    {
      id: "gingham",
      name: "Gingham",
      css: "hue-rotate(-10deg) brightness(105%) contrast(90%)",
    },
    {
      id: "moon",
      name: "Moon B&W",
      css: "grayscale(100%) contrast(140%) brightness(110%)",
    },
    {
      id: "lark",
      name: "Lark",
      css: "saturate(140%) contrast(110%) brightness(110%)",
    },
    {
      id: "reyes",
      name: "Reyes",
      css: "sepia(35%) brightness(110%) contrast(85%)",
    },
    {
      id: "juno",
      name: "Juno",
      css: "contrast(115%) saturate(150%) hue-rotate(-10deg)",
    },
    {
      id: "slumber",
      name: "Slumber",
      css: "saturate(66%) sepia(35%) contrast(85%)",
    },
    {
      id: "cyberpunk",
      name: "Cyberpunk",
      css: "hue-rotate(180deg) saturate(220%) contrast(130%)",
    },
    {
      id: "golden",
      name: "Golden Hour",
      css: "sepia(50%) contrast(110%) saturate(160%)",
    },
    {
      id: "noir",
      name: "Noir",
      css: "grayscale(100%) contrast(180%)",
    },
    {
      id: "vivid",
      name: "Vivid Pop",
      css: "saturate(200%) contrast(115%)",
    },
    {
      id: "vintage",
      name: "Retro Vintage",
      css: "sepia(60%) hue-rotate(-20deg) contrast(110%)",
    },
  ];

export function ImageFilterModal({
  isOpen,
  onClose,
  imageSrc,
  onApplyFilter,
}: ImageFilterModalProps) {
  const {
    effectiveTheme,
  } = useTheme();

  const {
    width,
    height,
  } = useWindowDimensions();

  const [selectedPreset, setSelectedPreset] =
    useState(
      "normal",
    );

  const [activeTab, setActiveTab] =
    useState<ActiveTab>(
      "presets",
    );

  const [brightness, setBrightness] =
    useState(100);

  const [contrast, setContrast] =
    useState(100);

  const [saturation, setSaturation] =
    useState(100);

  const [sepia, setSepia] =
    useState(0);

  const [hue, setHue] =
    useState(0);

  const [blur, setBlur] =
    useState(0);

  const dark =
    effectiveTheme ===
    "dark";

  const getComputedFilterCSS =
    () => {
      if (
        activeTab ===
        "presets"
      ) {
        const preset =
          FILTER_PRESETS.find(
            (item) =>
              item.id ===
              selectedPreset,
          );

        return preset
          ? preset.css
          : "none";
      }

      return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) hue-rotate(${hue}deg) blur(${blur}px)`;
    };

  const handleReset = () => {
    setSelectedPreset(
      "normal",
    );
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSepia(0);
    setHue(0);
    setBlur(0);
  };

  const handleApply = () => {
    onApplyFilter({
      filterStyle:
        getComputedFilterCSS(),
      presetName:
        selectedPreset,
    });

    onClose();
  };

  const previewHtml =
    useMemo(() => {
      const filter =
        getComputedFilterCSS()
          .replace(
            /&/g,
            "&amp;",
          )
          .replace(
            /"/g,
            "&quot;",
          );

      const safeImage =
        imageSrc
          .replace(
            /&/g,
            "&amp;",
          )
          .replace(
            /"/g,
            "&quot;",
          );

      return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: ${filter};
}
</style>
</head>
<body>
<img src="${safeImage}" />
</body>
</html>`;
    }, [
      imageSrc,
      activeTab,
      selectedPreset,
      brightness,
      contrast,
      saturation,
      sepia,
      hue,
      blur,
    ]);

  if (!isOpen) {
    return null;
  }

  const isCompact =
    width < 700;

  const modalHeight =
    Math.min(
      height * 0.90,
      760,
    );

  const imageHeight =
    isCompact
      ? Math.min(
          width - 40,
          320,
        )
      : 340;

  return (
    <View
      style={
        styles.overlay
      }
    >
      <View
        style={[
          styles.modal,
          {
            maxHeight:
              modalHeight,
            backgroundColor:
              dark
                ? "#130a1c"
                : "#ffffff",
            borderColor:
              dark
                ? "rgba(168,85,247,0.15)"
                : "rgba(255,255,255,0.40)",
          },
        ]}
      >
        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerLeft
            }
          >
            <Wand2
              size={20}
              color="#a855f7"
            />

            <Text
              style={[
                styles.headerTitle,
                {
                  color:
                    dark
                      ? "#f8fafc"
                      : "#0f172a",
                },
              ]}
              numberOfLines={
                1
              }
            >
              Instagram &
              Snapchat Photo
              Filters
            </Text>
          </View>

          <Pressable
            onPress={
              onClose
            }
            hitSlop={8}
            style={
              styles.closeButton
            }
            accessibilityRole="button"
            accessibilityLabel="Close filters"
          >
            <X
              size={20}
              color={
                dark
                  ? "#94a3b8"
                  : "#64748b"
              }
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.body
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={[
              styles.content,
              !isCompact &&
                styles.contentWide,
            ]}
          >
            <View
              style={[
                styles.preview,
                {
                  height:
                    imageHeight,
                },
              ]}
            >
              <WebView
                source={{
                  html:
                    previewHtml,
                }}
                originWhitelist={[
                  "*",
                ]}
                javaScriptEnabled
                scrollEnabled={
                  false
                }
                showsHorizontalScrollIndicator={
                  false
                }
                showsVerticalScrollIndicator={
                  false
                }
                style={
                  styles.webview
                }
              />
            </View>

            <View
              style={
                styles.controls
              }
            >
              <View
                style={[
                  styles.tabs,
                  {
                    backgroundColor:
                      dark
                        ? "#1e112c"
                        : "#f1f5f9",
                    borderColor:
                      dark
                        ? "#2d1b3b"
                        : "#e2e8f0",
                  },
                ]}
              >
                <Pressable
                  onPress={() =>
                    setActiveTab(
                      "presets",
                    )
                  }
                  style={[
                    styles.tab,
                    activeTab ===
                      "presets" &&
                      styles.activeTab,
                  ]}
                >
                  <Sparkles
                    size={13}
                    color={
                      activeTab ===
                      "presets"
                        ? "#ffffff"
                        : "#64748b"
                    }
                  />

                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab ===
                          "presets"
                            ? "#ffffff"
                            : dark
                              ? "#94a3b8"
                              : "#64748b",
                      },
                    ]}
                  >
                    Presets (
                    {
                      FILTER_PRESETS.length
                    }
                    )
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setActiveTab(
                      "custom",
                    )
                  }
                  style={[
                    styles.tab,
                    activeTab ===
                      "custom" &&
                      styles.activeTab,
                  ]}
                >
                  <Sliders
                    size={13}
                    color={
                      activeTab ===
                      "custom"
                        ? "#ffffff"
                        : "#64748b"
                    }
                  />

                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab ===
                          "custom"
                            ? "#ffffff"
                            : dark
                              ? "#94a3b8"
                              : "#64748b",
                      },
                    ]}
                  >
                    Custom
                    Tuning
                  </Text>
                </Pressable>
              </View>

              {activeTab ===
              "presets" ? (
                <View
                  style={
                    styles.presetGrid
                  }
                >
                  {FILTER_PRESETS.map(
                    (
                      preset,
                    ) => {
                      const selected =
                        selectedPreset ===
                        preset.id;

                      const thumbnailHtml = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}
img{width:100%;height:100%;object-fit:cover;filter:${preset.css}}
</style>
</head>
<body><img src="${imageSrc.replace(
                        /"/g,
                        "&quot;",
                      )}" /></body>
</html>`;

                      return (
                        <Pressable
                          key={
                            preset.id
                          }
                          onPress={() =>
                            setSelectedPreset(
                              preset.id,
                            )
                          }
                          style={[
                            styles.preset,
                            {
                              borderColor:
                                selected
                                  ? "#a855f7"
                                  : dark
                                    ? "#2d1b3b"
                                    : "#e2e8f0",
                              backgroundColor:
                                selected
                                  ? "rgba(168,85,247,0.10)"
                                  : "transparent",
                            },
                          ]}
                        >
                          <View
                            style={
                              styles.thumbnail
                            }
                          >
                            <WebView
                              source={{
                                html:
                                  thumbnailHtml,
                              }}
                              originWhitelist={[
                                "*",
                              ]}
                              scrollEnabled={
                                false
                              }
                              javaScriptEnabled
                              style={
                                styles.webview
                              }
                            />
                          </View>

                          <Text
                            style={[
                              styles.presetName,
                              {
                                color:
                                  dark
                                    ? "#f8fafc"
                                    : "#0f172a",
                              },
                            ]}
                            numberOfLines={
                              1
                            }
                          >
                            {
                              preset.name
                            }
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>
              ) : (
                <ScrollView
                  style={
                    styles.customPanel
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  <Adjustment
                    label="Brightness"
                    value={
                      brightness
                    }
                    suffix="%"
                    minimum={
                      50
                    }
                    maximum={
                      150
                    }
                    step={1}
                    onChange={
                      setBrightness
                    }
                    dark={dark}
                  />

                  <Adjustment
                    label="Contrast"
                    value={
                      contrast
                    }
                    suffix="%"
                    minimum={
                      50
                    }
                    maximum={
                      150
                    }
                    step={1}
                    onChange={
                      setContrast
                    }
                    dark={dark}
                  />

                  <Adjustment
                    label="Saturation"
                    value={
                      saturation
                    }
                    suffix="%"
                    minimum={0}
                    maximum={
                      200
                    }
                    step={1}
                    onChange={
                      setSaturation
                    }
                    dark={dark}
                  />

                  <Adjustment
                    label="Sepia Warmth"
                    value={
                      sepia
                    }
                    suffix="%"
                    minimum={0}
                    maximum={
                      100
                    }
                    step={1}
                    onChange={
                      setSepia
                    }
                    dark={dark}
                  />

                  <Adjustment
                    label="Hue Rotate"
                    value={
                      hue
                    }
                    suffix="°"
                    minimum={
                      -180
                    }
                    maximum={
                      180
                    }
                    step={1}
                    onChange={
                      setHue
                    }
                    dark={dark}
                  />
                </ScrollView>
              )}

              <View
                style={[
                  styles.actions,
                  {
                    borderTopColor:
                      dark
                        ? "#2d1b3b"
                        : "#e2e8f0",
                  },
                ]}
              >
                <Pressable
                  onPress={
                    handleReset
                  }
                  style={[
                    styles.resetButton,
                    {
                      backgroundColor:
                        dark
                          ? "rgba(19,10,28,0.50)"
                          : "rgba(255,255,255,0.70)",
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Reset filters"
                >
                  <RotateCcw
                    size={16}
                    color={
                      dark
                        ? "#94a3b8"
                        : "#64748b"
                    }
                  />
                </Pressable>

                <View
                  style={
                    styles.applyButton
                  }
                >
                  <Button
                    onPress={
                      handleApply
                    }
                    variant="gradient"
                  >
                    <View
                      style={
                        styles.applyContent
                      }
                    >
                      <Text
                        style={
                          styles.applyText
                        }
                      >
                        Apply Filter
                      </Text>

                      <Check
                        size={16}
                        color="#ffffff"
                      />
                    </View>
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

interface AdjustmentProps {
  label: string;
  value: number;
  suffix: string;
  minimum: number;
  maximum: number;
  step: number;
  onChange: (
    value: number,
  ) => void;
  dark: boolean;
}

/**
 * Native slider replacement without introducing another dependency.
 *
 * The track is draggable using PanResponder-like touch handling
 * through Pressable's long-press/touch behavior is not sufficient
 * for continuous dragging, so this implementation currently offers
 * decrement/increment controls around the native value.
 *
 * A dedicated native slider can be introduced later if the project
 * already standardizes on one.
 */
function Adjustment({
  label,
  value,
  suffix,
  minimum,
  maximum,
  step,
  onChange,
  dark,
}: AdjustmentProps) {
  const decrease = () => {
    onChange(
      Math.max(
        minimum,
        value - step,
      ),
    );
  };

  const increase = () => {
    onChange(
      Math.min(
        maximum,
        value + step,
      ),
    );
  };

  const progress =
    (value - minimum) /
    (maximum - minimum);

  return (
    <View
      style={
        styles.adjustment
      }
    >
      <View
        style={
          styles.adjustmentHeader
        }
      >
        <Text
          style={[
            styles.adjustmentLabel,
            {
              color:
                dark
                  ? "#94a3b8"
                  : "#64748b",
            },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.adjustmentValue,
            {
              color:
                dark
                  ? "#94a3b8"
                  : "#64748b",
            },
          ]}
        >
          {value}
          {suffix}
        </Text>
      </View>

      <View
        style={
          styles.sliderRow
        }
      >
        <Pressable
          onPress={
            decrease
          }
          style={
            styles.sliderButton
          }
        >
          <Text
            style={
              styles.sliderButtonText
            }
          >
            −
          </Text>
        </Pressable>

        <View
          style={
            styles.sliderTrack
          }
        >
          <View
            style={[
              styles.sliderFill,
              {
                width: `${Math.max(
                  0,
                  Math.min(
                    1,
                    progress,
                  ),
                ) * 100}%`,
              },
            ]}
          />
        </View>

        <Pressable
          onPress={
            increase
          }
          style={
            styles.sliderButton
          }
        >
          <Text
            style={
              styles.sliderButtonText
            }
          >
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1000,
      elevation: 1000,
      backgroundColor:
        "rgba(0,0,0,0.80)",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 16,
    },

    modal: {
      width: "100%",
      maxWidth: 900,
      borderWidth: 1,
      borderRadius: 24,
      overflow:
        "hidden",
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#2d1b3b",
    },

    headerLeft: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "800",
    },

    closeButton: {
      padding: 8,
      borderRadius: 999,
    },

    body: {
      padding: 16,
    },

    content: {
      gap: 20,
    },

    contentWide: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    preview: {
      flex: 1,
      minHeight: 260,
      borderRadius: 16,
      overflow:
        "hidden",
      backgroundColor:
        "#000000",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    webview: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    controls: {
      flex: 1,
      minWidth: 0,
      gap: 16,
    },

    tabs: {
      flexDirection:
        "row",
      padding: 4,
      borderWidth: 1,
      borderRadius: 12,
    },

    tab: {
      flex: 1,
      minHeight: 38,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 5,
      borderRadius: 8,
    },

    activeTab: {
      backgroundColor:
        "#a855f7",
      shadowColor:
        "#a855f7",
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 4,
    },

    tabText: {
      fontSize: 12,
      fontWeight: "700",
    },

    presetGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
    },

    preset: {
      width: "31%",
      minWidth: 90,
      borderWidth: 1,
      borderRadius: 12,
      padding: 8,
    },

    thumbnail: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 8,
      overflow:
        "hidden",
      backgroundColor:
        "#000000",
      marginBottom: 4,
    },

    presetName: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700",
      textAlign: "center",
    },

    customPanel: {
      maxHeight: 320,
    },

    adjustment: {
      marginBottom: 14,
    },

    adjustmentHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginBottom: 6,
    },

    adjustmentLabel: {
      fontSize: 12,
    },

    adjustmentValue: {
      fontSize: 12,
    },

    sliderRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    sliderTrack: {
      flex: 1,
      height: 6,
      borderRadius: 999,
      backgroundColor:
        "rgba(148,163,184,0.22)",
      overflow:
        "hidden",
    },

    sliderFill: {
      height: "100%",
      backgroundColor:
        "#a855f7",
      borderRadius: 999,
    },

    sliderButton: {
      width: 32,
      height: 32,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 16,
      backgroundColor:
        "rgba(168,85,247,0.12)",
    },

    sliderButtonText: {
      color: "#a855f7",
      fontSize: 20,
      lineHeight: 22,
    },

    actions: {
      flexDirection:
        "row",
      gap: 8,
      paddingTop: 10,
      borderTopWidth: 1,
    },

    resetButton: {
      width: 42,
      height: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.12)",
    },

    applyButton: {
      flex: 1,
    },

    applyContent: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
    },

    applyText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
    },
  });