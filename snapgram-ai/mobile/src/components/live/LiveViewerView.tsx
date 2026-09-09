import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  Pressable,
  View,
  Platform,
} from "react-native";
import {
  AlertTriangle,
  Users,
  Wifi,
  X,
} from "lucide-react-native";
import {
  RTCView,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";
import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  useSocket,
} from "../../contexts/SocketContext";
import {
  getStream,
} from "../../services/liveService";

import {
  Avatar,
} from "../ui/Avatar";

import {
  LiveChat,
} from "./LiveChat";

import {
  LiveLikes,
} from "./LiveLikes";

type Quality =
  | "good"
  | "poor"
  | "disconnected";

interface StreamHost {
  _id: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
}

interface StreamInfo {
  _id: string;
  status: string;
  host: StreamHost;
}

export const LiveViewerView =
  () => {
    const params =
      useLocalSearchParams<{
        id?: string;
      }>();

    const streamId =
      Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const {
      socket,
    } = useSocket();

    const [
      streamInfo,
      setStreamInfo,
    ] =
      useState<StreamInfo | null>(
        null,
      );

    const [
      loading,
      setLoading,
    ] = useState(
      true,
    );

    const [
      error,
      setError,
    ] = useState<
      string | null
    >(null);

    const [
      viewerCount,
      setViewerCount,
    ] = useState(1);

    const [
      quality,
      setQuality,
    ] =
      useState<Quality>(
        "poor",
      );

    const [
      remoteStream,
      setRemoteStream,
    ] =
      useState<MediaStream | null>(
        null,
      );

    const peerRef =
      useRef<RTCPeerConnection | null>(
        null,
      );

    useEffect(() => {
      let mounted =
        true;

      const fetchStream =
        async () => {
          if (!streamId) {
            setError(
              "Stream not found.",
            );
            setLoading(
              false,
            );
            return;
          }

          try {
            const data =
              await getStream(
                streamId,
              );

            if (
              !mounted
            ) {
              return;
            }

            if (
              data.data
                .status !==
              "live"
            ) {
              setError(
                "This live stream has ended.",
              );
            } else {
              setStreamInfo(
                data.data,
              );
            }
          } catch (
            err
          ) {
            console.error(
              err,
            );

            if (
              mounted
            ) {
              setError(
                "Stream not found.",
              );
            }
          } finally {
            if (
              mounted
            ) {
              setLoading(
                false,
              );
            }
          }
        };

      void fetchStream();

      return () => {
        mounted = false;
      };
    }, [
      streamId,
    ]);

    useEffect(() => {
      if (
        !socket ||
        !streamInfo ||
        error ||
        !streamId
      ) {
        return;
      }

      let mounted =
        true;

      const createPeer =
        () => {
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

          peerRef.current =
            peer;

          peer.ontrack =
            (event: any) => {
              const stream =
                event.streams?.[0];

              if (
                stream &&
                mounted
              ) {
                setRemoteStream(
                  stream,
                );
                setQuality(
                  "good",
                );
              }
            };

          peer.onicecandidate =
            (event: any) => {
              if (
                event.candidate &&
                socket
              ) {
                socket.emit(
                  "webrtc-ice-candidate",
                  {
                    target:
                      streamInfo.host
                        ._id,
                    candidate:
                      event.candidate,
                    streamId,
                  },
                );
              }
            };

          peer.oniceconnectionstatechange =
            () => {
              switch (
                peer.iceConnectionState
              ) {
                case "connected":
                case "completed":
                  if (
                    mounted
                  ) {
                    setQuality(
                      "good",
                    );
                  }
                  break;

                case "checking":
                  if (
                    mounted
                  ) {
                    setQuality(
                      "poor",
                    );
                  }
                  break;

                case "disconnected":
                case "failed":
                case "closed":
                  if (
                    mounted
                  ) {
                    setQuality(
                      "disconnected",
                    );
                  }
                  break;

                default:
                  break;
              }
            };

          return peer;
        };

      const handleOffer =
        async ({
          caller,
          offer,
        }: {
          caller: string;
          offer: any;
        }) => {
          try {
            const peer =
              peerRef.current ||
              createPeer();

            await peer.setRemoteDescription(
              new RTCSessionDescription(
                offer,
              ),
            );

            const answer =
              await peer.createAnswer();

            await peer.setLocalDescription(
              answer,
            );

            socket.emit(
              "webrtc-answer",
              {
                target:
                  caller,
                answer,
                streamId,
              },
            );
          } catch (
            error
          ) {
            console.error(
              "WebRTC offer handling failed:",
              error,
            );
          }
        };

      const handleIceCandidate =
        async ({
          candidate,
        }: {
          candidate: any;
        }) => {
          if (
            !peerRef.current
          ) {
            return;
          }

          try {
            await peerRef.current.addIceCandidate(
              new RTCIceCandidate(
                candidate,
              ),
            );
          } catch (
            error
          ) {
            console.error(
              "Error adding ICE candidate:",
              error,
            );
          }
        };

      const handleViewerCount =
        ({
          count,
        }: {
          count: number;
        }) => {
          if (
            typeof count ===
            "number"
          ) {
            setViewerCount(
              count,
            );
          }
        };

      socket.on(
        "webrtc-offer",
        handleOffer,
      );

      socket.on(
        "webrtc-ice-candidate",
        handleIceCandidate,
      );

      /*
       * Keep support for a server-side viewer count event if your
       * backend emits one. This does not alter the existing signaling.
       */
      socket.on(
        "live-viewer-count",
        handleViewerCount,
      );

      socket.emit(
        "join-live",
        {
          streamId,
        },
      );

      setQuality(
        "poor",
      );

      return () => {
        mounted = false;

        socket.off(
          "webrtc-offer",
          handleOffer,
        );

        socket.off(
          "webrtc-ice-candidate",
          handleIceCandidate,
        );

        socket.off(
          "live-viewer-count",
          handleViewerCount,
        );

        socket.emit(
          "leave-live",
          {
            streamId,
          },
        );

        try {
          peerRef.current?.close();
        } catch {
          // Already closed.
        }

        peerRef.current =
          null;

        setRemoteStream(
          null,
        );
      };
    }, [
      socket,
      streamInfo,
      error,
      streamId,
    ]);

    const handleClose =
      () => {
        router.replace(
          "/app" as any,
        );
      };

    if (loading) {
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

    if (error) {
      return (
        <View
          style={
            styles.centerScreen
          }
        >
          <AlertTriangle
            size={64}
            color="#eab308"
          />

          <Text
            style={
              styles.errorTitle
            }
          >
            {error}
          </Text>

          <Pressable
            onPress={
              handleClose
            }
            style={
              styles.backButton
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Go Back
            </Text>
          </Pressable>
        </View>
      );
    }

    if (!streamInfo) {
      return null;
    }

    return (
      <View
        style={
          styles.container
        }
      >
        {remoteStream ? (
          <RTCView
            streamURL={
              remoteStream.toURL()
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

        {quality !==
        "good" ? (
          <View
            style={
              styles.connectingOverlay
            }
          >
            {quality ===
            "disconnected" ? (
              <Wifi
                size={34}
                color="#eab308"
              />
            ) : (
              <ActivityIndicator
                size="large"
                color="#ffffff"
              />
            )}

            <Text
              style={
                styles.connectingText
              }
            >
              {quality ===
              "disconnected"
                ? "Connection lost"
                : "Connecting to stream..."}
            </Text>
          </View>
        ) : null}

        <View
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
                styles.hostPill
              }
            >
              <Avatar
                src={
                  streamInfo.host
                    .profilePicture ||
                  streamInfo.host
                    .avatar
                }
                size="sm"
                fallback={
                  streamInfo.host.username
                    ?.charAt(
                      0,
                    )
                    ?.toUpperCase() ||
                  "U"
                }
              />

              <View
                style={
                  styles.hostText
                }
              >
                <Text
                  style={
                    styles.hostUsername
                  }
                  numberOfLines={
                    1
                  }
                >
                  {
                    streamInfo.host
                      .username
                  }
                </Text>

                <View
                  style={
                    styles.liveLabel
                  }
                >
                  <View
                    style={
                      styles.liveDot
                    }
                  />

                  <Text
                    style={
                      styles.liveLabelText
                    }
                  >
                    LIVE
                  </Text>
                </View>
              </View>
            </View>

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
                  styles.viewerCount
                }
              >
                {
                  viewerCount
                }
              </Text>
            </View>

            <View
              style={[
                styles.qualityPill,
                quality ===
                  "good"
                  ? styles.goodQuality
                  : styles.poorQuality,
              ]}
            >
              <Wifi
                size={15}
                color={
                  quality ===
                  "good"
                    ? "#4ade80"
                    : "#facc15"
                }
              />
            </View>
          </View>

          <Pressable
            onPress={
              handleClose
            }
            style={
              styles.closeButton
            }
            accessibilityRole="button"
            accessibilityLabel="Close live stream"
          >
            <X
              size={22}
              color="#ffffff"
            />
          </Pressable>
        </View>

        <LiveChat
          streamId={
            streamId ||
            null
          }
          isHost={false}
        />

        <LiveLikes
          streamId={
            streamId ||
            null
          }
          isHost={false}
        />
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

    centerScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#000000",
      padding: 24,
    },

    errorTitle: {
      marginTop: 16,
      marginBottom: 20,
      color: "#ffffff",
      fontSize: 20,
      lineHeight: 27,
      fontWeight: "800",
      textAlign:
        "center",
    },

    backButton: {
      minHeight: 42,
      paddingHorizontal: 24,
      borderRadius: 22,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.10)",
    },

    backButtonText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },

    connectingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.60)",
      zIndex: 10,
    },

    connectingText: {
      marginTop: 14,
      color:
        "rgba(255,255,255,0.80)",
      fontSize: 13,
      fontWeight: "600",
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
      zIndex: 15,
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

      paddingHorizontal: 12,
      zIndex: 20,
    },

    topLeft: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    hostPill: {
      maxWidth: 210,

      minHeight: 44,

      flexDirection:
        "row",
      alignItems:
        "center",

      paddingLeft: 4,
      paddingRight: 10,

      borderRadius: 24,

      backgroundColor:
        "rgba(0,0,0,0.42)",
    },

    hostText: {
      flex: 1,
      minWidth: 0,
      marginLeft: 8,
    },

    hostUsername: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
    },

    liveLabel: {
      marginTop: 2,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        "#ef4444",
    },

    liveLabelText: {
      color:
        "rgba(255,255,255,0.80)",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1,
    },

    viewerPill: {
      minHeight: 36,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      paddingHorizontal: 10,
      borderRadius: 18,
      backgroundColor:
        "rgba(0,0,0,0.42)",
    },

    viewerCount: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "800",
    },

    qualityPill: {
      width: 34,
      height: 34,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 17,
    },

    goodQuality: {
      backgroundColor:
        "rgba(34,197,94,0.20)",
    },

    poorQuality: {
      backgroundColor:
        "rgba(234,179,8,0.20)",
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
  });

export default LiveViewerView;