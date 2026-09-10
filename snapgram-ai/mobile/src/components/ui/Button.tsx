import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  LoaderCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../../theme/fonts";
import { heroGradient, aiGradient } from "../../theme/colors";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "glass"
  | "gradient"
  | "ai";

type ButtonSize =
  | "sm"
  | "md"
  | "lg"
  | "icon";

export interface ButtonProps
  extends Omit<PressableProps, "style" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;

  /**
   * React Native replacement for the web `className` prop.
   *
   * Kept in the public API so migrating components can continue
   * passing it without TypeScript errors. Styling should be handled
   * through `style` in React Native.
   */
  className?: string;

  style?: StyleProp<ViewStyle>;

  /**
   * Optional text style for the button label.
   */
  textStyle?: StyleProp<TextStyle>;
}

export const Button = forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled = false,
      style,
      textStyle,
      className: _className,
      onPressIn,
      onPressOut,
      ...props
    },
    ref,
  ) => {
    const scale =
      useRef(
        new Animated.Value(1),
      ).current;

    const isDisabled =
      disabled || isLoading;

    useImperativeHandle(
      ref,
      () =>
        pressableRef.current as React.ElementRef<
          typeof Pressable
        >,
    );

    const pressableRef =
      useRef<
        React.ElementRef<typeof Pressable>
      >(null);

    const handlePressIn:
      NonNullable<
        PressableProps["onPressIn"]
      > = (event) => {
        if (!isDisabled) {
          Animated.spring(scale, {
            toValue: 0.95,
            friction: 8,
            tension: 120,
            useNativeDriver: true,
          }).start();
        }

        onPressIn?.(event);
      };

    const handlePressOut:
      NonNullable<
        PressableProps["onPressOut"]
      > = (event) => {
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 120,
          useNativeDriver: true,
        }).start();

        onPressOut?.(event);
      };

    const variantStyle =
      getVariantStyle(variant);

    const sizeStyle =
      getSizeStyle(size);

    const textColor =
      getTextColor(variant);

    const showLabel =
      size !== "icon";

    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [
              {
                scale,
              },
            ],
          },
        ]}
      >
        <Pressable
          ref={pressableRef}
          disabled={isDisabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityState={{
            disabled: isDisabled,
            busy: isLoading,
          }}
          style={({ pressed }) => [
            styles.base,
            variantStyle,
            sizeStyle,
            isDisabled &&
              styles.disabled,
            pressed &&
              !isDisabled &&
              styles.pressed,
            style,
          ]}
          {...props}
        >
          {isLoading ? (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                size="small"
                color={textColor}
              />

              {showLabel &&
                children ? (
                  <Text
                    style={[
                      styles.text,
                      {
                        color:
                          textColor,
                      },
                      textStyle,
                    ]}
                    numberOfLines={1}
                  >
                    {children}
                  </Text>
                ) : null}
            </View>
          ) : (
            <>
              {leftIcon ? (
                <View
                  style={
                    styles.leftIcon
                  }
                >
                  {leftIcon}
                </View>
              ) : null}

              {showLabel ? (
                <Text
                  style={[
                    styles.text,
                    {
                      color:
                        textColor,
                    },
                    textStyle,
                  ]}
                  numberOfLines={1}
                >
                  {children}
                </Text>
              ) : (
                children
              )}

              {rightIcon ? (
                <View
                  style={
                    styles.rightIcon
                  }
                >
                  {rightIcon}
                </View>
              ) : null}
            </>
          )}
        {/* Gradient overlay for gradient/ai variants */}
        {(variant === "gradient" || variant === "ai") && (
          <LinearGradient
            colors={(variant === "ai" ? [...aiGradient] : [...heroGradient]) as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        </Pressable>
      </Animated.View>
    );
  },
);

Button.displayName =
  "Button";

function getVariantStyle(
  variant: ButtonVariant,
): ViewStyle {
  switch (variant) {
    case "primary":
      return {
        backgroundColor:
          "#a855f7",
        shadowColor:
          "#000000",
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.04,
        shadowRadius: 30,
        elevation: 2,
      };

    case "secondary":
      return {
        backgroundColor:
          "#ec4899",
        shadowColor:
          "#000000",
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.04,
        shadowRadius: 30,
        elevation: 2,
      };

    case "outline":
      return {
        backgroundColor:
          "transparent",
        borderWidth: 2,
        borderColor:
          "#a855f7",
      };

    case "ghost":
      return {
        backgroundColor:
          "transparent",
      };

    case "glass":
      return {
        backgroundColor:
          "rgba(255,255,255,0.70)",
        borderWidth: 1,
        borderColor:
          "rgba(255,255,255,0.40)",
        shadowColor:
          "#000000",
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.04,
        shadowRadius: 30,
        elevation: 3,
      };

    case "gradient":
      return {
        backgroundColor:
          "#a855f7",
        shadowColor:
          "#000000",
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.04,
        shadowRadius: 30,
        elevation: 2,
      };

    case "ai":
      return {
        backgroundColor:
          "#c084fc",
        shadowColor:
          "#a855f7",
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
      };

    default:
      return {};
  }
}

function getSizeStyle(
  size: ButtonSize,
): ViewStyle {
  switch (size) {
    case "sm":
      return {
        minHeight: 32,
        paddingHorizontal: 12,
        borderRadius: 12,
      };

    case "md":
      return {
        minHeight: 40,
        paddingHorizontal: 16,
        borderRadius: 12,
      };

    case "lg":
      return {
        minHeight: 48,
        paddingHorizontal: 32,
        borderRadius: 12,
      };

    case "icon":
      return {
        width: 40,
        height: 40,
        paddingHorizontal: 0,
        borderRadius: 12,
      };

    default:
      return {};
  }
}

function getTextColor(
  variant: ButtonVariant,
): string {
  switch (variant) {
    case "primary":
    case "secondary":
    case "gradient":
    case "ai":
      return "#FFFFFF";

    case "outline":
      return "#a855f7";

    case "ghost":
      return "#0f172a";

    case "glass":
      return "#0f172a";

    default:
      return "#FFFFFF";
  }
}

const styles =
  StyleSheet.create({
    animatedContainer: {
      alignSelf:
        "flex-start",
    },

    base: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      overflow:
        "hidden",

      minWidth: 0,
    },

    text: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fonts.semibold,   // was "400" — now matches web font-medium feel
      includeFontPadding: false,
      textAlign: "center",
    },

    leftIcon: {
      marginRight: 8,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    rightIcon: {
      marginLeft: 8,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingContainer: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    disabled: {
      opacity: 0.5,
    },

    pressed: {
      opacity: 0.96,
    },
  });