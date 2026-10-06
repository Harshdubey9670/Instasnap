import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../../../theme/fonts";

interface SpatialSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  maxHeightPct?: number;
}

// Bottom sheet used for comments / share / options / add-note flows.
export const SpatialSheet: React.FC<SpatialSheetProps> = ({ isOpen, onClose, title, children, maxHeightPct = 85 }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { maxHeight: `${maxHeightPct}%`, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.handle} />
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <X size={18} color="#FFF7F5" />
            </Pressable>
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(48,5,4,0.7)",
  },
  sheet: {
    backgroundColor: "rgba(145,35,32,0.97)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: {
    color: "#FFF7F5",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});

export default SpatialSheet;
