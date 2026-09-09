import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import {
  AlertTriangle,
  Clock,
  Eye,
  ShieldAlert,
  X,
} from "lucide-react-native";
import {
  Video,
  ResizeMode,
} from "expo-av";

import api from "../../services/api";
import {
  useToast,
} from "../ui/Toast";

interface Snap {
  _id: string;
  snapTimer?: number;
  sender?: {
    username?: string;
  };
  mediaType?: string;
  mediaUrl?: string;
  text?: string;
}

interface SnapViewerModalProps {
  snap: Snap | null;
  onClose: () => void;
  onSnapExpired?: (
    id: string,
  ) => void;
}

export const SnapViewerModal = ({
  snap,
  onClose,
  onSnapExpired,
}: SnapViewerModalProps) => {
  if (!snap) return null;

  const {
    toast,
  } = useToast();

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    timeLeft,
    setTimeLeft,
  ] = useState(
    snap?.snapTimer ||
      10,
  );

  const [
    screenshotAlert,
    setScreenshotAlert,
  ] = useState(false);

  const timerRef =
    useRef<
      ReturnType<
        typeof setInterval
      > | null
    >(null);

  useEffect(() => {
    return () => {
      if (
        timerRef.current
      ) {
        clearInterval(
          timerRef.current,
        );
      }
    };
  }, []);

  const triggerScreenshotDetection =
    async () => {
      setScreenshotAlert(
        true,
      );

      toast({
        variant:
          "error",
        title:
          "📷 Screenshot Detected!",
        description: `Sender @${
          snap.sender
            ?.username ||
          "user"
        } has been notified of your screenshot.`,
      });

      try {
        await api.post(
          `/api/messages/snap/${snap._id}/screenshot`,
        );
      } catch (
        error
      ) {
        console.error(
          "Screenshot reporting failed:",
          error,
        );
      }
    };

  const handleOpenSnap =
    async () => {
      if (isOpen) {
        return;
      }

      setIsOpen(
        true,
      );

      try {
        await api.post(
          `/api/messages/snap/${snap._id}/open`,
        );
      } catch (
        error
      ) {
        console.error(
          "Open snap failed:",
          error,
        );
      }

      let remaining =
        snap?.snapTimer ||
        10;

      timerRef.current =
        setInterval(
          () => {
            remaining -=
              1;

            setTimeLeft(
              remaining,
            );

            if (
              remaining <=
              0
            ) {
              if (
                timerRef.current
              ) {
                clearInterval(
                  timerRef.current,
                );

                timerRef.current =
                  null;
              }

              if (snap?._id) {
                onSnapExpired?.(
                  snap._id,
                );
              }

              onClose();
            }
          },
          1000,
        );
    };

  if (!snap) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.container
        }
      >
        <View
          style={
            styles.topBar
          }
        >
          <View
            style={
              styles.timerPill
            }
          >
            <Clock
              size={15}
              color="#f0abfc"
            />

            <Text
              style={
                styles.timerText
              }
            >
              {isOpen
                ? `${timeLeft}s remaining`
                : `${
                    snap.snapTimer ||
                    10
                  }s Snap`}
            </Text>
          </View>

          {screenshotAlert ? (
            <View
              style={
                styles.screenshotAlert
              }
            >
              <ShieldAlert
                size={15}
                color="#ffffff"
              />

              <Text
                style={
                  styles.screenshotText
                }
              >
                Screenshot Taken!
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={
              onClose
            }
            style={
              styles.closeButton
            }
            accessibilityRole="button"
            accessibilityLabel="Close snap"
          >
            <X
              size={23}
              color="#ffffff"
            />
          </Pressable>
        </View>

        <View
          style={
            styles.snapContainer
          }
        >
          {!isOpen ? (
            <Pressable
              onPress={() =>
                void handleOpenSnap()
              }
              style={
                styles.cover
              }
            >
              <View
                style={
                  styles.eyeCircle
                }
              >
                <Eye
                  size={38}
                  color="#ffffff"
                />
              </View>

              <Text
                style={
                  styles.coverTitle
                }
              >
                New Snap from @
                {snap.sender
                  ?.username ||
                  "friend"}
              </Text>

              <Text
                style={
                  styles.coverDescription
                }
              >
                Tap anywhere to view snap
                {" "}
                (
                {snap.snapTimer ||
                  10}
                s)
              </Text>

              <View
                style={
                  styles.selfDestructPill
                }
              >
                <Text
                  style={
                    styles.selfDestructText
                  }
                >
                  🔒 Self-destructs after
                  viewing
                </Text>
              </View>
            </Pressable>
          ) : (
            <View
              style={
                styles.mediaContainer
              }
            >
              {snap.mediaType ===
              "video" &&
              snap.mediaUrl ? (
                <Video
                  source={{
                    uri:
                      snap.mediaUrl,
                  }}
                  style={
                    styles.media
                  }
                  resizeMode={
                    ResizeMode.CONTAIN
                  }
                  shouldPlay
                  isLooping={false}
                />
              ) : snap.mediaUrl ? (
                <Image
                  source={{
                    uri:
                      snap.mediaUrl,
                  }}
                  style={
                    styles.media
                  }
                  resizeMode="contain"
                />
              ) : (
                <Text
                  style={
                    styles.snapText
                  }
                >
                  {
                    snap.text
                  }
                </Text>
              )}

              <View
                style={
                  styles.countdown
                }
              >
                <Text
                  style={
                    styles.countdownText
                  }
                >
                  {
                    timeLeft
                  }
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.96)",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    topBar: {
      position:
        "absolute",
      top:
        Platform.OS ===
        "ios"
          ? 54
          : 24,
      left: 16,
      right: 16,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      zIndex: 20,
    },

    timerPill: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,

      minHeight: 38,

      paddingHorizontal: 13,

      borderRadius: 20,

      backgroundColor:
        "rgba(255,255,255,0.09)",
    },

    timerText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
    },

    screenshotAlert: {
      position:
        "absolute",
      left: "50%",

      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,

      paddingHorizontal: 10,
      paddingVertical: 6,

      borderRadius: 15,

      backgroundColor:
        "#ef4444",

      transform: [
        {
          translateX:
            -55,
        },
      ],
    },

    screenshotText: {
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "800",
    },

    closeButton: {
      width: 42,
      height: 42,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 21,

      backgroundColor:
        "rgba(255,255,255,0.09)",
    },

    snapContainer: {
      width:
        "92%",
      maxWidth: 480,
      height:
        "82%",

      overflow:
        "hidden",

      borderRadius: 28,

      backgroundColor:
        "#000000",
    },

    cover: {
      flex: 1,

      alignItems:
        "center",
      justifyContent:
        "center",

      padding: 28,

      backgroundColor:
        "#130a1c",
    },

    eyeCircle: {
      width: 80,
      height: 80,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 40,

      backgroundColor:
        "#a855f7",

      marginBottom: 18,
    },

    coverTitle: {
      color:
        "#ffffff",
      fontSize: 20,
      lineHeight: 27,
      fontWeight:
        "800",
      textAlign:
        "center",
    },

    coverDescription: {
      marginTop: 7,
      marginBottom: 20,

      color:
        "#94a3b8",

      fontSize: 12,
      lineHeight: 18,

      textAlign:
        "center",
    },

    selfDestructPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,

      borderRadius: 20,

      backgroundColor:
        "rgba(255,255,255,0.06)",

      borderWidth: 1,
      borderColor:
        "rgba(168,85,247,0.30)",
    },

    selfDestructText: {
      color:
        "#c084fc",
      fontSize: 10,
      fontWeight:
        "700",
    },

    mediaContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",

      position:
        "relative",
    },

    media: {
      width: "100%",
      height: "100%",
    },

    snapText: {
      padding: 24,
      color:
        "#ffffff",
      fontSize: 20,
      textAlign:
        "center",
    },

    countdown: {
      position:
        "absolute",
      right: 18,
      bottom: 18,

      width: 48,
      height: 48,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 24,

      backgroundColor:
        "rgba(0,0,0,0.50)",

      borderWidth: 2,
      borderColor:
        "#a855f7",
    },

    countdownText: {
      color:
        "#ffffff",
      fontSize: 14,
      fontWeight:
        "900",
    },
  });

export default SnapViewerModal;