import React, {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface OptimizedImageProps {
  src: string;
  alt?: string;
  width?: number;
  quality?: number;
  className?: string;
  fallbackSrc?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: ImageProps["style"];
  [key: string]: unknown;
}

const DEFAULT_FALLBACK_SRC =
  "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop";

/**
 * Same CDN URL transformation behavior as the existing web utility.
 */
export const getCdnUrl = (
  url: string | undefined,
  {
    width = 800,
    quality = 80,
    format = "webp",
  }: {
    width?: number;
    quality?: number;
    format?: string;
  } = {},
): string | undefined => {
  if (!url || typeof url !== "string") {
    return url;
  }

  // Unsplash CDN
  if (
    url.includes(
      "images.unsplash.com",
    )
  ) {
    const separator =
      url.includes("?")
        ? "&"
        : "?";

    return `${url}${separator}w=${width}&q=${quality}&fm=${format}&fit=crop`;
  }

  // Cloudinary CDN
  if (
    url.includes(
      "res.cloudinary.com",
    )
  ) {
    return url.replace(
      "/upload/",
      `/upload/w_${width},q_${quality},f_${format},c_limit/`,
    );
  }

  return url;
};

export const OptimizedImage = ({
  src,
  alt = "Media image",
  width = 800,
  quality = 80,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  style,
  imageStyle,
  ...props
}: OptimizedImageProps) => {
  const [
    isLoaded,
    setIsLoaded,
  ] = useState(false);

  const [
    hasError,
    setHasError,
  ] = useState(false);

  const [
    showingFallback,
    setShowingFallback,
  ] = useState(false);

  const sourceUrl =
    hasError
      ? fallbackSrc
      : src;

  const optimizedSrc =
    getCdnUrl(
      sourceUrl,
      {
        width,
        quality,
        format: "webp",
      },
    );

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setShowingFallback(false);
  }, [
    src,
    width,
    quality,
  ]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    if (!showingFallback) {
      setHasError(true);
      setShowingFallback(true);
      setIsLoaded(false);
      return;
    }

    setIsLoaded(false);
  };

  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      {!isLoaded && (
        <View
          pointerEvents="none"
          style={
            styles.placeholder
          }
        >
          <ActivityIndicator
            size="small"
            color="#a855f7"
          />
        </View>
      )}

      {optimizedSrc ? (
        <Image
          source={{
            uri: optimizedSrc,
          }}
          accessibilityLabel={
            alt
          }
          resizeMode="cover"
          onLoad={
            handleLoad
          }
          onError={
            handleError
          }
          style={[
            styles.image,
            {
              opacity:
                isLoaded
                  ? 1
                  : 0,
            },
            imageStyle,
          ]}
          {...props}
        />
      ) : null}
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
      alignItems:
        "center",
      justifyContent:
        "center",
      zIndex: 1,
      backgroundColor:
        "#f1f5f9",
    },

    image: {
      width: "100%",
      height: "100%",
    },
  });