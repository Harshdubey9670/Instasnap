import React, {
  forwardRef,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import { fonts } from "../../theme/fonts";

interface CardProps
  extends Omit<ViewProps, "style"> {
  glass?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface CardSectionProps
  extends Omit<ViewProps, "style"> {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface CardTitleProps
  extends Omit<TextProps, "style"> {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<TextStyle>;
}

interface CardDescriptionProps
  extends Omit<TextProps, "style"> {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<TextStyle>;
}

const Card = forwardRef<
  View,
  CardProps
>(
  (
    {
      glass = false,
      children,
      style,
      className: _className,
      ...props
    },
    ref,
  ) => {
    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme === "dark";

    return (
      <View
        ref={ref}
        style={[
          styles.card,
          glass
            ? getGlassStyle(dark)
            : getNormalCardStyle(dark),
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);

Card.displayName =
  "Card";

const CardHeader =
  forwardRef<
    View,
    CardSectionProps
  >(
    (
      {
        children,
        style,
        className: _className,
        ...props
      },
      ref,
    ) => (
      <View
        ref={ref}
        style={[
          styles.header,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    ),
  );

CardHeader.displayName =
  "CardHeader";

const CardTitle =
  forwardRef<
    Text,
    CardTitleProps
  >(
    (
      {
        children,
        style,
        className: _className,
        ...props
      },
      ref,
    ) => {
      const {
        effectiveTheme,
      } = useTheme();

      return (
        <Text
          ref={ref}
          style={[
            styles.title,
            {
              color:
                effectiveTheme ===
                "dark"
                  ? "#f8fafc"
                  : "#0f172a",
            },
            style,
          ]}
          {...props}
        >
          {children}
        </Text>
      );
    },
  );

CardTitle.displayName =
  "CardTitle";

const CardDescription =
  forwardRef<
    Text,
    CardDescriptionProps
  >(
    (
      {
        children,
        style,
        className: _className,
        ...props
      },
      ref,
    ) => {
      const {
        effectiveTheme,
      } = useTheme();

      return (
        <Text
          ref={ref}
          style={[
            styles.description,
            {
              color:
                effectiveTheme ===
                "dark"
                  ? "#94a3b8"
                  : "#64748b",
            },
            style,
          ]}
          {...props}
        >
          {children}
        </Text>
      );
    },
  );

CardDescription.displayName =
  "CardDescription";

const CardContent =
  forwardRef<
    View,
    CardSectionProps
  >(
    (
      {
        children,
        style,
        className: _className,
        ...props
      },
      ref,
    ) => (
      <View
        ref={ref}
        style={[
          styles.content,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    ),
  );

CardContent.displayName =
  "CardContent";

const CardFooter =
  forwardRef<
    View,
    CardSectionProps
  >(
    (
      {
        children,
        style,
        className: _className,
        ...props
      },
      ref,
    ) => (
      <View
        ref={ref}
        style={[
          styles.footer,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    ),
  );

CardFooter.displayName =
  "CardFooter";

function getNormalCardStyle(
  dark: boolean,
): ViewStyle {
  return {
    backgroundColor:
      dark
        ? "#130a1c"
        : "#ffffff",
    borderColor:
      dark
        ? "#2d1b3b"
        : "#e2e8f0",
    shadowColor:
      "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity:
      dark ? 0.5 : 0.04,
    shadowRadius: 30,
    elevation: dark ? 8 : 2,
  };
}

function getGlassStyle(
  dark: boolean,
): ViewStyle {
  return {
    backgroundColor:
      dark
        ? "rgba(19,10,28,0.50)"
        : "rgba(255,255,255,0.70)",
    borderColor:
      dark
        ? "rgba(168,85,247,0.15)"
        : "rgba(255,255,255,0.40)",
    shadowColor:
      "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity:
      dark ? 0.5 : 0.04,
    shadowRadius: 30,
    elevation: 4,
  };
}

const styles =
  StyleSheet.create({
    card: {
      width: "100%",
      borderWidth: 1,
      borderRadius: 16,  // matches web rounded-2xl (was 24)
      overflow: "hidden",
    },

    header: {
      flexDirection:
        "column",
      padding: 24,
      paddingBottom: 24,
      gap: 6,
    },

    title: {
      fontSize: 20,
      lineHeight: 24,
      fontFamily: fonts.semibold,  // Inter SemiBold (was fontWeight: "600")
      letterSpacing: -0.2,
    },

    description: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fonts.regular,   // Inter Regular (was fontWeight: "400")
    },

    content: {
      padding: 24,
      paddingTop: 0,
    },

    footer: {
      flexDirection:
        "row",
      alignItems:
        "center",
      padding: 24,
      paddingTop: 0,
    },
  });

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};