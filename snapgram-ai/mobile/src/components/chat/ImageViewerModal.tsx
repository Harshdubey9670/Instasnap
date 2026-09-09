import React from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  Download,
  X,
} from "lucide-react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

interface ImageViewerModalProps {
  src?: string | null;
  onClose: () => void;
}

export const ImageViewerModal = ({
  src,
  onClose,
}: ImageViewerModalProps) => {
  const handleDownload =
    async () => {
      if (!src) {
        return;
      }

      try {
        const filename =
          `snapgram_${Date.now()}.jpg`;

        const uri =
          `${FileSystem.cacheDirectory}${filename}`;

        const result =
          await FileSystem.downloadAsync(
            src,
            uri,
          );

        const available =
          await Sharing.isAvailableAsync();

        if (available) {
          await Sharing.shareAsync(
            result.uri,
            {
              mimeType:
                "image/jpeg",
              dialogTitle:
                "Save image",
              UTI:
                "public.jpeg",
            },
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Failed to download image:",
          error,
        );
      }
    };

  return (
    <Modal
      visible={Boolean(src)}
      transparent
      animationType="fade"
      onRequestClose={
        onClose
      }
      statusBarTranslucent
    >
      <View
        style={
          styles.container
        }
      >
        <Pressable
          style={
            styles.backdrop
          }
          onPress={
            onClose
          }
        />

        <View
          style={
            styles.actions
          }
        >
          <Pressable
            onPress={() =>
              void handleDownload()
            }
            style={
              styles.actionButton
            }
            accessibilityRole="button"
            accessibilityLabel="Download image"
          >
            <Download
              size={23}
              color="#ffffff"
            />
          </Pressable>

          <Pressable
            onPress={
              onClose
            }
            style={
              styles.actionButton
            }
            accessibilityRole="button"
            accessibilityLabel="Close image viewer"
          >
            <X
              size={23}
              color="#ffffff"
            />
          </Pressable>
        </View>

        {src ? (
          <Pressable
            style={
              styles.imageContainer
            }
            onPress={() => {}}
          >
            <Image
              source={{
                uri: src,
              }}
              style={
                styles.image
              }
              resizeMode="contain"
              accessibilityLabel="Full screen viewer"
            />
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
};

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.97)",
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.97)",
    },

    actions: {
      position:
        "absolute",
      top:
        18,
      right:
        16,

      flexDirection:
        "row",

      gap: 10,

      zIndex: 10,
    },

    actionButton: {
      width: 46,
      height: 46,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 23,

      backgroundColor:
        "rgba(255,255,255,0.10)",
    },

    imageContainer: {
      width: "100%",
      height: "88%",

      alignItems:
        "center",
      justifyContent:
        "center",

      paddingHorizontal: 12,
    },

    image: {
      width: "100%",
      height: "100%",
    },
  });

export default ImageViewerModal;