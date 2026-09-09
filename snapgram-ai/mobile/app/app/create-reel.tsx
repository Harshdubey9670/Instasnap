import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
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
  router,
} from "expo-router";
import {
  Calendar,
  Clock,
  Film,
  Loader2,
  Mic,
  Music2,
  Save,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  Users,
  Video,
  Wand2,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import api from "../../src/services/api";
import {
  useToast,
} from "../../src/components/ui/Toast";

type MusicTrack = {
  id?: string;
  _id?: string;
  title: string;
  artist: string;
  audioUrl?: string;
  duration?: string | number;
};

type AiCaption = {
  text?: string;
  [key: string]: any;
};

type SelectedVideo = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

const FILTER_PRESETS = [
  {
    id: "none",
    name: "Normal",
  },
  {
    id: "vintage",
    name: "Vintage",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
  },
  {
    id: "cinematic",
    name: "Cinematic",
  },
  {
    id: "bw",
    name: "B & W",
  },
  {
    id: "warm",
    name: "Warm Glow",
  },
  {
    id: "neon",
    name: "Neon",
  },
];

export default function CreateReelScreen() {
  const {
    showToast,
  } = useToast();

  const [
    step,
    setStep,
  ] = useState(0);

  const [
    videoFile,
    setVideoFile,
  ] = useState<
    SelectedVideo | null
  >(null);

  const [
    videoDuration,
    setVideoDuration,
  ] = useState(0);

  const [
    speed,
    setSpeed,
  ] = useState(1);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState(
    "none",
  );

  const [
    trimStart,
    setTrimStart,
  ] = useState(0);

  const [
    trimEnd,
    setTrimEnd,
  ] = useState(0);

  const [
    voiceoverActive,
    setVoiceoverActive,
  ] = useState(
    false,
  );

  const [
    showMusicModal,
    setShowMusicModal,
  ] = useState(
    false,
  );

  const [
    musicLibrary,
    setMusicLibrary,
  ] = useState<
    MusicTrack[]
  >([]);

  const [
    selectedMusic,
    setSelectedMusic,
  ] = useState<
    MusicTrack | null
  >(null);

  const [
    aiCaptions,
    setAiCaptions,
  ] = useState<
    AiCaption[]
  >([]);

  const [
    generatingCaptions,
    setGeneratingCaptions,
  ] = useState(
    false,
  );

  const [
    captionStyle,
    setCaptionStyle,
  ] = useState(
    "Pop",
  );

  const [
    caption,
    setCaption,
  ] = useState("");

  const [
    collaborators,
    setCollaborators,
  ] = useState("");

  const [
    publishStatus,
    setPublishStatus,
  ] = useState<
    "published" | "draft" | "scheduled"
  >("published");

  const [
    scheduledAt,
    setScheduledAt,
  ] = useState("");

  const [
    downloadAllowed,
    setDownloadAllowed,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isPickingVideo,
    setIsPickingVideo,
  ] = useState(false);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(true);

  useEffect(() => {
    const loadMusic =
      async () => {
        try {
          const response =
            await api.get(
              "/api/reels/music-library",
            );

          setMusicLibrary(
            response.data
              ?.data || [],
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to load music library:",
            error,
          );
        }
      };

    void loadMusic();
  }, []);

  const selectedFilterName =
    useMemo(
      () =>
        FILTER_PRESETS.find(
          (
            item,
          ) =>
            item.id ===
            selectedFilter,
        )?.name ||
        "Normal",
      [
        selectedFilter,
      ],
    );

  const pickVideo =
    async () => {
      setIsPickingVideo(
        true,
      );

      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          showToast(
            "error",
            "Permission Required",
            "Please allow photo and video library access.",
          );
          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ImagePicker.MediaTypeOptions.Videos,
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

        if (
          asset.fileSize &&
          asset.fileSize >
            100 *
              1024 *
              1024
        ) {
          showToast(
            "error",
            "Video Too Large",
            "Please select a video file up to 100MB.",
          );
          return;
        }

        const type =
          asset.mimeType ||
          "video/mp4";

        if (
          !type.startsWith(
            "video/",
          )
        ) {
          showToast(
            "error",
            "Invalid Video",
            "Please select a valid video file.",
          );
          return;
        }

        const video: SelectedVideo =
          {
            uri:
              asset.uri,
            name:
              asset.fileName ||
              `reel_${Date.now()}.mp4`,
            type,
            size:
              asset.fileSize,
          };

        setVideoFile(
          video,
        );

        /*
         * Expo ImagePicker can provide duration on some platforms.
         * Preserve zero when the platform does not provide it.
         */
        const duration =
          typeof asset.duration ===
          "number"
            ? Math.floor(
                asset.duration /
                  1000,
              )
            : 0;

        setVideoDuration(
          duration,
        );

        setTrimStart(
          0,
        );
        setTrimEnd(
          duration,
        );

        setStep(
          1,
        );
      } catch (
        error
      ) {
        console.error(
          "Video picker error:",
          error,
        );

        showToast(
          "error",
          "Video Selection Failed",
          "Unable to select this video.",
        );
      } finally {
        setIsPickingVideo(
          false,
        );
      }
    };

  const handleGenerateCaptions =
    async () => {
      setGeneratingCaptions(
        true,
      );

      try {
        const response =
          await api.post(
            "/api/reels/generate-captions",
            {
              captionStyle,
            },
          );

        setAiCaptions(
          response.data
            ?.data
            ?.captions || [],
        );

        showToast(
          "success",
          "AI Captions Generated",
          "AI captions generated successfully!",
        );
      } catch (
        error
      ) {
        console.error(
          "AI caption generation failed:",
          error,
        );

        showToast(
          "error",
          "Generation Failed",
          "Failed to generate AI captions.",
        );
      } finally {
        setGeneratingCaptions(
          false,
        );
      }
    };

  const handleSubmitReel =
    async () => {
      if (!videoFile) {
        showToast(
          "error",
          "Video Required",
          "Please select a video first.",
        );
        return;
      }

      if (
        publishStatus ===
          "scheduled" &&
        !scheduledAt
      ) {
        showToast(
          "error",
          "Schedule Time Required",
          "Please choose a release date and time.",
        );
        return;
      }

      setIsSubmitting(
        true,
      );

      try {
        /*
         * Preserve the existing backend upload route and field.
         */
        const formData =
          new FormData();

        formData.append(
          "file",
          {
            uri:
              videoFile.uri,
            name:
              videoFile.name,
            type:
              videoFile.type,
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

        const uploaded =
          uploadResponse.data;

        const collaboratorsList =
          collaborators
            .split(",")
            .map(
              (
                value,
              ) =>
                value.trim(),
            )
            .filter(
              Boolean,
            );

        const payload = {
          caption,
          video: {
            url:
              uploaded.url,
            public_id:
              uploaded.public_id,
            duration:
              videoDuration,
          },
          music:
            selectedMusic
              ? {
                  title:
                    selectedMusic.title,
                  artist:
                    selectedMusic.artist,
                  audioUrl:
                    selectedMusic.audioUrl,
                }
              : {},
          status:
            publishStatus,
          scheduledAt:
            publishStatus ===
            "scheduled"
              ? scheduledAt
              : undefined,
          downloadAllowed,
          collaborators:
            collaboratorsList,
          editingMetadata: {
            speed,
            filter:
              selectedFilter,
            trimStart,
            trimEnd,
            voiceoverUrl:
              voiceoverActive
                ? "recorded_audio_stream"
                : "",
          },
          aiCaptions,
        };

        await api.post(
          "/api/reels",
          payload,
        );

        const successMessage =
          publishStatus ===
          "draft"
            ? "Reel saved as Draft!"
            : publishStatus ===
                "scheduled"
              ? "Reel scheduled!"
              : "Reel published!";

        showToast(
          "success",
          "Reels",
          successMessage,
        );

        router.replace(
          "/app/reels" as any,
        );
      } catch (
        error: any
      ) {
        console.error(
          "Failed to publish Reel:",
          error,
        );

        showToast(
          "error",
          "Reel Failed",
          error?.response
            ?.data?.message ||
            "Failed to publish Reel.",
        );
      } finally {
        setIsSubmitting(
          false,
        );
      }
    };

  const goBack =
    () => {
      if (
        step >
        0
      ) {
        setStep(
          step - 1,
        );
      } else {
        router.back();
      }
    };

  const showSchedulePrompt =
    () => {
      Alert.prompt(
        "Schedule Reel",
        "Enter date and time in ISO format, for example 2026-08-27T18:30:00",
        (
          value,
        ) => {
          if (
            value
          ) {
            setScheduledAt(
              value,
            );
          }
        },
        "plain-text",
        scheduledAt,
      );
    };

  return (
    <KeyboardAvoidingView
      style={
        styles.screen
      }
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={
            styles.header
          }
        >
          <Pressable
            onPress={
              goBack
            }
            style={
              styles.headerBack
            }
          >
            <Text
              style={
                styles.backArrow
              }
            >
              ‹
            </Text>

            <Text
              style={
                styles.backText
              }
            >
              Back
            </Text>
          </Pressable>

          <View
            style={
              styles.headerTitleWrap
            }
          >
            <Film
              size={23}
              color="#a855f7"
            />

            <Text
              style={
                styles.headerTitle
              }
            >
              Reels Creator Studio
            </Text>
          </View>

          {step ===
          1 ? (
            <Pressable
              onPress={() =>
                setStep(
                  2,
                )
              }
              style={
                styles.nextButton
              }
            >
              <Text
                style={
                  styles.nextButtonText
                }
              >
                Next
              </Text>
            </Pressable>
          ) : (
            <View
              style={
                styles.headerSpacer
              }
            />
          )}
        </View>

        {/* STEP 0 */}
        {step ===
          0 && (
          <View
            style={
              styles.selectCard
            }
          >
            <View
              style={
                styles.uploadIcon
              }
            >
              <UploadCloud
                size={42}
                color="#a855f7"
              />
            </View>

            <Text
              style={
                styles.selectTitle
              }
            >
              Select Video for Reel
            </Text>

            <Text
              style={
                styles.selectDescription
              }
            >
              MP4, MOV or WebM files up to
              100MB
            </Text>

            <Pressable
              onPress={() =>
                void pickVideo()
              }
              disabled={
                isPickingVideo
              }
              style={
                styles.chooseButton
              }
            >
              {isPickingVideo ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <UploadCloud
                  size={18}
                  color="#ffffff"
                />
              )}

              <Text
                style={
                  styles.chooseButtonText
                }
              >
                {isPickingVideo
                  ? "Opening..."
                  : "Choose Video File"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* STEP 1 */}
        {step ===
          1 &&
          videoFile && (
            <View
              style={
                styles.editor
              }
            >
              {/* Preview */}
              <View
                style={
                  styles.previewCard
                }
              >
                <View
                  style={
                    styles.videoPlaceholder
                  }
                >
                  <Video
                    size={52}
                    color="#a855f7"
                  />

                  <Text
                    style={
                      styles.previewFilename
                    }
                    numberOfLines={
                      2
                    }
                  >
                    {
                      videoFile.name
                    }
                  </Text>

                  <Text
                    style={
                      styles.previewMeta
                    }
                  >
                    {videoDuration
                      ? `${videoDuration}s`
                      : "Video selected"}
                  </Text>

                  <Pressable
                    onPress={() =>
                      setIsPlaying(
                        (
                          value,
                        ) => !value,
                      )
                    }
                    style={
                      styles.playButton
                    }
                  >
                    <Text
                      style={
                        styles.playButtonText
                      }
                    >
                      {isPlaying
                        ? "Pause Preview"
                        : "Play Preview"}
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={
                    styles.speedBadge
                  }
                >
                  {speed}x Speed
                </View>

                {aiCaptions.length >
                  0 && (
                  <View
                    style={
                      styles.captionOverlay
                    }
                  >
                    <Text
                      style={
                        styles.captionOverlayText
                      }
                    >
                      {
                        aiCaptions[0]
                          ?.text
                      }
                    </Text>
                  </View>
                )}
              </View>

              {/* Music */}
              <View
                style={
                  styles.controlCard
                }
              >
                <View
                  style={
                    styles.controlHeader
                  }
                >
                  <View
                    style={
                      styles.controlTitleRow
                    }
                  >
                    <Music2
                      size={18}
                      color="#a855f7"
                    />

                    <Text
                      style={
                        styles.controlTitle
                      }
                    >
                      Audio & Music
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setShowMusicModal(
                        true,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.actionLink
                      }
                    >
                      {selectedMusic
                        ? "Change Track"
                        : "+ Add Music"}
                    </Text>
                  </Pressable>
                </View>

                {selectedMusic ? (
                  <View
                    style={
                      styles.selectedTrack
                    }
                  >
                    <View
                      style={
                        styles.trackIcon
                      }
                    >
                      <Music2
                        size={17}
                        color="#a855f7"
                      />
                    </View>

                    <View
                      style={
                        styles.trackCopy
                      }
                    >
                      <Text
                        style={
                          styles.trackTitle
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          selectedMusic.title
                        }
                      </Text>

                      <Text
                        style={
                          styles.trackArtist
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          selectedMusic.artist
                        }
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        setSelectedMusic(
                          null,
                        )
                      }
                    >
                      <Text
                        style={
                          styles.removeText
                        }
                      >
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {/* Speed */}
              <View
                style={
                  styles.controlCard
                }
              >
                <View
                  style={
                    styles.controlTitleRow
                  }
                >
                  <Clock
                    size={18}
                    color="#10b981"
                  />

                  <Text
                    style={
                      styles.controlTitle
                    }
                  >
                    Playback Speed
                  </Text>
                </View>

                <View
                  style={
                    styles.speedRow
                  }
                >
                  {[
                    0.5,
                    1,
                    1.5,
                    2,
                    3,
                  ].map(
                    (
                      value,
                    ) => (
                      <Pressable
                        key={`${value}`}
                        onPress={() =>
                          setSpeed(
                            value,
                          )
                        }
                        style={[
                          styles.speedOption,
                          speed ===
                            value &&
                            styles.speedOptionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.speedOptionText,
                            speed ===
                              value &&
                              styles.speedOptionTextActive,
                          ]}
                        >
                          {value}x
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>
              </View>

              {/* Filters */}
              <View
                style={
                  styles.controlCard
                }
              >
                <View
                  style={
                    styles.controlTitleRow
                  }
                >
                  <Wand2
                    size={18}
                    color="#f59e0b"
                  />

                  <Text
                    style={
                      styles.controlTitle
                    }
                  >
                    Visual Filters
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.filterRow
                  }
                >
                  {FILTER_PRESETS.map(
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
                            styles.filterText,
                            selectedFilter ===
                              filter.id &&
                              styles.filterTextActive,
                          ]}
                        >
                          {
                            filter.name
                          }
                        </Text>
                      </Pressable>
                    ),
                  )}
                </ScrollView>

                <Text
                  style={
                    styles.currentFilter
                  }
                >
                  Selected:{" "}
                  {
                    selectedFilterName
                  }
                </Text>
              </View>

              {/* AI Captions */}
              <View
                style={
                  styles.controlCard
                }
              >
                <View
                  style={
                    styles.controlHeader
                  }
                >
                  <View
                    style={
                      styles.controlTitleRow
                    }
                  >
                    <Sparkles
                      size={18}
                      color="#3b82f6"
                    />

                    <Text
                      style={
                        styles.controlTitle
                      }
                    >
                      AI Auto Captions
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      void handleGenerateCaptions()
                    }
                    disabled={
                      generatingCaptions
                    }
                    style={
                      styles.generateButton
                    }
                  >
                    {generatingCaptions ? (
                      <ActivityIndicator
                        size="small"
                        color="#ffffff"
                      />
                    ) : null}

                    <Text
                      style={
                        styles.generateButtonText
                      }
                    >
                      {generatingCaptions
                        ? "Generating..."
                        : "Generate AI Captions"}
                    </Text>
                  </Pressable>
                </View>

                {aiCaptions.length >
                0 ? (
                  <Text
                    style={
                      styles.captionCount
                    }
                  >
                    {
                      aiCaptions.length
                    }{" "}
                    caption
                    {aiCaptions.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    generated
                  </Text>
                ) : null}
              </View>

              {/* Voiceover */}
              <View
                style={
                  styles.controlCard
                }
              >
                <View
                  style={
                    styles.controlHeader
                  }
                >
                  <View
                    style={
                      styles.controlTitleRow
                    }
                  >
                    <Mic
                      size={18}
                      color="#f43f5e"
                    />

                    <Text
                      style={
                        styles.controlTitle
                      }
                    >
                      Voiceover Audio
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setVoiceoverActive(
                        (
                          value,
                        ) => !value,
                      )
                    }
                    style={[
                      styles.voiceButton,
                      voiceoverActive &&
                        styles.voiceButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.voiceButtonText,
                        voiceoverActive &&
                          styles.voiceButtonTextActive,
                      ]}
                    >
                      {voiceoverActive
                        ? "Voiceover Active"
                        : "Record Voiceover"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

        {/* STEP 2 */}
        {step ===
          2 && (
            <View
              style={
                styles.detailsContainer
              }
            >
              <View
                style={
                  styles.detailsCard
                }
              >
                <Text
                  style={
                    styles.detailsTitle
                  }
                >
                  Reel Publishing Details
                </Text>

                {/* Caption */}
                <View
                  style={
                    styles.field
                  }
                >
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    Caption & Hashtags
                  </Text>

                  <TextInput
                    value={
                      caption
                    }
                    onChangeText={
                      setCaption
                    }
                    placeholder="Write a caption... Use #hashtags"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={
                      4
                    }
                    textAlignVertical="top"
                    style={
                      styles.textArea
                    }
                  />
                </View>

                {/* Collaborators */}
                <View
                  style={
                    styles.field
                  }
                >
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    Invite Collaborators
                  </Text>

                  <Text
                    style={
                      styles.fieldHint
                    }
                  >
                    Usernames separated by comma
                  </Text>

                  <View
                    style={
                      styles.collabInputWrap
                    }
                  >
                    <Users
                      size={17}
                      color="#64748b"
                    />

                    <TextInput
                      value={
                        collaborators
                      }
                      onChangeText={
                        setCollaborators
                      }
                      placeholder="alex_dev, sarah_design"
                      placeholderTextColor="#94a3b8"
                      style={
                        styles.collabInput
                      }
                    />
                  </View>
                </View>

                {/* Publish mode */}
                <View
                  style={
                    styles.statusGrid
                  }
                >
                  <Pressable
                    onPress={() =>
                      setPublishStatus(
                        "published",
                      )
                    }
                    style={[
                      styles.statusOption,
                      publishStatus ===
                        "published" &&
                        styles.statusOptionActive,
                    ]}
                  >
                    <Film
                      size={20}
                      color={
                        publishStatus ===
                        "published"
                          ? "#a855f7"
                          : "#64748b"
                      }
                    />

                    <Text
                      style={[
                        styles.statusText,
                        publishStatus ===
                          "published" &&
                          styles.statusTextActive,
                      ]}
                    >
                      Publish Now
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setPublishStatus(
                        "draft",
                      )
                    }
                    style={[
                      styles.statusOption,
                      publishStatus ===
                        "draft" &&
                        styles.statusOptionActive,
                    ]}
                  >
                    <Save
                      size={20}
                      color={
                        publishStatus ===
                        "draft"
                          ? "#a855f7"
                          : "#64748b"
                      }
                    />

                    <Text
                      style={[
                        styles.statusText,
                        publishStatus ===
                          "draft" &&
                          styles.statusTextActive,
                      ]}
                    >
                      Save Draft
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setPublishStatus(
                        "scheduled",
                      )
                    }
                    style={[
                      styles.statusOption,
                      publishStatus ===
                        "scheduled" &&
                        styles.statusOptionActive,
                    ]}
                  >
                    <Calendar
                      size={20}
                      color={
                        publishStatus ===
                        "scheduled"
                          ? "#a855f7"
                          : "#64748b"
                      }
                    />

                    <Text
                      style={[
                        styles.statusText,
                        publishStatus ===
                          "scheduled" &&
                          styles.statusTextActive,
                      ]}
                    >
                      Schedule
                    </Text>
                  </Pressable>
                </View>

                {/* Schedule */}
                {publishStatus ===
                "scheduled" ? (
                  <View
                    style={
                      styles.field
                    }
                  >
                    <Text
                      style={
                        styles.fieldLabel
                      }
                    >
                      Release Date & Time
                    </Text>

                    <Pressable
                      onPress={
                        showSchedulePrompt
                      }
                      style={
                        styles.dateButton
                      }
                    >
                      <Calendar
                        size={17}
                        color="#64748b"
                      />

                      <Text
                        style={
                          scheduledAt
                            ? styles.dateText
                            : styles.datePlaceholder
                        }
                      >
                        {scheduledAt ||
                          "Choose date and time"}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {/* DRM */}
                <View
                  style={
                    styles.drmCard
                  }
                >
                  <View
                    style={
                      styles.drmCopy
                    }
                  >
                    <View
                      style={
                        styles.drmTitleRow
                      }
                    >
                      <ShieldAlert
                        size={18}
                        color="#10b981"
                      />

                      <Text
                        style={
                          styles.drmTitle
                        }
                      >
                        Download Protection
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.drmDescription
                      }
                    >
                      Prevent viewers from downloading
                      or ripping your original video.
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setDownloadAllowed(
                        (
                          value,
                        ) => !value,
                      )
                    }
                    style={[
                      styles.switch,
                      !downloadAllowed &&
                        styles.switchActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.switchKnob,
                        !downloadAllowed &&
                          styles.switchKnobActive,
                      ]}
                    />
                  </Pressable>
                </View>

                {/* Submit */}
                <Pressable
                  onPress={() =>
                    void handleSubmitReel()
                  }
                  disabled={
                    isSubmitting
                  }
                  style={[
                    styles.submitButton,
                    isSubmitting &&
                      styles.submitButtonDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                    />
                  ) : (
                    <Sparkles
                      size={19}
                      color="#ffffff"
                    />
                  )}

                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    {isSubmitting
                      ? "Processing Video..."
                      : publishStatus ===
                          "draft"
                        ? "Save Draft"
                        : publishStatus ===
                            "scheduled"
                          ? "Schedule Reel"
                          : "Share Reel Now"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
      </ScrollView>

      {/* Music Modal */}
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
              styles.musicModal
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.controlTitleRow
                }
              >
                <Music2
                  size={19}
                  color="#a855f7"
                />

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Trending Music Library
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
                  size={21}
                  color="#f8fafc"
                />
              </Pressable>
            </View>

            <ScrollView
              style={
                styles.musicList
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {musicLibrary.length ===
              0 ? (
                <View
                  style={
                    styles.noMusic
                  }
                >
                  <Music2
                    size={30}
                    color="#64748b"
                  />

                  <Text
                    style={
                      styles.noMusicText
                    }
                  >
                    No music tracks available.
                  </Text>
                </View>
              ) : (
                musicLibrary.map(
                  (
                    track,
                    index,
                  ) => (
                    <Pressable
                      key={
                        track.id ||
                        track._id ||
                        `${track.title}-${index}`
                      }
                      onPress={() => {
                        setSelectedMusic(
                          track,
                        );
                        setShowMusicModal(
                          false,
                        );
                      }}
                      style={
                        styles.musicRow
                      }
                    >
                      <View
                        style={
                          styles.trackIcon
                        }
                      >
                        <Music2
                          size={16}
                          color="#a855f7"
                        />
                      </View>

                      <View
                        style={
                          styles.trackCopy
                        }
                      >
                        <Text
                          style={
                            styles.trackTitle
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            track.title
                          }
                        </Text>

                        <Text
                          style={
                            styles.trackArtist
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            track.artist
                          }
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.trackDuration
                        }
                      >
                        {
                          track.duration
                        }
                      </Text>
                    </Pressable>
                  ),
                )
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#0a0510",
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 40,
    },

    header: {
      minHeight: 58,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "#2d1b3b",
      marginBottom: 16,
    },

    headerBack: {
      minWidth: 70,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    backArrow: {
      color:
        "#94a3b8",
      fontSize: 30,
      lineHeight: 30,
    },

    backText: {
      color:
        "#94a3b8",
      fontSize: 12,
      fontWeight:
        "700",
    },

    headerTitleWrap: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
    },

    headerTitle: {
      color:
        "#a855f7",
      fontSize: 16,
      fontWeight:
        "900",
    },

    nextButton: {
      minWidth: 70,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor:
        "#a855f7",
      alignItems:
        "center",
    },

    nextButtonText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
    },

    headerSpacer: {
      width: 70,
    },

    selectCard: {
      minHeight: 500,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 28,
      borderRadius: 24,
      borderWidth: 2,
      borderStyle:
        "dashed",
      borderColor:
        "#2d1b3b",
      backgroundColor:
        "#130a1c",
    },

    uploadIcon: {
      width: 82,
      height: 82,
      borderRadius: 41,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(168,85,247,0.12)",
      marginBottom: 18,
    },

    selectTitle: {
      color:
        "#f8fafc",
      fontSize: 22,
      lineHeight: 28,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    selectDescription: {
      marginTop: 6,
      marginBottom: 22,
      color:
        "#94a3b8",
      fontSize: 12,
      textAlign:
        "center",
    },

    chooseButton: {
      minHeight: 48,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
      paddingHorizontal: 22,
      borderRadius: 15,
      backgroundColor:
        "#a855f7",
    },

    chooseButtonText: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "900",
    },

    editor: {
      gap: 14,
    },

    previewCard: {
      height: 420,
      overflow:
        "hidden",
      position:
        "relative",
      borderRadius: 22,
      backgroundColor:
        "#000000",
      borderWidth: 1,
      borderColor:
        "#27272a",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    videoPlaceholder: {
      width: "100%",
      height: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    previewFilename: {
      marginTop: 14,
      color:
        "#f8fafc",
      fontSize: 13,
      fontWeight:
        "800",
      textAlign:
        "center",
    },

    previewMeta: {
      marginTop: 4,
      color:
        "#94a3b8",
      fontSize: 11,
    },

    playButton: {
      marginTop: 15,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor:
        "rgba(168,85,247,0.18)",
      borderWidth: 1,
      borderColor:
        "rgba(168,85,247,0.35)",
    },

    playButtonText: {
      color:
        "#c084fc",
      fontSize: 10,
      fontWeight:
        "800",
    },

    speedBadge: {
      position:
        "absolute",
      top: 12,
      right: 12,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor:
        "rgba(0,0,0,0.65)",
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "800",
    },

    captionOverlay: {
      position:
        "absolute",
      left: 20,
      right: 20,
      bottom: 22,
      alignItems:
        "center",
    },

    captionOverlayText: {
      maxWidth: "95%",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 11,
      backgroundColor:
        "rgba(0,0,0,0.78)",
      color:
        "#fde047",
      fontSize: 12,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    controlCard: {
      padding: 15,
      borderRadius: 18,
      backgroundColor:
        "#130a1c",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    controlHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    controlTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    controlTitle: {
      color:
        "#f8fafc",
      fontSize: 12,
      fontWeight:
        "800",
    },

    actionLink: {
      color:
        "#a855f7",
      fontSize: 10,
      fontWeight:
        "800",
    },

    selectedTrack: {
      marginTop: 11,
      padding: 10,
      borderRadius: 12,
      backgroundColor:
        "#0a0510",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
    },

    trackIcon: {
      width: 35,
      height: 35,
      borderRadius: 9,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(168,85,247,0.12)",
    },

    trackCopy: {
      flex: 1,
      minWidth: 0,
    },

    trackTitle: {
      color:
        "#f8fafc",
      fontSize: 11,
      fontWeight:
        "800",
    },

    trackArtist: {
      marginTop: 2,
      color:
        "#94a3b8",
      fontSize: 9,
    },

    removeText: {
      color:
        "#f43f5e",
      fontSize: 10,
      fontWeight:
        "700",
    },

    speedRow: {
      marginTop: 11,
      flexDirection:
        "row",
      gap: 6,
    },

    speedOption: {
      flex: 1,
      minHeight: 36,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 10,
      backgroundColor:
        "#0a0510",
    },

    speedOptionActive: {
      backgroundColor:
        "#a855f7",
    },

    speedOptionText: {
      color:
        "#94a3b8",
      fontSize: 10,
      fontWeight:
        "800",
    },

    speedOptionTextActive: {
      color:
        "#ffffff",
    },

    filterRow: {
      gap: 7,
      paddingTop: 11,
    },

    filterButton: {
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor:
        "#0a0510",
    },

    filterButtonActive: {
      backgroundColor:
        "rgba(245,158,11,0.13)",
      borderWidth: 1,
      borderColor:
        "rgba(245,158,11,0.35)",
    },

    filterText: {
      color:
        "#94a3b8",
      fontSize: 10,
      fontWeight:
        "700",
    },

    filterTextActive: {
      color:
        "#f59e0b",
    },

    currentFilter: {
      marginTop: 8,
      color:
        "#64748b",
      fontSize: 9,
    },

    generateButton: {
      minHeight: 32,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 5,
      paddingHorizontal: 10,
      borderRadius: 9,
      backgroundColor:
        "#2563eb",
    },

    generateButtonText: {
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "800",
    },

    captionCount: {
      marginTop: 9,
      color:
        "#64748b",
      fontSize: 9,
    },

    voiceButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor:
        "#0a0510",
    },

    voiceButtonActive: {
      backgroundColor:
        "#f43f5e",
    },

    voiceButtonText: {
      color:
        "#94a3b8",
      fontSize: 9,
      fontWeight:
        "800",
    },

    voiceButtonTextActive: {
      color:
        "#ffffff",
    },

    detailsContainer: {
      width: "100%",
      maxWidth: 650,
      alignSelf:
        "center",
    },

    detailsCard: {
      padding: 17,
      borderRadius: 22,
      backgroundColor:
        "#130a1c",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    detailsTitle: {
      color:
        "#f8fafc",
      fontSize: 17,
      fontWeight:
        "900",
      marginBottom: 17,
    },

    field: {
      marginBottom: 16,
    },

    fieldLabel: {
      color:
        "#94a3b8",
      fontSize: 10,
      fontWeight:
        "800",
      marginBottom: 6,
    },

    fieldHint: {
      marginBottom: 7,
      color:
        "#64748b",
      fontSize: 9,
    },

    textArea: {
      minHeight: 120,
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor:
        "#0a0510",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
      color:
        "#f8fafc",
      fontSize: 12,
      lineHeight: 18,
    },

    collabInputWrap: {
      minHeight: 46,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 13,
      backgroundColor:
        "#0a0510",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    collabInput: {
      flex: 1,
      color:
        "#f8fafc",
      fontSize: 11,
    },

    statusGrid: {
      flexDirection:
        "row",
      gap: 7,
      marginBottom: 15,
    },

    statusOption: {
      flex: 1,
      minHeight: 78,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
      borderRadius: 13,
      backgroundColor:
        "#0a0510",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
      paddingHorizontal: 4,
    },

    statusOptionActive: {
      borderColor:
        "#a855f7",
      backgroundColor:
        "rgba(168,85,247,0.10)",
    },

    statusText: {
      color:
        "#64748b",
      fontSize: 9,
      fontWeight:
        "700",
      textAlign:
        "center",
    },

    statusTextActive: {
      color:
        "#a855f7",
    },

    dateButton: {
      minHeight: 46,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 13,
      backgroundColor:
        "#0a0510",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    dateText: {
      color:
        "#f8fafc",
      fontSize: 11,
    },

    datePlaceholder: {
      color:
        "#64748b",
      fontSize: 11,
    },

    drmCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 12,
      padding: 13,
      marginBottom: 17,
      borderRadius: 15,
      backgroundColor:
        "#0a0510",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    drmCopy: {
      flex: 1,
    },

    drmTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    drmTitle: {
      color:
        "#f8fafc",
      fontSize: 11,
      fontWeight:
        "800",
    },

    drmDescription: {
      marginTop: 4,
      color:
        "#64748b",
      fontSize: 9,
      lineHeight: 14,
    },

    switch: {
      width: 46,
      height: 27,
      paddingHorizontal: 3,
      borderRadius: 14,
      justifyContent:
        "center",
      backgroundColor:
        "#334155",
    },

    switchActive: {
      backgroundColor:
        "#a855f7",
    },

    switchKnob: {
      width: 21,
      height: 21,
      borderRadius: 11,
      backgroundColor:
        "#ffffff",
    },

    switchKnobActive: {
      alignSelf:
        "flex-end",
    },

    submitButton: {
      minHeight: 50,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
      borderRadius: 15,
      backgroundColor:
        "#a855f7",
    },

    submitButtonDisabled: {
      opacity: 0.55,
    },

    submitButtonText: {
      color:
        "#ffffff",
      fontSize: 13,
      fontWeight:
        "900",
    },

    modalBackdrop: {
      flex: 1,
      justifyContent:
        "flex-end",
      backgroundColor:
        "rgba(0,0,0,0.75)",
    },

    musicModal: {
      height: "75%",
      padding: 17,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor:
        "#130a1c",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    modalHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 13,
    },

    modalTitle: {
      color:
        "#f8fafc",
      fontSize: 15,
      fontWeight:
        "900",
    },

    musicList: {
      flex: 1,
    },

    musicRow: {
      minHeight: 66,
      marginBottom: 7,
      paddingHorizontal: 10,
      borderRadius: 13,
      backgroundColor:
        "#0a0510",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
    },

    trackDuration: {
      color:
        "#a855f7",
      fontSize: 9,
      fontWeight:
        "800",
    },

    noMusic: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingVertical: 60,
    },

    noMusicText: {
      marginTop: 10,
      color:
        "#64748b",
      fontSize: 11,
    },
  });