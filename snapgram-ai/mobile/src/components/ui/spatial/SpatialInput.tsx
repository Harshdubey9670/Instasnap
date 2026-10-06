import React from "react";
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";

interface SpatialInputProps extends TextInputProps {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const SpatialInput: React.FC<SpatialInputProps> = ({ icon, rightElement, containerStyle, style, ...props }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <TextInput
        placeholderTextColor="rgba(255,247,245,0.5)"
        style={[styles.input, icon ? { paddingLeft: 40 } : null, rightElement ? { paddingRight: 40 } : null, style]}
        {...props}
      />
      {rightElement && <View style={styles.right}>{rightElement}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  right: {
    position: "absolute",
    right: 12,
    zIndex: 1,
  },
  input: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    color: "#FFF7F5",
    fontSize: 14,
  },
});

export default SpatialInput;
