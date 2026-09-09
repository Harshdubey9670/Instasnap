import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  FolderPlus,
  Lock,
  Settings,
  Trash2,
  Unlock,
} from "lucide-react-native";

interface MemoryAlbum {
  _id: string;
  name: string;
  coverUrl?: string;
  itemCount?: number;
  isPrivate?: boolean;
}

interface MemoryAlbumCardProps {
  album: MemoryAlbum;
  onClick?: (
    album: MemoryAlbum,
  ) => void;
  onEdit?: (
    album: MemoryAlbum,
  ) => void;
  onDelete?: (
    albumId: string,
  ) => void;
}

export const MemoryAlbumCard = ({
  album,
  onClick,
  onEdit,
  onDelete,
}: MemoryAlbumCardProps) => {
  const handleOpen =
    () => {
      onClick?.(album);
    };

  const handleEdit =
    () => {
      onEdit?.(album);
    };

  const handleDelete =
    () => {
      onDelete?.(album._id);
    };

  return (
    <View
      style={
        styles.card
      }
    >
      <Pressable
        onPress={
          handleOpen
        }
        style={({ pressed }) => [
          styles.mediaArea,
          pressed &&
            styles.mediaPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open album ${album.name}`}
      >
        {album.coverUrl ? (
          <>
            <Image
              source={{
                uri:
                  album.coverUrl,
              }}
              style={
                styles.cover
              }
              resizeMode="cover"
              accessibilityLabel={
                album.name
              }
            />

            <View
              pointerEvents="none"
              style={
                styles.coverOverlay
              }
            />
          </>
        ) : (
          <View
            style={
              styles.emptyCover
            }
          >
            <FolderPlus
              size={48}
              color="#c084fc"
              strokeWidth={1.8}
            />
          </View>
        )}

        <View
          style={
            styles.albumInfo
          }
        >
          <Text
            style={
              styles.albumName
            }
            numberOfLines={
              1
            }
          >
            {album.name}
          </Text>

          <Text
            style={
              styles.itemCount
            }
          >
            {album.itemCount ||
              0}{" "}
            {album.itemCount ===
            1
              ? "item"
              : "items"}
          </Text>
        </View>

        <View
          style={
            styles.privacyBadge
          }
        >
          {album.isPrivate ? (
            <Lock
              size={14}
              color="#fbbf24"
              strokeWidth={2}
            />
          ) : (
            <Unlock
              size={14}
              color="#34d399"
              strokeWidth={2}
            />
          )}
        </View>
      </Pressable>

      {(onEdit ||
        onDelete) ? (
        <View
          style={
            styles.actions
          }
        >
          {onEdit ? (
            <Pressable
              onPress={
                handleEdit
              }
              style={
                styles.actionButton
              }
              accessibilityRole="button"
              accessibilityLabel={`Edit ${album.name}`}
              hitSlop={4}
            >
              <Settings
                size={14}
                color="#ffffff"
              />
            </Pressable>
          ) : null}

          {onDelete ? (
            <Pressable
              onPress={
                handleDelete
              }
              style={
                styles.actionButton
              }
              accessibilityRole="button"
              accessibilityLabel={`Delete ${album.name}`}
              hitSlop={4}
            >
              <Trash2
                size={14}
                color="#fca5a5"
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles =
  StyleSheet.create({
    card: {
      position:
        "relative",

      width: "100%",

      overflow:
        "hidden",

      borderRadius: 18,

      backgroundColor:
        "#130a1c",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },

    mediaArea: {
      position:
        "relative",

      width: "100%",

      aspectRatio: 1,

      alignItems:
        "center",
      justifyContent:
        "center",

      overflow:
        "hidden",
    },

    mediaPressed: {
      opacity: 0.92,
    },

    cover: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
      opacity: 0.62,
    },

    coverOverlay: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        "rgba(0,0,0,0.30)",
    },

    emptyCover: {
      ...StyleSheet.absoluteFillObject,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "rgba(0,0,0,0.25)",
    },

    albumInfo: {
      position:
        "absolute",

      left: 0,
      right: 0,
      bottom: 0,

      paddingHorizontal: 14,
      paddingBottom: 13,
      paddingTop: 36,
    },

    albumName: {
      width: "100%",

      color:
        "#ffffff",

      fontSize: 14,
      lineHeight: 19,

      fontWeight:
        "800",
    },

    itemCount: {
      marginTop: 2,

      color:
        "rgba(255,255,255,0.70)",

      fontSize: 11,
      lineHeight: 15,
    },

    privacyBadge: {
      position:
        "absolute",

      top: 10,
      right: 10,

      width: 30,
      height: 30,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 15,

      backgroundColor:
        "rgba(0,0,0,0.58)",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.12)",
    },

    actions: {
      position:
        "absolute",

      right: 9,
      bottom: 9,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,

      zIndex: 20,
    },

    actionButton: {
      width: 32,
      height: 32,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 9,

      backgroundColor:
        "rgba(0,0,0,0.60)",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },
  });

export default MemoryAlbumCard;