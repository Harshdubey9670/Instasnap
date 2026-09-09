import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Camera,
  Image as ImageIcon,
  Radio,
  Video,
  X,
} from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

interface CreateMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreatePost: () => void;
}

interface MenuItem {
  label: string;
  action: () => void;
  icon: typeof ImageIcon;
  color: string;
  backgroundColor: string;
}

export const CreateMenuModal = ({
  isOpen,
  onClose,
  onOpenCreatePost,
}: CreateMenuModalProps) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const menuItems: MenuItem[] = [
    {
      label: "Create Post",
      icon: ImageIcon,
      color: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.15)",
      action: () => {
        onClose();
        onOpenCreatePost();
      },
    },
    {
      label: "Upload Reel",
      icon: Video,
      color: "#ef4444",
      backgroundColor: "rgba(239,68,68,0.15)",
      action: () => {
        onClose();
        router.push("/app/reels/create");
      },
    },
    {
      label: "Create Story",
      icon: Camera,
      color: "#ec4899",
      backgroundColor: "rgba(236,72,153,0.15)",
      action: () => {
        onClose();
        router.push("/app/story/create");
      },
    },
    {
      label: "Go Live",
      icon: Radio,
      color: "#a855f7",
      backgroundColor: "rgba(168,85,247,0.15)",
      action: () => {
        onClose();
        router.push("/app/live/new");
      },
    },
  ];

  const modalBg = isDark ? "#130a1c" : "#ffffff";
  const borderCol = isDark ? "#2d1b3b" : "#e2e8f0";
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const itemBg = isDark ? "#1c102b" : "#f8fafc";
  const itemBorder = isDark ? "#2d1b3b" : "rgba(226,232,240,0.60)";

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlayContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.modal, { backgroundColor: modalBg }]}>
          <View style={[styles.header, { borderBottomColor: borderCol }]}>
            <Text style={[styles.title, { color: textColor }]}>Create</Text>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close create menu"
              hitSlop={8}
            >
              <X size={20} color={isDark ? "#94a3b8" : "#64748b"} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Pressable
                  key={item.label}
                  onPress={item.action}
                  style={({ pressed }) => [
                    styles.menuItem,
                    {
                      backgroundColor: itemBg,
                      borderColor: itemBorder,
                    },
                    pressed && styles.menuItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: item.backgroundColor,
                      },
                    ]}
                  >
                    <Icon size={24} color={item.color} />
                  </View>

                  <Text style={[styles.menuLabel, { color: textColor }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  modal: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
    paddingBottom: 28,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  menuItem: {
    width: "47%",
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  menuItemPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default CreateMenuModal;