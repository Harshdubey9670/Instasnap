import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  router,
} from "expo-router";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AtSign,
  Check,
  ChevronRight,
  Clock,
  Eraser,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Music2,
  Pencil,
  RotateCw,
  Smile,
  Sparkles,
  Type,
  UploadCloud,
  Vote,
  Wand2,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useSelector } from "react-redux";

import api from "../../src/services/api";
import {
  useToast,
} from "../../src/components/ui/Toast";
import {
  Avatar,
} from "../../src/components/ui/Avatar";
import MusicPicker from "../../src/components/ui/MusicPicker";

type AuthUser = {
  _id?: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
};

type TextElement = {
  id: string;
  text: string;
  color: string;
  bgStyle: "none" | "glass" | "solid";
  alignment: "left" | "center" | "right";
  size: number;
  rotation: number;
  position: {
    x: number;
    y: number;
  };
};

type Sticker = {
  id: string;
  type:
    | "emoji"
    | "poll"
    | "question"
    | "countdown"
    | "link"
    | "mention"
    | "location";
  data: any;
  position: {
    x: number;
    y: number;
  };
};

type SelectedMedia = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

type MusicItem = {
  id?: string;
  _id?: string;
  title: string;
  artist: string;
  coverUrl?: string;
  previewUrl?: string;
  audioUrl?: string;
  duration?: string | number;
};

const FILTERS = [
  {
    id: "none",
    label: "Normal",
  },
  {
    id: "vintage",
    label: "Vintage",
  },
  {
    id: "grayscale",
    label: "B & W",
  },
  {
    id: "warm",
    label: "Summer",
  },
  {
    id: "cyberpunk",
    label: "Cyber",
  },
  {
    id: "drama",
    label: "Drama",
  },
  {
    id: "glow",
    label: "Glow",
  },
];

const PRESET_COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF0055",
  "#FFCC00",
  "#00FF66",
  "#00CCFF",
  "#AA00FF",
  "#FF5500",
];

const EMOJI_PRESETS = [
  "🔥",
  "❤️",
  "😂",
  "✨",
  "🎉",
  "💯",
  "👑",
  "🚀",
  "🌟",
  "🌈",
  "🍕",
  "🎯",
  "⚡",
  "💎",
  "🍿",
  "😎",
];

export default function CreateStoryScreen() {
  const { toast } =
    useToast();

  const { user } =
    useSelector(
      (state: any) =>
        state.auth,
    );

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<
    SelectedMedia | null
  >(null);

  const [
    preview,
    setPreview,
  ] = useState<
    string | null
  >(null);

  const [
    mediaType,
    setMediaType,
  ] = useState<
    "image" | "video"
  >("image");

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    rotation,
    setRotation,
  ] = useState(0);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState("none");

  const [
    textElements,
    setTextElements,
  ] = useState<
    TextElement[]
  >([]);

  const [
    activeTextId,
    setActiveTextId,
  ] = useState<
    string | null
  >(null);

  const [
    showTextModal,
    setShowTextModal,
  ] = useState(false);

  const [
    inputText,
    setInputText,
  ] = useState("");

  const [
    textColor,
    setTextColor,
  ] = useState("#FFFFFF");

  const [
    textBgStyle,
    setTextBgStyle,
  ] = useState<
    "none" | "glass" | "solid"
  >("glass");

  const [
    textAlignment,
    setTextAlignment,
  ] = useState<
    "left" | "center" | "right"
  >("center");

  const [
    textSize,
    setTextSize,
  ] = useState(24);

  const [
    textRotation,
    setTextRotation,
  ] = useState(0);

  const [
    activeStickers,
    setActiveStickers,
  ] = useState<
    Sticker[]
  >([]);

  const [
    showStickerDrawer,
    setShowStickerDrawer,
  ] = useState(false);

  const [
    selectedMusic,
    setSelectedMusic,
  ] = useState<
    MusicItem | null
  >(null);

  const [
    showMusicModal,
    setShowMusicModal,
  ] = useState(false);

  const [
    showAiModal,
    setShowAiModal,
  ] = useState(false);

  const [
    aiPrompt,
    setAiPrompt,
  ] = useState("");

  const [
    generatingAi,
    setGeneratingAi,
  ] = useState(false);

  const [
    showFilterBar,
    setShowFilterBar,
  ] = useState(false);

  const [
    isArchived,
    setIsArchived,
  ] = useState(true);

  const [
    privacy,
    setPrivacy,
  ] = useState<
    "public" |
    "followers" |
    "close_friends" |
    "custom"
  >("public");

  const [
    allowedUsers,
    setAllowedUsers,
  ] = useState<
    string[]
  >([]);

  const [
    hiddenFrom,
    setHiddenFrom,
  ] = useState<
    string[]
  >([]);

  const [
    showPrivacyModal,
    setShowPrivacyModal,
  ] = useState(false);

  const [
    userPickerMode,
    setUserPickerMode,
  ] = useState<
    "custom" |
    "hiddenFrom" |
    null
  >(null);

  const [
    pickerSearchQuery,
    setPickerSearchQuery,
  ] = useState("");

  const [
    pickerUsers,
    setPickerUsers,
  ] = useState<
    AuthUser[]
  >([]);

  const [
    loadingPickerUsers,
    setLoadingPickerUsers,
  ] = useState(false);

  useEffect(() => {
    if (
      !userPickerMode
    ) {
      return;
    }

    const timer =
      setTimeout(
        async () => {
          setLoadingPickerUsers(
            true,
          );

          try {
            const response =
              await api.get(
                `/api/search/users?q=${encodeURIComponent(
                  pickerSearchQuery,
                )}`,
              );

            if (
              response.data
                ?.success
            ) {
              setPickerUsers(
                response.data
                  .data || [],
              );
            }
          } catch (
            error
          ) {
            console.error(
              "Failed to search users:",
              error,
            );
          } finally {
            setLoadingPickerUsers(
              false,
            );
          }
        },
        300,
      );

    return () =>
      clearTimeout(
        timer,
      );
  }, [
    pickerSearchQuery,
    userPickerMode,
  ]);

  const currentFilter =
    useMemo(
      () =>
        FILTERS.find(
          (
            item,
          ) =>
            item.id ===
            selectedFilter,
        ),
      [
        selectedFilter,
      ],
    );

  const selectMedia =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          toast({
            variant:
              "error",
            title:
              "Permission Required",
            description:
              "Please allow access to your photo and video library.",
          });
          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ImagePicker.MediaTypeOptions.All,
              allowsEditing:
                false,
              quality:
                1,
            },
          );

        if (
          result.canceled ||
          !result.assets?.length
        ) {
          return;
        }

        const asset =
          result.assets[0];

        const selectedType =
          asset.type ===
          "video"
            ? "video"
            : "image";

        if (
          asset.fileSize &&
          asset.fileSize >
            10 *
              1024 *
              1024
        ) {
          toast({
            variant:
              "error",
            title:
              "File Too Large",
            description:
              "Photo or video must be under 10MB.",
          });
          return;
        }

        setSelectedFile(
          {
            uri:
              asset.uri,
            name:
              asset.fileName ||
              `story_${Date.now()}`,
            type:
              asset.mimeType ||
              (selectedType ===
              "video"
                ? "video/mp4"
                : "image/jpeg"),
            size:
              asset.fileSize,
          },
        );

        setPreview(
          asset.uri,
        );

        setMediaType(
          selectedType,
        );
      } catch (
        error
      ) {
        console.error(
          "Media picker error:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Selection Failed",
          description:
            "Unable to select the media.",
        });
      }
    };

  const handleSaveTextElement =
    () => {
      if (
        !inputText.trim()
      ) {
        return;
      }

      if (
        activeTextId
      ) {
        setTextElements(
          (
            previous,
          ) =>
            previous.map(
              (
                item,
              ) =>
                item.id ===
                activeTextId
                  ? {
                      ...item,
                      text:
                        inputText,
                      color:
                        textColor,
                      bgStyle:
                        textBgStyle,
                      alignment:
                        textAlignment,
                      size:
                        textSize,
                      rotation:
                        textRotation,
                    }
                  : item,
            ),
        );
      } else {
        setTextElements(
          (
            previous,
          ) => [
            ...previous,
            {
              id: `${Date.now()}`,
              text:
                inputText,
              color:
                textColor,
              bgStyle:
                textBgStyle,
              alignment:
                textAlignment,
              size:
                textSize,
              rotation:
                textRotation,
              position: {
                x: 50,
                y:
                  35 +
                  previous.length *
                    10,
              },
            },
          ],
        );
      }

      setInputText(
        "",
      );

      setActiveTextId(
        null,
      );

      setShowTextModal(
        false,
      );
    };

  const editText =
    (
      item: TextElement,
    ) => {
      setActiveTextId(
        item.id,
      );
      setInputText(
        item.text,
      );
      setTextColor(
        item.color,
      );
      setTextBgStyle(
        item.bgStyle,
      );
      setTextAlignment(
        item.alignment,
      );
      setTextSize(
        item.size,
      );
      setTextRotation(
        item.rotation,
      );
      setShowTextModal(
        true,
      );
    };

  const addSticker =
    (
      type: Sticker["type"],
      value?: string,
    ) => {
      let data: any =
        {};

      if (
        type ===
        "emoji"
      ) {
        data = {
          emoji:
            value ||
            "✨",
        };
      }

      if (
        type ===
        "poll"
      ) {
        data = {
          question:
            "Vote below!",
          optionA:
            "Yes 🔥",
          optionB:
            "No ❄️",
        };
      }

      if (
        type ===
        "question"
      ) {
        data = {
          prompt:
            "Ask me a question...",
        };
      }

      if (
        type ===
        "countdown"
      ) {
        data = {
          title:
            "Big Announcement!",
          targetDate:
            "2026-12-31",
        };
      }

      if (
        type ===
        "link"
      ) {
        data = {
          url:
            "https://snapgram.ai",
          label:
            "Visit Website",
        };
      }

      if (
        type ===
        "mention"
      ) {
        data = {
          handle:
            "@snapgram_official",
        };
      }

      if (
        type ===
        "location"
      ) {
        data = {
          location:
            "San Francisco, CA",
        };
      }

      setActiveStickers(
        (
          previous,
        ) => [
          ...previous,
          {
            id: `${Date.now()}-${Math.random()}`,
            type,
            data,
            position: {
              x: 50,
              y: 50,
            },
          },
        ],
      );

      setShowStickerDrawer(
        false,
      );
    };

  const removeText =
    (
      id: string,
    ) => {
      setTextElements(
        (
          previous,
        ) =>
          previous.filter(
            (
              item,
            ) =>
              item.id !==
              id,
          ),
      );
    };

  const removeSticker =
    (
      id: string,
    ) => {
      setActiveStickers(
        (
          previous,
        ) =>
          previous.filter(
            (
              item,
            ) =>
              item.id !==
              id,
          ),
      );
    };

  const generateAiStory =
    async () => {
      if (
        !aiPrompt.trim()
      ) {
        return;
      }

      setGeneratingAi(
        true,
      );

      try {
        const response =
          await api.post(
            "/api/stories/ai-generate",
            {
              prompt:
                aiPrompt,
            },
          );

        const mediaUrl =
          response.data
            ?.data
            ?.mediaUrl;

        if (!mediaUrl) {
          throw new Error(
            "No media returned",
          );
        }

        setSelectedFile(
          null,
        );

        setPreview(
          mediaUrl,
        );

        setMediaType(
          "image",
        );

        setShowAiModal(
          false,
        );

        setAiPrompt(
          "",
        );

        toast({
          variant:
            "success",
          title:
            "AI Story Generated",
          description:
            "AI Story background generated successfully.",
        });
      } catch (
        error
      ) {
        console.error(
          "AI Story generation failed:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Generation Failed",
          description:
            "Failed to generate AI story.",
        });
      } finally {
        setGeneratingAi(
          false,
        );
      }
    };

  const handleShareStory =
    async () => {
      if (
        !preview &&
        !selectedFile
      ) {
        toast({
          variant:
            "error",
          title:
            "Media Required",
          description:
            "Please add media or create an AI background.",
        });
        return;
      }

      setIsUploading(
        true,
      );

      try {
        let finalMediaUrl =
          preview;

        if (
          selectedFile
        ) {
          const formData =
            new FormData();

          formData.append(
            "image",
            {
              uri:
                selectedFile.uri,
              name:
                selectedFile.name,
              type:
                selectedFile.type,
            } as any,
          );

          const uploadResponse =
            await api.post(
              "/api/upload",
              formData,
              {
                headers: {
                  "Content-Type":
                    "multipart/form-data",
                },
              },
            );

          finalMediaUrl =
            uploadResponse.data
              ?.data?.url ||
            uploadResponse.data
              ?.url;
        }

        if (
          !finalMediaUrl
        ) {
          throw new Error(
            "Media URL unavailable",
          );
        }

        const stickers =
          [
            ...activeStickers,
            ...textElements.map(
              (
                item,
              ) => ({
                type:
                  "text",
                data:
                  item,
              }),
            ),
          ];

        const payload =
          {
            media: [
              {
                url:
                  finalMediaUrl,
                type:
                  mediaType,
              },
            ],
            stickers,
            music:
              selectedMusic
                ? {
                    title:
                      selectedMusic.title,
                    artist:
                      selectedMusic.artist,
                    coverUrl:
                      selectedMusic.coverUrl,
                    audioUrl:
                      selectedMusic.previewUrl ||
                      selectedMusic.audioUrl,
                  }
                : {},
            status:
              "published",
            isArchived,
            privacy,
            allowedUsers,
            hiddenFrom,
          };

        await api.post(
          "/api/stories",
          payload,
        );

        toast({
          variant:
            "success",
          title:
            "Story Shared",
          description:
            "Added to your Story! ✨",
        });

        router.replace(
          "/app",
        );
      } catch (
        error: any
      ) {
        console.error(
          "Failed to publish story:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Story Failed",
          description:
            error?.response
              ?.data?.message ||
            "Failed to post story.",
        });
      } finally {
        setIsUploading(
          false,
        );
      }
    };

  const togglePickerUser =
    (
      selectedUser: AuthUser,
    ) => {
      if (
        !selectedUser._id
      ) {
        return;
      }

      if (
        userPickerMode ===
        "custom"
      ) {
        setAllowedUsers(
          (
            previous,
          ) =>
            previous.includes(
              selectedUser._id!,
            )
              ? previous.filter(
                  (
                    id,
                  ) =>
                    id !==
                    selectedUser._id,
                )
              : [
                  ...previous,
                  selectedUser._id!,
                ],
        );
      }

      if (
        userPickerMode ===
        "hiddenFrom"
      ) {
        setHiddenFrom(
          (
            previous,
          ) =>
            previous.includes(
              selectedUser._id!,
            )
              ? previous.filter(
                  (
                    id,
                  ) =>
                    id !==
                    selectedUser._id,
                )
              : [
                  ...previous,
                  selectedUser._id!,
                ],
        );
      }
    };

  const isUserSelected =
    (
      id?: string,
    ) => {
      if (!id) {
        return false;
      }

      return userPickerMode ===
        "custom"
        ? allowedUsers.includes(
            id,
          )
        : hiddenFrom.includes(
            id,
          );
    };

  const openTextModal =
    () => {
      setActiveTextId(
        null,
      );
      setInputText(
        "",
      );
      setTextColor(
        "#FFFFFF",
      );
      setTextBgStyle(
        "glass",
      );
      setTextAlignment(
        "center",
      );
      setTextSize(
        24,
      );
      setTextRotation(
        0,
      );
      setShowTextModal(
        true,
      );
    };

  return (
    <View
      style={
        styles.screen
      }
    >
      <View
        style={
          styles.canvas
        }
      >
        {preview ? (
          <View
            style={[
              styles.previewWrapper,
              {
                transform: [
                  {
                    rotate: `${rotation}deg`,
                  },
                ],
              },
            ]}
          >
            <Image
              source={{
                uri: preview,
              }}
              resizeMode="cover"
              style={
                styles.previewImage
              }
            />

            {currentFilter?.id !==
            "none" ? (
              <View
                pointerEvents="none"
                style={
                  styles.filterOverlay
                }
              />
            ) : null}
          </View>
        ) : (
          <Pressable
            onPress={() =>
              void selectMedia()
            }
            style={
              styles.emptyCanvas
            }
          >
            <View
              style={
                styles.uploadCircle
              }
            >
              <UploadCloud
                size={31}
                color="#a855f7"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Select Photo or Video
            </Text>

            <Text
              style={
                styles.emptySubtitle
              }
            >
              Or create with AI prompt
            </Text>
          </Pressable>
        )}

        {/* Text overlays */}
        {textElements.map(
          (
            item,
          ) => (
            <Pressable
              key={
                item.id
              }
              onPress={() =>
                editText(
                  item,
                )
              }
              style={[
                styles.textElement,
                item.bgStyle ===
                  "glass" &&
                  styles.textGlass,
                item.bgStyle ===
                  "solid" &&
                  styles.textSolid,
                {
                  left: `${item.position.x}%`,
                  top: `${item.position.y}%`,
                  transform: [
                    {
                      translateX:
                        -60,
                    },
                    {
                      rotate: `${item.rotation}deg`,
                    },
                  ],
                },
              ]}
            >
              <Text
                style={[
                  styles.textElementText,
                  {
                    color:
                      item.bgStyle ===
                      "solid"
                        ? "#000000"
                        : item.color,
                    fontSize:
                      item.size,
                    textAlign:
                      item.alignment,
                  },
                ]}
              >
                {
                  item.text
                }
              </Text>

              <Pressable
                onPress={() =>
                  removeText(
                    item.id,
                  )
                }
                style={
                  styles.overlayRemove
                }
              >
                <X
                  size={11}
                  color="#ffffff"
                />
              </Pressable>
            </Pressable>
          ),
        )}

        {/* Stickers */}
        {activeStickers.map(
          (
            sticker,
          ) => (
            <View
              key={
                sticker.id
              }
              style={[
                styles.sticker,
                {
                  left: `${sticker.position.x}%`,
                  top: `${sticker.position.y}%`,
                },
              ]}
            >
              {sticker.type ===
              "emoji" ? (
                <Text
                  style={
                    styles.emoji
                  }
                >
                  {
                    sticker.data
                      .emoji
                  }
                </Text>
              ) : null}

              {sticker.type ===
              "poll" ? (
                <View
                  style={
                    styles.stickerContent
                  }
                >
                  <Text
                    style={
                      styles.pollTitle
                    }
                  >
                    {
                      sticker.data
                        .question
                    }
                  </Text>

                  <View
                    style={
                      styles.pollOptions
                    }
                  >
                    <Text
                      style={
                        styles.pollOption
                      }
                    >
                      {
                        sticker.data
                          .optionA
                      }
                    </Text>

                    <Text
                      style={
                        styles.pollOption
                      }
                    >
                      {
                        sticker.data
                          .optionB
                      }
                    </Text>
                  </View>
                </View>
              ) : null}

              {sticker.type ===
              "question" ? (
                <View
                  style={
                    styles.stickerContent
                  }
                >
                  <Text
                    style={
                      styles.questionTitle
                    }
                  >
                    {
                      sticker.data
                        .prompt
                    }
                  </Text>

                  <Text
                    style={
                      styles.questionInput
                    }
                  >
                    Type something...
                  </Text>
                </View>
              ) : null}

              {sticker.type ===
              "countdown" ? (
                <View
                  style={
                    styles.stickerContent
                  }
                >
                  <Text
                    style={
                      styles.countdownTitle
                    }
                  >
                    {
                      sticker.data
                        .title
                    }
                  </Text>

                  <Text
                    style={
                      styles.countdownTimer
                    }
                  >
                    00 : 42 : 19
                  </Text>
                </View>
              ) : null}

              {sticker.type ===
              "link" ? (
                <View
                  style={
                    styles.inlineSticker
                  }
                >
                  <LinkIcon
                    size={15}
                    color="#34d399"
                  />

                  <Text
                    style={
                      styles.linkStickerText
                    }
                  >
                    {
                      sticker.data
                        .label
                    }
                  </Text>
                </View>
              ) : null}

              {sticker.type ===
              "mention" ? (
                <View
                  style={
                    styles.inlineSticker
                  }
                >
                  <AtSign
                    size={15}
                    color="#c084fc"
                  />

                  <Text
                    style={
                      styles.mentionText
                    }
                  >
                    {
                      sticker.data
                        .handle
                    }
                  </Text>
                </View>
              ) : null}

              {sticker.type ===
              "location" ? (
                <View
                  style={
                    styles.inlineSticker
                  }
                >
                  <MapPin
                    size={15}
                    color="#fbbf24"
                  />

                  <Text
                    style={
                      styles.locationText
                    }
                  >
                    {
                      sticker.data
                        .location
                    }
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={() =>
                  removeSticker(
                    sticker.id,
                  )
                }
                style={
                  styles.overlayRemove
                }
              >
                <X
                  size={11}
                  color="#ffffff"
                />
              </Pressable>
            </View>
          ),
        )}

        {/* Top controls */}
        <View
          style={
            styles.topControls
          }
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.circleButton
            }
          >
            <X
              size={20}
              color="#ffffff"
            />
          </Pressable>

          {preview ? (
            <View
              style={
                styles.toolBar
              }
            >
              <Pressable
                onPress={
                  openTextModal
                }
                style={
                  styles.toolButton
                }
              >
                <Text
                  style={
                    styles.aaText
                  }
                >
                  Aa
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setShowStickerDrawer(
                    (
                      value,
                    ) => !value,
                  )
                }
                style={
                  styles.toolButton
                }
              >
                <Smile
                  size={17}
                  color="#ffffff"
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Drawing",
                    "Freehand drawing is available in the web editor. Native story publishing currently preserves the story without a canvas drawing layer.",
                  )
                }
                style={
                  styles.toolButton
                }
              >
                <Pencil
                  size={17}
                  color="#ffffff"
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  setShowMusicModal(
                    true,
                  )
                }
                style={
                  styles.toolButton
                }
              >
                <Music2
                  size={17}
                  color={
                    selectedMusic
                      ? "#34d399"
                      : "#ffffff"
                  }
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  setShowFilterBar(
                    (
                      value,
                    ) => !value,
                  )
                }
                style={
                  styles.toolButton
                }
              >
                <Sparkles
                  size={17}
                  color={
                    selectedFilter !==
                    "none"
                      ? "#f472b6"
                      : "#ffffff"
                  }
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  setRotation(
                    (
                      value,
                    ) =>
                      (value +
                        90) %
                      360,
                  )
                }
                style={
                  styles.toolButton
                }
              >
                <RotateCw
                  size={17}
                  color="#ffffff"
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  setShowAiModal(
                    true,
                  )
                }
                style={
                  styles.toolButton
                }
              >
                <Wand2
                  size={17}
                  color="#c084fc"
                />
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Filter drawer */}
        {showFilterBar ? (
          <View
            style={
              styles.bottomDrawer
            }
          >
            <View
              style={
                styles.drawerHeader
              }
            >
              <View
                style={
                  styles.drawerTitleRow
                }
              >
                <Sparkles
                  size={15}
                  color="#f472b6"
                />

                <Text
                  style={
                    styles.drawerTitle
                  }
                >
                  Photo Filters
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowFilterBar(
                    false,
                  )
                }
              >
                <X
                  size={17}
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.drawerScroll
              }
            >
              {FILTERS.map(
                (
                  filter,
                ) => (
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
                      styles.filterButton,
                      selectedFilter ===
                        filter.id &&
                        styles.filterButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedFilter ===
                          filter.id &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      {
                        filter.label
                      }
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>
          </View>
        ) : null}

        {/* Sticker drawer */}
        {showStickerDrawer ? (
          <View
            style={
              styles.stickerDrawer
            }
          >
            <View
              style={
                styles.drawerHeader
              }
            >
              <View
                style={
                  styles.drawerTitleRow
                }
              >
                <Smile
                  size={16}
                  color="#facc15"
                />

                <Text
                  style={
                    styles.drawerTitle
                  }
                >
                  Emojis & Stickers
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowStickerDrawer(
                    false,
                  )
                }
              >
                <X
                  size={17}
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.emojiRow
              }
            >
              {EMOJI_PRESETS.map(
                (
                  emoji,
                ) => (
                  <Pressable
                    key={
                      emoji
                    }
                    onPress={() =>
                      addSticker(
                        "emoji",
                        emoji,
                      )
                    }
                    style={
                      styles.emojiButton
                    }
                  >
                    <Text
                      style={
                        styles.emojiButtonText
                      }
                    >
                      {
                        emoji
                      }
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>

            <View
              style={
                styles.stickerGrid
              }
            >
              <StickerButton
                type="poll"
                label="Poll"
                icon={
                  <Vote
                    size={16}
                    color="#eab308"
                  />
                }
                onPress={() =>
                  addSticker(
                    "poll",
                  )
                }
              />

              <StickerButton
                type="question"
                label="Question"
                icon={
                  <Type
                    size={16}
                    color="#60a5fa"
                  />
                }
                onPress={() =>
                  addSticker(
                    "question",
                  )
                }
              />

              <StickerButton
                type="countdown"
                label="Timer"
                icon={
                  <Clock
                    size={16}
                    color="#fb7185"
                  />
                }
                onPress={() =>
                  addSticker(
                    "countdown",
                  )
                }
              />

              <StickerButton
                type="link"
                label="Link"
                icon={
                  <LinkIcon
                    size={16}
                    color="#34d399"
                  />
                }
                onPress={() =>
                  addSticker(
                    "link",
                  )
                }
              />

              <StickerButton
                type="mention"
                label="Mention"
                icon={
                  <AtSign
                    size={16}
                    color="#c084fc"
                  />
                }
                onPress={() =>
                  addSticker(
                    "mention",
                  )
                }
              />

              <StickerButton
                type="location"
                label="Location"
                icon={
                  <MapPin
                    size={16}
                    color="#fbbf24"
                  />
                }
                onPress={() =>
                  addSticker(
                    "location",
                  )
                }
              />
            </View>
          </View>
        ) : null}

        {/* Bottom share controls */}
        {preview ? (
          <View
            style={
              styles.bottomControls
            }
          >
            <View
              style={
                styles.shareOptions
              }
            >
              <Pressable
                onPress={() =>
                  setPrivacy(
                    "public",
                  )
                }
                style={[
                  styles.storyButton,
                  privacy ===
                    "public" &&
                    styles.storyButtonActive,
                ]}
              >
                <Avatar
                  src={
                    user?.profilePicture ||
                    user?.avatar
                  }
                  fallback={
                    user?.username?.charAt(
                      0,
                    ) || "U"
                  }
                  size="sm"
                />

                <Text
                  style={[
                    styles.storyButtonText,
                    privacy ===
                      "public" &&
                      styles.storyButtonTextActive,
                  ]}
                >
                  Your Story
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setPrivacy(
                    (
                      current,
                    ) =>
                      current ===
                      "close_friends"
                        ? "public"
                        : "close_friends",
                  )
                }
                style={[
                  styles.closeFriendsButton,
                  privacy ===
                    "close_friends" &&
                    styles.closeFriendsActive,
                ]}
              >
                <Text>
                  ⭐
                </Text>

                <Text
                  style={
                    styles.closeFriendsText
                  }
                >
                  Close Friends
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setShowPrivacyModal(
                    true,
                  )
                }
                style={
                  styles.settingsButton
                }
              >
                <Text
                  style={
                    styles.settingsEmoji
                  }
                >
                  ⚙️
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() =>
                void handleShareStory()
              }
              disabled={
                isUploading
              }
              style={
                styles.nextButton
              }
            >
              {isUploading ? (
                <Loader2
                  size={20}
                  color="#000000"
                />
              ) : (
                <ChevronRight
                  size={27}
                  color="#000000"
                  strokeWidth={
                    3
                  }
                />
              )}
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Privacy Modal */}
      <Modal
        visible={
          showPrivacyModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowPrivacyModal(
            false,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                🔒 Story Privacy Options
              </Text>

              <Pressable
                onPress={() =>
                  setShowPrivacyModal(
                    false,
                  )
                }
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            <PrivacyOption
              title="🌐 Everyone / Public"
              description="Anyone can view this story."
              active={
                privacy ===
                "public"
              }
              onPress={() =>
                setPrivacy(
                  "public",
                )
              }
            />

            <PrivacyOption
              title="👥 Followers Only"
              description="Only people following you."
              active={
                privacy ===
                "followers"
              }
              onPress={() =>
                setPrivacy(
                  "followers",
                )
              }
            />

            <PrivacyOption
              title="⭐ Close Friends"
              description="Only your close friends."
              active={
                privacy ===
                "close_friends"
              }
              onPress={() =>
                setPrivacy(
                  "close_friends",
                )
              }
            />

            <PrivacyOption
              title={`🎯 Custom Audience (${allowedUsers.length} selected)`}
              description="Choose specific people who can view it."
              active={
                privacy ===
                "custom"
              }
              onPress={() => {
                setPrivacy(
                  "custom",
                );
                setUserPickerMode(
                  "custom",
                );
              }}
            />

            <PrivacyOption
              title={`🚫 Hide Story From (${hiddenFrom.length} hidden)`}
              description="Choose people who cannot view it."
              active={
                hiddenFrom.length >
                0
              }
              onPress={() =>
                setUserPickerMode(
                  "hiddenFrom",
                )
              }
            />

            <Pressable
              onPress={() =>
                setShowPrivacyModal(
                  false,
                )
              }
              style={
                styles.doneButton
              }
            >
              <Text
                style={
                  styles.doneButtonText
                }
              >
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* User picker */}
      <Modal
        visible={
          userPickerMode !==
          null
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setUserPickerMode(
            null,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={[
              styles.modalCard,
              styles.userPickerCard,
            ]}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                {userPickerMode ===
                "custom"
                  ? "🎯 Custom Audience"
                  : "🚫 Hide Story From"}
              </Text>

              <Pressable
                onPress={() =>
                  setUserPickerMode(
                    null,
                  )
                }
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            <TextInput
              value={
                pickerSearchQuery
              }
              onChangeText={
                setPickerSearchQuery
              }
              placeholder="Search users..."
              placeholderTextColor="#64748b"
              style={
                styles.userSearch
              }
              autoCapitalize="none"
            />

            <ScrollView
              style={
                styles.userList
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {loadingPickerUsers ? (
                <View
                  style={
                    styles.loadingState
                  }
                >
                  <Loader2
                    size={25}
                    color="#a855f7"
                  />
                </View>
              ) : pickerUsers.length ===
                0 ? (
                <Text
                  style={
                    styles.noUsers
                  }
                >
                  No users found.
                </Text>
              ) : (
                pickerUsers.map(
                  (
                    pickerUser,
                  ) => {
                    const selected =
                      isUserSelected(
                        pickerUser._id,
                      );

                    return (
                      <Pressable
                        key={
                          pickerUser._id
                        }
                        onPress={() =>
                          togglePickerUser(
                            pickerUser,
                          )
                        }
                        style={
                          styles.userRow
                        }
                      >
                        <View
                          style={
                            styles.userInfo
                          }
                        >
                          <Avatar
                            src={
                              pickerUser.profilePicture ||
                              pickerUser.avatar
                            }
                            fallback={pickerUser.username?.charAt(
                              0,
                            )}
                            size="sm"
                          />

                          <View
                            style={
                              styles.userCopy
                            }
                          >
                            <Text
                              style={
                                styles.userName
                              }
                            >
                              {pickerUser.fullName ||
                                pickerUser.username}
                            </Text>

                            <Text
                              style={
                                styles.userHandle
                              }
                            >
                              @
                              {
                                pickerUser.username
                              }
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.checkCircle,
                            selected &&
                              styles.checkCircleActive,
                          ]}
                        >
                          {selected ? (
                            <Check
                              size={
                                15
                              }
                              color="#ffffff"
                              strokeWidth={
                                3
                              }
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  },
                )
              )}
            </ScrollView>

            <Pressable
              onPress={() =>
                setUserPickerMode(
                  null,
                )
              }
              style={
                styles.doneButton
              }
            >
              <Text
                style={
                  styles.doneButtonText
                }
              >
                Save Selection
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Text modal */}
      <Modal
        visible={
          showTextModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowTextModal(
            false,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <ScrollView
            style={
              styles.modalScroll
            }
            contentContainerStyle={
              styles.modalScrollContent
            }
          >
            <View
              style={
                styles.modalCard
              }
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View
                  style={
                    styles.drawerTitleRow
                  }
                >
                  <Type
                    size={18}
                    color="#a855f7"
                  />

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    {activeTextId
                      ? "Edit Text Element"
                      : "Add Story Text"}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowTextModal(
                      false,
                    )
                  }
                >
                  <X
                    size={20}
                    color="#94a3b8"
                  />
                </Pressable>
              </View>

              <TextInput
                value={
                  inputText
                }
                onChangeText={
                  setInputText
                }
                placeholder="Type your story text..."
                placeholderTextColor="#64748b"
                style={
                  styles.textInput
                }
                maxLength={
                  200
                }
              />

              <Text
                style={
                  styles.modalSectionLabel
                }
              >
                Text Color
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.colorRow
                }
              >
                {PRESET_COLORS.map(
                  (
                    color,
                  ) => (
                    <Pressable
                      key={
                        color
                      }
                      onPress={() =>
                        setTextColor(
                          color,
                        )
                      }
                      style={[
                        styles.colorDot,
                        {
                          backgroundColor:
                            color,
                        },
                        textColor ===
                          color &&
                          styles.colorDotActive,
                      ]}
                    />
                  ),
                )}
              </ScrollView>

              <Text
                style={
                  styles.modalSectionLabel
                }
              >
                Background Style
              </Text>

              <View
                style={
                  styles.optionRow
                }
              >
                {[
                  {
                    id: "none",
                    label: "None",
                  },
                  {
                    id: "glass",
                    label: "Glass",
                  },
                  {
                    id: "solid",
                    label: "Solid",
                  },
                ].map(
                  (
                    item,
                  ) => (
                    <Pressable
                      key={
                        item.id
                      }
                      onPress={() =>
                        setTextBgStyle(
                          item.id as any,
                        )
                      }
                      style={[
                        styles.optionButton,
                        textBgStyle ===
                          item.id &&
                          styles.optionButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          textBgStyle ===
                            item.id &&
                            styles.optionButtonTextActive,
                        ]}
                      >
                        {
                          item.label
                        }
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>

              <Text
                style={
                  styles.modalSectionLabel
                }
              >
                Alignment
              </Text>

              <View
                style={
                  styles.optionRow
                }
              >
                <AlignButton
                  active={
                    textAlignment ===
                    "left"
                  }
                  onPress={() =>
                    setTextAlignment(
                      "left",
                    )
                  }
                  icon={
                    <AlignLeft
                      size={17}
                      color={
                        textAlignment ===
                        "left"
                          ? "#ffffff"
                          : "#94a3b8"
                      }
                    />
                  }
                />

                <AlignButton
                  active={
                    textAlignment ===
                    "center"
                  }
                  onPress={() =>
                    setTextAlignment(
                      "center",
                    )
                  }
                  icon={
                    <AlignCenter
                      size={17}
                      color={
                        textAlignment ===
                        "center"
                          ? "#ffffff"
                          : "#94a3b8"
                      }
                    />
                  }
                />

                <AlignButton
                  active={
                    textAlignment ===
                    "right"
                  }
                  onPress={() =>
                    setTextAlignment(
                      "right",
                    )
                  }
                  icon={
                    <AlignRight
                      size={17}
                      color={
                        textAlignment ===
                        "right"
                          ? "#ffffff"
                          : "#94a3b8"
                      }
                    />
                  }
                />
              </View>

              <View
                style={
                  styles.sliderSection
                }
              >
                <Text
                  style={
                    styles.modalSectionLabel
                  }
                >
                  Font Size:{" "}
                  {
                    textSize
                  }
                  px
                </Text>

                <View
                  style={
                    styles.adjustRow
                  }
                >
                  <Pressable
                    onPress={() =>
                      setTextSize(
                        (
                          value,
                        ) =>
                          Math.max(
                            14,
                            value -
                              2,
                          ),
                      )
                    }
                    style={
                      styles.adjustButton
                    }
                  >
                    <Text
                      style={
                        styles.adjustButtonText
                      }
                    >
                      −
                    </Text>
                  </Pressable>

                  <View
                    style={
                      styles.adjustTrack
                    }
                  >
                    <View
                      style={[
                        styles.adjustFill,
                        {
                          width: `${
                            ((textSize -
                              14) /
                              34) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>

                  <Pressable
                    onPress={() =>
                      setTextSize(
                        (
                          value,
                        ) =>
                          Math.min(
                            48,
                            value +
                              2,
                          ),
                      )
                    }
                    style={
                      styles.adjustButton
                    }
                  >
                    <Text
                      style={
                        styles.adjustButtonText
                      }
                    >
                      +
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View
                style={
                  styles.sliderSection
                }
              >
                <Text
                  style={
                    styles.modalSectionLabel
                  }
                >
                  Rotation:{" "}
                  {
                    textRotation
                  }
                  °
                </Text>

                <View
                  style={
                    styles.rotationRow
                  }
                >
                  <Pressable
                    onPress={() =>
                      setTextRotation(
                        (
                          value,
                        ) =>
                          Math.max(
                            -45,
                            value -
                              5,
                          ),
                      )
                    }
                    style={
                      styles.rotationButton
                    }
                  >
                    <Text
                      style={
                        styles.rotationButtonText
                      }
                    >
                      −
                    </Text>
                  </Pressable>

                  <Text
                    style={
                      styles.rotationValue
                    }
                  >
                    {
                      textRotation
                    }°
                  </Text>

                  <Pressable
                    onPress={() =>
                      setTextRotation(
                        (
                          value,
                        ) =>
                          Math.min(
                            45,
                            value +
                              5,
                          ),
                      )
                    }
                    style={
                      styles.rotationButton
                    }
                  >
                    <Text
                      style={
                        styles.rotationButtonText
                      }
                    >
                      +
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={
                  handleSaveTextElement
                }
                style={
                  styles.doneButton
                }
              >
                <Text
                  style={
                    styles.doneButtonText
                  }
                >
                  {activeTextId
                    ? "Update Text"
                    : "Done"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Music Picker */}
      <Modal
        visible={
          showMusicModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowMusicModal(
            false,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.musicPickerCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.drawerTitleRow
                }
              >
                <Music2
                  size={18}
                  color="#a855f7"
                />

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Add Music
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowMusicModal(
                    false,
                  )
                }
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            <View
              style={
                styles.musicPickerWrap
              }
            >
              <MusicPicker
                onSelect={(
                  music: any,
                ) => {
                  setSelectedMusic(
                    {
                      ...music,
                      audioUrl:
                        music.previewUrl,
                    },
                  );

                  setShowMusicModal(
                    false,
                  );
                }}
                onClose={() =>
                  setShowMusicModal(
                    false,
                  )
                }
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Modal */}
      <Modal
        visible={
          showAiModal
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowAiModal(
            false,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.drawerTitleRow
                }
              >
                <Wand2
                  size={18}
                  color="#c084fc"
                />

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  AI Story Background
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowAiModal(
                    false,
                  )
                }
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            <TextInput
              value={
                aiPrompt
              }
              onChangeText={
                setAiPrompt
              }
              placeholder="Describe a background..."
              placeholderTextColor="#64748b"
              style={
                styles.textInput
              }
              autoCapitalize="sentences"
            />

            <Pressable
              onPress={() =>
                void generateAiStory()
              }
              disabled={
                generatingAi
              }
              style={
                styles.generateAiButton
              }
            >
              {generatingAi ? (
                <Loader2
                  size={18}
                  color="#ffffff"
                />
              ) : (
                <Sparkles
                  size={18}
                  color="#ffffff"
                />
              )}

              <Text
                style={
                  styles.generateAiText
                }
              >
                {generatingAi
                  ? "Generating..."
                  : "Generate AI Background"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StickerButton({
  type,
  label,
  icon,
  onPress,
}: {
  type: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={
        styles.stickerGridButton
      }
    >
      {icon}

      <Text
        style={
          styles.stickerGridText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PrivacyOption({
  title,
  description,
  active,
  onPress,
}: {
  title: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.privacyOption,
        active &&
          styles.privacyOptionActive,
      ]}
    >
      <View
        style={
          styles.privacyCopy
        }
      >
        <Text
          style={
            styles.privacyTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.privacyDescription
          }
        >
          {description}
        </Text>
      </View>

      {active ? (
        <Check
          size={19}
          color="#34d399"
        />
      ) : null}
    </Pressable>
  );
}

function AlignButton({
  active,
  onPress,
  icon,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.alignButton,
        active &&
          styles.alignButtonActive,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    canvas: {
      flex: 1,
      position:
        "relative",
      overflow:
        "hidden",
      backgroundColor:
        "#09090b",
    },

    previewWrapper: {
      ...StyleSheet.absoluteFillObject,
    },

    previewImage: {
      width: "100%",
      height: "100%",
    },

    filterOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(168,85,247,0.06)",
    },

    emptyCanvas: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 30,
    },

    uploadCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(168,85,247,0.10)",
      borderWidth: 1,
      borderColor:
        "rgba(168,85,247,0.22)",
      marginBottom: 15,
    },

    emptyTitle: {
      color:
        "#ffffff",
      fontSize: 16,
      fontWeight:
        "800",
    },

    emptySubtitle: {
      marginTop: 5,
      color:
        "rgba(255,255,255,0.60)",
      fontSize: 11,
    },

    topControls: {
      position:
        "absolute",
      top: 14,
      left: 14,
      right: 14,
      zIndex: 20,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    circleButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.55)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
    },

    toolBar: {
      maxWidth:
        "86%",
      flexDirection:
        "row",
      alignItems:
        "center",
      borderRadius: 24,
      backgroundColor:
        "rgba(0,0,0,0.60)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.16)",
      paddingHorizontal: 6,
      paddingVertical: 4,
    },

    toolButton: {
      width: 36,
      height: 36,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    aaText: {
      color:
        "#ffffff",
      fontSize: 15,
      fontWeight:
        "900",
    },

    bottomControls: {
      position:
        "absolute",
      left: 14,
      right: 14,
      bottom: 16,
      zIndex: 30,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    shareOptions: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      marginRight: 8,
    },

    storyButton: {
      maxWidth: 125,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 22,
      backgroundColor:
        "rgba(0,0,0,0.62)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.16)",
    },

    storyButtonActive: {
      backgroundColor:
        "#ffffff",
      borderColor:
        "#ffffff",
    },

    storyButtonText: {
      flexShrink: 1,
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "800",
    },

    storyButtonTextActive: {
      color:
        "#000000",
    },

    closeFriendsButton: {
      maxWidth: 110,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor:
        "rgba(0,0,0,0.62)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.16)",
    },

    closeFriendsActive: {
      backgroundColor:
        "#10b981",
      borderColor:
        "#10b981",
    },

    closeFriendsText: {
      color:
        "#ffffff",
      fontSize: 8,
      fontWeight:
        "800",
    },

    settingsButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.62)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.16)",
    },

    settingsEmoji: {
      fontSize: 15,
    },

    nextButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
    },

    textElement: {
      position:
        "absolute",
      minWidth: 70,
      maxWidth:
        "82%",
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 12,
      zIndex: 10,
    },

    textGlass: {
      backgroundColor:
        "rgba(0,0,0,0.56)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
    },

    textSolid: {
      backgroundColor:
        "#ffffff",
    },

    textElementText: {
      fontWeight:
        "700",
    },

    overlayRemove: {
      position:
        "absolute",
      top: -7,
      right: -7,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ef4444",
    },

    sticker: {
      position:
        "absolute",
      minWidth: 70,
      maxWidth: 220,
      padding: 11,
      borderRadius: 15,
      backgroundColor:
        "rgba(0,0,0,0.76)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.17)",
      transform: [
        {
          translateX:
            -45,
        },
        {
          translateY:
            -20,
        },
      ],
      zIndex: 11,
    },

    emoji: {
      fontSize: 38,
    },

    stickerContent: {
      alignItems:
        "center",
    },

    pollTitle: {
      color:
        "#fde047",
      fontSize: 10,
      fontWeight:
        "900",
    },

    pollOptions: {
      flexDirection:
        "row",
      gap: 5,
      marginTop: 7,
    },

    pollOption: {
      paddingHorizontal: 6,
      paddingVertical: 5,
      borderRadius: 7,
      backgroundColor:
        "rgba(255,255,255,0.16)",
      color:
        "#ffffff",
      fontSize: 8,
      fontWeight:
        "800",
    },

    questionTitle: {
      color:
        "#93c5fd",
      fontSize: 10,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    questionInput: {
      marginTop: 5,
      color:
        "rgba(255,255,255,0.55)",
      fontSize: 8,
    },

    countdownTitle: {
      color:
        "#fb7185",
      fontSize: 9,
      fontWeight:
        "900",
      textTransform:
        "uppercase",
    },

    countdownTimer: {
      marginTop: 4,
      color:
        "#ffffff",
      fontSize: 15,
      fontWeight:
        "900",
    },

    inlineSticker: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    linkStickerText: {
      color:
        "#34d399",
      fontSize: 10,
      fontWeight:
        "800",
    },

    mentionText: {
      color:
        "#c084fc",
      fontSize: 10,
      fontWeight:
        "900",
    },

    locationText: {
      color:
        "#fbbf24",
      fontSize: 10,
      fontWeight:
        "800",
    },

    bottomDrawer: {
      position:
        "absolute",
      left: 14,
      right: 14,
      bottom: 16,
      zIndex: 40,
      padding: 12,
      borderRadius: 17,
      backgroundColor:
        "rgba(0,0,0,0.86)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.14)",
    },

    stickerDrawer: {
      position:
        "absolute",
      left: 14,
      right: 14,
      bottom: 16,
      zIndex: 40,
      padding: 13,
      borderRadius: 22,
      backgroundColor:
        "rgba(0,0,0,0.88)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.14)",
    },

    drawerHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 9,
    },

    drawerTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    drawerTitle: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
    },

    drawerScroll: {
      gap: 7,
    },

    filterButton: {
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 11,
      backgroundColor:
        "rgba(255,255,255,0.10)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    filterButtonActive: {
      backgroundColor:
        "#ec4899",
      borderColor:
        "#ec4899",
    },

    filterButtonText: {
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "800",
    },

    filterButtonTextActive: {
      color:
        "#ffffff",
    },

    emojiRow: {
      gap: 7,
      paddingBottom: 10,
    },

    emojiButton: {
      width: 37,
      height: 37,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.10)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    emojiButtonText: {
      fontSize: 19,
    },

    stickerGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 7,
    },

    stickerGridButton: {
      width: "31.5%",
      minHeight: 39,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 4,
      borderRadius: 10,
      backgroundColor:
        "rgba(255,255,255,0.10)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    stickerGridText: {
      color:
        "#ffffff",
      fontSize: 8,
      fontWeight:
        "800",
    },

    modalBackdrop: {
      flex: 1,
      justifyContent:
        "flex-end",
      backgroundColor:
        "rgba(0,0,0,0.78)",
    },

    modalScroll: {
      flex: 1,
    },

    modalScrollContent: {
      flexGrow: 1,
      justifyContent:
        "flex-end",
    },

    modalCard: {
      width: "100%",
      padding: 18,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      backgroundColor:
        "#17121d",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    musicPickerCard: {
      width: "100%",
      height: "80%",
      padding: 15,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      backgroundColor:
        "#17121d",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    musicPickerWrap: {
      flex: 1,
      overflow:
        "hidden",
    },

    userPickerCard: {
      height: "78%",
    },

    modalHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 15,
    },

    modalTitle: {
      color:
        "#ffffff",
      fontSize: 15,
      fontWeight:
        "900",
    },

    textInput: {
      minHeight: 47,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor:
        "#0d0a11",
      borderWidth: 1,
      borderColor:
        "#30243b",
      color:
        "#ffffff",
      fontSize: 12,
      marginBottom: 13,
    },

    modalSectionLabel: {
      color:
        "#94a3b8",
      fontSize: 10,
      fontWeight:
        "800",
      marginBottom: 7,
    },

    colorRow: {
      gap: 8,
      paddingBottom: 13,
    },

    colorDot: {
      width: 27,
      height: 27,
      borderRadius: 14,
      borderWidth: 2,
      borderColor:
        "transparent",
    },

    colorDotActive: {
      borderColor:
        "#ffffff",
      transform: [
        {
          scale: 1.15,
        },
      ],
    },

    optionRow: {
      flexDirection:
        "row",
      gap: 7,
      marginBottom: 13,
    },

    optionButton: {
      flex: 1,
      minHeight: 38,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 10,
      backgroundColor:
        "#0d0a11",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    optionButtonActive: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    optionButtonText: {
      color:
        "#94a3b8",
      fontSize: 9,
      fontWeight:
        "800",
    },

    optionButtonTextActive: {
      color:
        "#ffffff",
    },

    alignButton: {
      flex: 1,
      minHeight: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 10,
      backgroundColor:
        "#0d0a11",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    alignButtonActive: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    sliderSection: {
      marginBottom: 14,
    },

    adjustRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    adjustButton: {
      width: 36,
      height: 34,
      borderRadius: 9,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#0d0a11",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    adjustButtonText: {
      color:
        "#ffffff",
      fontSize: 19,
      fontWeight:
        "800",
    },

    adjustTrack: {
      flex: 1,
      height: 6,
      borderRadius: 5,
      overflow:
        "hidden",
      backgroundColor:
        "#29222f",
    },

    adjustFill: {
      height: "100%",
      backgroundColor:
        "#a855f7",
    },

    rotationRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 15,
    },

    rotationButton: {
      width: 38,
      height: 34,
      borderRadius: 9,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#0d0a11",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    rotationButtonText: {
      color:
        "#ffffff",
      fontSize: 18,
      fontWeight:
        "800",
    },

    rotationValue: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "900",
      minWidth: 45,
      textAlign:
        "center",
    },

    doneButton: {
      minHeight: 47,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 13,
      backgroundColor:
        "#ffffff",
      marginTop: 3,
    },

    doneButtonText: {
      color:
        "#000000",
      fontSize: 11,
      fontWeight:
        "900",
    },

    privacyOption: {
      minHeight: 62,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 10,
      padding: 12,
      marginBottom: 7,
      borderRadius: 13,
      backgroundColor:
        "#0d0a11",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    privacyOptionActive: {
      borderColor:
        "#ffffff",
      backgroundColor:
        "rgba(255,255,255,0.06)",
    },

    privacyCopy: {
      flex: 1,
    },

    privacyTitle: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
    },

    privacyDescription: {
      marginTop: 3,
      color:
        "#64748b",
      fontSize: 9,
    },

    userSearch: {
      minHeight: 44,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor:
        "#0d0a11",
      borderWidth: 1,
      borderColor:
        "#30243b",
      color:
        "#ffffff",
      fontSize: 11,
      marginBottom: 8,
    },

    userList: {
      flex: 1,
    },

    loadingState: {
      paddingVertical: 35,
      alignItems:
        "center",
    },

    noUsers: {
      paddingVertical: 30,
      textAlign:
        "center",
      color:
        "#64748b",
      fontSize: 11,
    },

    userRow: {
      minHeight: 59,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor:
        "#251e2d",
    },

    userInfo: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
    },

    userCopy: {
      flexShrink: 1,
    },

    userName: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
    },

    userHandle: {
      marginTop: 2,
      color:
        "#64748b",
      fontSize: 9,
    },

    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#475569",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    checkCircleActive: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    generateAiButton: {
      minHeight: 48,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
      borderRadius: 13,
      backgroundColor:
        "#9333ea",
    },

    generateAiText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "900",
    },
  });