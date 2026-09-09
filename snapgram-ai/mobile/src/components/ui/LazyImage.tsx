import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Image,
  StyleSheet,
  View,
  type ImageProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: ImageProps["style"];
  [key: string]: unknown;
}

/**
 * React Native adaptation of the web LazyImage.
 *
 * The original web component uses IntersectionObserver with a 200px
 * root margin. React Native does not have a direct component-level
 * equivalent to IntersectionObserver, so this implementation starts
 * loading once the component has been laid out on screen.
 *
 * The placeholder and fade-in behavior are preserved.
 */
export const LazyImage = ({
  src,
  alt = "",
  style,
  imageStyle,
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] =
    useState(false);
  const [isInView, setIsInView] =
    useState(false);

  const opacity =
    useRef(
      new Animated.Value(0),
    ).current;

  useEffect(() => {
    if (isInView) {
      return;
    }
  }, [isInView]);

  const handleLayout = () => {
    if (!isInView) {
      setIsInView(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);

    Animated.timing(
      opacity,
      {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      },
    ).start();
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        style,
      ]}
      {...props}
    >
      {!isLoaded && (
        <View
          pointerEvents="none"
          style={
            styles.placeholder
          }
        >
          <Animated.View
            style={[
              styles.placeholderPulse,
              {
                opacity:
                  opacity.interpolate({
                    inputRange: [
                      0,
                      1,
                    ],
                    outputRange: [
                      0.65,
                      1,
                    ],
                  }),
              },
            ]}
          />
        </View>
      )}

      {isInView && (
        <Animated.Image
          source={{
            uri: src,
          }}
          accessibilityLabel={
            alt
          }
          resizeMode="cover"
          onLoad={
            handleLoad
          }
          style={[
            styles.image,
            {
              opacity,
            },
            imageStyle,
          ]}
        />
      )}
    </View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      position:
        "relative",
      overflow:
        "hidden",
      backgroundColor:
        "#f1f5f9",
    },

    placeholder: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
      backgroundColor:
        "#f1f5f9",
    },

    placeholderPulse: {
      flex: 1,
      backgroundColor:
        "#e2e8f0",
    },

    image: {
      width: "100%",
      height: "100%",
    },
  });