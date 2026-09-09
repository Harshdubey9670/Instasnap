import React, { useId } from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

interface GradientTextProps {
  text: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  colors?: string[];
  style?: StyleProp<ViewStyle>;
  letterSpacing?: number;
}

export const GradientText: React.FC<GradientTextProps> = ({
  text,
  fontSize = 28,
  fontWeight = "800",
  colors = ["#c084fc", "#ec4899"],
  style,
  letterSpacing = -0.5,
}) => {
  const rawId = useId();
  const gradId = `grad_${rawId.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const height = Math.ceil(fontSize * 1.38);

  return (
    <View style={[styles.container, { height }, style]}>
      <Svg height={height} width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {colors.map((color, index) => (
              <Stop
                key={index}
                offset={`${(index / Math.max(colors.length - 1, 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>
        </Defs>
        <SvgText
          fill={`url(#${gradId})`}
          fontSize={fontSize}
          fontWeight={fontWeight}
          letterSpacing={letterSpacing}
          x="50%"
          y={fontSize}
          textAnchor="middle"
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
