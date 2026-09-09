import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Video,
  ResizeMode,
} from "expo-av";
import {
  Bot,
  Check,
  ChevronDown,
  Crop as CropIcon,
  Download,
  Eye,
  Flame,
  FlipHorizontal,
  FlipVertical,
  Folder,
  Heart,
  Layers,
  Maximize2,
  Moon,
  Palette,
  RotateCcw,
  RotateCw,
  Scissors,
  Settings2,
  Sliders,
  Smile,
  Sparkles,
  Sparkle,
  Sticker as StickerIcon,
  Sun,
  Type,
  Undo,
  Wand2,
  X,
  Zap,
} from "lucide-react-native";

import {
  Button,
} from "../ui/Button";
import {
  useToast,
} from "../ui/Toast";
import {
  EXTENDED_FILTER_PRESETS,
} from "../../services/FilterEngine";

interface MediaEditorStudioProps {
  isOpen: boolean;
  onClose: () => void;
  mediaSrc: string;
  mediaType?: "image" | "video" | string;
  onSave?: (
    payload: {
      filterStyle: string;
      exportQuality: ExportQuality;
      exportFormat: string;
    },
  ) => void;
}

type EditorTab =
  | "filters"
  | "adjust"
  | "beauty"
  | "stickers"
  | "text"
  | "crop"
  | "fx"
  | "ai"
  | "export";

type ExportQuality =
  | "720p"
  | "1080p"
  | "2K"
  | "4K";

type StickerType =
  | "emoji"
  | "location"
  | "weather";

interface StickerItem {
  id: string;
  content: string;
  type: StickerType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TextLayer {
  id: string;
  text: string;
  font: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  x: number;
  y: number;
  scale: number;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  exposure: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  saturation: number;
  vibrance: number;
  hue: number;
  sharpness: number;
  clarity: number;
  structure: number;
  texture: number;
  noiseReduction: number;
  vignette: number;
  grain: number;
  fade: number;
}

interface BeautyState {
  skinSmoothing: number;
  blemishReduction: number;
  skinTone: number;
  teethWhitening: number;
  eyeEnhancement: number;
  faceBrightness: number;
  lipEnhancement: number;
  eyebrowEnhancement: number;
  naturalMode: boolean;
  intensity: number;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  saturation: 100,
  vibrance: 0,
  hue: 0,
  sharpness: 0,
  clarity: 0,
  structure: 0,
  texture: 0,
  noiseReduction: 0,
  vignette: 0,
  grain: 0,
  fade: 0,
};

const DEFAULT_BEAUTY: BeautyState = {
  skinSmoothing: 0,
  blemishReduction: 0,
  skinTone: 0,
  teethWhitening: 0,
  eyeEnhancement: 0,
  faceBrightness: 0,
  lipEnhancement: 0,
  eyebrowEnhancement: 0,
  naturalMode: true,
  intensity: 50,
};

const TABS: Array<{
  id: EditorTab;
  label: string;
  icon: React.ComponentType<any>;
}> = [
  {
    id: "filters",
    label: "Filters",
    icon: Wand2,
  },
  {
    id: "adjust",
    label: "Adjust",
    icon: Sliders,
  },
  {
    id: "beauty",
    label: "Beauty",
    icon: Sparkles,
  },
  {
    id: "stickers",
    label: "Stickers",
    icon: StickerIcon,
  },
  {
    id: "text",
    label: "Text",
    icon: Type,
  },
  {
    id: "crop",
    label: "Crop",
    icon: CropIcon,
  },
  {
    id: "fx",
    label: "Effects",
    icon: Flame,
  },
  {
    id: "ai",
    label: "AI Studio",
    icon: Bot,
  },
  {
    id: "export",
    label: "Export",
    icon: Download,
  },
];

const ADJUSTMENT_SLIDERS: Array<{
  key: keyof Adjustments;
  label: string;
  min: number;
  max: number;
}> = [
  {
    key: "brightness",
    label: "Brightness",
    min: 50,
    max: 150,
  },
  {
    key: "contrast",
    label: "Contrast",
    min: 50,
    max: 150,
  },
  {
    key: "exposure",
    label: "Exposure EV",
    min: -50,
    max: 50,
  },
  {
    key: "saturation",
    label: "Saturation",
    min: 0,
    max: 200,
  },
  {
    key: "vibrance",
    label: "Vibrance",
    min: -50,
    max: 50,
  },
  {
    key: "temperature",
    label: "Warmth / Temp",
    min: -50,
    max: 50,
  },
  {
    key: "hue",
    label: "Hue Shift",
    min: -180,
    max: 180,
  },
  {
    key: "clarity",
    label: "Clarity",
    min: 0,
    max: 100,
  },
  {
    key: "sharpness",
    label: "Sharpness",
    min: 0,
    max: 100,
  },
  {
    key: "vignette",
    label: "Vignette",
    min: 0,
    max: 100,
  },
];

const BEAUTY_SLIDERS: Array<{
  key: keyof BeautyState;
  label: string;
}> = [
  {
    key: "skinSmoothing",
    label: "Skin Smooth",
  },
  {
    key: "blemishReduction",
    label: "Blemish Reduction",
  },
  {
    key: "teethWhitening",
    label: "Teeth Whitening",
  },
  {
    key: "eyeEnhancement",
    label: "Eye Brightening",
  },
  {
    key: "faceBrightness",
    label: "Face Contour Glow",
  },
];

const EMOJI_STICKERS = [
  "🔥",
  "✨",
  "📸",
  "😍",
  "🎉",
  "❤️",
  "🌈",
  "💯",
  "👑",
  "🚀",
];

const MediaEditorStudio = ({
  isOpen,
  onClose,
  mediaSrc,
  mediaType = "image",
  onSave,
}: MediaEditorStudioProps) => {
  const {
    toast,
  } = useToast();

  const [
    activeTab,
    setActiveTab,
  ] = useState<EditorTab>(
    "filters",
  );

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState(
    "natural",
  );

  const [
    adjustments,
    setAdjustments,
  ] =
    useState<Adjustments>(
      DEFAULT_ADJUSTMENTS,
    );

  const [
    beauty,
    setBeauty,
  ] =
    useState<BeautyState>(
      DEFAULT_BEAUTY,
    );

  const [
    stickers,
    setStickers,
  ] = useState<
    StickerItem[]
  >([]);

  const [
    activeStickerId,
    setActiveStickerId,
  ] = useState<
    string | null
  >(null);

  const [
    textLayers,
    setTextLayers,
  ] = useState<
    TextLayer[]
  >([]);

  const [
    newText,
    setNewText,
  ] = useState("");

  const [
    selectedFont,
    setSelectedFont,
  ] = useState(
    "sans-serif",
  );

  const [
    textColor,
    setTextColor,
  ] = useState(
    "#FFFFFF",
  );

  const [
    isBold,
    setIsBold,
  ] = useState(
    false,
  );

  const [
    isItalic,
    setIsItalic,
  ] = useState(
    false,
  );

  const [
    isDrawing,
    setIsDrawing,
  ] = useState(
    false,
  );

  const [
    drawTool,
    setDrawTool,
  ] = useState<
    | "pen"
    | "brush"
    | "highlighter"
    | "eraser"
  >("pen");

  const [
    drawColor,
    setDrawColor,
  ] = useState(
    "#EF4444",
  );

  const [
    brushSize,
    setBrushSize,
  ] = useState(5);

  const [
    drawOpacity,
    setDrawOpacity,
  ] = useState(
    100,
  );

  const [
    undoStack,
    setUndoStack,
  ] = useState<
    unknown[]
  >([]);

  const [
    rotation,
    setRotation,
  ] = useState(0);

  const [
    flipH,
    setFlipH,
  ] = useState(
    false,
  );

  const [
    flipV,
    setFlipV,
  ] = useState(
    false,
  );

  const [
    straighten,
    setStraighten,
  ] = useState(0);

  const [
    cropRatio,
    setCropRatio,
  ] = useState(
    "free",
  );

  const [
    activeFx,
    setActiveFx,
  ] = useState(
    "none",
  );

  const [
    aiProcessing,
    setAiProcessing,
  ] = useState(
    false,
  );

  const [
    exportQuality,
    setExportQuality,
  ] =
    useState<ExportQuality>(
      "1080p",
    );

  const [
    exportFormat,
    setExportFormat,
  ] = useState(
    "image/webp",
  );

  const [
    isExporting,
    setIsExporting,
  ] = useState(
    false,
  );

  const [
    exportProgress,
    setExportProgress,
  ] = useState(0);

  const [
    workspaceSize,
    setWorkspaceSize,
  ] = useState({
    width: 0,
    height: 0,
  });


  const exportTimer =
    useRef<
      ReturnType<
        typeof setInterval
      > | null
    >(null);

  useEffect(() => {
    return () => {
      if (
        exportTimer.current
      ) {
        clearInterval(
          exportTimer.current,
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setExportProgress(
      0,
    );
    setIsExporting(
      false,
    );
  }, [
    isOpen,
  ]);

  const getFilterStyle =
    () => {
      const preset = (
        EXTENDED_FILTER_PRESETS as Array<{
          id: string;
          css?: string;
        }>
      ).find(
        (filter) =>
          filter.id ===
          selectedFilter,
      );

      const presetCss =
        preset &&
        preset.css !==
          "none"
          ? preset.css || ""
          : "";

      const customCss = `
        brightness(${adjustments.brightness + adjustments.exposure}%)
        contrast(${adjustments.contrast + adjustments.clarity * 0.5}%)
        saturate(${adjustments.saturation + adjustments.vibrance * 0.5}%)
        hue-rotate(${adjustments.hue + adjustments.temperature * 0.3}deg)
        sepia(${adjustments.tint > 0 ? adjustments.tint : 0}%)
        blur(${activeFx === "blur" ? 4 : 0}px)
      `.trim();

      return `${presetCss} ${customCss}`.trim();
    };

  const filterPreview =
    useMemo(() => {
      /*
       * React Native does not support arbitrary CSS filter strings.
       * We still keep the generated CSS value because this is part
       * of the existing editor's save contract.
       */
      return getFilterStyle();
    }, [
      activeFx,
      adjustments,
      selectedFilter,
    ]);

  const resetEditor =
    () => {
      setSelectedFilter(
        "natural",
      );

      setAdjustments(
        DEFAULT_ADJUSTMENTS,
      );

      setBeauty(
        DEFAULT_BEAUTY,
      );

      setStickers(
        [],
      );

      setActiveStickerId(
        null,
      );

      setTextLayers(
        [],
      );

      setNewText(
        "",
      );

      setIsBold(
        false,
      );

      setIsItalic(
        false,
      );

      setRotation(
        0,
      );

      setFlipH(
        false,
      );

      setFlipV(
        false,
      );

      setStraighten(
        0,
      );

      setCropRatio(
        "free",
      );

      setActiveFx(
        "none",
      );

      setAiProcessing(
        false,
      );

      setIsExporting(
        false,
      );

      setExportProgress(
        0,
      );

      setUndoStack(
        [],
      );

      toast({
        variant:
          "info",
        title:
          "Editor Reset",
      });
    };

  const addSticker =
    (
      content: string,
      type: StickerType =
        "emoji",
    ) => {
      const item: StickerItem =
        {
          id: `sticker_${Date.now()}_${Math.random()}`,
          content,
          type,
          x: 40,
          y: 40,
          scale: 1,
          rotation: 0,
        };

      setStickers(
        (
          previous,
        ) => [
          ...previous,
          item,
        ],
      );

      setActiveStickerId(
        item.id,
      );

      toast({
        variant:
          "success",
        title:
          "Sticker Added",
      });
    };

  const addTextLayer =
    () => {
      if (
        !newText.trim()
      ) {
        return;
      }

      const item: TextLayer =
        {
          id: `text_${Date.now()}_${Math.random()}`,
          text: newText.trim(),
          font: selectedFont,
          color: textColor,
          isBold,
          isItalic,
          x: 30,
          y: 30,
          scale: 1,
        };

      setTextLayers(
        (
          previous,
        ) => [
          ...previous,
          item,
        ],
      );

      setNewText("");

      toast({
        variant:
          "success",
        title:
          "Text Layer Added",
      });
    };

  const handleAiAction =
    (
      actionName:
        | "bg_remove"
        | "auto_enhance"
        | "upscale",
    ) => {
      setAiProcessing(
        true,
      );

      setTimeout(
        () => {
          setAiProcessing(
            false,
          );

          if (
            actionName ===
            "bg_remove"
          ) {
            toast({
              variant:
                "success",
              title:
                "AI Background Removed",
              description:
                "Subject isolated cleanly.",
            });
          } else if (
            actionName ===
            "auto_enhance"
          ) {
            setAdjustments(
              (
                previous,
              ) => ({
                ...previous,
                brightness: 108,
                contrast: 115,
                saturation: 120,
                clarity: 15,
              }),
            );

            toast({
              variant:
                "success",
              title:
                "AI Auto Color Enhanced",
            });
          } else {
            toast({
              variant:
                "success",
              title:
                "AI 4K Super-Resolution Applied",
            });
          }
        },
        1200,
      );
    };

  const handleExport =
    () => {
      if (
        isExporting
      ) {
        return;
      }

      setIsExporting(
        true,
      );

      let progress = 10;

      setExportProgress(
        progress,
      );

      exportTimer.current =
        setInterval(
          () => {
            progress += 30;

            if (
              progress >=
              100
            ) {
              if (
                exportTimer.current
              ) {
                clearInterval(
                  exportTimer.current,
                );

                exportTimer.current =
                  null;
              }

              setExportProgress(
                100,
              );

              setIsExporting(
                false,
              );

              toast({
                variant:
                  "success",
                title: `Media Exported cleanly in ${exportQuality}`,
              });

              onSave?.({
                filterStyle:
                  filterPreview,
                exportQuality,
                exportFormat,
              });

              onClose();
            } else {
              setExportProgress(
                progress,
              );
            }
          },
          300,
        );
    };

  const handleAdjust =
    (
      key: keyof Adjustments,
      value: number,
    ) => {
      setAdjustments(
        (
          previous,
        ) => ({
          ...previous,
          [key]:
            value,
        }),
      );
    };

  const handleBeauty =
    (
      key: keyof BeautyState,
      value: number,
    ) => {
      setBeauty(
        (
          previous,
        ) => ({
          ...previous,
          [key]:
            value,
        }),
      );
    };

  const applyRotation =
    () => {
      setRotation(
        (
          previous,
        ) =>
          (previous +
            90) %
          360,
      );
    };

  const removeSticker =
    (
      stickerId: string,
    ) => {
      setStickers(
        (
          previous,
        ) =>
          previous.filter(
            (
              sticker,
            ) =>
              sticker.id !==
              stickerId,
          ),
      );

      if (
        activeStickerId ===
        stickerId
      ) {
        setActiveStickerId(
          null,
        );
      }
    };

  /*
   * The web source renders stickers/text over the preview and marks
   * them movable. Native PanResponder gives us the same direct
   * touch interaction.
   */
  const stickerPanHandlers =
    (
      sticker: StickerItem,
    ) =>
      PanResponder.create({
        onStartShouldSetPanResponder:
          () => true,

        onPanResponderGrant:
          () => {
            setActiveStickerId(
              sticker.id,
            );
          },

        onPanResponderMove:
          (
            _event,
            gesture,
          ) => {
            if (
              workspaceSize.width <=
                0 ||
              workspaceSize.height <=
                0
            ) {
              return;
            }

            const nextX =
              Math.max(
                5,
                Math.min(
                  95,
                  sticker.x +
                    (gesture.dx /
                      workspaceSize.width) *
                      100,
                ),
              );

            const nextY =
              Math.max(
                5,
                Math.min(
                  95,
                  sticker.y +
                    (gesture.dy /
                      workspaceSize.height) *
                      100,
                ),
              );

            setStickers(
              (
                previous,
              ) =>
                previous.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    sticker.id
                      ? {
                          ...item,
                          x:
                            nextX,
                          y:
                            nextY,
                        }
                      : item,
                ),
            );
          },
      });

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={
        onClose
      }
    >
      <KeyboardAvoidingView
        style={
          styles.modalRoot
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        />

        <View
          style={
            styles.editorShell
          }
        >
          {/* Header */}
          <View
            style={
              styles.header
            }
          >
            <View
              style={
                styles.headerTitleRow
              }
            >
              <Wand2
                size={19}
                color="#a855f7"
              />

              <Text
                style={
                  styles.headerTitle
                }
                numberOfLines={
                  1
                }
              >
                InstaSnap Studio & Media Editor
              </Text>
            </View>

            <View
              style={
                styles.headerActions
              }
            >
              <Pressable
                onPress={
                  resetEditor
                }
                style={
                  styles.headerIconButton
                }
                accessibilityRole="button"
                accessibilityLabel="Reset editor"
              >
                <RotateCcw
                  size={19}
                  color="#94a3b8"
                />
              </Pressable>

              <Pressable
                onPress={
                  onClose
                }
                style={
                  styles.headerIconButton
                }
                accessibilityRole="button"
                accessibilityLabel="Close editor"
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </Pressable>
            </View>
          </View>

          <View
            style={
              styles.workspace
            }
          >
            {/* Preview */}
            <View
              style={
                styles.previewPanel
              }
            >
              <View
                style={
                  styles.previewViewport
                }
                onLayout={(
                  event,
                ) => {
                  setWorkspaceSize({
                    width:
                      event.nativeEvent.layout.width,
                    height:
                      event.nativeEvent.layout.height,
                  });
                }}
              >
                <View
                  style={[
                    styles.mediaTransformContainer,
                    {
                      transform: [
                        {
                          rotate: `${rotation + straighten}deg`,
                        },
                        {
                          scaleX:
                            flipH
                              ? -1
                              : 1,
                        },
                        {
                          scaleY:
                            flipV
                              ? -1
                              : 1,
                        },
                      ],
                    },
                  ]}
                >
                  {mediaType ===
                  "video" ? (
                    <Video
                      source={{
                        uri:
                          mediaSrc,
                      }}
                      style={
                        styles.media
                      }
                      resizeMode={
                        ResizeMode.CONTAIN
                      }
                      useNativeControls
                      shouldPlay
                      isLooping
                    />
                  ) : (
                    <Image
                      source={{
                        uri:
                          mediaSrc,
                      }}
                      style={
                        styles.media
                      }
                      resizeMode="contain"
                    />
                  )}

                  {/* Native approximation of the editor's blur FX */}
                  {activeFx ===
                  "blur" ? (
                    <View
                      pointerEvents="none"
                      style={
                        styles.blurOverlay
                      }
                    />
                  ) : null}

                  {activeFx ===
                  "glitch" ? (
                    <View
                      pointerEvents="none"
                      style={
                        styles.glitchOverlay
                      }
                    />
                  ) : null}

                  {activeFx ===
                  "neon" ? (
                    <View
                      pointerEvents="none"
                      style={
                        styles.neonOverlay
                      }
                    />
                  ) : null}

                  {/* Stickers */}
                  {stickers.map(
                    (
                      sticker,
                    ) => (
                      <MovableSticker
                        key={
                          sticker.id
                        }
                        sticker={
                          sticker
                        }
                        onPress={() =>
                          setActiveStickerId(
                            sticker.id,
                          )
                        }
                        onMove={(
                          dx,
                          dy,
                        ) => {
                          if (
                            workspaceSize.width <=
                              0 ||
                            workspaceSize.height <=
                              0
                          ) {
                            return;
                          }

                          setStickers(
                            (
                              previous,
                            ) =>
                              previous.map(
                                (
                                  item,
                                ) =>
                                  item.id ===
                                  sticker.id
                                    ? {
                                        ...item,
                                        x:
                                          Math.max(
                                            5,
                                            Math.min(
                                              95,
                                              item.x +
                                                (dx /
                                                  workspaceSize.width) *
                                                  100,
                                            ),
                                          ),
                                        y:
                                          Math.max(
                                            5,
                                            Math.min(
                                              95,
                                              item.y +
                                                (dy /
                                                  workspaceSize.height) *
                                                  100,
                                            ),
                                          ),
                                      }
                                    : item,
                              ),
                          );
                        }}
                      />
                    ),
                  )}

                  {/* Text layers */}
                  {textLayers.map(
                    (
                      text,
                    ) => (
                      <View
                        key={
                          text.id
                        }
                        style={[
                          styles.textLayer,
                          {
                            left:
                              `${text.x}%`,
                            top:
                              `${text.y}%`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.textLayerText,
                            {
                              color:
                                text.color,
                              fontWeight:
                                text.isBold
                                  ? "700"
                                  : "400",
                              fontStyle:
                                text.isItalic
                                  ? "italic"
                                  : "normal",
                            },
                          ]}
                        >
                          {
                            text.text
                          }
                        </Text>
                      </View>
                    ),
                  )}

                  {isDrawing ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.drawIndicator,
                        {
                          borderColor:
                            drawColor,
                          width:
                            Math.max(
                              20,
                              brushSize *
                                3,
                            ),
                          height:
                            Math.max(
                              20,
                              brushSize *
                                3,
                            ),
                          opacity:
                            drawOpacity /
                            100,
                        },
                      ]}
                    />
                  ) : null}
                </View>
              </View>

              <View
                style={
                  styles.previewInfo
                }
              >
                <Text
                  style={
                    styles.previewInfoTitle
                  }
                >
                  {selectedFilter}
                </Text>

                <Text
                  style={
                    styles.previewInfoText
                  }
                  numberOfLines={
                    2
                  }
                >
                  {filterPreview}
                </Text>
              </View>
            </View>

            {/* Inspector */}
            <View
              style={
                styles.inspector
              }
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                style={
                  styles.tabs
                }
                contentContainerStyle={
                  styles.tabsContent
                }
              >
                {TABS.map(
                  (
                    tab,
                  ) => {
                    const Icon =
                      tab.icon;

                    const active =
                      activeTab ===
                      tab.id;

                    return (
                      <Pressable
                        key={
                          tab.id
                        }
                        onPress={() =>
                          setActiveTab(
                            tab.id,
                          )
                        }
                        style={[
                          styles.tab,
                          active &&
                            styles.activeTab,
                        ]}
                        accessibilityRole="tab"
                        accessibilityState={{
                          selected:
                            active,
                        }}
                      >
                        <Icon
                          size={14}
                          color={
                            active
                              ? "#ffffff"
                              : "#94a3b8"
                          }
                        />

                        <Text
                          style={[
                            styles.tabLabel,
                            active &&
                              styles.activeTabLabel,
                          ]}
                        >
                          {
                            tab.label
                          }
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </ScrollView>

              <ScrollView
                style={
                  styles.inspectorBody
                }
                contentContainerStyle={
                  styles.inspectorContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              >
                {/* Filters */}
                {activeTab ===
                "filters" ? (
                  <View
                    style={
                      styles.filterGrid
                    }
                  >
                    {(
                      EXTENDED_FILTER_PRESETS as Array<{
                        id: string;
                        name: string;
                        category: string;
                      }>
                    ).map(
                      (
                        filter,
                      ) => {
                        const active =
                          selectedFilter ===
                          filter.id;

                        return (
                          <Pressable
                            key={
                              filter.id
                            }
                            onPress={() =>
                              setSelectedFilter(
                                filter.id,
                              )
                            }
                            style={[
                              styles.filterCard,
                              active &&
                                styles.activeFilterCard,
                            ]}
                          >
                            <Text
                              style={
                                styles.filterName
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {
                                filter.name
                              }
                            </Text>

                            <Text
                              style={
                                styles.filterCategory
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {
                                filter.category
                              }
                            </Text>
                          </Pressable>
                        );
                      },
                    )}
                  </View>
                ) : null}

                {/* Adjust */}
                {activeTab ===
                "adjust" ? (
                  <View
                    style={
                      styles.section
                    }
                  >
                    {ADJUSTMENT_SLIDERS.map(
                      (
                        slider,
                      ) => (
                        <NumberSlider
                          key={
                            slider.key
                          }
                          label={
                            slider.label
                          }
                          value={
                            adjustments[
                              slider.key
                            ] as number
                          }
                          min={
                            slider.min
                          }
                          max={
                            slider.max
                          }
                          onChange={(
                            value,
                          ) =>
                            handleAdjust(
                              slider.key,
                              value,
                            )
                          }
                        />
                      ),
                    )}
                  </View>
                ) : null}

                {/* Beauty */}
                {activeTab ===
                "beauty" ? (
                  <View
                    style={
                      styles.section
                    }
                  >
                    <View
                      style={
                        styles.inlineSetting
                      }
                    >
                      <Text
                        style={
                          styles.inlineSettingText
                        }
                      >
                        Natural Mode Boost
                      </Text>

                      <Pressable
                        onPress={() =>
                          setBeauty(
                            (
                              previous,
                            ) => ({
                              ...previous,
                              naturalMode:
                                !previous.naturalMode,
                            }),
                          )
                        }
                        style={[
                          styles.toggle,
                          beauty.naturalMode &&
                            styles.toggleActive,
                        ]}
                        accessibilityRole="switch"
                        accessibilityState={{
                          checked:
                            beauty.naturalMode,
                        }}
                      >
                        <View
                          style={[
                            styles.toggleThumb,
                            beauty.naturalMode &&
                              styles.toggleThumbActive,
                          ]}
                        />
                      </Pressable>
                    </View>

                    {BEAUTY_SLIDERS.map(
                      (
                        slider,
                      ) => (
                        <NumberSlider
                          key={
                            slider.key
                          }
                          label={
                            slider.label
                          }
                          value={
                            beauty[
                              slider.key
                            ] as number
                          }
                          min={0}
                          max={100}
                          suffix="%"
                          onChange={(
                            value,
                          ) =>
                            handleBeauty(
                              slider.key,
                              value,
                            )
                          }
                        />
                      ),
                    )}
                  </View>
                ) : null}

                {/* Stickers */}
                {activeTab ===
                "stickers" ? (
                  <View
                    style={
                      styles.section
                    }
                  >
                    <Text
                      style={
                        styles.sectionLabel
                      }
                    >
                      Tap to Add Emoji Sticker
                    </Text>

                    <View
                      style={
                        styles.emojiGrid
                      }
                    >
                      {EMOJI_STICKERS.map(
                        (
                          emoji,
                        ) => (
                          <Pressable
                            key={
                              emoji
                            }
                            onPress={() =>
                              addSticker(
                                emoji,
                              )
                            }
                            style={
                              styles.emojiButton
                            }
                          >
                            <Text
                              style={
                                styles.emoji
                              }
                            >
                              {
                                emoji
                              }
                            </Text>
                          </Pressable>
                        ),
                      )}
                    </View>

                    <Text
                      style={
                        styles.sectionLabel
                      }
                    >
                      Badges & Tags
                    </Text>

                    <Pressable
                      onPress={() =>
                        addSticker(
                          "📍 San Francisco",
                          "location",
                        )
                      }
                      style={
                        styles.gradientChip
                      }
                    >
                      <Text
                        style={
                          styles.gradientChipText
                        }
                      >
                        + Location Tag
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        addSticker(
                          "☀️ 24°C Sunny",
                          "weather",
                        )
                      }
                      style={
                        styles.secondaryChip
                      }
                    >
                      <Text
                        style={
                          styles.secondaryChipText
                        }
                      >
                        + Weather Sticker
                      </Text>
                    </Pressable>

                    {stickers.length >
                    0 ? (
                      <View
                        style={
                          styles.layerList
                        }
                      >
                        <Text
                          style={
                            styles.sectionLabel
                          }
                        >
                          Added Stickers
                        </Text>

                        {stickers.map(
                          (
                            sticker,
                          ) => (
                            <View
                              key={
                                sticker.id
                              }
                              style={[
                                styles.layerRow,
                                activeStickerId ===
                                  sticker.id &&
                                  styles.activeLayerRow,
                              ]}
                            >
                              <Text
                                style={
                                  styles.layerEmoji
                                }
                              >
                                {
                                  sticker.content
                                }
                              </Text>

                              <Pressable
                                onPress={() =>
                                  removeSticker(
                                    sticker.id,
                                  )
                                }
                                style={
                                  styles.smallDelete
                                }
                              >
                                <X
                                  size={
                                    14
                                  }
                                  color="#ef4444"
                                />
                              </Pressable>
                            </View>
                          ),
                        )}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Text */}
                {activeTab ===
                "text" ? (
                  <View
                    style={
                      styles.section
                    }
                  >
                    <TextInput
                      value={
                        newText
                      }
                      onChangeText={
                        setNewText
                      }
                      placeholder="Type text overlay..."
                      placeholderTextColor="#64748b"
                      style={
                        styles.textInput
                      }
                    />

                    <View
                      style={
                        styles.twoColumn
                      }
                    >
                      <Pressable
                        onPress={() =>
                          setIsBold(
                            (
                              value,
                            ) =>
                              !value,
                          )
                        }
                        style={[
                          styles.styleButton,
                          isBold &&
                            styles.activeStyleButton,
                        ]}
                      >
                        <Text
                          style={[
                            styles.styleButtonText,
                            isBold &&
                              styles.activeStyleButtonText,
                          ]}
                        >
                          Bold
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          setIsItalic(
                            (
                              value,
                            ) =>
                              !value,
                          )
                        }
                        style={[
                          styles.styleButton,
                          isItalic &&
                            styles.activeStyleButton,
                        ]}
                      >
                        <Text
                          style={[
                            styles.italicStyleButtonText,
                            isItalic &&
                              styles.activeStyleButtonText,
                          ]}
                        >
                          Italic
                        </Text>
                      </Pressable>
                    </View>

                    <Button
                      onPress={
                        addTextLayer
                      }
                      variant="gradient"
                    >
                      Add Text Layer
                    </Button>

                    {textLayers.length >
                    0 ? (
                      <View
                        style={
                          styles.layerList
                        }
                      >
                        {textLayers.map(
                          (
                            layer,
                          ) => (
                            <View
                              key={
                                layer.id
                              }
                              style={
                                styles.textLayerListRow
                              }
                            >
                              <Text
                                style={[
                                  styles.textLayerListText,
                                  {
                                    color:
                                      layer.color,
                                    fontWeight:
                                      layer.isBold
                                        ? "700"
                                        : "400",
                                    fontStyle:
                                      layer.isItalic
                                        ? "italic"
                                        : "normal",
                                  },
                                ]}
                                numberOfLines={
                                  1
                                }
                              >
                                {
                                  layer.text
                                }
                              </Text>
                            </View>
                          ),
                        )}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Crop */}
                {activeTab ===
                "crop" ? (
                  <View
                    style={
                      styles.section
                    }
                  >
                    <View
                      style={
                        styles.twoColumn
                      }
                    >
                      <Pressable
                        onPress={
                          applyRotation
                        }
                        style={
                          styles.transformButton
                        }
                      >
                        <RotateCw
                          size={16}
                          color="#f8fafc"
                        />

                        <Text
                          style={
                            styles.transformText
                          }
                        >
                          Rotate 90°
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          setFlipH(
                            (
                              value,
                            ) =>
                              !value,
                          )
                        }
                        style={
                          styles.transformButton
                        }
                      >
                        <FlipHorizontal
                          size={16}
                          color={
                            flipH
                              ? "#a855f7"
                              : "#f8fafc"
                          }
                        />

                        <Text
                          style={
                            styles.transformText
                          }
                        >
                          Flip H
                        </Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() =>
                        setFlipV(
                          (
                            value,
                          ) =>
                            !value,
                        )
                      }
                      style={
                        styles.transformButton
                      }
                    >
                      <FlipVertical
                        size={16}
                        color={
                          flipV
                            ? "#a855f7"
                            : "#f8fafc"
                        }
                      />

                      <Text
                        style={
                          styles.transformText
                        }
                      >
                        Flip V
                      </Text>
                    </Pressable>

                    <NumberSlider
                      label="Straighten Tilt"
                      value={
                        straighten
                      }
                      min={
                        -45
                      }
                      max={
                        45
                      }
                      suffix="°"
                      onChange={
                        setStraighten
                      }
                    />

                    <View
                      style={
                        styles.cropInfo
                      }
                    >
                      <Text
                        style={
                          styles.cropInfoTitle
                        }
                      >
                        Crop Ratio
                      </Text>

                      <View
                        style={
                          styles.cropRatioRow
                        }
                      >
                        {[
                          "free",
                          "1:1",
                          "4:5",
                          "16:9",
                        ].map(
                          (
                            ratio,
                          ) => (
                            <Pressable
                              key={
                                ratio
                              }
                              onPress={() =>
                                setCropRatio(
                                  ratio,
                                )
                              }
                              style={[
                                styles.ratioChip,
                                cropRatio ===
                                  ratio &&
                                  styles.ratioChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.ratioText,
                                  cropRatio ===
                                    ratio &&
                                    styles.ratioTextActive,
                                ]}
                              >
                                {
                                  ratio
                                }
                              </Text>
                            </Pressable>
                          ),
                        )}
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* FX */}
                {activeTab ===
                "fx" ? (
                  <View
                    style={
                      styles.filterGrid
                    }
                  >
                    {[
                      {
                        id: "none",
                        label:
                          "None",
                      },
                      {
                        id: "glitch",
                        label:
                          "Cyber Glitch",
                      },
                      {
                        id: "neon",
                        label:
                          "Neon Border",
                      },
                      {
                        id: "blur",
                        label:
                          "Bokeh Blur",
                      },
                    ].map(
                      (
                        effect,
                      ) => (
                        <Pressable
                          key={
                            effect.id
                          }
                          onPress={() =>
                            setActiveFx(
                              effect.id,
                            )
                          }
                          style={[
                            styles.filterCard,
                            activeFx ===
                              effect.id &&
                              styles.activeFilterCard,
                          ]}
                        >
                          <Text
                            style={
                              styles.filterName
                            }
                          >
                            {
                              effect.label
                            }
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>
                ) : null}

                {/* AI */}
                {activeTab ===
                "ai" ? (
                  <View
                    style={
                      styles.section
                    }
                  >
                    <AiButton
                      title="AI Background Remover"
                      icon={
                        <Bot
                          size={17}
                          color="#ffffff"
                        />
                      }
                      primary
                      disabled={
                        aiProcessing
                      }
                      onPress={() =>
                        handleAiAction(
                          "bg_remove",
                        )
                      }
                    />

                    <AiButton
                      title="AI One-Tap Color Enhance"
                      icon={
                        <Sparkles
                          size={17}
                          color="#facc15"
                        />
                      }
                      disabled={
                        aiProcessing
                      }
                      onPress={() =>
                        handleAiAction(
                          "auto_enhance",
                        )
                      }
                    />

                    <AiButton
                      title="AI 4K Super Resolution"
                      icon={
                        <Zap
                          size={17}
                          color="#60a5fa"
                        />
                      }
                      disabled={
                        aiProcessing
                      }
                      onPress={() =>
                        handleAiAction(
                          "upscale",
                        )
                      }
                    />

                    {aiProcessing ? (
                      <View
                        style={
                          styles.processing
                        }
                      >
                        <ActivityIndicator
                          size="small"
                          color="#a855f7"
                        />

                        <Text
                          style={
                            styles.processingText
                          }
                        >
                          AI is processing...
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Export */}
                {activeTab ===
                "export" ? (
                  <View
                    style={
                      styles.section
                    }
                  >
                    <Text
                      style={
                        styles.sectionLabel
                      }
                    >
                      Resolution Output
                    </Text>

                    <View
                      style={
                        styles.twoColumn
                      }
                    >
                      {(
                        [
                          "720p",
                          "1080p",
                          "2K",
                          "4K",
                        ] as ExportQuality[]
                      ).map(
                        (
                          quality,
                        ) => (
                          <Pressable
                            key={
                              quality
                            }
                            onPress={() =>
                              setExportQuality(
                                quality,
                              )
                            }
                            style={[
                              styles.resolutionButton,
                              exportQuality ===
                                quality &&
                                styles.activeResolutionButton,
                            ]}
                          >
                            <Text
                              style={[
                                styles.resolutionText,
                                exportQuality ===
                                  quality &&
                                  styles.activeResolutionText,
                              ]}
                            >
                              {quality}
                              {quality ===
                              "1080p"
                                ? " (Full HD)"
                                : ""}
                            </Text>
                          </Pressable>
                        ),
                      )}
                    </View>

                    {isExporting ? (
                      <View
                        style={
                          styles.exportProgressBox
                        }
                      >
                        <View
                          style={
                            styles.exportProgressHeader
                          }
                        >
                          <Text
                            style={
                              styles.exportProgressText
                            }
                          >
                            Rendering & Exporting...
                          </Text>

                          <Text
                            style={
                              styles.exportProgressText
                            }
                          >
                            {
                              exportProgress
                            }
                            %
                          </Text>
                        </View>

                        <View
                          style={
                            styles.progressTrack
                          }
                        >
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${exportProgress}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    ) : (
                      <Button
                        onPress={
                          handleExport
                        }
                        variant="gradient"
                      >
                        Export Final Media
                      </Button>
                    )}
                  </View>
                ) : null}

                {/* Hidden native equivalent of unused drawing state */}
                {activeTab ===
                "filters" ? (
                  <View
                    style={
                      styles.nativeCompatibilityBox
                    }
                  >
                    <Text
                      style={
                        styles.nativeCompatibilityText
                      }
                    >
                      Native editor preserves all
                      existing editor state and
                      export settings.
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const NumberSlider = ({
  label,
  value,
  min,
  max,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (
    value: number,
  ) => void;
}) => {
  const [
    width,
    setWidth,
  ] = useState(1);

  const [
    dragging,
    setDragging,
  ] = useState(
    false,
  );

  const panResponder =
    useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder:
            () => true,

          onPanResponderGrant:
            () => {
              setDragging(
                true,
              );
            },

          onPanResponderMove:
            (
              event,
            ) => {
              const x =
                event
                  .nativeEvent
                  .locationX;

              const ratio =
                Math.max(
                  0,
                  Math.min(
                    1,
                    x /
                      Math.max(
                        1,
                        width,
                      ),
                  ),
                );

              const nextValue =
                min +
                ratio *
                  (max -
                    min);

              onChange(
                Math.round(
                  nextValue,
                ),
              );
            },

          onPanResponderRelease:
            () => {
              setDragging(
                false,
              );
            },

          onPanResponderTerminate:
            () => {
              setDragging(
                false,
              );
            },
        }),
      [
        max,
        min,
        onChange,
        width,
      ],
    );

  const percentage =
    ((value -
      min) /
      (max -
        min)) *
    100;

  return (
    <View
      style={
        styles.sliderBlock
      }
    >
      <View
        style={
          styles.sliderHeader
        }
      >
        <Text
          style={
            styles.sliderLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.sliderValue
          }
        >
          {value}
          {suffix}
        </Text>
      </View>

      <View
        onLayout={(event) =>
          setWidth(
            event.nativeEvent.layout.width,
          )
        }
        style={
          styles.sliderTrack
        }
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.sliderFill,
            {
              width: `${percentage}%`,
            },
          ]}
        />

        <View
          style={[
            styles.sliderThumb,
            {
              left: `${percentage}%`,
            },
            dragging &&
              styles.sliderThumbDragging,
          ]}
        />
      </View>
    </View>
  );
};

const MovableSticker = ({
  sticker,
  onPress,
  onMove,
}: {
  sticker: StickerItem;
  onPress: () => void;
  onMove: (
    dx: number,
    dy: number,
  ) => void;
}) => {
  const panResponder =
    useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder:
            () => true,

          onPanResponderGrant:
            () => {
              onPress();
            },

          onPanResponderMove:
            (
              _event,
              gesture,
            ) => {
              onMove(
                gesture.dx,
                gesture.dy,
              );
            },

          onPanResponderRelease:
            () => {
              onPress();
            },
        }),
      [
        onMove,
        onPress,
      ],
    );

  return (
    <View
      style={[
        styles.stickerLayer,
        {
          left:
            `${sticker.x}%`,
          top:
            `${sticker.y}%`,
          transform: [
            {
              translateX: -20,
            },
            {
              translateY: -20,
            },
            {
              scale:
                sticker.scale,
            },
            {
              rotate:
                `${sticker.rotation}deg`,
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Text
        style={
          styles.stickerText
        }
      >
        {
          sticker.content
        }
      </Text>
    </View>
  );
};

const AiButton = ({
  title,
  icon,
  primary = false,
  disabled,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  primary?: boolean;
  disabled: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={
      onPress
    }
    disabled={
      disabled
    }
    style={[
      styles.aiButton,
      primary &&
        styles.aiButtonPrimary,
      disabled &&
        styles.disabledButton,
    ]}
  >
    <Text
      style={
        primary
          ? styles.aiPrimaryText
          : styles.aiText
      }
    >
      {title}
    </Text>

    {icon}
  </Pressable>
);



const styles =
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.86)",
      padding: 8,
    },

    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.82)",
    },

    editorShell: {
      flex: 1,
      width: "100%",
      maxWidth: 1100,
      alignSelf:
        "center",

      overflow:
        "hidden",

      borderRadius: 24,

      backgroundColor:
        "#130a1c",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    header: {
      minHeight: 60,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 14,

      backgroundColor:
        "rgba(19,10,28,0.96)",

      borderBottomWidth: 1,
      borderBottomColor:
        "#2d1b3b",
    },

    headerTitleRow: {
      flex: 1,
      minWidth: 0,

      flexDirection:
        "row",
      alignItems:
        "center",

      gap: 8,
    },

    headerTitle: {
      flexShrink: 1,
      color:
        "#f8fafc",

      fontSize: 15,
      fontWeight:
        "900",
    },

    headerActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      marginLeft: 10,
    },

    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,

      alignItems:
        "center",
      justifyContent:
        "center",
    },

    workspace: {
      flex: 1,
      flexDirection:
        "column",
      minHeight: 0,
    },

    previewPanel: {
      flex: 1.2,
      minHeight: 250,
      backgroundColor:
        "#000000",
      position:
        "relative",
    },

    previewViewport: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      overflow:
        "hidden",
      padding: 14,
    },

    mediaTransformContainer: {
      position:
        "relative",

      width: "100%",
      height: "100%",

      alignItems:
        "center",
      justifyContent:
        "center",
    },

    media: {
      width: "100%",
      height: "100%",
      maxWidth: "100%",
      maxHeight: "100%",
    },

    blurOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(255,255,255,0.10)",
      opacity: 0.5,
    },

    glitchOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(34,211,238,0.14)",
      borderWidth: 2,
      borderColor:
        "rgba(34,211,238,0.45)",
    },

    neonOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderWidth: 4,
      borderColor:
        "#ec4899",
      borderRadius: 18,
    },

    stickerLayer: {
      position:
        "absolute",
      zIndex: 15,
    },

    stickerText: {
      fontSize: 42,
      color:
        "#ffffff",
      textShadowColor:
        "rgba(0,0,0,0.60)",
      textShadowOffset: {
        width: 0,
        height: 3,
      },
      textShadowRadius: 6,
    },

    textLayer: {
      position:
        "absolute",
      zIndex: 16,

      maxWidth:
        "80%",

      transform: [
        {
          translateX:
            -50,
        },
        {
          translateY:
            -20,
        },
      ],
    },

    textLayerText: {
      fontSize: 22,
      lineHeight: 28,

      textShadowColor:
        "rgba(0,0,0,0.80)",
      textShadowOffset: {
        width: 0,
        height: 3,
      },
      textShadowRadius: 8,
    },

    drawIndicator: {
      position:
        "absolute",
      left: "50%",
      top: "50%",

      marginLeft:
        -10,
      marginTop:
        -10,

      borderWidth: 2,
      borderRadius:
        999,

      zIndex: 20,
    },

    previewInfo: {
      position:
        "absolute",
      left: 14,
      right: 14,
      bottom: 12,

      padding: 10,

      borderRadius: 13,

      backgroundColor:
        "rgba(0,0,0,0.50)",
    },

    previewInfoTitle: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
      textTransform:
        "uppercase",
    },

    previewInfoText: {
      marginTop: 3,
      color:
        "rgba(255,255,255,0.58)",
      fontSize: 8,
      lineHeight: 12,
    },

    inspector: {
      flex: 1,
      minHeight: 320,

      backgroundColor:
        "#130a1c",

      borderTopWidth: 1,
      borderTopColor:
        "#2d1b3b",
    },

    tabs: {
      flexGrow: 0,
      flexShrink: 0,
      maxHeight: 58,
      borderBottomWidth: 1,
      borderBottomColor:
        "#2d1b3b",
    },

    tabsContent: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      gap: 5,
    },

    tab: {
      minHeight: 38,

      flexDirection:
        "row",
      alignItems:
        "center",

      gap: 5,

      paddingHorizontal: 10,

      borderRadius: 12,

      backgroundColor:
        "transparent",
    },

    activeTab: {
      backgroundColor:
        "#a855f7",
    },

    tabLabel: {
      color:
        "#94a3b8",
      fontSize: 10,
      fontWeight:
        "800",
    },

    activeTabLabel: {
      color:
        "#ffffff",
    },

    inspectorBody: {
      flex: 1,
    },

    inspectorContent: {
      padding: 14,
      paddingBottom: 28,
    },

    section: {
      gap: 14,
    },

    filterGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
    },

    filterCard: {
      width:
        "48%",
      minHeight: 68,

      justifyContent:
        "center",

      padding: 12,

      borderRadius: 15,

      backgroundColor:
        "rgba(255,255,255,0.04)",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    activeFilterCard: {
      backgroundColor:
        "rgba(168,85,247,0.10)",
      borderColor:
        "#a855f7",
    },

    filterName: {
      color:
        "#f8fafc",
      fontSize: 11,
      fontWeight:
        "900",
    },

    filterCategory: {
      marginTop: 4,
      color:
        "#94a3b8",
      fontSize: 9,
    },

    sliderBlock: {
      gap: 7,
    },

    sliderHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    sliderLabel: {
      color:
        "#94a3b8",
      fontSize: 11,
    },

    sliderValue: {
      color:
        "#f8fafc",
      fontSize: 10,
      fontWeight:
        "800",
    },

    sliderTrack: {
      height: 20,
      justifyContent:
        "center",
      position:
        "relative",
    },

    sliderFill: {
      position:
        "absolute",
      left: 0,
      height: 4,
      borderRadius: 2,
      backgroundColor:
        "#a855f7",
    },

    sliderThumb: {
      position:
        "absolute",
      marginLeft:
        -7,

      width: 14,
      height: 14,

      borderRadius: 7,

      backgroundColor:
        "#ffffff",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.20,
      shadowRadius: 3,
      elevation: 3,
    },

    sliderThumbDragging: {
      width: 18,
      height: 18,
      marginLeft:
        -9,
    },

    inlineSetting: {
      minHeight: 52,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 12,

      borderRadius: 14,

      backgroundColor:
        "rgba(255,255,255,0.04)",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    inlineSettingText: {
      flex: 1,
      color:
        "#f8fafc",
      fontSize: 11,
      fontWeight:
        "700",
    },

    toggle: {
      width: 44,
      height: 24,
      borderRadius: 12,
      padding: 2,
      justifyContent:
        "center",
      backgroundColor:
        "#475569",
    },

    toggleActive: {
      backgroundColor:
        "#a855f7",
    },

    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        "#ffffff",
    },

    toggleThumbActive: {
      alignSelf:
        "flex-end",
    },

    emojiGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,

      padding: 10,

      borderRadius: 16,

      backgroundColor:
        "rgba(255,255,255,0.04)",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    emojiButton: {
      width: 44,
      height: 44,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    emoji: {
      fontSize: 27,
    },

    sectionLabel: {
      marginTop: 2,
      color:
        "#94a3b8",
      fontSize: 9,
      fontWeight:
        "900",
      textTransform:
        "uppercase",
      letterSpacing: 1,
    },

    gradientChip: {
      minHeight: 40,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 20,

      backgroundColor:
        "#a855f7",
    },

    gradientChipText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
    },

    secondaryChip: {
      minHeight: 40,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 20,

      backgroundColor:
        "rgba(255,255,255,0.06)",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    secondaryChipText: {
      color:
        "#f8fafc",
      fontSize: 11,
      fontWeight:
        "800",
    },

    layerList: {
      gap: 7,
      marginTop: 4,
    },

    layerRow: {
      minHeight: 42,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 11,

      borderRadius: 11,

      backgroundColor:
        "rgba(255,255,255,0.04)",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    activeLayerRow: {
      borderColor:
        "#a855f7",
      backgroundColor:
        "rgba(168,85,247,0.08)",
    },

    layerEmoji: {
      color:
        "#ffffff",
      fontSize: 20,
    },

    smallDelete: {
      width: 30,
      height: 30,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    textInput: {
      minHeight: 48,

      paddingHorizontal: 13,

      borderRadius: 12,

      borderWidth: 1,
      borderColor:
        "#2d1b3b",

      backgroundColor:
        "rgba(255,255,255,0.04)",

      color:
        "#f8fafc",

      fontSize: 13,
    },

    twoColumn: {
      flexDirection:
        "row",
      gap: 8,
    },

    styleButton: {
      flex: 1,
      minHeight: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 12,
      backgroundColor:
        "rgba(255,255,255,0.05)",
    },

    activeStyleButton: {
      backgroundColor:
        "#a855f7",
    },

    styleButtonText: {
      color:
        "#94a3b8",
      fontSize: 11,
      fontWeight:
        "900",
    },

    activeStyleButtonText: {
      color:
        "#ffffff",
    },

    italicStyleButtonText: {
      color:
        "#94a3b8",
      fontSize: 11,
      fontStyle:
        "italic",
      fontWeight:
        "700",
    },

    textLayerListRow: {
      minHeight: 42,
      justifyContent:
        "center",
      paddingHorizontal: 12,
      borderRadius: 11,
      backgroundColor:
        "rgba(255,255,255,0.04)",
    },

    textLayerListText: {
      fontSize: 12,
    },

    transformButton: {
      flex: 1,

      minHeight: 44,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      gap: 6,

      borderRadius: 12,

      backgroundColor:
        "rgba(255,255,255,0.05)",
    },

    transformText: {
      color:
        "#f8fafc",
      fontSize: 11,
      fontWeight:
        "800",
    },

    cropInfo: {
      padding: 12,
      borderRadius: 14,
      backgroundColor:
        "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    cropInfoTitle: {
      color:
        "#f8fafc",
      fontSize: 11,
      fontWeight:
        "800",
    },

    cropRatioRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 7,
      marginTop: 8,
    },

    ratioChip: {
      minWidth: 54,
      paddingHorizontal: 10,
      paddingVertical: 8,
      alignItems:
        "center",
      borderRadius: 10,
      backgroundColor:
        "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    ratioChipActive: {
      backgroundColor:
        "rgba(168,85,247,0.10)",
      borderColor:
        "#a855f7",
    },

    ratioText: {
      color:
        "#94a3b8",
      fontSize: 10,
      fontWeight:
        "800",
    },

    ratioTextActive: {
      color:
        "#f8fafc",
    },

    aiButton: {
      minHeight: 48,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 14,

      borderRadius: 15,

      backgroundColor:
        "rgba(255,255,255,0.05)",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    aiButtonPrimary: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    aiText: {
      flex: 1,
      color:
        "#f8fafc",
      fontSize: 11,
      fontWeight:
        "800",
    },

    aiPrimaryText: {
      flex: 1,
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "900",
    },

    disabledButton: {
      opacity: 0.45,
    },

    processing: {
      minHeight: 44,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      gap: 8,

      borderRadius: 12,

      backgroundColor:
        "rgba(168,85,247,0.08)",
    },

    processingText: {
      color:
        "#c4b5fd",
      fontSize: 11,
      fontWeight:
        "700",
    },

    resolutionButton: {
      flex: 1,
      minHeight: 44,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 12,

      borderWidth: 1,
      borderColor:
        "#2d1b3b",

      backgroundColor:
        "rgba(255,255,255,0.04)",
    },

    activeResolutionButton: {
      borderColor:
        "#a855f7",
      backgroundColor:
        "rgba(168,85,247,0.10)",
    },

    resolutionText: {
      color:
        "#94a3b8",
      fontSize: 10,
      fontWeight:
        "800",
    },

    activeResolutionText: {
      color:
        "#f8fafc",
    },

    exportProgressBox: {
      marginTop: 4,
      gap: 8,
    },

    exportProgressHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    exportProgressText: {
      color:
        "#f8fafc",
      fontSize: 10,
      fontWeight:
        "800",
    },

    progressTrack: {
      height: 8,
      overflow:
        "hidden",
      borderRadius: 4,
      backgroundColor:
        "#2d1b3b",
    },

    progressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor:
        "#a855f7",
    },

    nativeCompatibilityBox: {
      marginTop: 18,
      padding: 10,
      borderRadius: 12,
      backgroundColor:
        "rgba(168,85,247,0.06)",
      borderWidth: 1,
      borderColor:
        "rgba(168,85,247,0.15)",
    },

    nativeCompatibilityText: {
      color:
        "#64748b",
      fontSize: 9,
      lineHeight: 14,
      textAlign:
        "center",
    },
  });

export default MediaEditorStudio;