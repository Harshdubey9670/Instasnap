import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
} from "lucide-react-native";

type ToastVariant =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "default";

interface ToastData {
  id: number;
  title?: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastFunction {
  (options: ToastOptions): void;
  success: (
    title?: string,
    description?: string,
  ) => void;
  error: (
    title?: string,
    description?: string,
  ) => void;
  info: (
    title?: string,
    description?: string,
  ) => void;
  warning: (
    title?: string,
    description?: string,
  ) => void;
}

type ShowToastFunction = (
  arg1?: string,
  arg2?: string,
  arg3?: string,
) => void;

interface ToastContextValue {
  toast: ToastFunction;
  showToast: ShowToastFunction;
}

const ToastContext =
  createContext<ToastContextValue | null>(null);

let toastId = 0;

interface ToastItemProps {
  toast: ToastData;
  onRemove: () => void;
}

const ToastItem = ({
  toast,
  onRemove,
}: ToastItemProps) => {
  const translateY =
    useRef(
      new Animated.Value(50),
    ).current;

  const opacity =
    useRef(
      new Animated.Value(0),
    ).current;

  const scale =
    useRef(
      new Animated.Value(0.9),
    ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(
        translateY,
        {
          toValue: 0,
          duration: 250,
          easing:
            Easing.out(
              Easing.cubic,
            ),
          useNativeDriver: true,
        },
      ),
      Animated.timing(
        opacity,
        {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        },
      ),
      Animated.spring(
        scale,
        {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        },
      ),
    ]).start();

    return () => {
      translateY.stopAnimation();
      opacity.stopAnimation();
      scale.stopAnimation();
    };
  }, [
    opacity,
    scale,
    translateY,
  ]);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(
        opacity,
        {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        },
      ),
      Animated.timing(
        scale,
        {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        },
      ),
    ]).start(() => {
      onRemove();
    });
  };

  const iconColor =
    getIconColor(
      toast.variant,
    );

  const Icon =
    getToastIcon(
      toast.variant,
    );

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            marginTop:
              toast.title ||
              toast.description
                ? 2
                : 0,
          },
        ]}
      >
        <Icon
          size={20}
          color={iconColor}
          strokeWidth={2}
        />
      </View>

      <View style={styles.content}>
        {!!toast.title && (
          <Text
            style={[
              styles.title,
              {
                color:
                  "#FFFFFF",
              },
            ]}
            numberOfLines={3}
          >
            {toast.title}
          </Text>
        )}

        {!!toast.description && (
          <Text
            style={[
              styles.description,
              {
                color:
                  "rgba(255,255,255,0.72)",
              },
            ]}
            numberOfLines={5}
          >
            {toast.description}
          </Text>
        )}
      </View>

      <Pressable
        onPress={handleRemove}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={10}
        style={({ pressed }) => [
          styles.closeButton,
          pressed &&
            styles.closeButtonPressed,
        ]}
      >
        <X
          size={16}
          color="rgba(255,255,255,0.72)"
          strokeWidth={2}
        />
      </Pressable>
    </Animated.View>
  );
};

export const ToastProvider = ({
  children,
}: PropsWithChildren) => {
  const [toasts, setToasts] =
    useState<ToastData[]>([]);

  const timeoutIds =
    useRef(
      new Map<number, ReturnType<typeof setTimeout>>(),
    ).current;

  useEffect(() => {
    return () => {
      timeoutIds.forEach(
        (timeoutId) => {
          clearTimeout(timeoutId);
        },
      );

      timeoutIds.clear();
    };
  }, [timeoutIds]);

  const removeToast =
    useCallback(
      (id: number) => {
        const timeoutId =
          timeoutIds.get(id);

        if (timeoutId) {
          clearTimeout(
            timeoutId,
          );
          timeoutIds.delete(id);
        }

        setToasts((previous) =>
          previous.filter(
            (item) =>
              item.id !== id,
          ),
        );
      },
      [timeoutIds],
    );

  const toast =
    useCallback(
      ({
        title,
        description,
        variant = "default",
        duration = 5000,
      }: ToastOptions) => {
        const id =
          ++toastId;

        setToasts((previous) => [
          ...previous,
          {
            id,
            title,
            description,
            variant,
          },
        ]);

        if (duration > 0) {
          const timeoutId =
            setTimeout(() => {
              timeoutIds.delete(
                id,
              );

              setToasts(
                (previous) =>
                  previous.filter(
                    (item) =>
                      item.id !== id,
                  ),
              );
            }, duration);

          timeoutIds.set(
            id,
            timeoutId,
          );
        }
      },
      [timeoutIds],
    ) as unknown as ToastFunction;

  toast.success = (
    title,
    description,
  ) =>
    toast({
      title,
      description,
      variant: "success",
    });

  toast.error = (
    title,
    description,
  ) =>
    toast({
      title,
      description,
      variant: "error",
    });

  toast.info = (
    title,
    description,
  ) =>
    toast({
      title,
      description,
      variant: "info",
    });

  toast.warning = (
    title,
    description,
  ) =>
    toast({
      title,
      description,
      variant: "warning",
    });

  const showToast =
    useCallback<ShowToastFunction>(
      (
        arg1,
        arg2,
        arg3,
      ) => {
        const validVariants: ToastVariant[] =
          [
            "success",
            "error",
            "info",
            "warning",
            "default",
          ];

        if (
          arg1 &&
          validVariants.includes(
            arg1 as ToastVariant,
          )
        ) {
          toast({
            variant:
              arg1 as ToastVariant,
            title: arg2,
            description: arg3,
          });
        } else if (
          arg2 &&
          validVariants.includes(
            arg2 as ToastVariant,
          )
        ) {
          toast({
            variant:
              arg2 as ToastVariant,
            title: arg1,
          });
        } else {
          toast({
            title: arg1,
            description: arg2,
          });
        }
      },
      [toast],
    );

  return (
    <ToastContext.Provider
      value={{
        toast,
        showToast,
      }}
    >
      {children}

      <View
        pointerEvents="box-none"
        style={styles.container}
      >
        {toasts.map((item) => (
          <ToastItem
            key={item.id}
            toast={item}
            onRemove={() =>
              removeToast(
                item.id,
              )
            }
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast =
  (): ToastContextValue => {
    const context =
      useContext(
        ToastContext,
      );

    if (!context) {
      throw new Error(
        "useToast must be used within ToastProvider",
      );
    }

    return context;
  };

function getToastIcon(
  variant: ToastVariant,
) {
  switch (variant) {
    case "success":
      return CheckCircle;

    case "error":
    case "warning":
      return AlertCircle;

    case "info":
    case "default":
    default:
      return Info;
  }
}

function getIconColor(
  variant: ToastVariant,
): string {
  switch (variant) {
    case "success":
      return "#22C55E";

    case "error":
      return "#EF4444";

    case "warning":
      return "#F59E0B";

    case "info":
    case "default":
    default:
      return "#60A5FA";
  }
}

const styles =
  StyleSheet.create({
    container: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 24,
      zIndex: 10000,
      elevation: 10000,
      gap: 8,
    },

    toast: {
      width: "100%",
      minHeight: 64,

      flexDirection:
        "row",
      alignItems:
        "flex-start",

      padding:
        16,

      borderRadius:
        12,

      backgroundColor:
        "rgba(24,24,27,0.96)",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,

      elevation: 12,
    },

    iconContainer: {
      width: 24,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 12,
      flexShrink: 0,
    },

    content: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },

    title: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
    },

    description: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400",
    },

    closeButton: {
      width: 28,
      height: 28,
      marginLeft: 8,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 14,
    },

    closeButtonPressed: {
      backgroundColor:
        "rgba(255,255,255,0.10)",
    },
  });