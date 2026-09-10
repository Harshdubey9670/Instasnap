import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Check, Minus, Plus, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIEWPORT_SIZE = Math.min(SCREEN_WIDTH - 64, 280);

export interface AvatarCropResult {
  uri: string;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AvatarCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onCropDone: (result: AvatarCropResult) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  visible,
  imageUri,
  onClose,
  onCropDone,
}) => {
  const [scale, setScale] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Keep references for gesture tracking
  const panRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1.0);
  panRef.current = pan;
  scaleRef.current = scale;

  // Load natural image dimensions when imageUri changes
  useEffect(() => {
    if (!imageUri || !visible) {
      setImageSize(null);
      setScale(1.0);
      setPan({ x: 0, y: 0 });
      return;
    }

    Image.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height });
        setScale(1.0);
        setPan({ x: 0, y: 0 });
      },
      () => {
        // Fallback size if getSize fails
        setImageSize({ width: 1000, height: 1000 });
        setScale(1.0);
        setPan({ x: 0, y: 0 });
      }
    );
  }, [imageUri, visible]);

  // Compute base fit dimensions
  const baseLayout = useMemo(() => {
    if (!imageSize) return { width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, baseScale: 1 };
    const baseScale = Math.max(
      VIEWPORT_SIZE / imageSize.width,
      VIEWPORT_SIZE / imageSize.height
    );
    return {
      width: imageSize.width * baseScale,
      height: imageSize.height * baseScale,
      baseScale,
    };
  }, [imageSize]);

  // Clamp pan offsets so the circle is always filled
  const clampPan = useCallback(
    (newX: number, newY: number, currentScale: number) => {
      const curW = baseLayout.width * currentScale;
      const curH = baseLayout.height * currentScale;
      const maxDeltaX = Math.max(0, (curW - VIEWPORT_SIZE) / 2);
      const maxDeltaY = Math.max(0, (curH - VIEWPORT_SIZE) / 2);

      return {
        x: Math.max(-maxDeltaX, Math.min(maxDeltaX, newX)),
        y: Math.max(-maxDeltaY, Math.min(maxDeltaY, newY)),
      };
    },
    [baseLayout]
  );

  // Pan gesture responder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {},
        onPanResponderMove: (_evt, gestureState) => {
          const nextX = panRef.current.x + gestureState.dx;
          const nextY = panRef.current.y + gestureState.dy;
          setPan(clampPan(nextX, nextY, scaleRef.current));
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const finalX = panRef.current.x + gestureState.dx;
          const finalY = panRef.current.y + gestureState.dy;
          setPan(clampPan(finalX, finalY, scaleRef.current));
        },
      }),
    [clampPan]
  );

  // Zoom slider gesture
  const handleZoomChange = useCallback(
    (newScale: number) => {
      const clamped = Math.max(1.0, Math.min(3.0, newScale));
      setScale(clamped);
      setPan((prev) => clampPan(prev.x, prev.y, clamped));
    },
    [clampPan]
  );

  const handleReset = useCallback(() => {
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleConfirmCrop = async () => {
    if (!imageUri || !imageSize || isProcessing) return;

    try {
      setIsProcessing(true);

      // Compute crop bounds in natural image coordinates
      const totalScale = baseLayout.baseScale * scale;
      const cropSizeNatural = VIEWPORT_SIZE / totalScale;

      // In natural image space:
      const centerX = imageSize.width / 2 - pan.x / totalScale;
      const centerY = imageSize.height / 2 - pan.y / totalScale;

      let originX = Math.round(centerX - cropSizeNatural / 2);
      let originY = Math.round(centerY - cropSizeNatural / 2);
      let width = Math.round(cropSizeNatural);
      let height = Math.round(cropSizeNatural);

      // Boundary protections
      if (originX < 0) {
        originX = 0;
      }
      if (originY < 0) {
        originY = 0;
      }
      if (originX + width > imageSize.width) {
        width = imageSize.width - originX;
      }
      if (originY + height > imageSize.height) {
        height = imageSize.height - originY;
      }

      // Ensure square crop
      const minDimension = Math.max(10, Math.min(width, height));

      const cropRect = {
        x: Math.max(0, originX),
        y: Math.max(0, originY),
        width: minDimension,
        height: minDimension,
      };

      setIsProcessing(false);
      onCropDone({ uri: imageUri, crop: cropRect });
    } catch (err) {
      console.error("Avatar crop error:", err);
      setIsProcessing(false);
      // Fallback: return original image with full bounds
      onCropDone({
        uri: imageUri,
        crop: {
          x: 0,
          y: 0,
          width: imageSize.width,
          height: imageSize.height,
        },
      });
    }
  };

  if (!visible || !imageUri) return null;

  const currentDisplayWidth = baseLayout.width * scale;
  const currentDisplayHeight = baseLayout.height * scale;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Top bar */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            disabled={isProcessing}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.btnPressed]}
          >
            <X size={24} color="#f8fafc" />
          </Pressable>
          <Text style={styles.headerTitle}>Adjust Profile Photo</Text>
          <Pressable
            onPress={handleConfirmCrop}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.headerBtn,
              styles.confirmBtn,
              pressed && styles.btnPressed,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Check size={22} color="#ffffff" />
            )}
          </Pressable>
        </View>

        {/* Viewport Area */}
        <View style={styles.viewportContainer}>
          <View
            style={[
              styles.viewport,
              { width: VIEWPORT_SIZE, height: VIEWPORT_SIZE },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Movable & Scalable Image */}
            <View
              style={[
                styles.imageContainer,
                {
                  width: currentDisplayWidth,
                  height: currentDisplayHeight,
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>

            {/* Circular cut-out aperture mask */}
            <View
              pointerEvents="none"
              style={[
                styles.circleMask,
                {
                  width: VIEWPORT_SIZE,
                  height: VIEWPORT_SIZE,
                  borderRadius: VIEWPORT_SIZE / 2,
                },
              ]}
            />
            {/* Grid crosshair guidelines */}
            <View pointerEvents="none" style={styles.guidelineH} />
            <View pointerEvents="none" style={styles.guidelineV} />
          </View>

          <Text style={styles.instructionText}>
            Drag image to reposition • Use controls below to zoom
          </Text>
        </View>

        {/* Controls Section */}
        <View style={styles.controls}>
          {/* Zoom Slider / Controls */}
          <View style={styles.zoomRow}>
            <Pressable
              onPress={() => handleZoomChange(scale - 0.15)}
              style={({ pressed }) => [styles.zoomStepBtn, pressed && styles.btnPressed]}
            >
              <Minus size={18} color="#94a3b8" />
            </Pressable>

            {/* Visual Zoom Bar */}
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${((scale - 1.0) / 2.0) * 100}%` },
                ]}
              />
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${((scale - 1.0) / 2.0) * 100}%` },
                ]}
              />
            </View>

            <Pressable
              onPress={() => handleZoomChange(scale + 0.15)}
              style={({ pressed }) => [styles.zoomStepBtn, pressed && styles.btnPressed]}
            >
              <Plus size={18} color="#94a3b8" />
            </Pressable>

            <Text style={styles.zoomValue}>{Math.round(scale * 100)}%</Text>
          </View>

          {/* Quick actions: Reset & Presets */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.actionPill, pressed && styles.btnPressed]}
            >
              <RotateCcw size={14} color="#94a3b8" style={{ marginRight: 6 }} />
              <Text style={styles.actionPillText}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={() => handleZoomChange(1.0)}
              style={({ pressed }) => [
                styles.actionPill,
                scale === 1.0 && styles.actionPillActive,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.actionPillText,
                  scale === 1.0 && styles.actionPillTextActive,
                ]}
              >
                1.0x
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleZoomChange(1.5)}
              style={({ pressed }) => [
                styles.actionPill,
                scale === 1.5 && styles.actionPillActive,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.actionPillText,
                  scale === 1.5 && styles.actionPillTextActive,
                ]}
              >
                1.5x
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleZoomChange(2.0)}
              style={({ pressed }) => [
                styles.actionPill,
                scale === 2.0 && styles.actionPillActive,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.actionPillText,
                  scale === 2.0 && styles.actionPillTextActive,
                ]}
              >
                2.0x
              </Text>
            </Pressable>
          </View>

          {/* Confirm Button */}
          <Pressable
            onPress={handleConfirmCrop}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.saveBtn,
              isProcessing && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Set Profile Photo</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#262626",
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "700",
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  confirmBtn: {
    backgroundColor: "#a855f7",
  },
  viewportContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  viewport: {
    borderRadius: 140,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171717",
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  imageContainer: {
    position: "absolute",
  },
  circleMask: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  guidelineH: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  guidelineV: {
    position: "absolute",
    height: "100%",
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  instructionText: {
    marginTop: 18,
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  zoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  zoomStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e112c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2d1b3b",
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#262626",
    position: "relative",
    justifyContent: "center",
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#a855f7",
  },
  sliderThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#a855f7",
    marginLeft: -10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  zoomValue: {
    width: 44,
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
  },
  actionPillActive: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderColor: "#a855f7",
  },
  actionPillText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  actionPillTextActive: {
    color: "#a855f7",
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: "#a855f7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
