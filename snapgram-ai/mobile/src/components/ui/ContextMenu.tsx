import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";

interface ContextMenuItem {
  label?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  separator?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  children: React.ReactNode;
  menuItems: ContextMenuItem[];
  className?: string;
  style?: ViewStyle;
}

export const ContextMenu = ({
  children,
  menuItems,
  style,
}: ContextMenuProps) => {
  const [isOpen, setIsOpen] =
    useState(false);

  const [anchorPosition, setAnchorPosition] =
    useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

  const triggerRef =
    useRef<View>(null);

  const openMenu = () => {
    triggerRef.current?.measureInWindow(
      (x, y, width, height) => {
        setAnchorPosition({
          x,
          y,
          width,
          height,
        });

        setIsOpen(true);
      },
    );
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleTriggerLayout = (
    _event: LayoutChangeEvent,
  ) => {
    // Layout is measured again when opening
    // so the menu position remains accurate.
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        onLongPress={openMenu}
        delayLongPress={350}
        onPress={(event) => {
          /*
           * Keep normal taps available for the
           * wrapped component. The ContextMenu
           * behavior itself is represented by
           * long-press on touch devices.
           */
        }}
        onLayout={
          handleTriggerLayout
        }
        style={style}
        accessibilityRole="button"
        accessibilityHint="Long press to open menu"
      >
        {children}
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={
          closeMenu
        }
      >
        <Pressable
          style={styles.overlay}
          onPress={closeMenu}
        >
          <View
            style={[
              styles.menu,
              getMenuPosition(
                anchorPosition,
              ),
            ]}
          >
            {menuItems.map(
              (item, index) => {
                if (item.separator) {
                  return (
                    <View
                      key={`sep-${index}`}
                      style={
                        styles.separator
                      }
                    />
                  );
                }

                return (
                  <Pressable
                    key={`item-${index}`}
                    onPress={() => {
                      item.onClick?.();
                      closeMenu();
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed &&
                        styles.menuItemPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      item.label
                    }
                  >
                    {item.icon ? (
                      <View
                        style={
                          styles.icon
                        }
                      >
                        {item.icon}
                      </View>
                    ) : null}

                    <Text
                      style={[
                        styles.menuItemText,
                        item.danger &&
                          styles.dangerText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

function getMenuPosition(position: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  /*
   * The web version positions the menu at the
   * user's pointer coordinates.
   *
   * On mobile, long-press provides the native
   * equivalent, so the menu opens below the
   * pressed element.
   */
  return {
    position: "absolute" as const,
    left: Math.max(
      8,
      Math.min(
        position.x,
        400 - 216,
      ),
    ),
    top: position.y + position.height + 6,
  };
}

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor:
        "transparent",
    },

    menu: {
      minWidth: 200,
      maxWidth: 320,
      borderRadius: 16,
      padding: 4,

      backgroundColor:
        "rgba(255,255,255,0.96)",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.40)",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.20,
      shadowRadius: 24,

      elevation: 12,
    },

    menuItem: {
      minHeight: 40,
      width: "100%",

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 12,
      paddingVertical: 8,

      borderRadius: 10,
    },

    menuItemPressed: {
      backgroundColor:
        "rgba(15,23,42,0.06)",
    },

    icon: {
      width: 20,
      marginRight: 8,
      alignItems: "center",
      justifyContent: "center",
    },

    menuItemText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: "#0f172a",
    },

    dangerText: {
      color: "#ef4444",
    },

    separator: {
      height: 1,
      marginVertical: 4,
      backgroundColor:
        "#e2e8f0",
    },
  });