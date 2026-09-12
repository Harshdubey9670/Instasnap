import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
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
  Camera as CameraView,
  CameraType,
  FlashMode,
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  getMicrophonePermissionsAsync,
  requestMicrophonePermissionsAsync,
} from "expo-camera";

// Compatibility shims for expo-camera v15 hook API on top of v14
const useCameraPermissions = (): [
  { granted: boolean } | null,
  () => Promise<{ granted: boolean }>,
] => {
  const [perm, setPerm] = React.useState<{ granted: boolean } | null>(null);
  React.useEffect(() => {
    getCameraPermissionsAsync().then(setPerm);
  }, []);
  return [perm, () => requestCameraPermissionsAsync().then(r => { setPerm(r); return r; })];
};

const useMicrophonePermissions = (): [
  { granted: boolean } | null,
  () => Promise<{ granted: boolean }>,
] => {
  const [perm, setPerm] = React.useState<{ granted: boolean } | null>(null);
  React.useEffect(() => {
    getMicrophonePermissionsAsync().then(setPerm);
  }, []);
  return [perm, () => requestMicrophonePermissionsAsync().then(r => { setPerm(r); return r; })];
};

import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import {
  router,
} from "expo-router";
import {
  Camera,
  Check,
  ChevronLeft,
  Download,
  Grid3X3,
  Image as ImageIcon,
  Lock,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  SwitchCamera,
  Video,
  VideoOff,
  Wand2,
  X,
  Zap,
  ZapOff,
} from "lucide-react-native";
import {
  useSelector,
} from "react-redux";

import api from "../../src/services/api";
import {
  useToast,
} from "../../src/components/ui/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CaptureType =
  | "image"
  | "video";

type CapturedMedia = {
  uri: string;
  type: CaptureType;
  fileName: string;
  mimeType: string;
};

type FilterPreset = {
  id: string;
  name: string;
};

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "none",
    name: "Normal",
  },
  {
    id: "vintage",
    name: "Vintage",
  },
  {
    id: "cyber",
    name: "Cyber",
  },
  {
    id: "cinema",
    name: "Cinema",
  },
  {
    id: "bw",
    name: "B&W",
  },
  {
    id: "warm",
    name: "Warm",
  },
  {
    id: "neon",
    name: "Neon",
  },
];

export default function CameraScreen() {
  const { toast } =
    useToast();

  const insets = useSafeAreaInsets();

  const { user } =
    useSelector(
      (state: any) =>
        state.auth,
    );

  const [
    cameraPermission,
    requestCameraPermission,
  ] = useCameraPermissions();

  const [
    microphonePermission,
    requestMicrophonePermission,
  ] = useMicrophonePermissions();

  const cameraRef =
    useRef<CameraView | null>(
      null,
    );

  const [
    facing,
    setFacing,
  ] =
    useState<CameraType>(
      CameraType.back,
    );

  const [
    flash,
    setFlash,
  ] = useState<
    "off" | "on"
  >("off");

  const [
    mode,
    setMode,
  ] = useState<
    "photo" | "video"
  >("photo");

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);

  const [
    isPaused,
    setIsPaused,
  ] = useState(false);

  const [
    showGrid,
    setShowGrid,
  ] = useState(true);

  const [
    nightMode,
    setNightMode,
  ] = useState(false);

  const [
    hdrEnabled,
    setHdrEnabled,
  ] = useState(false);

  const [
    zoom,
    setZoom,
  ] = useState(0);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState(
    FILTER_PRESETS[0],
  );

  const [
    timerSeconds,
    setTimerSeconds,
  ] = useState(0);

  const [
    countdown,
    setCountdown,
  ] = useState<number | null>(
    null,
  );

  const [
    capturedMedia,
    setCapturedMedia,
  ] =
    useState<CapturedMedia | null>(
      null,
    );

  const [
    caption,
    setCaption,
  ] = useState("");

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    isPostingStory,
    setIsPostingStory,
  ] = useState(false);

  const [
    isSavingVault,
    setIsSavingVault,
  ] = useState(false);

  const [
    showSettings,
    setShowSettings,
  ] = useState(false);

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    showCaption,
    setShowCaption,
  ] = useState(false);

  const [
    recordingTimer,
    setRecordingTimer,
  ] =
    useState<ReturnType<
      typeof setInterval
    > | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(
          recordingTimer,
        );
      }
    };
  }, [recordingTimer]);

  useEffect(() => {
    if (
      !cameraPermission?.granted
    ) {
      void requestCameraPermission();
    }
  }, [
    cameraPermission?.granted,
    requestCameraPermission,
  ]);

  const ensureMicrophonePermission =
    async () => {
      if (
        microphonePermission?.granted
      ) {
        return true;
      }

      const result =
        await requestMicrophonePermission();

      return result.granted;
    };

  const capturePhoto =
    async () => {
      if (
        !cameraRef.current ||
        isRecording
      ) {
        return;
      }

      try {
        if (
          timerSeconds > 0
        ) {
          for (
            let value =
              timerSeconds;
            value > 0;
            value -= 1
          ) {
            setCountdown(
              value,
            );

            await new Promise(
              (
                resolve,
              ) =>
                setTimeout(
                  resolve,
                  1000,
                ),
            );
          }

          setCountdown(
            null,
          );
        }

        const photo =
          await cameraRef.current.takePictureAsync(
            {
              quality:
                0.95,
            },
          );

        if (!photo?.uri) {
          throw new Error(
            "Photo capture failed",
          );
        }

        setCapturedMedia(
          {
            uri: photo.uri,
            type: "image",
            fileName: `snap_${Date.now()}.jpg`,
            mimeType:
              "image/jpeg",
          },
        );
      } catch (error) {
        console.error(
          "Photo capture failed:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Capture Failed",
          description:
            "Unable to capture photo.",
        });
      }
    };

  const startRecording =
    async () => {
      if (
        !cameraRef.current ||
        isRecording
      ) {
        return;
      }

      const microphoneAllowed =
        await ensureMicrophonePermission();

      if (
        !microphoneAllowed
      ) {
        toast({
          variant:
            "error",
          title:
            "Microphone Permission",
          description:
            "Microphone access is required to record video.",
        });
        return;
      }

      try {
        setIsRecording(
          true,
        );
        setIsPaused(
          false,
        );
        setRecordingSeconds(
          0,
        );

        const interval =
          setInterval(
            () => {
              setRecordingSeconds(
                (
                  value,
                ) =>
                  value + 1,
              );
            },
            1000,
          );

        setRecordingTimer(
          interval,
        );

        const result =
          await cameraRef.current.recordAsync(
            {
              maxDuration:
                120,
            },
          );

        if (
          result?.uri
        ) {
          setCapturedMedia(
            {
              uri:
                result.uri,
              type:
                "video",
              fileName: `snap_${Date.now()}.mp4`,
              mimeType:
                "video/mp4",
            },
          );
        }
      } catch (error) {
        console.error(
          "Video recording failed:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Recording Failed",
          description:
            "Unable to record video.",
        });
      } finally {
        setIsRecording(
          false,
        );
        setIsPaused(
          false,
        );

        if (
          recordingTimer
        ) {
          clearInterval(
            recordingTimer,
          );
          setRecordingTimer(
            null,
          );
        }
      }
    };

  const stopRecording =
    () => {
      if (
        !cameraRef.current ||
        !isRecording
      ) {
        return;
      }

      cameraRef.current.stopRecording();

      setIsRecording(
        false,
      );
      setIsPaused(
        false,
      );

      if (
        recordingTimer
      ) {
        clearInterval(
          recordingTimer,
        );
        setRecordingTimer(
          null,
        );
      }
    };

  const togglePauseRecording =
    () => {
      /*
       * Expo Camera's native recording API does not expose the same
       * browser MediaRecorder pause/resume behavior on every platform.
       * Keep the UI state here without pretending the underlying stream
       * has been paused when the platform cannot guarantee it.
       */
      setIsPaused(
        (
          value,
        ) => !value,
      );

      toast({
        variant:
          "info",
        title:
          "Recording Control",
        description:
          "Pause/resume depends on the native camera implementation.",
      });
    };

  const cycleFlash =
    () => {
      setFlash(
        (
          value,
        ) =>
          value ===
          "off"
            ? "on"
            : "off",
      );
    };

  const toggleCamera =
    () => {
      setFacing(
        (
          value,
        ) =>
          value ===
          CameraType.back
            ? CameraType.front
            : CameraType.back,
      );
    };

  const importFromGallery =
    async () => {
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
            "Allow photo library access to choose media.",
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

      const type =
        asset.type ===
        "video"
          ? "video"
          : "image";

      setCapturedMedia(
        {
          uri:
            asset.uri,
          type,
          fileName:
            asset.fileName ||
            `import_${Date.now()}.${type === "video" ? "mp4" : "jpg"}`,
          mimeType:
            asset.mimeType ||
            (type === "video"
              ? "video/mp4"
              : "image/jpeg"),
        },
      );
    };

  const handleRetake =
    () => {
      setCapturedMedia(
        null,
      );
      setCaption("");
    };

  const uploadMedia =
    async (
      media: CapturedMedia,
      prefix: string,
    ) => {
      const formData =
        new FormData();

      formData.append(
        "image",
        {
          uri:
            media.uri,
          name:
            `${prefix}_${media.fileName}`,
          type:
            media.mimeType,
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
          },
        );

      if (
        !response.data
          ?.success
      ) {
        throw new Error(
          "Upload failed",
        );
      }

      return (
        response.data
          ?.data?.url ||
        response.data?.url
      );
    };

  const handlePublish =
    async () => {
      if (
        !capturedMedia
      ) {
        return;
      }

      setIsUploading(
        true,
      );

      try {
        const url =
          await uploadMedia(
            capturedMedia,
            "snap",
          );

        const mediaType =
          capturedMedia.type;

        await api.post(
          "/api/posts",
          {
            caption,
            mediaUrl:
              url,
            public_id:
              undefined,
            mediaType,
          },
        );

        toast({
          variant:
            "success",
          title:
            "Snap Shared",
          description:
            "Snap shared to Feed!",
        });

        router.replace(
          "/app",
        );
      } catch (
        error: any
      ) {
        toast({
          variant:
            "error",
          title:
            "Upload Failed",
          description:
            error?.response
              ?.data?.message ||
            "Failed to share snap.",
        });
      } finally {
        setIsUploading(
          false,
        );
      }
    };

  const handlePublishStory =
    async () => {
      if (
        !capturedMedia
      ) {
        return;
      }

      setIsPostingStory(
        true,
      );

      try {
        const url =
          await uploadMedia(
            capturedMedia,
            "camera_story",
          );

        await api.post(
          "/api/stories",
          {
            media: [
              {
                url,
                type:
                  capturedMedia.type,
              },
            ],
            status:
              "published",
            isArchived:
              true,
            privacy:
              "public",
          },
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
        setIsPostingStory(
          false,
        );
      }
    };

  const handleSaveToVault =
    async () => {
      if (
        !capturedMedia
      ) {
        return;
      }

      setIsSavingVault(
        true,
      );

      try {
        const url =
          await uploadMedia(
            capturedMedia,
            "snap_vault",
          );

        await api.post(
          "/api/vault/memories",
          {
            title: `Memory - ${new Date().toLocaleDateString()}`,
            mediaUrl:
              url,
            mediaType:
              capturedMedia.type,
            isPrivate:
              false,
          },
        );

        toast({
          variant:
            "success",
          title:
            "Saved",
          description:
            "Saved to Vault!",
        });

        handleRetake();
      } catch (
        error: any
      ) {
        toast({
          variant:
            "error",
          title:
            "Vault Failed",
          description:
            error?.response
              ?.data?.message ||
            "Failed to save to Vault.",
        });
      } finally {
        setIsSavingVault(
          false,
        );
      }
    };

  const handleDownload =
    async () => {
      if (
        !capturedMedia
      ) {
        return;
      }

      try {
        const permission =
          await MediaLibrary.requestPermissionsAsync();

        if (
          !permission.granted
        ) {
          toast({
            variant:
              "error",
            title:
              "Permission Required",
            description:
              "Allow photo library access to save media.",
          });
          return;
        }

        await MediaLibrary.saveToLibraryAsync(
          capturedMedia.uri,
        );

        toast({
          variant:
            "success",
          title:
            "Saved",
          description:
            "Media saved to your device.",
        });
      } catch (
        error
      ) {
        console.error(
          "Save to library failed:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Save Failed",
          description:
            "Unable to save media to device.",
        });
      }
    };

  if (
    !cameraPermission
  ) {
    return (
      <View
        style={
          styles.centerScreen
        }
      >
        <ActivityIndicator
          size="large"
          color="#a855f7"
        />
      </View>
    );
  }

  if (
    !cameraPermission.granted
  ) {
    return (
      <View
        style={
          styles.permissionScreen
        }
      >
        <Camera
          size={54}
          color="#a855f7"
        />

        <Text
          style={
            styles.permissionTitle
          }
        >
          Camera access needed
        </Text>

        <Text
          style={
            styles.permissionText
          }
        >
          SnapGram needs camera access
          to take photos and videos.
        </Text>

        <Pressable
          onPress={() =>
            void requestCameraPermission()
          }
          style={
            styles.primaryButton
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Allow Camera
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.back()
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
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={
        styles.screen
      }
    >
      {!capturedMedia ? (
        <>
          <CameraView
            ref={cameraRef}
            style={
              styles.camera
            }
            type={
              facing
            }
            zoom={
              zoom
            }
            flashMode={
              mode === "photo" && flash === "on"
                ? FlashMode.on
                : FlashMode.off
            }
            ratio="9:16"
          >
            {nightMode ? (
              <View
                pointerEvents="none"
                style={
                  styles.nightOverlay
                }
              />
            ) : null}

            {hdrEnabled ? (
              <View
                pointerEvents="none"
                style={
                  styles.hdrOverlay
                }
              />
            ) : null}

            {showGrid ? (
              <View
                pointerEvents="none"
                style={
                  styles.grid
                }
              >
                <View
                  style={
                    styles.gridVerticalLeft
                  }
                />

                <View
                  style={
                    styles.gridVerticalRight
                  }
                />

                <View
                  style={
                    styles.gridHorizontalTop
                  }
                />

                <View
                  style={
                    styles.gridHorizontalBottom
                  }
                />
              </View>
            ) : null}

            {countdown !==
            null ? (
              <View
                style={
                  styles.countdownOverlay
                }
              >
                <Text
                  style={
                    styles.countdownText
                  }
                >
                  {
                    countdown
                  }
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.topBar,
                { top: (insets.top || 20) + 6 },
              ]}
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
                  size={21}
                  color="#ffffff"
                />
              </Pressable>

              <View
                style={
                  styles.topCenter
                }
              >
                <View
                  style={
                    styles.liveBadge
                  }
                >
                  <Text
                    style={
                      styles.liveBadgeText
                    }
                  >
                    {mode ===
                    "photo"
                      ? "PHOTO"
                      : "VIDEO"}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.topActions
                }
              >
                <Pressable
                  onPress={
                    cycleFlash
                  }
                  style={
                    styles.circleButton
                  }
                >
                  {flash ===
                  "on" ? (
                    <Zap
                      size={
                        20
                      }
                      color="#facc15"
                    />
                  ) : (
                    <ZapOff
                      size={
                        20
                      }
                      color="#ffffff"
                    />
                  )}
                </Pressable>

                <Pressable
                  onPress={() =>
                    setShowSettings(
                      true,
                    )
                  }
                  style={
                    styles.circleButton
                  }
                >
                  <Settings
                    size={
                      20
                    }
                    color="#ffffff"
                  />
                </Pressable>
              </View>
            </View>

            <View
              style={
                styles.sideControls
              }
            >
              <Pressable
                onPress={() =>
                  setZoom(
                    zoom ===
                      0
                      ? 0.35
                      : zoom ===
                          0.35
                        ? 0.7
                        : 0,
                  )
                }
                style={
                  styles.zoomButton
                }
              >
                <Text
                  style={
                    styles.zoomText
                  }
                >
                  {zoom ===
                  0
                    ? "1x"
                    : zoom <
                        0.5
                      ? "2x"
                      : "3x"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setNightMode(
                    (
                      value,
                    ) =>
                      !value,
                  )
                }
                style={[
                  styles.sideButton,
                  nightMode &&
                    styles.sideButtonActive,
                ]}
              >
                <Moon
                  size={
                    19
                  }
                  color={
                    nightMode
                      ? "#a78bfa"
                      : "#ffffff"
                  }
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  setHdrEnabled(
                    (
                      value,
                    ) =>
                      !value,
                  )
                }
                style={[
                  styles.hdrButton,
                  hdrEnabled &&
                    styles.hdrButtonActive,
                ]}
              >
                <Text
                  style={
                    styles.hdrText
                  }
                >
                  HDR
                </Text>
              </Pressable>
            </View>

            {isRecording ? (
              <View
                style={
                  styles.recordingBadge
                }
              >
                <View
                  style={
                    styles.recordingDot
                  }
                />

                <Text
                  style={
                    styles.recordingText
                  }
                >
                  {
                    recordingSeconds
                  }
                  s
                </Text>

                <Pressable
                  onPress={
                    togglePauseRecording
                  }
                  style={
                    styles.pauseButton
                  }
                >
                  {isPaused ? (
                    <Play
                      size={
                        13
                      }
                      color="#ffffff"
                    />
                  ) : (
                    <Pause
                      size={
                        13
                      }
                      color="#ffffff"
                    />
                  )}
                </Pressable>
              </View>
            ) : null}

            <View
              style={
                styles.bottomArea
              }
            >
              <View
                style={
                  styles.modeRow
                }
              >
                <Pressable
                  onPress={() =>
                    setMode(
                      "photo",
                    )
                  }
                  style={[
                    styles.modeButton,
                    mode ===
                      "photo" &&
                      styles.modeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      mode ===
                        "photo" &&
                        styles.modeTextActive,
                    ]}
                  >
                    PHOTO
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setMode(
                      "video",
                    )
                  }
                  style={[
                    styles.modeButton,
                    mode ===
                      "video" &&
                      styles.videoModeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      mode ===
                        "video" &&
                        styles.modeTextActive,
                    ]}
                  >
                    VIDEO
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filtersRow
                }
              >
                {FILTER_PRESETS.map(
                  (
                    filter,
                  ) => {
                    const active =
                      selectedFilter.id ===
                      filter.id;

                    return (
                      <Pressable
                        key={
                          filter.id
                        }
                        onPress={() =>
                          setSelectedFilter(
                            filter,
                          )
                        }
                        style={[
                          styles.filterItem,
                          active &&
                            styles.filterItemActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.filterCircle,
                            active &&
                              styles.filterCircleActive,
                          ]}
                        >
                          <Sparkles
                            size={
                              16
                            }
                            color={
                              active
                                ? "#facc15"
                                : "#ffffff"
                            }
                          />
                        </View>

                        <Text
                          style={[
                            styles.filterName,
                            active &&
                              styles.filterNameActive,
                          ]}
                        >
                          {
                            filter.name
                          }
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </ScrollView>

              <View
                style={
                  styles.shutterRow
                }
              >
                <Pressable
                  onPress={
                    importFromGallery
                  }
                  style={
                    styles.sideAction
                  }
                >
                  <ImageIcon
                    size={
                      21
                    }
                    color="#ffffff"
                  />
                </Pressable>

                <Pressable
                  onPress={
                    mode ===
                    "photo"
                      ? () =>
                          void capturePhoto()
                      : isRecording
                        ? stopRecording
                        : () =>
                            void startRecording()
                  }
                  style={[
                    styles.shutterOuter,
                    mode ===
                      "video" &&
                      styles.videoShutterOuter,
                  ]}
                >
                  <View
                    style={[
                      styles.shutterInner,
                      mode ===
                        "video" &&
                        isRecording &&
                        styles.recordingShutterInner,
                    ]}
                  />
                </Pressable>

                <Pressable
                  onPress={
                    toggleCamera
                  }
                  style={
                    styles.sideAction
                  }
                >
                  <SwitchCamera
                    size={
                      21
                    }
                    color="#ffffff"
                  />
                </Pressable>
              </View>

              <View
                style={
                  styles.bottomLinks
                }
              >
                <Pressable
                  onPress={() =>
                    setTimerSeconds(
                      (
                        value,
                      ) =>
                        value ===
                        0
                          ? 3
                          : value ===
                              3
                            ? 10
                            : 0,
                    )
                  }
                  style={
                    styles.smallTool
                  }
                >
                  <Text
                    style={
                      styles.timerText
                    }
                  >
                    {timerSeconds ===
                    0
                      ? "Timer"
                      : `${timerSeconds}s`}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setShowGrid(
                      (
                        value,
                      ) =>
                        !value,
                    )
                  }
                  style={
                    styles.smallTool
                  }
                >
                  <Grid3X3
                    size={
                      16
                    }
                    color="#ffffff"
                  />
                </Pressable>

                <Pressable
                  onPress={() =>
                    setShowFilters(
                      (
                        value,
                      ) =>
                        !value,
                    )
                  }
                  style={
                    styles.smallTool
                  }
                >
                  <Wand2
                    size={
                      16
                    }
                    color="#ffffff"
                  />
                </Pressable>
              </View>
            </View>
          </CameraView>

          {showFilters ? (
            <View
              style={
                styles.filterPanel
              }
            >
              <View
                style={
                  styles.filterPanelHeader
                }
              >
                <Text
                  style={
                    styles.filterPanelTitle
                  }
                >
                  Filters
                </Text>

                <Pressable
                  onPress={() =>
                    setShowFilters(
                      false,
                    )
                  }
                >
                  <X
                    size={
                      18
                    }
                    color="#ffffff"
                  />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterPanelRow
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
                      onPress={() => {
                        setSelectedFilter(
                          filter,
                        );
                        setShowFilters(
                          false,
                        );
                      }}
                      style={
                        styles.filterPanelItem
                      }
                    >
                      <View
                        style={[
                          styles.filterPreviewCircle,
                          selectedFilter.id ===
                            filter.id &&
                            styles.filterPreviewCircleActive,
                        ]}
                      >
                        <Sparkles
                          size={
                            17
                          }
                          color="#ffffff"
                        />
                      </View>

                      <Text
                        style={
                          styles.filterPanelName
                        }
                      >
                        {
                          filter.name
                        }
                      </Text>
                    </Pressable>
                  ),
                )}
              </ScrollView>
            </View>
          ) : null}
        </>
      ) : (
        <View
          style={
            styles.previewScreen
          }
        >
          <View
            style={
              styles.previewMediaWrap
            }
          >
            {capturedMedia.type ===
            "video" ? (
              <View
                style={
                  styles.videoPreviewPlaceholder
                }
              >
                <Video
                  size={
                    50
                  }
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.videoPreviewText
                  }
                >
                  Video captured
                </Text>
              </View>
            ) : (
              <Image
                source={{
                  uri:
                    capturedMedia.uri,
                }}
                resizeMode="contain"
                style={
                  styles.previewImage
                }
              />
            )}

            <View
              style={
                styles.previewTopBar
              }
            >
              <Pressable
                onPress={
                  handleRetake
                }
                style={
                  styles.circleButton
                }
              >
                <RotateCcw
                  size={
                    21
                  }
                  color="#ffffff"
                />
              </Pressable>

              <View
                style={
                  styles.previewActions
                }
              >
                <Pressable
                  onPress={
                    handleDownload
                  }
                  style={
                    styles.circleButton
                  }
                >
                  <Download
                    size={
                      20
                    }
                    color="#ffffff"
                  />
                </Pressable>

                <Pressable
                  onPress={() =>
                    setShowCaption(
                      true,
                    )
                  }
                  style={
                    styles.circleButton
                  }
                >
                  <Sparkles
                    size={
                      20
                    }
                    color="#ffffff"
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <View
            style={
              styles.previewBottom
            }
          >
            <Text
              style={
                styles.previewTitle
              }
            >
              Share your moment
            </Text>

            <Text
              style={
                styles.previewSubtitle
              }
            >
              Choose where you want to
              send this capture.
            </Text>

            <View
              style={
                styles.previewButtons
              }
            >
              <Pressable
                onPress={
                  handleSaveToVault
                }
                disabled={
                  isSavingVault
                }
                style={
                  styles.outlineAction
                }
              >
                {isSavingVault ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <>
                    <Lock
                      size={
                        18
                      }
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.outlineActionText
                      }
                    >
                      Vault
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={
                  handlePublishStory
                }
                disabled={
                  isPostingStory
                }
                style={
                  styles.gradientAction
                }
              >
                {isPostingStory ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <>
                    <Sparkles
                      size={
                        18
                      }
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.gradientActionText
                      }
                    >
                      Your Story
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={
                  handlePublish
                }
                disabled={
                  isUploading
                }
                style={
                  styles.sendAction
                }
              >
                {isUploading ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <>
                    <Send
                      size={
                        18
                      }
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.sendActionText
                      }
                    >
                      Send Snap
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Settings */}
      <Modal
        visible={
          showSettings
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowSettings(
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
              styles.settingsCard
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
                Camera Settings
              </Text>

              <Pressable
                onPress={() =>
                  setShowSettings(
                    false,
                  )
                }
              >
                <X
                  size={
                    20
                  }
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            <SettingRow
              label="Grid"
              value={
                showGrid
              }
              onPress={() =>
                setShowGrid(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
            />

            <SettingRow
              label="Night Mode"
              value={
                nightMode
              }
              onPress={() =>
                setNightMode(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
            />

            <SettingRow
              label="HDR"
              value={
                hdrEnabled
              }
              onPress={() =>
                setHdrEnabled(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
            />

            <View
              style={
                styles.zoomSettings
              }
            >
              <Text
                style={
                  styles.settingLabel
                }
              >
                Zoom
              </Text>

              <View
                style={
                  styles.zoomOptions
                }
              >
                {[
                  {
                    label:
                      "1x",
                    value:
                      0,
                  },
                  {
                    label:
                      "2x",
                    value:
                      0.35,
                  },
                  {
                    label:
                      "3x",
                    value:
                      0.7,
                  },
                ].map(
                  (
                    option,
                  ) => (
                    <Pressable
                      key={
                        option.label
                      }
                      onPress={() =>
                        setZoom(
                          option.value,
                        )
                      }
                      style={[
                        styles.zoomOption,
                        zoom ===
                          option.value &&
                          styles.zoomOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.zoomOptionText,
                          zoom ===
                            option.value &&
                            styles.zoomOptionTextActive,
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </View>

            <Pressable
              onPress={() =>
                setShowSettings(
                  false,
                )
              }
              style={
                styles.primaryButton
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Caption */}
      <Modal
        visible={
          showCaption
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowCaption(
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
              styles.captionCard
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
                Add Caption
              </Text>

              <Pressable
                onPress={() =>
                  setShowCaption(
                    false,
                  )
                }
              >
                <X
                  size={
                    20
                  }
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            <TextInput
              value={
                caption
              }
              onChangeText={
                setCaption
              }
              placeholder="Write a caption..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={
                5
              }
              style={
                styles.captionInput
              }
            />

            <Pressable
              onPress={() =>
                setShowCaption(
                  false,
                )
              }
              style={
                styles.primaryButton
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Save Caption
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={
        styles.settingRow
      }
    >
      <Text
        style={
          styles.settingLabel
        }
      >
        {label}
      </Text>

      <View
        style={[
          styles.switch,
          value &&
            styles.switchActive,
        ]}
      >
        {value ? (
          <Check
            size={
              15
            }
            color="#ffffff"
          />
        ) : null}
      </View>
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

    camera: {
      flex: 1,
    },

    centerScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#000000",
    },

    permissionScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 28,
      backgroundColor:
        "#f8fafc",
    },

    permissionTitle: {
      marginTop: 18,
      fontSize: 24,
      fontWeight:
        "800",
      color:
        "#0f172a",
      textAlign:
        "center",
    },

    permissionText: {
      marginTop: 8,
      maxWidth: 330,
      color:
        "#64748b",
      fontSize: 14,
      lineHeight: 21,
      textAlign:
        "center",
    },

    primaryButton: {
      minHeight: 46,
      paddingHorizontal: 22,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#a855f7",
      marginTop: 16,
    },

    primaryButtonText: {
      color:
        "#ffffff",
      fontSize: 13,
      fontWeight:
        "800",
    },

    secondaryButton: {
      marginTop: 10,
      minHeight: 44,
      paddingHorizontal: 22,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderColor:
        "#cbd5e1",
    },

    secondaryButtonText: {
      color:
        "#475569",
      fontSize: 13,
      fontWeight:
        "700",
    },

    nightOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(67,56,202,0.12)",
    },

    hdrOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(255,220,160,0.04)",
    },

    grid: {
      ...StyleSheet.absoluteFillObject,
    },

    gridVerticalLeft: {
      position:
        "absolute",
      left: "33.33%",
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor:
        "rgba(255,255,255,0.18)",
    },

    gridVerticalRight: {
      position:
        "absolute",
      right: "33.33%",
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor:
        "rgba(255,255,255,0.18)",
    },

    gridHorizontalTop: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top: "33.33%",
      height: 1,
      backgroundColor:
        "rgba(255,255,255,0.18)",
    },

    gridHorizontalBottom: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: "33.33%",
      height: 1,
      backgroundColor:
        "rgba(255,255,255,0.18)",
    },

    countdownOverlay: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.28)",
    },

    countdownText: {
      color:
        "#ffffff",
      fontSize: 90,
      fontWeight:
        "900",
    },

    topBar: {
      position:
        "absolute",
      top: 16,
      left: 16,
      right: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    topCenter: {
      position:
        "absolute",
      left: 0,
      right: 0,
      alignItems:
        "center",
    },

    topActions: {
      flexDirection:
        "row",
      gap: 8,
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
        "rgba(0,0,0,0.48)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
    },

    liveBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor:
        "rgba(0,0,0,0.48)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.16)",
    },

    liveBadgeText: {
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing: 1,
    },

    sideControls: {
      position:
        "absolute",
      right: 16,
      top: 90,
      gap: 10,
      alignItems:
        "center",
    },

    zoomButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.50)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
    },

    zoomText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "900",
    },

    sideButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.50)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
    },

    sideButtonActive: {
      backgroundColor:
        "rgba(99,102,241,0.35)",
    },

    hdrButton: {
      minWidth: 42,
      height: 34,
      paddingHorizontal: 8,
      borderRadius: 17,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.50)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
    },

    hdrButtonActive: {
      backgroundColor:
        "rgba(16,185,129,0.36)",
      borderColor:
        "rgba(16,185,129,0.60)",
    },

    hdrText: {
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "900",
    },

    recordingBadge: {
      position:
        "absolute",
      top: 76,
      alignSelf:
        "center",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 18,
      backgroundColor:
        "#ef4444",
    },

    recordingDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        "#ffffff",
    },

    recordingText: {
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "900",
    },

    pauseButton: {
      width: 23,
      height: 23,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.20)",
    },

    bottomArea: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: 22,
      paddingTop: 12,
    },

    modeRow: {
      alignSelf:
        "center",
      flexDirection:
        "row",
      padding: 3,
      borderRadius: 18,
      backgroundColor:
        "rgba(0,0,0,0.48)",
    },

    modeButton: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 15,
    },

    modeButtonActive: {
      backgroundColor:
        "#ffffff",
    },

    videoModeActive: {
      backgroundColor:
        "#ef4444",
    },

    modeText: {
      color:
        "rgba(255,255,255,0.65)",
      fontSize: 9,
      fontWeight:
        "900",
    },

    modeTextActive: {
      color:
        "#000000",
    },

    filtersRow: {
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },

    filterItem: {
      alignItems:
        "center",
      width: 62,
    },

    filterItemActive: {
      transform: [
        {
          scale: 1.05,
        },
      ],
    },

    filterCircle: {
      width: 45,
      height: 45,
      borderRadius: 23,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.42)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.55)",
    },

    filterCircleActive: {
      borderWidth: 2,
      borderColor:
        "#facc15",
      backgroundColor:
        "rgba(0,0,0,0.58)",
    },

    filterName: {
      marginTop: 5,
      color:
        "rgba(255,255,255,0.85)",
      fontSize: 8,
      fontWeight:
        "700",
      textAlign:
        "center",
    },

    filterNameActive: {
      color:
        "#facc15",
    },

    shutterRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 48,
    },

    sideAction: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.50)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.22)",
    },

    shutterOuter: {
      width: 78,
      height: 78,
      borderRadius: 39,
      borderWidth: 4,
      borderColor:
        "#ffffff",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    videoShutterOuter: {
      borderColor:
        "#ffffff",
    },

    shutterInner: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor:
        "#ffffff",
    },

    recordingShutterInner: {
      width: 29,
      height: 29,
      borderRadius: 7,
      backgroundColor:
        "#ef4444",
    },

    bottomLinks: {
      marginTop: 10,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 11,
    },

    smallTool: {
      minWidth: 38,
      minHeight: 30,
      paddingHorizontal: 9,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 15,
      backgroundColor:
        "rgba(0,0,0,0.45)",
    },

    timerText: {
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "800",
    },

    filterPanel: {
      position:
        "absolute",
      left: 12,
      right: 12,
      bottom: 145,
      padding: 12,
      borderRadius: 20,
      backgroundColor:
        "rgba(15,15,18,0.94)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.12)",
    },

    filterPanelHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 10,
    },

    filterPanelTitle: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "900",
    },

    filterPanelRow: {
      gap: 10,
    },

    filterPanelItem: {
      alignItems:
        "center",
      width: 62,
    },

    filterPreviewCircle: {
      width: 47,
      height: 47,
      borderRadius: 24,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.08)",
    },

    filterPreviewCircleActive: {
      borderWidth: 2,
      borderColor:
        "#a855f7",
    },

    filterPanelName: {
      marginTop: 4,
      color:
        "#cbd5e1",
      fontSize: 8,
      fontWeight:
        "700",
    },

    previewScreen: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    previewMediaWrap: {
      flex: 1,
      position:
        "relative",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    previewImage: {
      width:
        "100%",
      height:
        "100%",
    },

    videoPreviewPlaceholder: {
      width:
        "100%",
      height:
        "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#111111",
    },

    videoPreviewText: {
      marginTop: 10,
      color:
        "#ffffff",
      fontSize: 14,
      fontWeight:
        "700",
    },

    previewTopBar: {
      position:
        "absolute",
      top: 16,
      left: 16,
      right: 16,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
    },

    previewActions: {
      flexDirection:
        "row",
      gap: 9,
    },

    previewBottom: {
      padding: 20,
      paddingBottom: 30,
      backgroundColor:
        "#000000",
    },

    previewTitle: {
      color:
        "#ffffff",
      fontSize: 20,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    previewSubtitle: {
      marginTop: 5,
      color:
        "#94a3b8",
      fontSize: 12,
      textAlign:
        "center",
    },

    previewButtons: {
      flexDirection:
        "row",
      gap: 8,
      marginTop: 18,
    },

    outlineAction: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      flexDirection:
        "row",
      gap: 5,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.22)",
      backgroundColor:
        "rgba(255,255,255,0.08)",
    },

    outlineActionText: {
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "800",
    },

    gradientAction: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      flexDirection:
        "row",
      gap: 5,
      backgroundColor:
        "#8b5cf6",
    },

    gradientActionText: {
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "800",
    },

    sendAction: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      flexDirection:
        "row",
      gap: 5,
      backgroundColor:
        "#a855f7",
    },

    sendActionText: {
      color:
        "#ffffff",
      fontSize: 10,
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

    settingsCard: {
      padding: 20,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      backgroundColor:
        "#17121d",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    captionCard: {
      padding: 20,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      backgroundColor:
        "#17121d",
      borderWidth: 1,
      borderColor:
        "#30243b",
    },

    modalHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    modalTitle: {
      color:
        "#ffffff",
      fontSize: 17,
      fontWeight:
        "900",
    },

    settingRow: {
      minHeight: 52,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "#2b2332",
    },

    settingLabel: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "700",
    },

    switch: {
      width: 34,
      height: 21,
      borderRadius: 11,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#334155",
    },

    switchActive: {
      backgroundColor:
        "#a855f7",
    },

    zoomSettings: {
      paddingVertical: 17,
    },

    zoomOptions: {
      flexDirection:
        "row",
      gap: 8,
      marginTop: 8,
    },

    zoomOption: {
      flex: 1,
      minHeight: 38,
      borderRadius: 11,
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

    zoomOptionActive: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    zoomOptionText: {
      color:
        "#94a3b8",
      fontSize: 10,
      fontWeight:
        "800",
    },

    zoomOptionTextActive: {
      color:
        "#ffffff",
    },

    captionInput: {
      minHeight: 140,
      padding: 13,
      borderRadius: 14,
      backgroundColor:
        "#0d0a11",
      borderWidth: 1,
      borderColor:
        "#30243b",
      color:
        "#ffffff",
      textAlignVertical:
        "top",
      fontSize: 13,
    },
  });