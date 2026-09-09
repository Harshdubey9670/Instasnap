import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Audio,
  ResizeMode,
  Video,
} from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Settings,
  UploadCloud,
  Video as VideoIcon,
  X,
} from "lucide-react-native";

import api from "../../services/api";
import {
  useToast,
} from "../ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";

const DRAFT_KEY =
  "postDraft";

const MAX_FILES = 10;
const MAX_FILE_SIZE =
  50 * 1024 * 1024;

type MediaType =
  | "image"
  | "video";

interface NativeMedia {
  asset: ImagePicker.ImagePickerAsset;
  type: MediaType;
  altText: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (
    post: unknown,
  ) => void;
}

export const CreatePostModal =
  ({
    isOpen,
    onClose,
    onPostCreated,
  }: CreatePostModalProps) => {
    const {
      toast,
    } = useToast();

    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme ===
      "dark";

    const [
      media,
      setMedia,
    ] = useState<
      NativeMedia[]
    >([]);

    const [
      caption,
      setCaption,
    ] = useState("");

    const [
      location,
      setLocation,
    ] = useState("");

    const [
      commentsEnabled,
      setCommentsEnabled,
    ] = useState(true);

    const [
      hideLikes,
      setHideLikes,
    ] = useState(false);

    const [
      isLoading,
      setIsLoading,
    ] = useState(false);

    const [
      uploadProgress,
      setUploadProgress,
    ] = useState(0);

    const [
      currentIndex,
      setCurrentIndex,
    ] = useState(0);

    const [
      showSettings,
      setShowSettings,
    ] = useState(false);

    const currentMedia =
      media[
        currentIndex
      ];

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const loadDraft =
        async () => {
          try {
            const raw =
              await AsyncStorage.getItem(
                DRAFT_KEY,
              );

            if (!raw) {
              return;
            }

            const draft =
              JSON.parse(
                raw,
              );

            setCaption(
              draft.caption ||
                "",
            );

            setLocation(
              draft.location ||
                "",
            );

            setCommentsEnabled(
              draft.commentsEnabled ??
                true,
            );

            setHideLikes(
              draft.hideLikes ??
                false,
            );
          } catch (error) {
            console.error(
              "Failed to load post draft:",
              error,
            );
          }
        };

      void loadDraft();
    }, [isOpen]);

    useEffect(() => {
      if (
        currentIndex >=
          media.length &&
        media.length > 0
      ) {
        setCurrentIndex(
          media.length - 1,
        );
      }

      if (
        media.length === 0
      ) {
        setCurrentIndex(0);
      }
    }, [
      currentIndex,
      media.length,
    ]);

    const canAddMedia =
      media.length <
      MAX_FILES;

    const pickMedia =
      async () => {
        if (!canAddMedia) {
          toast({
            variant:
              "info",
            title:
              "Maximum media reached",
            description:
              "You can add up to 10 items.",
          });
          return;
        }

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          toast({
            variant:
              "error",
            title:
              "Permission required",
            description:
              "Please allow access to your photos and videos.",
          });
          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ImagePicker.MediaTypeOptions.All,
              allowsMultipleSelection:
                true,
              selectionLimit:
                MAX_FILES -
                media.length,
              quality: 1,
              videoMaxDuration:
                0,
            },
          );

        if (
          result.canceled ||
          !result.assets?.length
        ) {
          return;
        }

        const selected =
          result.assets;

        const accepted: NativeMedia[] =
          [];

        for (
          const asset of selected
        ) {
          if (
            !asset.fileSize
          ) {
            /*
             * Some native providers don't return fileSize.
             * Let the backend enforce its own size limits in
             * that case rather than incorrectly rejecting media.
             */
          } else if (
            asset.fileSize >
            MAX_FILE_SIZE
          ) {
            toast({
              variant:
                "error",
              title:
                "File too large",
              description:
                `${asset.fileName || "Selected media"} must be under 50MB.`,
            });
            continue;
          }

          const type =
            asset.type ===
            "video"
              ? "video"
              : "image";

          accepted.push({
            asset,
            type,
            altText: "",
          });
        }

        const combined =
          [
            ...media,
            ...accepted,
          ].slice(
            0,
            MAX_FILES,
          );

        setMedia(
          combined,
        );
      };

    const removeMedia =
      (
        index: number,
      ) => {
        setMedia(
          (
            previous,
          ) =>
            previous.filter(
              (
                _item,
                itemIndex,
              ) =>
                itemIndex !==
                index,
            ),
        );

        if (
          currentIndex >=
            media.length - 1 &&
          currentIndex > 0
        ) {
          setCurrentIndex(
            currentIndex - 1,
          );
        }
      };

    const updateAltText =
      (
        value: string,
      ) => {
        setMedia(
          (
            previous,
          ) =>
            previous.map(
              (
                item,
                index,
              ) =>
                index ===
                currentIndex
                  ? {
                      ...item,
                      altText:
                        value,
                    }
                  : item,
            ),
        );
      };

    const saveDraft =
      async () => {
        try {
          await AsyncStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
              caption,
              location,
              commentsEnabled,
              hideLikes,
            }),
          );

          toast({
            variant:
              "success",
            title:
              "Draft saved successfully!",
          });
        } catch {
          toast({
            variant:
              "error",
            title:
              "Failed to save draft",
          });
        }
      };

    const resetModal =
      () => {
        setMedia([]);
        setCaption("");
        setLocation("");
        setCommentsEnabled(
          true,
        );
        setHideLikes(
          false,
        );
        setIsLoading(
          false,
        );
        setUploadProgress(
          0,
        );
        setCurrentIndex(
          0,
        );
        setShowSettings(
          false,
        );
      };

    const handleClose =
      () => {
        if (isLoading) {
          return;
        }

        onClose();

        setTimeout(
          resetModal,
          250,
        );
      };

    const uploadFile =
      async (
        item: NativeMedia,
        index: number,
      ) => {
        const formData =
          new FormData();

        const asset =
          item.asset;

        const fileName =
          asset.fileName ||
          `media-${Date.now()}-${index}`;

        const mimeType =
          asset.mimeType ||
          (
            item.type ===
            "video"
              ? "video/mp4"
              : "image/jpeg"
          );

        formData.append(
          "image",
          {
            uri: asset.uri,
            name:
              fileName,
            type:
              mimeType,
          } as any,
        );

        const response =
          await api.post(
            "/api/upload",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },

              onUploadProgress:
                (
                  progressEvent,
                ) => {
                  if (
                    !progressEvent.total
                  ) {
                    return;
                  }

                  const baseProgress =
                    (index /
                      media.length) *
                    90;

                  const currentProgress =
                    (progressEvent.loaded *
                      100) /
                    progressEvent.total;

                  setUploadProgress(
                    baseProgress +
                      (currentProgress /
                        media.length) *
                        0.9,
                  );
                },
            },
          );

        return response;
      };

    const handleSubmit =
      async () => {
        if (
          media.length ===
            0 &&
          !caption.trim()
        ) {
          toast({
            variant:
              "error",
            title:
              "Please provide an image, video, or caption.",
          });
          return;
        }

        try {
          setIsLoading(
            true,
          );

          const mediaData: Array<{
            url: string;
            public_id: string;
            type:
              | "image"
              | "video";
            altText: string;
          }> = [];

          for (
            let index = 0;
            index <
            media.length;
            index += 1
          ) {
            const item =
              media[index];

            const uploadResponse =
              await uploadFile(
                item,
                index,
              );

            if (
              !uploadResponse
                .data
                ?.success
            ) {
              throw new Error(
                `Failed to upload media item ${index + 1}`,
              );
            }

            const {
              url,
              public_id,
              resource_type,
            } =
              uploadResponse.data
                .data;

            mediaData.push({
              url,
              public_id,
              type:
                resource_type ===
                "video"
                  ? "video"
                  : "image",
              altText:
                item.altText ||
                "",
            });
          }

          setUploadProgress(
            95,
          );

          const postResponse =
            await api.post(
              "/api/posts",
              {
                caption,
                location,
                mediaData,
                status:
                  "published",
                settings: {
                  commentsEnabled,
                  hideLikes,
                  sharingEnabled:
                    true,
                },
              },
            );

          if (
            postResponse.data
              ?.success
          ) {
            setUploadProgress(
              100,
            );

            await AsyncStorage.removeItem(
              DRAFT_KEY,
            );

            toast({
              variant:
                "success",
              title:
                "Post created successfully!",
            });

            onPostCreated?.(
              postResponse.data
                .data,
            );

            onClose();

            setTimeout(
              resetModal,
              250,
            );
          }
        } catch (
          error: any
        ) {
          console.error(
            "Post creation error:",
            error,
          );

          toast({
            variant:
              "error",
            title:
              error?.response
                ?.data
                ?.message ||
              "Failed to create post",
          });
        } finally {
          setIsLoading(
            false,
          );
        }
      };

    const mediaTitle =
      currentMedia?.type ===
      "video"
        ? "video"
        : "image";

    const submitDisabled =
      isLoading ||
      (
        media.length === 0 &&
        !caption.trim()
      );

    const progressLabel =
      `${Math.round(
        uploadProgress,
      )}%`;

    return (
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={
          handleClose
        }
      >
        <View
          style={
            styles.overlay
          }
        >
          <Pressable
            style={
              styles.backdrop
            }
            onPress={
              !isLoading
                ? handleClose
                : undefined
            }
          />

          <View
            style={[
              styles.modal,
              {
                backgroundColor:
                  dark
                    ? "#130a1c"
                    : "#f8fafc",
                borderColor:
                  dark
                    ? "#2d1b3b"
                    : "#e2e8f0",
              },
            ]}
          >
            <View
              style={[
                styles.header,
                {
                  borderBottomColor:
                    dark
                      ? "#2d1b3b"
                      : "#e2e8f0",
                },
              ]}
            >
              <Pressable
                onPress={
                  handleClose
                }
                disabled={
                  isLoading
                }
                hitSlop={8}
                style={
                  styles.headerButton
                }
              >
                <X
                  size={24}
                  color={
                    dark
                      ? "#f8fafc"
                      : "#0f172a"
                  }
                />
              </Pressable>

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
              >
                Create new post
              </Text>

              <View
                style={
                  styles.headerActions
                }
              >
                <Pressable
                  onPress={
                    saveDraft
                  }
                  disabled={
                    isLoading
                  }
                  style={
                    styles.draftButton
                  }
                >
                  <Text
                    style={
                      styles.draftText
                    }
                  >
                    Save
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    void handleSubmit()
                  }
                  disabled={
                    submitDisabled
                  }
                  style={[
                    styles.shareButton,
                    submitDisabled &&
                      styles.disabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                    />
                  ) : (
                    <Text
                      style={
                        styles.shareText
                      }
                    >
                      Share
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={
                styles.body
              }
              contentContainerStyle={
                styles.bodyContent
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
            >
              <View
                style={
                  styles.mediaSection
                }
              >
                {media.length ===
                0 ? (
                  <View
                    style={[
                      styles.emptyMedia,
                      {
                        backgroundColor:
                          dark
                            ? "#1e112c"
                            : "#ffffff",
                        borderColor:
                          dark
                            ? "#2d1b3b"
                            : "#e2e8f0",
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.mediaIcons
                      }
                    >
                      <ImageIcon
                        size={44}
                        color={
                          dark
                            ? "#94a3b8"
                            : "#64748b"
                        }
                      />

                      <VideoIcon
                        size={44}
                        color={
                          dark
                            ? "#94a3b8"
                            : "#64748b"
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.emptyTitle,
                        {
                          color:
                            dark
                              ? "#f8fafc"
                              : "#0f172a",
                        },
                      ]}
                    >
                      Add photos or videos
                    </Text>

                    <Text
                      style={[
                        styles.emptySubtitle,
                        {
                          color:
                            dark
                              ? "#94a3b8"
                              : "#64748b",
                        },
                      ]}
                    >
                      JPG, PNG, WEBP,
                      MP4, WEBM{" "}
                      {"\n"}
                      Up to 10 items
                    </Text>

                    <Pressable
                      onPress={() =>
                        void pickMedia()
                      }
                      style={
                        styles.selectButton
                      }
                    >
                      <UploadCloud
                        size={18}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.selectButtonText
                        }
                      >
                        Select photos/videos
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={
                      styles.previewContainer
                    }
                  >
                    <View
                      style={
                        styles.mainPreview
                      }
                    >
                      {currentMedia?.type ===
                      "video" ? (
                        <Video
                          source={{
                            uri:
                              currentMedia
                                .asset
                                .uri,
                          }}
                          style={
                            styles.previewMedia
                          }
                          resizeMode={
                            ResizeMode.CONTAIN
                          }
                          useNativeControls
                          shouldPlay={
                            false
                          }
                          isLooping={
                            false
                          }
                        />
                      ) : currentMedia ? (
                        <Image
                          source={{
                            uri:
                              currentMedia
                                .asset
                                .uri,
                          }}
                          style={
                            styles.previewMedia
                          }
                          resizeMode="contain"
                        />
                      ) : null}

                      {!isLoading ? (
                        <Pressable
                          onPress={() =>
                            removeMedia(
                              currentIndex,
                            )
                          }
                          style={
                            styles.removeMediaButton
                          }
                        >
                          <X
                            size={20}
                            color="#ffffff"
                          />
                        </Pressable>
                      ) : null}

                      {media.length >
                      1 ? (
                        <>
                          {currentIndex >
                          0 ? (
                            <Pressable
                              onPress={() =>
                                setCurrentIndex(
                                  (
                                    value,
                                  ) =>
                                    value -
                                    1,
                                )
                              }
                              style={[
                                styles.carouselButton,
                                styles.carouselLeft,
                              ]}
                            >
                              <ChevronLeft
                                size={
                                  24
                                }
                                color="#ffffff"
                              />
                            </Pressable>
                          ) : null}

                          {currentIndex <
                          media.length -
                            1 ? (
                            <Pressable
                              onPress={() =>
                                setCurrentIndex(
                                  (
                                    value,
                                  ) =>
                                    value +
                                    1,
                                )
                              }
                              style={[
                                styles.carouselButton,
                                styles.carouselRight,
                              ]}
                            >
                              <ChevronRight
                                size={
                                  24
                                }
                                color="#ffffff"
                              />
                            </Pressable>
                          ) : null}
                        </>
                      ) : null}
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={
                        false
                      }
                      contentContainerStyle={
                        styles.thumbnailRow
                      }
                    >
                      {media.map(
                        (
                          item,
                          index,
                        ) => (
                          <Pressable
                            key={`${item.asset.uri}-${index}`}
                            onPress={() =>
                              setCurrentIndex(
                                index,
                              )
                            }
                            style={[
                              styles.thumbnail,
                              index ===
                                currentIndex &&
                                styles.thumbnailActive,
                            ]}
                          >
                            {item.type ===
                            "video" ? (
                              <Video
                                source={{
                                  uri:
                                    item
                                      .asset
                                      .uri,
                                }}
                                style={
                                  styles.thumbnailMedia
                                }
                                resizeMode={
                                  ResizeMode.COVER
                                }
                                shouldPlay={
                                  false
                                }
                                isMuted
                              />
                            ) : (
                              <Image
                                source={{
                                  uri:
                                    item
                                      .asset
                                      .uri,
                                }}
                                style={
                                  styles.thumbnailMedia
                                }
                              />
                            )}
                          </Pressable>
                        ),
                      )}

                      {canAddMedia ? (
                        <Pressable
                          onPress={() =>
                            void pickMedia()
                          }
                          style={
                            styles.addThumbnail
                          }
                        >
                          <UploadCloud
                            size={20}
                            color={
                              dark
                                ? "#94a3b8"
                                : "#64748b"
                            }
                          />
                        </Pressable>
                      ) : null}
                    </ScrollView>
                  </View>
                )}

                {isLoading &&
                uploadProgress > 0 ? (
                  <View
                    style={
                      styles.progressOverlay
                    }
                  >
                    <ActivityIndicator
                      size="large"
                      color="#a855f7"
                    />

                    <View
                      style={
                        styles.progressTrack
                      }
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${uploadProgress}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={
                        styles.progressText
                      }
                    >
                      {
                        progressLabel
                      }
                    </Text>
                  </View>
                ) : null}
              </View>

              <View
                style={
                  styles.editorSection
                }
              >
                <View
                  style={
                    styles.captionSection
                  }
                >
                  <TextInput
                    value={caption}
                    onChangeText={
                      setCaption
                    }
                    placeholder="Write a caption... Add #hashtags to trend!"
                    placeholderTextColor={
                      dark
                        ? "#94a3b8"
                        : "#64748b"
                    }
                    maxLength={2200}
                    multiline
                    textAlignVertical="top"
                    editable={
                      !isLoading
                    }
                    style={[
                      styles.captionInput,
                      {
                        color:
                          dark
                            ? "#f8fafc"
                            : "#0f172a",
                      },
                    ]}
                  />

                  <View
                    style={
                      styles.captionFooter
                    }
                  >
                    <Text
                      style={
                        styles.emoji
                      }
                    >
                      😊
                    </Text>

                    <Text
                      style={[
                        styles.counter,
                        {
                          color:
                            caption.length >=
                            2200
                              ? "#ef4444"
                              : dark
                                ? "#94a3b8"
                                : "#64748b",
                        },
                      ]}
                    >
                      {caption.length}
                      /2200
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.rowField
                  }
                >
                  <MapPin
                    size={20}
                    color={
                      dark
                        ? "#94a3b8"
                        : "#64748b"
                    }
                  />

                  <TextInput
                    value={
                      location
                    }
                    onChangeText={
                      setLocation
                    }
                    placeholder="Add location"
                    placeholderTextColor={
                      dark
                        ? "#94a3b8"
                        : "#64748b"
                    }
                    editable={
                      !isLoading
                    }
                    style={[
                      styles.locationInput,
                      {
                        color:
                          dark
                            ? "#f8fafc"
                            : "#0f172a",
                      },
                    ]}
                  />
                </View>

                {currentMedia ? (
                  <View
                    style={
                      styles.altTextSection
                    }
                  >
                    <Text
                      style={[
                        styles.label,
                        {
                          color:
                            dark
                              ? "#f8fafc"
                              : "#0f172a",
                        },
                      ]}
                    >
                      Alt text for
                      current{" "}
                      {
                        mediaTitle
                      }
                    </Text>

                    <TextInput
                      value={
                        currentMedia.altText
                      }
                      onChangeText={
                        updateAltText
                      }
                      placeholder="Write alt text..."
                      placeholderTextColor={
                        dark
                          ? "#94a3b8"
                          : "#64748b"
                      }
                      maxLength={200}
                      editable={
                        !isLoading
                      }
                      style={[
                        styles.altTextInput,
                        {
                          backgroundColor:
                            dark
                              ? "#1e112c"
                              : "#ffffff",
                          borderColor:
                            dark
                              ? "#2d1b3b"
                              : "#e2e8f0",
                          color:
                            dark
                              ? "#f8fafc"
                              : "#0f172a",
                        },
                      ]}
                    />
                  </View>
                ) : null}

                <View
                  style={
                    styles.settingsSection
                  }
                >
                  <Pressable
                    onPress={() =>
                      setShowSettings(
                        (
                          value,
                        ) =>
                          !value,
                      )
                    }
                    style={
                      styles.settingsHeader
                    }
                  >
                    <View
                      style={
                        styles.settingsTitle
                      }
                    >
                      <Settings
                        size={20}
                        color={
                          dark
                            ? "#94a3b8"
                            : "#64748b"
                        }
                      />

                      <Text
                        style={[
                          styles.settingsText,
                          {
                            color:
                              dark
                                ? "#f8fafc"
                                : "#0f172a",
                          },
                        ]}
                      >
                        Advanced settings
                      </Text>
                    </View>

                    {showSettings ? (
                      <ChevronLeft
                        size={20}
                        color={
                          dark
                            ? "#94a3b8"
                            : "#64748b"
                        }
                        style={{
                          transform: [
                            {
                              rotate:
                                "-90deg",
                            },
                          ],
                        }}
                      />
                    ) : (
                      <ChevronRight
                        size={20}
                        color={
                          dark
                            ? "#94a3b8"
                            : "#64748b"
                        }
                      />
                    )}
                  </Pressable>

                  {showSettings ? (
                    <View
                      style={
                        styles.settingsContent
                      }
                    >
                      <View
                        style={
                          styles.settingRow
                        }
                      >
                        <View
                          style={
                            styles.settingCopy
                          }
                        >
                          <Text
                            style={[
                              styles.settingTitle,
                              {
                                color:
                                  dark
                                    ? "#f8fafc"
                                    : "#0f172a",
                              },
                            ]}
                          >
                            Turn off
                            commenting
                          </Text>

                          <Text
                            style={[
                              styles.settingDescription,
                              {
                                color:
                                  dark
                                    ? "#94a3b8"
                                    : "#64748b",
                              },
                            ]}
                          >
                            You can
                            change
                            this
                            later.
                          </Text>
                        </View>

                        <Switch
                          value={
                            !commentsEnabled
                          }
                          onValueChange={(
                            value,
                          ) =>
                            setCommentsEnabled(
                              !value,
                            )
                          }
                          trackColor={{
                            false:
                              "#cbd5e1",
                            true:
                              "#a855f7",
                          }}
                          thumbColor="#ffffff"
                        />
                      </View>

                      <View
                        style={
                          styles.settingRow
                        }
                      >
                        <View
                          style={
                            styles.settingCopy
                          }
                        >
                          <Text
                            style={[
                              styles.settingTitle,
                              {
                                color:
                                  dark
                                    ? "#f8fafc"
                                    : "#0f172a",
                              },
                            ]}
                          >
                            Hide like
                            and view
                            counts
                          </Text>

                          <Text
                            style={[
                              styles.settingDescription,
                              {
                                color:
                                  dark
                                    ? "#94a3b8"
                                    : "#64748b",
                              },
                            ]}
                          >
                            Only you
                            will see
                            the total
                            number.
                          </Text>
                        </View>

                        <Switch
                          value={
                            hideLikes
                          }
                          onValueChange={
                            setHideLikes
                          }
                          trackColor={{
                            false:
                              "#cbd5e1",
                            true:
                              "#a855f7",
                          }}
                          thumbColor="#ffffff"
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent:
        "flex-end",
      backgroundColor:
        "transparent",
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.60)",
    },

    modal: {
      width: "100%",
      maxHeight:
        "96%",

      borderWidth: 1,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,

      overflow:
        "hidden",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: -8,
      },
      shadowOpacity: 0.20,
      shadowRadius: 30,
      elevation: 20,
    },

    header: {
      minHeight: 60,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal:
        12,

      borderBottomWidth: 1,
    },

    headerButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    headerTitle: {
      flex: 1,
      textAlign:
        "center",
      fontSize: 17,
      fontWeight: "700",
    },

    headerActions: {
      minWidth: 96,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "flex-end",
      gap: 6,
    },

    draftButton: {
      paddingHorizontal: 8,
      paddingVertical: 8,
    },

    draftText: {
      color: "#a855f7",
      fontSize: 12,
      fontWeight: "600",
    },

    shareButton: {
      minWidth: 64,
      minHeight: 36,

      alignItems:
        "center",
      justifyContent:
        "center",

      paddingHorizontal: 12,

      borderRadius: 999,
      backgroundColor:
        "#a855f7",
    },

    shareText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
    },

    disabled: {
      opacity: 0.45,
    },

    body: {
      flexGrow: 0,
    },

    bodyContent: {
      paddingBottom: 24,
    },

    mediaSection: {
      minHeight: 300,
      position:
        "relative",
      backgroundColor:
        "#000000",
    },

    emptyMedia: {
      minHeight: 320,

      alignItems:
        "center",
      justifyContent:
        "center",

      margin: 16,

      borderWidth: 2,
      borderStyle:
        "dashed",
      borderRadius: 18,

      padding: 24,
    },

    mediaIcons: {
      flexDirection:
        "row",
      gap: 8,
      marginBottom: 16,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      textAlign:
        "center",
    },

    emptySubtitle: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 20,
      textAlign:
        "center",
      marginBottom: 20,
    },

    selectButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,

      minHeight: 44,

      paddingHorizontal: 20,

      backgroundColor:
        "#a855f7",

      borderRadius: 999,
    },

    selectButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
    },

    previewContainer: {
      backgroundColor:
        "#000000",
    },

    mainPreview: {
      height: 340,
      alignItems:
        "center",
      justifyContent:
        "center",
      position:
        "relative",
      backgroundColor:
        "#000000",
    },

    previewMedia: {
      width: "100%",
      height: "100%",
    },

    removeMediaButton: {
      position:
        "absolute",
      top: 12,
      right: 12,

      width: 38,
      height: 38,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 19,
      backgroundColor:
        "rgba(0,0,0,0.60)",
    },

    carouselButton: {
      position:
        "absolute",

      top: "50%",

      width: 40,
      height: 40,

      marginTop:
        -20,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 20,

      backgroundColor:
        "rgba(0,0,0,0.50)",
    },

    carouselLeft: {
      left: 10,
    },

    carouselRight: {
      right: 10,
    },

    thumbnailRow: {
      minHeight: 78,
      alignItems:
        "center",
      gap: 8,
      paddingHorizontal: 8,
      paddingVertical: 8,
      backgroundColor:
        "rgba(0,0,0,0.75)",
    },

    thumbnail: {
      width: 62,
      height: 62,

      overflow:
        "hidden",

      borderRadius: 8,
      borderWidth: 2,
      borderColor:
        "transparent",
    },

    thumbnailActive: {
      borderColor:
        "#a855f7",
    },

    thumbnailMedia: {
      width: "100%",
      height: "100%",
    },

    addThumbnail: {
      width: 62,
      height: 62,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 8,
      borderWidth: 2,
      borderStyle:
        "dashed",
      borderColor:
        "rgba(255,255,255,0.35)",
    },

    progressOverlay: {
      ...StyleSheet.absoluteFillObject,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "rgba(0,0,0,0.78)",

      padding: 24,
    },

    progressTrack: {
      width: "70%",
      maxWidth: 240,
      height: 8,
      marginTop: 18,

      overflow:
        "hidden",

      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.20)",
    },

    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor:
        "#a855f7",
    },

    progressText: {
      marginTop: 8,
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "600",
    },

    editorSection: {
      backgroundColor:
        "transparent",
    },

    captionSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    captionInput: {
      minHeight: 120,
      fontSize: 15,
      lineHeight: 22,
    },

    captionFooter: {
      marginTop: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    emoji: {
      fontSize: 20,
    },

    counter: {
      fontSize: 12,
      fontWeight: "500",
    },

    rowField: {
      minHeight: 58,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    locationInput: {
      flex: 1,
      minHeight: 52,
      fontSize: 14,
    },

    altTextSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
      gap: 8,
    },

    label: {
      fontSize: 14,
      fontWeight: "500",
    },

    altTextInput: {
      minHeight: 44,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      fontSize: 14,
    },

    settingsSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 20,
    },

    settingsHeader: {
      minHeight: 50,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    settingsTitle: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    settingsText: {
      fontSize: 15,
      fontWeight: "500",
    },

    settingsContent: {
      paddingTop: 8,
      gap: 18,
    },

    settingRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 16,
    },

    settingCopy: {
      flex: 1,
    },

    settingTitle: {
      fontSize: 14,
      fontWeight: "500",
    },

    settingDescription: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 17,
    },
  });