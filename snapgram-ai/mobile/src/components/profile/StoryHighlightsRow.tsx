import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Check,
  Plus,
  X,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { StoryViewer } from "../feed/StoryViewer";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop";

interface StoryMedia {
  url?: string;
  type?: string;
}

interface HighlightStory {
  _id: string;
  createdAt?: string;
  media?: StoryMedia[];
  music?: {
    audioUrl?: string;
    title?: string;
    artist?: string;
  };
  viewers?: Array<
    string | {
      _id: string;
      username?: string;
      profilePicture?: string;
      avatar?: string;
    }
  >;
  likes?: Array<
    string | {
      _id: string;
      username?: string;
      profilePicture?: string;
      avatar?: string;
    }
  >;
  allowReplies?: boolean;
  allowSharing?: boolean;
  allowDownload?: boolean;
  privacy?: string;
}

interface StoryHighlight {
  _id: string;
  title: string;
  coverImage?: string;
  stories?: HighlightStory[];
}

interface ArchivedStory {
  _id: string;
  createdAt?: string;
  media?: StoryMedia[];
}

interface ApiListResponse<T> {
  success?: boolean;
  data?: T[];
}

interface ApiItemResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

export interface StoryHighlightsRowProps {
  userId?: string | number;
  isOwnProfile?: boolean;
}

const normalizeStoriesForViewer = (
  highlight: StoryHighlight,
): Array<
  HighlightStory & {
    createdAt: string;
  }
> => {
  const stories = Array.isArray(
    highlight.stories,
  )
    ? highlight.stories
        .filter(
          (story) =>
            story &&
            typeof story === "object" &&
            Boolean(story._id),
        )
        .map((story) => ({
          ...story,
          _id: story._id.toString(),
          createdAt:
            story.createdAt ||
            new Date().toISOString(),
        }))
    : [];

  if (stories.length > 0) {
    return stories;
  }

  return [
    {
      _id: `highlight-${highlight._id}`,
      createdAt:
        new Date().toISOString(),
      media: [
        {
          url:
            highlight.coverImage ||
            FALLBACK_COVER,
          type: "image",
        },
      ],
    },
  ];
};

export const StoryHighlightsRow = ({
  userId,
  isOwnProfile = false,
}: StoryHighlightsRowProps) => {
  const { effectiveTheme } = useTheme();

  const normalizedUserId =
    userId?.toString();

  const darkMode =
    effectiveTheme === "dark";

  const colors = useMemo(
    () => ({
      background: darkMode
        ? "#0a0510"
        : "#f8fafc",
      surface: darkMode
        ? "#130a1c"
        : "#ffffff",
      surfaceHover: darkMode
        ? "#1e112c"
        : "#f1f5f9",
      textPrimary: darkMode
        ? "#f8fafc"
        : "#0f172a",
      textSecondary: darkMode
        ? "#94a3b8"
        : "#64748b",
      border: darkMode
        ? "#2d1b3b"
        : "#e2e8f0",
      primary: "#a855f7",
    }),
    [darkMode],
  );

  const [
    highlights,
    setHighlights,
  ] = useState<StoryHighlight[]>([]);

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [title, setTitle] =
    useState("");

  const [
    archivedStories,
    setArchivedStories,
  ] = useState<ArchivedStory[]>([]);

  const [
    selectedStoryIds,
    setSelectedStoryIds,
  ] = useState<string[]>([]);

  const [
    activeHighlight,
    setActiveHighlight,
  ] = useState<StoryHighlight | null>(
    null,
  );

  const [
    loadingHighlights,
    setLoadingHighlights,
  ] = useState(false);

  const [
    loadingArchive,
    setLoadingArchive,
  ] = useState(false);

  const [
    creatingHighlight,
    setCreatingHighlight,
  ] = useState(false);

  useEffect(() => {
    if (!normalizedUserId) {
      setHighlights([]);
      return;
    }

    let mounted = true;

    const fetchHighlights =
      async () => {
        setLoadingHighlights(true);

        try {
          const response =
            await api.get<
              ApiListResponse<StoryHighlight>
            >(
              `/api/stories/highlights/${normalizedUserId}`,
            );

          if (mounted) {
            setHighlights(
              Array.isArray(
                response.data.data,
              )
                ? response.data.data
                : [],
            );
          }
        } catch (error) {
          console.error(
            "Failed to load story highlights",
            error,
          );
        } finally {
          if (mounted) {
            setLoadingHighlights(false);
          }
        }
      };

    void fetchHighlights();

    return () => {
      mounted = false;
    };
  }, [normalizedUserId]);

  const handleOpenCreateModal =
    useCallback(async () => {
      setShowCreateModal(true);
      setLoadingArchive(true);

      try {
        const response =
          await api.get<
            ApiListResponse<ArchivedStory>
          >("/api/stories/archive");

        setArchivedStories(
          Array.isArray(response.data.data)
            ? response.data.data
            : [],
        );
      } catch (error) {
        console.error(
          "Failed to fetch archive",
          error,
        );
      } finally {
        setLoadingArchive(false);
      }
    }, []);

  const toggleSelectStory =
    useCallback((storyId: string) => {
      setSelectedStoryIds(
        (currentIds) =>
          currentIds.includes(storyId)
            ? currentIds.filter(
                (id) => id !== storyId,
              )
            : [
                ...currentIds,
                storyId,
              ],
      );
    }, []);

  const handleCreateHighlight =
    useCallback(async () => {
      if (
        !title.trim() ||
        creatingHighlight
      ) {
        return;
      }

      setCreatingHighlight(true);

      try {
        const selectedStories =
          archivedStories.filter(
            (story) =>
              selectedStoryIds.includes(
                story._id,
              ),
          );

        const coverImage =
          selectedStories[0]?.media?.[0]
            ?.url || FALLBACK_COVER;

        const storyIds =
          selectedStoryIds.length > 0
            ? selectedStoryIds
            : archivedStories[0]
              ? [archivedStories[0]._id]
              : [];

        const response =
          await api.post<
            ApiItemResponse<StoryHighlight>
          >("/api/stories/highlights", {
            title,
            coverImage,
            stories: storyIds,
          });

        if (response.data.data) {
          setHighlights(
            (currentHighlights) => [
              ...currentHighlights,
              response.data
                .data as StoryHighlight,
            ],
          );
        }

        setTitle("");
        setSelectedStoryIds([]);
        setShowCreateModal(false);
      } catch (error) {
        console.error(
          "Failed to create highlight",
          error,
        );
      } finally {
        setCreatingHighlight(false);
      }
    }, [
      archivedStories,
      creatingHighlight,
      selectedStoryIds,
      title,
    ]);

  const viewerStories = useMemo(
    () =>
      activeHighlight
        ? normalizeStoriesForViewer(
            activeHighlight,
          )
        : [],
    [activeHighlight],
  );

  const renderHighlight = useCallback(
    ({
      item,
    }: {
      item: StoryHighlight;
    }) => (
      <Pressable
        onPress={() =>
          setActiveHighlight(item)
        }
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title} highlight`}
        style={({ pressed }) => [
          styles.highlightItem,
          pressed &&
            styles.pressedHighlight,
        ]}
      >
        <LinearGradient
          colors={[
            "#facc15",
            "#a855f7",
            "#9333ea",
          ]}
          start={{
            x: 0,
            y: 1,
          }}
          end={{
            x: 1,
            y: 0,
          }}
          style={styles.highlightRing}
        >
          <View
            style={[
              styles.highlightImageBorder,
              {
                borderColor:
                  colors.background,
              },
            ]}
          >
            <Image
              source={{
                uri:
                  item.coverImage ||
                  FALLBACK_COVER,
              }}
              style={
                styles.highlightImage
              }
              resizeMode="cover"
              accessibilityLabel={
                item.title
              }
            />
          </View>
        </LinearGradient>

        <Text
          numberOfLines={1}
          style={[
            styles.highlightTitle,
            {
              color:
                colors.textPrimary,
            },
          ]}
        >
          {item.title}
        </Text>
      </Pressable>
    ),
    [
      colors.background,
      colors.textPrimary,
    ],
  );

  const renderNewHighlight = () => {
    if (!isOwnProfile) {
      return null;
    }

    return (
      <Pressable
        onPress={() =>
          void handleOpenCreateModal()
        }
        accessibilityRole="button"
        accessibilityLabel="Create new story highlight"
        style={({ pressed }) => [
          styles.highlightItem,
          pressed &&
            styles.pressedHighlight,
        ]}
      >
        <View
          style={[
            styles.newHighlightCircle,
            {
              backgroundColor:
                colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Plus
            size={25}
            color={colors.textSecondary}
          />
        </View>

        <Text
          style={[
            styles.highlightTitle,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          New
        </Text>
      </Pressable>
    );
  };

  const renderArchivedStory = (
    story: ArchivedStory,
  ) => {
    const selected =
      selectedStoryIds.includes(
        story._id,
      );

    const mediaUrl =
      story.media?.[0]?.url;

    return (
      <Pressable
        key={story._id}
        onPress={() =>
          toggleSelectStory(story._id)
        }
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: selected,
        }}
        accessibilityLabel="Select archived story"
        style={[
          styles.archiveItem,
          {
            borderColor: selected
              ? colors.primary
              : "transparent",
            transform: [
              {
                scale: selected
                  ? 0.96
                  : 1,
              },
            ],
          },
        ]}
      >
        {mediaUrl ? (
          <Image
            source={{
              uri: mediaUrl,
            }}
            style={styles.archiveImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.archivePlaceholder,
              {
                backgroundColor:
                  colors.surfaceHover,
              },
            ]}
          >
            <Text
              style={[
                styles.archivePlaceholderText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              No media
            </Text>
          </View>
        )}

        {selected ? (
          <View
            style={[
              styles.selectedBadge,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
          >
            <Check
              size={14}
              color="#ffffff"
              strokeWidth={3}
            />
          </View>
        ) : null}
      </Pressable>
    );
  };

  if (!normalizedUserId) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
        },
      ]}
    >
      {loadingHighlights &&
      highlights.length === 0 ? (
        <View
          style={styles.loadingHighlights}
        >
          <ActivityIndicator
            size="small"
            color={colors.primary}
          />
        </View>
      ) : (
        <FlatList
          horizontal
          data={highlights}
          keyExtractor={(item) =>
            item._id
          }
          renderItem={renderHighlight}
          ListHeaderComponent={
            renderNewHighlight
          }
          contentContainerStyle={
            styles.highlightList
          }
          showsHorizontalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {activeHighlight ? (
        <StoryViewer
          stories={[
            {
              user: {
                _id: normalizedUserId,
                username:
                  activeHighlight.title,
              },
              stories: viewerStories,
            },
          ]}
          initialUserIndex={0}
          onClose={() =>
            setActiveHighlight(null)
          }
        />
      ) : null}

      <Modal
        visible={showCreateModal}
        transparent
        statusBarTranslucent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() =>
          setShowCreateModal(false)
        }
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.overlay}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor:
                    colors.surface,
                  borderColor:
                    colors.border,
                },
              ]}
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color:
                        colors.textPrimary,
                    },
                  ]}
                >
                  New Story Highlight
                </Text>

                <Pressable
                  onPress={() =>
                    setShowCreateModal(
                      false,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Close create highlight"
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && {
                      backgroundColor:
                        colors.surfaceHover,
                    },
                  ]}
                >
                  <X
                    size={21}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              </View>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Highlight Name (e.g. Summer '26)"
                placeholderTextColor={
                  colors.textSecondary
                }
                maxLength={60}
                editable={
                  !creatingHighlight
                }
                accessibilityLabel="Highlight name"
                style={[
                  styles.titleInput,
                  {
                    color:
                      colors.textPrimary,
                    backgroundColor:
                      colors.background,
                    borderColor:
                      colors.border,
                  },
                ]}
              />

              <Text
                style={[
                  styles.archiveLabel,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Select Stories from Archive:
              </Text>

              <View
                style={[
                  styles.archiveContainer,
                  {
                    backgroundColor:
                      colors.background,
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                {loadingArchive ? (
                  <View
                    style={
                      styles.archiveEmpty
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color={
                        colors.primary
                      }
                    />
                  </View>
                ) : archivedStories.length ===
                  0 ? (
                  <View
                    style={
                      styles.archiveEmpty
                    }
                  >
                    <Text
                      style={[
                        styles.archiveEmptyText,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      No archived stories found
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={
                      false
                    }
                    contentContainerStyle={
                      styles.archiveGrid
                    }
                  >
                    {archivedStories.map(
                      renderArchivedStory,
                    )}
                  </ScrollView>
                )}
              </View>

              <Pressable
                onPress={() =>
                  void handleCreateHighlight()
                }
                disabled={
                  creatingHighlight ||
                  !title.trim()
                }
                accessibilityRole="button"
                accessibilityLabel="Create highlight"
                style={({ pressed }) => [
                  styles.createButton,
                  {
                    backgroundColor:
                      colors.primary,
                  },
                  pressed &&
                    styles.pressedButton,
                  (creatingHighlight ||
                    !title.trim()) &&
                    styles.disabledButton,
                ]}
              >
                {creatingHighlight ? (
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                  />
                ) : (
                  <Text
                    style={
                      styles.createButtonText
                    }
                  >
                    Create Highlight
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  highlightList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16,
  },

  highlightItem: {
    width: 70,
    alignItems: "center",
    gap: 7,
  },

  pressedHighlight: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  highlightRing: {
    width: 66,
    height: 66,
    padding: 2,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },

  highlightImageBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
    borderWidth: 2,
    overflow: "hidden",
  },

  highlightImage: {
    width: "100%",
    height: "100%",
  },

  newHighlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },

  highlightTitle: {
    width: 70,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  loadingHighlights: {
    height: 89,
    alignItems: "center",
    justifyContent: "center",
  },

  keyboardView: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    padding: 16,
    backgroundColor:
      "rgba(0,0,0,0.70)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCard: {
    width: "100%",
    maxWidth: 432,
    maxHeight: "85%",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  titleInput: {
    width: "100%",
    minHeight: 46,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
  },

  archiveLabel: {
    fontSize: 12,
    fontWeight: "800",
  },

  archiveContainer: {
    minHeight: 180,
    maxHeight: 270,
    borderRadius: 13,
    borderWidth: 1,
    padding: 7,
    overflow: "hidden",
  },

  archiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  archiveItem: {
    position: "relative",
    width: "31.5%",
    aspectRatio: 9 / 16,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
  },

  archiveImage: {
    width: "100%",
    height: "100%",
  },

  archivePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  archivePlaceholderText: {
    fontSize: 10,
    fontWeight: "600",
  },

  selectedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  archiveEmpty: {
    minHeight: 164,
    alignItems: "center",
    justifyContent: "center",
  },

  archiveEmptyText: {
    fontSize: 12,
    textAlign: "center",
  },

  createButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  pressedButton: {
    opacity: 0.76,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  disabledButton: {
    opacity: 0.5,
  },
});