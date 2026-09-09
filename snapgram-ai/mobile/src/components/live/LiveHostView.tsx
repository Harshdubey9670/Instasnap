import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import {
  RTCView,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";
import {
  Mic,
  MicOff,
  Settings,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react-native";
import {
  useSelector,
} from "react-redux";
import {
  router,
} from "expo-router";

import {
  useSocket,
} from "../../contexts/SocketContext";
import type {
  RootState,
} from "../../store/store";
import {
  startLiveStream,
  endLiveStream,
} from "../../services/liveService";

import {
  LiveChat,
} from "./LiveChat";
import {
  LiveLikes,
} from "./LiveLikes";

interface PeerMap {
  [viewerId: string]: RTCPeerConnection;
}

export const LiveHostView =
  () => {
    const {
      user,
    } = useSelector(
      (state: RootState) =>
        state.auth,
    );

    const {
      socket,
    } = useSocket();

    const [
      streamId,
      setStreamId,
    ] = useState<
      string | null
    >(null);

    const [
      isLive,
      setIsLive,
    ] = useState(
      false,
    );

    const [
      viewerCount,
      setViewerCount,
    ] = useState(0);

    const [
      isMuted,
      setIsMuted,
    ] = useState(
      false,
    );

    const [
      isVideoOff,
      setIsVideoOff,
    ] = useState(
      false,
    );

    const [
      localStream,
      setLocalStream,
    ] =
      useState<MediaStream | null>(
        null,
      );

    const streamRef =
      useRef<MediaStream | null>(
        null,
      );

    const peersRef =
      useRef<PeerMap>({});

    const endingRef =
      useRef(false);

    const initCamera =
      useCallback(
        async () => {
          try {
            const stream =
              await mediaDevices.getUserMedia(
                {
                  audio: true,
                  video: {
                    facingMode:
                      "user",
                  },
                },
              );

            streamRef.current =
              stream;

            setLocalStream(
              stream,
            );
          } catch (
            error
          ) {
            console.error(
              "Camera access denied or unavailable",
              error,
            );

            Alert.alert(
              "Camera Required",
              "Camera and microphone access is required to go live.",
              [
                {
                  text: "OK",
                  onPress: () =>
                    router.back(),
                },
              ],
            );
          }
        },
        [],
      );

    const stopLocalStream =
      () => {
        const stream =
          streamRef.current;

        if (!stream) {
          return;
        }

        stream
          .getTracks()
          .forEach(
            (
              track,
            ) => {
              track.stop();
            },
          );

        streamRef.current =
          null;

        setLocalStream(
          null,
        );
      };

    const closePeers =
      () => {
        Object.values(
          peersRef.current,
        ).forEach(
          (peer) => {
            try {
              peer.close();
            } catch {
              // Already closed.
            }
          },
        );

        peersRef.current =
          {};
      };

    const handleEndStream =
      useCallback(
        async () => {
          if (
            endingRef.current
          ) {
            return;
          }

          endingRef.current =
            true;

          try {
            if (
              streamId
            ) {
              try {
                await endLiveStream(
                  streamId,
                );
              } catch (
                error
              ) {
                console.error(
                  "Failed to end stream:",
                  error,
                );
              }

              if (socket) {
                socket.emit(
                  "leave-live",
                  {
                    streamId,
                  },
                );
              }
            }
          } finally {
            closePeers();
            stopLocalStream();
            router.replace(
              "/app" as any,
            );
          }
        },
        [
          socket,
          streamId,
        ],
      );

    useEffect(() => {
      void initCamera();

      return () => {
        closePeers();
        stopLocalStream();
      };
    }, [
      initCamera,
    ]);

    useEffect(() => {
      if (
        !socket ||
        !isLive ||
        !streamId
      ) {
        return;
      }

      const handleViewerJoined =
        async ({
          viewerId,
        }: {
          viewerId: string;
        }) => {
          setViewerCount(
            (
              previous,
            ) =>
              previous +
              1,
          );

          const peer =
            new RTCPeerConnection(
              {
                iceServers: [
                  {
                    urls:
                      "stun:stun.l.google.com:19302",
                  },
                ],
              },
            );

          peersRef.current[
            viewerId
          ] = peer;

          const currentStream =
            streamRef.current;

          if (
            currentStream
          ) {
            currentStream
              .getTracks()
              .forEach(
                (
                  track,
                ) => {
                  peer.addTrack(
                    track,
                    currentStream,
                  );
                },
              );
          }

          peer.onicecandidate =
            (event: any) => {
              if (
                event.candidate
              ) {
                socket.emit(
                  "webrtc-ice-candidate",
                  {
                    target:
                      viewerId,
                    candidate:
                      event.candidate,
                    streamId,
                  },
                );
              }
            };

          try {
            const offer =
              await peer.createOffer();

            await peer.setLocalDescription(
              offer,
            );

            socket.emit(
              "webrtc-offer",
              {
                target:
                  viewerId,
                offer,
                streamId,
              },
            );
          } catch (
            error
          ) {
            console.error(
              "Error creating offer:",
              error,
            );
          }
        };

      const handleViewerLeft =
        ({
          viewerId,
        }: {
          viewerId: string;
        }) => {
          setViewerCount(
            (
              previous,
            ) =>
              Math.max(
                0,
                previous -
                  1,
              ),
          );

          const peer =
            peersRef.current[
              viewerId
            ];

          if (
            peer
          ) {
            peer.close();

            delete peersRef.current[
              viewerId
            ];
          }
        };

      const handleAnswer =
        async ({
          caller,
          answer,
        }: {
          caller: string;
          answer: any;
        }) => {
          const peer =
            peersRef.current[
              caller
            ];

          if (
            peer
          ) {
            try {
              await peer.setRemoteDescription(
                new RTCSessionDescription(
                  answer,
                ),
              );
            } catch (
              error
            ) {
              console.error(
                "Failed to set remote answer:",
                error,
              );
            }
          }
        };

      const handleIceCandidate =
        async ({
          caller,
          candidate,
        }: {
          caller: string;
          candidate: any;
        }) => {
          const peer =
            peersRef.current[
              caller
            ];

          if (
            peer
          ) {
            try {
              await peer.addIceCandidate(
                new RTCIceCandidate(
                  candidate,
                ),
              );
            } catch (
              error
            ) {
              console.error(
                "Failed to add ICE candidate:",
                error,
              );
            }
          }
        };

      socket.on(
        "viewer-joined",
        handleViewerJoined,
      );

      socket.on(
        "viewer-left",
        handleViewerLeft,
      );

      socket.on(
        "webrtc-answer",
        handleAnswer,
      );

      socket.on(
        "webrtc-ice-candidate",
        handleIceCandidate,
      );

      return () => {
        socket.off(
          "viewer-joined",
          handleViewerJoined,
        );

        socket.off(
          "viewer-left",
          handleViewerLeft,
        );

        socket.off(
          "webrtc-answer",
          handleAnswer,
        );

        socket.off(
          "webrtc-ice-candidate",
          handleIceCandidate,
        );
      };
    }, [
      socket,
      isLive,
      streamId,
    ]);

    const handleGoLive =
      async () => {
        if (
          !user?.username
        ) {
          return;
        }

        try {
          const data =
            await startLiveStream(
              `${user.username}'s Live Stream`,
            );

          const id =
            data.data
              ._id;

          setStreamId(
            id,
          );

          setIsLive(
            true,
          );

          if (
            socket
          ) {
            socket.emit(
              "join-live",
              {
                streamId:
                  id,
              },
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to start stream:",
            error,
          );

          Alert.alert(
            "Error",
            "Failed to start stream",
          );
        }
      };

    const toggleMute =
      () => {
        const stream =
          streamRef.current;

        if (!stream) {
          return;
        }

        stream
          .getAudioTracks()
          .forEach(
            (
              track,
            ) => {
              track.enabled =
                isMuted;
            },
          );

        setIsMuted(
          (
            previous,
          ) =>
            !previous,
        );
      };

    const toggleVideo =
      () => {
        const stream =
          streamRef.current;

        if (!stream) {
          return;
        }

        stream
          .getVideoTracks()
          .forEach(
            (
              track,
            ) => {
              track.enabled =
                isVideoOff;
            },
          );

        setIsVideoOff(
          (
            previous,
          ) =>
            !previous,
        );
      };

    return (
      <View
        style={
          styles.container
        }
      >
        {localStream ? (
          <RTCView
            streamURL={
              localStream.toURL()
            }
            style={
              styles.video
            }
            objectFit="cover"
            mirror
            zOrder={0}
          />
        ) : (
          <View
            style={
              styles.blackScreen
            }
          />
        )}

        <View
          pointerEvents="none"
          style={
            styles.topGradient
          }
        />

        <View
          style={
            styles.topBar
          }
        >
          <View
            style={
              styles.topLeft
            }
          >
            <View
              style={
                styles.livePill
              }
            >
              {isLive ? (
                <>
                  <View
                    style={
                      styles.liveDot
                    }
                  />

                  <Text
                    style={
                      styles.liveText
                    }
                  >
                    LIVE
                  </Text>

                  <Text
                    style={
                      styles.liveTime
                    }
                  >
                    00:00
                  </Text>
                </>
              ) : (
                <Text
                  style={
                    styles.previewText
                  }
                >
                  PREVIEW
                </Text>
              )}
            </View>

            {isLive ? (
              <View
                style={
                  styles.viewerPill
                }
              >
                <Users
                  size={15}
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.viewerText
                  }
                >
                  {
                    viewerCount
                  }
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() =>
              void handleEndStream()
            }
            style={
              styles.closeButton
            }
            accessibilityRole="button"
            accessibilityLabel="End live stream"
          >
            <X
              size={22}
              color="#ffffff"
            />
          </Pressable>
        </View>

        {isLive ? (
          <>
            <LiveChat
              streamId={
                streamId
              }
              isHost
            />

            <LiveLikes
              streamId={
                streamId
              }
              isHost
            />
          </>
        ) : (
          <View
            style={
              styles.previewOverlay
            }
          >
            <View
              style={
                styles.previewCard
              }
            >
              <View
                style={
                  styles.videoIcon
                }
              >
                <Video
                  size={38}
                  color="#ffffff"
                />
              </View>

              <Text
                style={
                  styles.previewTitle
                }
              >
                Ready to go live?
              </Text>

              <Text
                style={
                  styles.previewDescription
                }
              >
                Your followers will be
                notified when you start
                your live stream.
              </Text>

              <Pressable
                onPress={
                  handleGoLive
                }
                style={
                  styles.goLiveButton
                }
              >
                <Text
                  style={
                    styles.goLiveText
                  }
                >
                  Go Live Now
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View
          style={
            styles.bottomBar
          }
        >
          <View
            style={
              styles.hostControls
            }
          >
            <Pressable
              onPress={
                toggleMute
              }
              style={[
                styles.controlButton,
                isMuted &&
                  styles.controlDanger,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isMuted
                  ? "Turn microphone on"
                  : "Mute microphone"
              }
            >
              {isMuted ? (
                <MicOff
                  size={24}
                  color="#ffffff"
                />
              ) : (
                <Mic
                  size={24}
                  color="#ffffff"
                />
              )}
            </Pressable>

            <Pressable
              onPress={
                toggleVideo
              }
              style={[
                styles.controlButton,
                isVideoOff &&
                  styles.controlDanger,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isVideoOff
                  ? "Turn camera on"
                  : "Turn camera off"
              }
            >
              {isVideoOff ? (
                <VideoOff
                  size={24}
                  color="#ffffff"
                />
              ) : (
                <Video
                  size={24}
                  color="#ffffff"
                />
              )}
            </Pressable>
          </View>

          <Pressable
            style={
              styles.controlButton
            }
            accessibilityRole="button"
            accessibilityLabel="Live settings"
          >
            <Settings
              size={24}
              color="#ffffff"
            />
          </Pressable>
        </View>
      </View>
    );
  };

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    video: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "#000000",
    },

    blackScreen: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "#000000",
    },

    topGradient: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 150,
      backgroundColor:
        "rgba(0,0,0,0.50)",
      zIndex: 5,
    },

    topBar: {
      position:
        "absolute",
      top:
        Platform.OS ===
        "ios"
          ? 56
          : 26,
      left: 0,
      right: 0,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 14,
      zIndex: 10,
    },

    topLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    livePill: {
      minHeight: 34,

      flexDirection:
        "row",
      alignItems:
        "center",

      paddingHorizontal: 12,

      borderRadius: 20,

      backgroundColor:
        "rgba(0,0,0,0.42)",
    },

    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        "#ef4444",
      marginRight: 6,
    },

    liveText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 1,
    },

    liveTime: {
      marginLeft: 6,
      color:
        "rgba(255,255,255,0.60)",
      fontSize: 10,
      fontFamily:
        Platform.select({
          ios:
            "Menlo",
          android:
            "monospace",
        }),
    },

    previewText: {
      color:
        "rgba(255,255,255,0.80)",
      fontSize: 12,
      fontWeight: "700",
    },

    viewerPill: {
      minHeight: 34,

      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,

      paddingHorizontal: 11,

      borderRadius: 20,

      backgroundColor:
        "rgba(0,0,0,0.42)",
    },

    viewerText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
    },

    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 21,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "rgba(0,0,0,0.40)",
    },

    previewOverlay: {
      ...StyleSheet.absoluteFillObject,

      alignItems:
        "center",
      justifyContent:
        "center",

      padding: 24,

      zIndex: 8,
    },

    previewCard: {
      width: "100%",
      maxWidth: 380,

      alignItems:
        "center",

      padding: 30,

      borderRadius: 28,

      backgroundColor:
        "rgba(0,0,0,0.42)",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    videoIcon: {
      width: 80,
      height: 80,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 40,

      backgroundColor:
        "#a855f7",

      marginBottom: 20,
    },

    previewTitle: {
      color: "#ffffff",
      fontSize: 23,
      fontWeight: "900",
      textAlign:
        "center",
    },

    previewDescription: {
      marginTop: 8,
      marginBottom: 22,

      maxWidth: 300,

      color:
        "rgba(255,255,255,0.70)",
      fontSize: 13,
      lineHeight: 19,
      textAlign:
        "center",
    },

    goLiveButton: {
      width: "100%",
      minHeight: 52,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 16,

      backgroundColor:
        "#a855f7",
    },

    goLiveText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "900",
    },

    bottomBar: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,

      minHeight: 100,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom:
        Platform.OS ===
        "ios"
          ? 28
          : 14,

      backgroundColor:
        "rgba(0,0,0,0.56)",

      zIndex: 20,
    },

    hostControls: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 14,
    },

    controlButton: {
      width: 52,
      height: 52,
      borderRadius: 26,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "rgba(0,0,0,0.42)",
    },

    controlDanger: {
      backgroundColor:
        "rgba(239,68,68,0.80)",
    },
  });

export default LiveHostView;