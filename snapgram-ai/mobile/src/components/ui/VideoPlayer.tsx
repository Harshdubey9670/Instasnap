import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import {
  Video,
  ResizeMode,
  type AVPlaybackStatus,
} from "expo-av";

export interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (
    seconds: number,
  ) => Promise<void>;
  readonly currentTime: number;
  readonly duration: number;
  readonly paused: boolean;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onEnded?: () => void;
  onTimeUpdate?: (
    currentTime: number,
  ) => void;
}

const formatTime = (
  seconds: number,
): string => {
  if (
    !Number.isFinite(
      seconds,
    ) ||
    Number.isNaN(seconds)
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  const secs =
    Math.floor(
      seconds % 60,
    )
      .toString()
      .padStart(2, "0");

  return `${minutes}:${secs}`;
};

export const VideoPlayer =
  forwardRef<
    VideoPlayerRef,
    VideoPlayerProps
  >(
    (
      {
        src,
        poster,
        autoPlay = false,
        loop = false,
        muted: mutedProp = false,
        controls = true,
        onEnded,
        onTimeUpdate,
      },
      ref,
    ) => {
      const videoRef =
        useRef<Video>(null);

      const hideTimer =
        useRef<
          ReturnType<typeof setTimeout> | null
        >(null);

      const [
        playing,
        setPlaying,
      ] = useState(
        autoPlay,
      );

      const [
        muted,
        setMuted,
      ] = useState(
        mutedProp,
      );

      const [
        volume,
        setVolume,
      ] = useState(1);

      const [
        currentTime,
        setCurrentTime,
      ] = useState(0);

      const [
        duration,
        setDuration,
      ] = useState(0);

      const [
        buffered,
        setBuffered,
      ] = useState(0);

      const [
        isFullscreen,
        setIsFullscreen,
      ] = useState(false);

      const [
        isPip,
        setIsPip,
      ] = useState(false);

      const [
        isBuffering,
        setIsBuffering,
      ] = useState(false);

      const [
        showControls,
        setShowControls,
      ] = useState(true);

      const [
        ended,
        setEnded,
      ] = useState(false);

      const [
        seeking,
        setSeeking,
      ] = useState(false);

      const {
        width,
      } =
        useWindowDimensions();

      const play =
        useCallback(
          async () => {
            await videoRef.current?.playAsync();
            setPlaying(true);
            setEnded(false);
          },
          [],
        );

      const pause =
        useCallback(
          async () => {
            await videoRef.current?.pauseAsync();
            setPlaying(false);
          },
          [],
        );

      const seek =
        useCallback(
          async (
            seconds: number,
          ) => {
            const safe =
              Math.max(
                0,
                Math.min(
                  seconds,
                  duration ||
                    seconds,
                ),
              );

            await videoRef.current?.setPositionAsync(
              safe *
                1000,
            );

            setCurrentTime(
              safe,
            );
          },
          [duration],
        );

      useImperativeHandle(
        ref,
        () => ({
          play,
          pause,
          seek,

          get currentTime() {
            return currentTime;
          },

          get duration() {
            return duration;
          },

          get paused() {
            return !playing;
          },
        }),
        [
          currentTime,
          duration,
          pause,
          play,
          playing,
          seek,
        ],
      );

      const resetHideTimer =
        useCallback(
          () => {
            setShowControls(
              true,
            );

            if (
              hideTimer.current
            ) {
              clearTimeout(
                hideTimer.current,
              );
            }

            if (playing) {
              hideTimer.current =
                setTimeout(() => {
                  setShowControls(
                    false,
                  );
                }, 3000);
            }
          },
          [playing],
        );

      useEffect(() => {
        resetHideTimer();

        return () => {
          if (
            hideTimer.current
          ) {
            clearTimeout(
              hideTimer.current,
            );
          }
        };
      }, [
        resetHideTimer,
      ]);

      useEffect(() => {
        return () => {
          if (
            hideTimer.current
          ) {
            clearTimeout(
              hideTimer.current,
            );
          }
        };
      }, []);

      const handlePlaybackStatusUpdate =
        (
          status: AVPlaybackStatus,
        ) => {
          if (
            !status.isLoaded
          ) {
            setIsBuffering(false);
            return;
          }

          setCurrentTime(
            status.positionMillis /
              1000,
          );

          setDuration(
            status.durationMillis
              ? status.durationMillis /
                  1000
              : 0,
          );

          setPlaying(
            status.isPlaying,
          );

          setIsBuffering(
            status.isBuffering,
          );

          if (
            !seeking &&
            status.positionMillis !==
              undefined
          ) {
            onTimeUpdate?.(
              status.positionMillis /
                1000,
            );
          }

          if (
            status.durationMillis &&
            status.durationMillis >
              0
          ) {
            setBuffered(
              status.positionMillis /
                status.durationMillis *
                100,
            );
          }

          if (
            status.didJustFinish
          ) {
            setPlaying(false);
            setEnded(true);
            onEnded?.();
          }
        };

      const togglePlay =
        async () => {
          if (!videoRef.current) {
            return;
          }

          if (playing) {
            await pause();
          } else {
            await play();
          }

          resetHideTimer();
        };

      const replay =
        async () => {
          if (!videoRef.current) {
            return;
          }

          setEnded(false);

          await videoRef.current.setPositionAsync(
            0,
          );

          await videoRef.current.playAsync();

          setPlaying(true);
        };

      const toggleMute =
        async () => {
          const nextMuted =
            !muted;

          setMuted(
            nextMuted,
          );

          await videoRef.current?.setIsMutedAsync(
            nextMuted,
          );
        };

      const toggleFullscreen =
        async () => {
          if (
            !videoRef.current
          ) {
            return;
          }

          try {
            if (
              isFullscreen
            ) {
              await videoRef.current.dismissFullscreenPlayer();
              setIsFullscreen(
                false,
              );
            } else {
              await videoRef.current.presentFullscreenPlayer();
              setIsFullscreen(
                true,
              );
            }
          } catch (error) {
            console.error(
              "Fullscreen error:",
              error,
            );
          }
        };

      const togglePip =
        async () => {
          /*
           * The current Expo 50 / expo-av foundation does not expose
           * the browser-style requestPictureInPicture API used by the
           * original web component.
           *
           * Keep the control visible only when a future native media
           * layer provides this capability.
           */
          console.warn(
            "Picture-in-Picture requires a native media implementation beyond the current expo-av setup.",
          );

          setIsPip(
            (value) => !value,
          );
        };

      const progress =
        duration > 0
          ? (currentTime /
              duration) *
            100
          : 0;

      const handleSeekPress =
        (
          percent: number,
        ) => {
          const nextTime =
            (percent / 100) *
            duration;

          setSeeking(true);
          void seek(
            nextTime,
          );
          setSeeking(false);
        };

      const handleVolumeStep =
        (
          direction:
            | "up"
            | "down",
        ) => {
          const nextVolume =
            direction ===
            "up"
              ? Math.min(
                  1,
                  volume +
                    0.05,
                )
              : Math.max(
                  0,
                  volume -
                    0.05,
                );

          setVolume(
            nextVolume,
          );

          setMuted(
            nextVolume ===
              0,
          );

          void videoRef.current?.setVolumeAsync(
            nextVolume,
          );

          void videoRef.current?.setIsMutedAsync(
            nextVolume ===
              0,
          );
        };

      const videoHeight =
        Math.max(
          220,
          Math.min(
            width *
              0.72,
            520,
          ),
        );

      return (
        <View
          style={[
            styles.container,
            {
              height:
                videoHeight,
            },
          ]}
        >
          <Pressable
            style={
              styles.videoArea
            }
            onPress={
              controls
                ? togglePlay
                : undefined
            }
            onPressIn={
              resetHideTimer
            }
            accessibilityRole="button"
          >
            <Video
              ref={videoRef}
              source={{
                uri: src,
              }}
              posterSource={
                poster
                  ? {
                      uri: poster,
                    }
                  : undefined
              }
              usePoster={
                Boolean(
                  poster,
                )
              }
              shouldPlay={
                autoPlay
              }
              isLooping={
                loop
              }
              isMuted={
                muted
              }
              volume={
                volume
              }
              resizeMode={
                ResizeMode.CONTAIN
              }
              style={
                styles.video
              }
              progressUpdateIntervalMillis={
                250
              }
              onPlaybackStatusUpdate={
                handlePlaybackStatusUpdate
              }
            />

            {isBuffering && (
              <View
                style={
                  styles.buffering
                }
              >
                <ActivityIndicator
                  size="large"
                  color="rgba(255,255,255,0.80)"
                />
              </View>
            )}

            {ended &&
            !loop ? (
              <View
                style={
                  styles.replayOverlay
                }
              >
                <Pressable
                  onPress={
                    replay
                  }
                  style={
                    styles.replayButton
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Replay video"
                >
                  <RotateCcw
                    size={56}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.replayText
                    }
                  >
                    Replay
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {controls &&
            showControls ? (
              <View
                pointerEvents="box-none"
                style={
                  styles.controlsOverlay
                }
              >
                <View
                  style={
                    styles.gradient
                  }
                />

                <View
                  style={
                    styles.controlsInner
                  }
                >
                  <Pressable
                    onPress={
                      () =>
                        void togglePlay()
                    }
                    style={
                      styles.controlButton
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      playing
                        ? "Pause video"
                        : "Play video"
                    }
                  >
                    {playing ? (
                      <Pause
                        size={24}
                        color="#ffffff"
                        fill="#ffffff"
                      />
                    ) : (
                      <Play
                        size={24}
                        color="#ffffff"
                        fill="#ffffff"
                      />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={
                      () =>
                        void toggleMute()
                    }
                    style={
                      styles.controlButton
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      muted
                        ? "Unmute video"
                        : "Mute video"
                    }
                  >
                    {muted ? (
                      <VolumeX
                        size={20}
                        color="#ffffff"
                      />
                    ) : (
                      <Volume2
                        size={20}
                        color="#ffffff"
                      />
                    )}
                  </Pressable>

                  <Text
                    style={
                      styles.timeText
                    }
                  >
                    {formatTime(
                      currentTime,
                    )}{" "}
                    /{" "}
                    {formatTime(
                      duration,
                    )}
                  </Text>

                  <View
                    style={
                      styles.spacer
                    }
                  />

                  <Pressable
                    onPress={
                      () =>
                        void togglePip()
                    }
                    style={[
                      styles.controlButton,
                      isPip &&
                        styles.activeControl,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Picture in Picture"
                  >
                    <PictureInPicture2
                      size={19}
                      color="#ffffff"
                    />
                  </Pressable>

                  <Pressable
                    onPress={
                      () =>
                        void toggleFullscreen()
                    }
                    style={
                      styles.controlButton
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      isFullscreen
                        ? "Exit fullscreen"
                        : "Enter fullscreen"
                    }
                  >
                    {isFullscreen ? (
                      <Minimize
                        size={20}
                        color="#ffffff"
                      />
                    ) : (
                      <Maximize
                        size={20}
                        color="#ffffff"
                      />
                    )}
                  </Pressable>
                </View>

                <View
                  style={
                    styles.progressTrack
                  }
                >
                  <View
                    style={[
                      styles.bufferedTrack,
                      {
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            buffered,
                          ),
                        )}%`,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.progressPlayed,
                      {
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            progress,
                          ),
                        )}%`,
                      },
                    ]}
                  />

                  <View
                    style={
                      styles.progressHitArea
                    }
                  >
                    <Pressable
                      onPress={() => {
                        /*
                         * React Native does not provide the browser's
                         * range input. Tapping the track itself is
                         * therefore used for seeking.
                         */
                        handleSeekPress(
                          progress >=
                            100
                            ? 0
                            : progress,
                        );
                      }}
                      style={
                        styles.progressPressable
                      }
                    />
                  </View>
                </View>

                <View
                  style={
                    styles.volumeHelper
                  }
                >
                  <Pressable
                    onPress={() =>
                      handleVolumeStep(
                        "down",
                      )
                    }
                    style={
                      styles.volumeStep
                    }
                  >
                    <Text
                      style={
                        styles.volumeStepText
                      }
                    >
                      −
                    </Text>
                  </Pressable>

                  <View
                    style={
                      styles.volumeTrack
                    }
                  >
                    <View
                      style={[
                        styles.volumeFill,
                        {
                          width: `${
                            muted
                              ? 0
                              : volume *
                                100
                          }%`,
                        },
                      ]}
                    />
                  </View>

                  <Pressable
                    onPress={() =>
                      handleVolumeStep(
                        "up",
                      )
                    }
                    style={
                      styles.volumeStep
                    }
                  >
                    <Text
                      style={
                        styles.volumeStepText
                      }
                    >
                      +
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </Pressable>
        </View>
      );
    },
  );

VideoPlayer.displayName =
  "VideoPlayer";

const styles =
  StyleSheet.create({
    container: {
      width: "100%",
      backgroundColor:
        "#000000",
      borderRadius: 16,
      overflow:
        "hidden",
    },

    videoArea: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    video: {
      width: "100%",
      height: "100%",
      backgroundColor:
        "#000000",
    },

    buffering: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    replayOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.40)",
    },

    replayButton: {
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    replayText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
    },

    controlsOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent:
        "flex-end",
    },

    gradient: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 130,
      backgroundColor:
        "rgba(0,0,0,0.45)",
    },

    controlsInner: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 8,
    },

    controlButton: {
      width: 34,
      height: 34,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 17,
    },

    activeControl: {
      backgroundColor:
        "rgba(168,85,247,0.25)",
    },

    spacer: {
      flex: 1,
    },

    timeText: {
      color:
        "rgba(255,255,255,0.80)",
      fontSize: 12,
      fontWeight: "500",
      fontVariant: [
        "tabular-nums",
      ],
    },

    progressTrack: {
      height: 6,
      marginHorizontal: 12,
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.20)",
      overflow:
        "hidden",
      position:
        "relative",
    },

    bufferedTrack: {
      position:
        "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor:
        "rgba(255,255,255,0.30)",
      borderRadius: 999,
    },

    progressPlayed: {
      position:
        "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor:
        "#ffffff",
      borderRadius: 999,
    },

    progressHitArea: {
      position:
        "absolute",
      left: -8,
      right: -8,
      top: -14,
      bottom: -14,
    },

    progressPressable: {
      flex: 1,
    },

    volumeHelper: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingBottom: 10,
    },

    volumeTrack: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.20)",
      overflow:
        "hidden",
    },

    volumeFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor:
        "#ffffff",
    },

    volumeStep: {
      width: 28,
      height: 28,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 14,
    },

    volumeStepText: {
      color: "#ffffff",
      fontSize: 20,
      lineHeight: 22,
    },
  });
