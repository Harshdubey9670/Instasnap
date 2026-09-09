// FILE: mobile/app/app/stories.tsx

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Image as ImageIcon,
  Plus,
  Send,
  Sliders,
  Sparkles,
  Type,
  Wand2,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import api from "../../src/services/api";
import { useToast } from "../../src/components/ui/Toast";
import { Avatar } from "../../src/components/ui/Avatar";

type Story = {
  _id: string;
  media?: {
    url: string;
    type?: string;
  }[];
};

type StoryGroup = {
  user?: {
    _id?: string;
    username?: string;
    profilePicture?: string;
    avatar?: string;
  };
  stories: Story[];
};

type ArchivedStory = Story & {
  media?: {
    url: string;
    type?: string;
  }[];
};

type Tab = "feed" | "editor" | "archive";

export default function StoriesScreen() {
  const { showToast } = useToast();

  const [storyGroups, setStoryGroups] =
    useState<StoryGroup[]>([]);
  const [archivedStories, setArchivedStories] =
    useState<ArchivedStory[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [loadingArchive, setLoadingArchive] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<Tab>("feed");

  const [activeGroupIndex, setActiveGroupIndex] =
    useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] =
    useState(0);

  const [replyText, setReplyText] =
    useState("");
  const [showViewersModal, setShowViewersModal] =
    useState(false);

  const [editorFileUri, setEditorFileUri] =
    useState<string | null>(null);
  const [editorMimeType, setEditorMimeType] =
    useState<string | null>(null);
  const [editorPreview, setEditorPreview] =
    useState("");
  const [activeFilter, setActiveFilter] =
    useState("normal");
  const [brightness, setBrightness] =
    useState(100);
  const [contrast, setContrast] =
    useState(100);
  const [saturation, setSaturation] =
    useState(100);
  const [blur, setBlur] =
    useState(0);
  const [rotation, setRotation] =
    useState(0);
  const [overlayText, setOverlayText] =
    useState("");
  const [textColor, setTextColor] =
    useState("#ffffff");
  const [isPublishing, setIsPublishing] =
    useState(false);

  useEffect(() => {
    void fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/stories");

      if (res.data?.success) {
        setStoryGroups(
          Array.isArray(res.data.data)
            ? res.data.data
            : [],
        );
      }
    } catch (error) {
      console.error(
        "Failed to load stories",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchArchive = async () => {
    try {
      setLoadingArchive(true);

      const res = await api.get(
        "/api/stories/archive",
      );

      if (res.data?.success) {
        setArchivedStories(
          Array.isArray(res.data.data)
            ? res.data.data
            : [],
        );
      }
    } catch (error) {
      console.error(
        "Failed to load archive",
        error,
      );
    } finally {
      setLoadingArchive(false);
    }
  };

  const selectEditorMedia =
    async () => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showToast(
          "error",
          "Permission Required",
          "Please allow photo-library access to choose story media.",
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker.MediaTypeOptions.All,
            allowsEditing: false,
            quality: 1,
          },
        );

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const asset = result.assets[0];

      setEditorFileUri(asset.uri);
      setEditorMimeType(
        asset.mimeType ||
          (asset.type === "video"
            ? "video/mp4"
            : "image/jpeg"),
      );
      setEditorPreview(asset.uri);
    };

  const getFilterStyle = () => {
    const extra =
      activeFilter === "vintage"
        ? "sepia"
        : activeFilter === "mono"
          ? "mono"
          : activeFilter === "cyberpunk"
            ? "cyberpunk"
            : activeFilter === "warm"
              ? "warm"
              : activeFilter === "cool"
                ? "cool"
                : "normal";

    return {
      opacity:
        brightness === 100 &&
        contrast === 100 &&
        saturation === 100 &&
        blur === 0
          ? 1
          : 0.98,
      transform: [
        {
          rotate: `${rotation}deg`,
        },
      ],
      borderWidth:
        extra === "normal" ? 0 : 1,
      borderColor:
        extra === "normal"
          ? "transparent"
          : "rgba(255,255,255,0.18)",
    };
  };

  const shareStory = async () => {
    if (
      !editorPreview &&
      !editorFileUri
    ) {
      return;
    }

    setIsPublishing(true);

    try {
      let mediaUrl =
        editorPreview;

      if (editorFileUri) {
        const formData =
          new FormData();

        formData.append(
          "image",
          {
            uri: editorFileUri,
            name:
              `story_${Date.now()}.` +
              (editorMimeType?.includes(
                "video",
              )
                ? "mp4"
                : "jpg"),
            type:
              editorMimeType ||
              "image/jpeg",
          } as any,
        );

        const uploadRes =
          await api.post(
            "/api/upload",
            formData,
          );

        mediaUrl =
          uploadRes.data?.data?.url ||
          uploadRes.data?.url ||
          "";
      }

      await api.post(
        "/api/stories",
        {
          media: [
            {
              url: mediaUrl,
              type:
                editorMimeType?.includes(
                  "video",
                )
                  ? "video"
                  : "image",
            },
          ],
          stickers: overlayText
            ? [
                {
                  text: overlayText,
                  color: textColor,
                },
              ]
            : [],
        },
      );

      showToast(
        "success",
        "Story Posted!",
        "Your story is live for 24 hours.",
      );

      setEditorFileUri(null);
      setEditorMimeType(null);
      setEditorPreview("");
      setOverlayText("");

      setActiveTab("feed");
      await fetchStories();
    } catch (error: any) {
      showToast(
        "error",
        "Failed to post story",
        error?.response?.data?.message ||
          "",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleNextStory =
    () => {
      if (activeGroupIndex === null) {
        return;
      }

      const currentGroup =
        storyGroups[
          activeGroupIndex
        ];

      if (!currentGroup) {
        return;
      }

      if (
        activeStoryIndex <
        currentGroup.stories.length - 1
      ) {
        setActiveStoryIndex(
          (previous) =>
            previous + 1,
        );
        return;
      }

      if (
        activeGroupIndex <
        storyGroups.length - 1
      ) {
        setActiveGroupIndex(
          (previous) =>
            previous !== null ? previous + 1 : null,
        );
        setActiveStoryIndex(0);
        return;
      }

      setActiveGroupIndex(null);
    };

  const handlePrevStory =
    () => {
      if (activeGroupIndex === null) {
        return;
      }

      if (activeStoryIndex > 0) {
        setActiveStoryIndex(
          (previous) =>
            previous - 1,
        );
        return;
      }

      if (activeGroupIndex > 0) {
        const previousGroup =
          storyGroups[
            activeGroupIndex - 1
          ];

        setActiveGroupIndex(
          (previous) =>
            previous !== null ? previous - 1 : null,
        );

        setActiveStoryIndex(
          Math.max(
            0,
            previousGroup?.stories
              ?.length -
              1,
          ),
        );
      }
    };

  const handleReply = async () => {
    if (
      !replyText.trim() ||
      activeGroupIndex === null
    ) {
      return;
    }

    const currentGroup =
      storyGroups[
        activeGroupIndex
      ];

    const currentStory =
      currentGroup?.stories[
        activeStoryIndex
      ];

    if (!currentStory) {
      return;
    }

    try {
      await api.post(
        `/api/stories/${currentStory._id}/reply`,
        {
          message: replyText.trim(),
        },
      );

      showToast(
        "success",
        "Reply Sent!",
        `Replied to @${currentGroup?.user?.username || "user"}`,
      );

      setReplyText("");
    } catch {
      showToast(
        "error",
        "Failed to send reply",
        "",
      );
    }
  };

  const selectGroup =
    (groupIndex: number) => {
      setActiveGroupIndex(
        groupIndex,
      );
      setActiveStoryIndex(0);
    };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <FlatList<any>
        data={
          activeTab === "archive"
            ? archivedStories
            : storyGroups
        }
        keyExtractor={(
          item: any,
          index,
        ) =>
          String(
            item?._id ||
              item?.user?._id ||
              index,
          )
        }
        numColumns={
          activeTab === "feed" ? 2 : 1
        }
        contentContainerStyle={
          styles.content
        }
        columnWrapperStyle={
          activeTab === "feed"
            ? styles.column
            : undefined
        }
        showsVerticalScrollIndicator={
          false
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft
                  size={22}
                  color="#0f172a"
                />
              </Pressable>

              <View
                style={
                  styles.headerTitleWrap
                }
              >
                <View
                  style={styles.headerIcon}
                >
                  <Sparkles
                    size={20}
                    color="#a855f7"
                  />
                </View>

                <View style={styles.headerText}>
                  <Text
                    style={styles.title}
                  >
                    Stories & Lenses Studio
                  </Text>

                  <Text
                    style={
                      styles.subtitle
                    }
                  >
                    24-hour stories, editor,
                    filters and archive
                  </Text>
                </View>
              </View>
            </View>

            <FlatList
              horizontal
              data={[
                {
                  id: "feed" as Tab,
                  label: "Stories Feed",
                  icon: Clock,
                },
                {
                  id: "editor" as Tab,
                  label: "Camera Editor",
                  icon: Wand2,
                },
                {
                  id: "archive" as Tab,
                  label: "Archive",
                  icon: Archive,
                },
              ]}
              keyExtractor={(item) =>
                item.id
              }
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.tabs
              }
              renderItem={({ item }) => {
                const Icon = item.icon;
                const active =
                  activeTab === item.id;

                return (
                  <Pressable
                    onPress={() => {
                      setActiveTab(
                        item.id,
                      );

                      if (
                        item.id ===
                        "archive"
                      ) {
                        void fetchArchive();
                      }
                    }}
                    style={[
                      styles.tabButton,
                      active &&
                        styles.tabButtonActive,
                    ]}
                  >
                    <Icon
                      size={15}
                      color={
                        active
                          ? "#ffffff"
                          : "#64748b"
                      }
                    />

                    <Text
                      style={[
                        styles.tabText,
                        active &&
                          styles.tabTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {activeTab === "feed" &&
              loading && (
                <View
                  style={
                    styles.loadingCard
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#a855f7"
                  />
                </View>
              )}

            {activeTab === "feed" &&
              !loading && (
                <Pressable
                  onPress={() =>
                    setActiveTab(
                      "editor",
                    )
                  }
                  style={
                    styles.addStoryCard
                  }
                >
                  <View
                    style={
                      styles.addStoryIcon
                    }
                  >
                    <Plus
                      size={24}
                      color="#ffffff"
                    />
                  </View>

                  <Text
                    style={
                      styles.addStoryText
                    }
                  >
                    Add Story
                  </Text>
                </Pressable>
              )}

            {activeTab === "editor" && (
              <View style={styles.editorWrap}>
                <View
                  style={
                    styles.editorPreviewBox
                  }
                >
                  {editorPreview ? (
                    <View
                      style={
                        styles.previewContainer
                      }
                    >
                      <Image
                        source={{
                          uri: editorPreview,
                        }}
                        resizeMode="cover"
                        style={[
                          styles.previewImage,
                          getFilterStyle(),
                        ]}
                      />

                      {!!overlayText && (
                        <Text
                          style={[
                            styles.overlayText,
                            {
                              color:
                                textColor,
                            },
                          ]}
                        >
                          {
                            overlayText
                          }
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View
                      style={
                        styles.editorEmpty
                      }
                    >
                      <ImageIcon
                        size={46}
                        color="#a855f7"
                      />

                      <Text
                        style={
                          styles.editorEmptyTitle
                        }
                      >
                        Select Photo / Video
                      </Text>

                      <Text
                        style={
                          styles.editorEmptySubtitle
                        }
                      >
                        Choose media from your
                        device
                      </Text>

                      <Pressable
                        onPress={
                          selectEditorMedia
                        }
                        style={
                          styles.selectButton
                        }
                      >
                        <Text
                          style={
                            styles.selectButtonText
                          }
                        >
                          Select Media
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {!!editorPreview && (
                  <>
                    <Pressable
                      onPress={
                        selectEditorMedia
                      }
                      style={
                        styles.secondaryButton
                      }
                    >
                      <Text
                        style={
                          styles.secondaryButtonText
                        }
                      >
                        Change Media
                      </Text>
                    </Pressable>

                    <View
                      style={
                        styles.editorCard
                      }
                    >
                      <View
                        style={
                          styles.editorCardHeader
                        }
                      >
                        <Sliders
                          size={18}
                          color="#a855f7"
                        />

                        <Text
                          style={
                            styles.editorCardTitle
                          }
                        >
                          Filter Presets & Lenses
                        </Text>
                      </View>

                      <FlatList
                        horizontal
                        data={[
                          "normal",
                          "vintage",
                          "cyberpunk",
                          "mono",
                          "warm",
                          "cool",
                        ]}
                        keyExtractor={(item) =>
                          item
                        }
                        showsHorizontalScrollIndicator={
                          false
                        }
                        contentContainerStyle={
                          styles.filterList
                        }
                        renderItem={({
                          item,
                        }) => {
                          const active =
                            activeFilter ===
                            item;

                          return (
                            <Pressable
                              onPress={() =>
                                setActiveFilter(
                                  item,
                                )
                              }
                              style={[
                                styles.filterButton,
                                active &&
                                  styles.filterActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.filterText,
                                  active &&
                                    styles.filterTextActive,
                                ]}
                              >
                                {item}
                              </Text>
                            </Pressable>
                          );
                        }}
                      />

                      <Text
                        style={styles.editorLabel}
                      >
                        Rotation
                      </Text>

                      <View
                        style={
                          styles.adjustRow
                        }
                      >
                        <Pressable
                          onPress={() =>
                            setRotation(
                              (previous) =>
                                previous -
                                15,
                            )
                          }
                          style={
                            styles.adjustButton
                          }
                        >
                          <ChevronLeft
                            size={18}
                            color="#0f172a"
                          />
                        </Pressable>

                        <Text
                          style={
                            styles.adjustValue
                          }
                        >
                          {rotation}°
                        </Text>

                        <Pressable
                          onPress={() =>
                            setRotation(
                              (previous) =>
                                previous +
                                15,
                            )
                          }
                          style={
                            styles.adjustButton
                          }
                        >
                          <ChevronRight
                            size={18}
                            color="#0f172a"
                          />
                        </Pressable>
                      </View>

                      <Text
                        style={styles.editorLabel}
                      >
                        Text Overlay
                      </Text>

                      <TextInput
                        value={overlayText}
                        onChangeText={
                          setOverlayText
                        }
                        style={styles.input}
                        placeholder="Type story text overlay..."
                        placeholderTextColor="#94a3b8"
                      />

                      <Text
                        style={styles.editorLabel}
                      >
                        Text Color
                      </Text>

                      <View
                        style={
                          styles.colorRow
                        }
                      >
                        {[
                          "#ffffff",
                          "#000000",
                          "#ff0055",
                          "#ffcc00",
                          "#00ff66",
                          "#00ccff",
                          "#aa00ff",
                        ].map((color) => (
                          <Pressable
                            key={color}
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
                        ))}
                      </View>

                      <Pressable
                        onPress={() =>
                          void shareStory()
                        }
                        disabled={
                          isPublishing
                        }
                        style={[
                          styles.publishButton,
                          isPublishing &&
                            styles.publishDisabled,
                        ]}
                      >
                        {isPublishing ? (
                          <ActivityIndicator
                            size="small"
                            color="#ffffff"
                          />
                        ) : (
                          <Send
                            size={18}
                            color="#ffffff"
                          />
                        )}

                        <Text
                          style={
                            styles.publishText
                          }
                        >
                          {isPublishing
                            ? "Publishing..."
                            : "Publish to Story"}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            )}

            {activeTab ===
              "archive" &&
              loadingArchive && (
                <View
                  style={
                    styles.loadingCard
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#a855f7"
                  />
                </View>
              )}
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === "feed") {
            const group =
              item as StoryGroup;

            const imageUrl =
              group.stories?.[0]
                ?.media?.[0]?.url;

            return (
              <Pressable
                onPress={() =>
                  selectGroup(
                    storyGroups.findIndex(
                      (entry) =>
                        entry ===
                        group,
                    ),
                  )
                }
                style={
                  styles.storyCard
                }
              >
                {imageUrl ? (
                  <Image
                    source={{
                      uri: imageUrl,
                    }}
                    style={
                      styles.storyImage
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.storyImagePlaceholder
                    }
                  >
                    <ImageIcon
                      size={28}
                      color="#94a3b8"
                    />
                  </View>
                )}

                <View
                  style={
                    styles.storyOverlay
                  }
                >
                  <View
                    style={
                      styles.storyUserRow
                    }
                  >
                    <Avatar
                      src={
                        group.user
                          ?.profilePicture ||
                        group.user
                          ?.avatar
                      }
                      fallback={
                        group.user
                          ?.username?.charAt(
                            0,
                          ) || "U"
                      }
                      style={
                        styles.storyAvatar
                      }
                    />

                    <Text
                      style={
                        styles.storyUsername
                      }
                      numberOfLines={1}
                    >
                      @
                      {group.user
                        ?.username ||
                        "user"}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.storyCount
                    }
                  >
                    {group.stories
                      ?.length || 0}{" "}
                    {group.stories
                      ?.length === 1
                      ? "story"
                      : "stories"}
                  </Text>
                </View>
              </Pressable>
            );
          }

          const story =
            item as unknown as ArchivedStory;

          return (
            <View
              style={
                styles.archiveItem
              }
            >
              {story.media?.[0]?.url ? (
                <Image
                  source={{
                    uri: story.media[0].url,
                  }}
                  style={
                    styles.archiveImage
                  }
                />
              ) : null}

              <View
                style={
                  styles.archiveText
                }
              >
                <Text
                  style={
                    styles.archiveTitle
                  }
                >
                  Archived Story
                </Text>

                <Text
                  style={
                    styles.archiveSubtitle
                  }
                >
                  Tap to preview from your
                  archive
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading &&
          !loadingArchive &&
          activeTab !== "editor" ? (
            <View
              style={
                styles.emptyArchive
              }
            >
              <Archive
                size={36}
                color="#94a3b8"
              />

              <Text
                style={
                  styles.emptyArchiveTitle
                }
              >
                {activeTab === "feed"
                  ? "No active stories"
                  : "No archived stories"}
              </Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={
          activeGroupIndex !== null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setActiveGroupIndex(null)
        }
      >
        {activeGroupIndex !== null &&
          storyGroups[
            activeGroupIndex
          ] && (
            <View style={styles.viewerBackdrop}>
              <View style={styles.viewer}>
                <View
                  style={
                    styles.viewerTop
                  }
                >
                  <View
                    style={
                      styles.progressRow
                    }
                  >
                    {storyGroups[
                      activeGroupIndex
                    ].stories.map(
                      (_, index) => (
                        <View
                          key={
                            `progress-${index}`
                          }
                          style={[
                            styles.progressTrack,
                            index <=
                              activeStoryIndex &&
                              styles.progressActive,
                          ]}
                        />
                      ),
                    )}
                  </View>

                  <View
                    style={
                      styles.viewerUserRow
                    }
                  >
                    <View
                      style={
                        styles.viewerUser
                      }
                    >
                      <Avatar
                        src={
                          storyGroups[
                            activeGroupIndex
                          ].user
                            ?.profilePicture ||
                          storyGroups[
                            activeGroupIndex
                          ].user?.avatar
                        }
                        fallback={
                          storyGroups[
                            activeGroupIndex
                          ].user
                            ?.username?.charAt(
                              0,
                            ) ||
                          "U"
                        }
                        style={
                          styles.viewerAvatar
                        }
                      />

                      <Text
                        style={
                          styles.viewerUsername
                        }
                      >
                        @
                        {storyGroups[
                          activeGroupIndex
                        ].user?.username ||
                          "user"}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.viewerActions
                      }
                    >
                      <Pressable
                        onPress={() =>
                          setShowViewersModal(
                            true,
                          )
                        }
                        style={
                          styles.smallButton
                        }
                      >
                        <Eye
                          size={15}
                          color="#ffffff"
                        />
                        <Text
                          style={
                            styles.smallButtonText
                          }
                        >
                          Viewers
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          setActiveGroupIndex(
                            null,
                          )
                        }
                        style={
                          styles.closeButton
                        }
                      >
                        <X
                          size={19}
                          color="#ffffff"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View
                  style={
                    styles.viewerMedia
                  }
                >
                  <Pressable
                    onPress={
                      handlePrevStory
                    }
                    style={
                      styles.viewerPrev
                    }
                  />

                  {storyGroups[
                    activeGroupIndex
                  ].stories[
                    activeStoryIndex
                  ]?.media?.[0]?.url ? (
                    <Image
                      source={{
                        uri:
                          storyGroups[
                            activeGroupIndex
                          ].stories[
                            activeStoryIndex
                          ].media?.[0]?.url,
                      }}
                      resizeMode="contain"
                      style={
                        styles.viewerImage
                      }
                    />
                  ) : null}

                  <Pressable
                    onPress={
                      handleNextStory
                    }
                    style={
                      styles.viewerNext
                    }
                  />
                </View>

                <View
                  style={
                    styles.replyBar
                  }
                >
                  <TextInput
                    value={replyText}
                    onChangeText={
                      setReplyText
                    }
                    placeholder="Send a story reply..."
                    placeholderTextColor="rgba(255,255,255,0.55)"
                    style={
                      styles.replyInput
                    }
                  />

                  <Pressable
                    onPress={() =>
                      void handleReply()
                    }
                    style={
                      styles.replyButton
                    }
                  >
                    <Send
                      size={17}
                      color="#ffffff"
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
      </Modal>

      <Modal
        visible={showViewersModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowViewersModal(false)
        }
      >
        <View
          style={
            styles.sheetBackdrop
          }
        >
          <View style={styles.sheet}>
            <View
              style={
                styles.sheetHeader
              }
            >
              <Text
                style={
                  styles.sheetTitle
                }
              >
                Story Viewers
              </Text>

              <Pressable
                onPress={() =>
                  setShowViewersModal(
                    false,
                  )
                }
                style={
                  styles.closeSheetButton
                }
              >
                <X
                  size={19}
                  color="#0f172a"
                />
              </Pressable>
            </View>

            <View
              style={
                styles.sheetEmpty
              }
            >
              <Eye
                size={34}
                color="#94a3b8"
              />
              <Text
                style={
                  styles.sheetDescription
                }
              >
                Viewer analytics are
                available from the story
                analytics endpoint.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 10,
  },

  headerTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(168,85,247,0.10)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748b",
  },

  tabs: {
    gap: 8,
    paddingBottom: 16,
  },

  tabButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  tabButtonActive: {
    backgroundColor: "#a855f7",
    borderColor: "#a855f7",
  },

  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },

  tabTextActive: {
    color: "#ffffff",
  },

  column: {
    gap: 8,
  },

  loadingCard: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  addStoryCard: {
    width: "100%",
    minHeight: 96,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(168,85,247,0.45)",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  addStoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  addStoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },

  storyCard: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 9 / 15,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#111827",
    marginBottom: 8,
  },

  storyImage: {
    width: "100%",
    height: "100%",
  },

  storyImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },

  storyOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    padding: 10,
    justifyContent: "space-between",
  },

  storyUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  storyAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },

  storyUsername: {
    flex: 1,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },

  storyCount: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.45)",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  editorWrap: {
    marginBottom: 16,
  },

  editorPreviewBox: {
    width: "100%",
    aspectRatio: 9 / 15,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#111827",
    marginBottom: 10,
  },

  previewContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  overlayText: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "48%",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "#000000",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 4,
  },

  editorEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  editorEmptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },

  editorEmptySubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },

  selectButton: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },

  selectButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  secondaryButton: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  secondaryButtonText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },

  editorCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 14,
  },

  editorCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  editorCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },

  filterList: {
    gap: 8,
    marginBottom: 13,
  },

  filterButton: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  filterActive: {
    backgroundColor: "#a855f7",
    borderColor: "#a855f7",
  },

  filterText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "capitalize",
  },

  filterTextActive: {
    color: "#ffffff",
  },

  editorLabel: {
    marginTop: 8,
    marginBottom: 7,
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },

  adjustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 10,
  },

  adjustButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  adjustValue: {
    minWidth: 55,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },

  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    color: "#0f172a",
    fontSize: 13,
  },

  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  colorDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },

  colorDotActive: {
    borderColor: "#0f172a",
  },

  publishButton: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#a855f7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  publishDisabled: {
    opacity: 0.6,
  },

  publishText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  archiveItem: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
  },

  archiveImage: {
    width: 78,
    height: 102,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    marginRight: 12,
  },

  archiveText: {
    flex: 1,
  },

  archiveTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },

  archiveSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
  },

  emptyArchive: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyArchiveTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
  },

  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    padding: 12,
    justifyContent: "center",
  },

  viewer: {
    flex: 1,
    backgroundColor: "#000000",
    borderRadius: 24,
    overflow: "hidden",
  },

  viewerTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    padding: 12,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  progressRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 10,
  },

  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  progressActive: {
    backgroundColor: "#ffffff",
  },

  viewerUserRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewerUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  viewerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#ffffff",
  },

  viewerUsername: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  viewerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  smallButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  smallButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  viewerMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  viewerImage: {
    width: "100%",
    height: "100%",
  },

  viewerPrev: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "33%",
    zIndex: 5,
  },

  viewerNext: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "33%",
    zIndex: 5,
  },

  replyBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 14,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  replyInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 15,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    color: "#ffffff",
    fontSize: 13,
  },

  replyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  sheet: {
    minHeight: 250,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  closeSheetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetEmpty: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  sheetDescription: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748b",
    textAlign: "center",
  },
});