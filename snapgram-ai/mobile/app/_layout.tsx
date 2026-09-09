import {
    Stack,
    usePathname,
} from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { fontAssets } from "../src/theme/fontAssets";

// Keep the splash screen visible until fonts finish loading
SplashScreen.preventAutoHideAsync();

// ─── Global error suppressor ──────────────────────────────────
// Expo Go (SDK ~50) internally calls registerScreenCaptureObserver
// which requires android.permission.DETECT_SCREEN_CAPTURE. Expo Go's
// pre-built binary does not have this permission on all emulators,
// causing a SecurityException that crashes AppRegistry before our
// app can register. We catch and swallow only this specific error.
if (typeof ErrorUtils !== "undefined") {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    if (
      error?.message?.includes("DETECT_SCREEN_CAPTURE") ||
      error?.message?.includes("registerScreenCaptureObserver")
    ) {
      // Silently swallow — this is an Expo Go internal permission bug,
      // not an application error.
      return;
    }
    originalHandler(error, isFatal);
  });
}
// ─────────────────────────────────────────────────────────────
import {
    useEffect,
    useCallback,
} from "react";
import {
    Provider,
    useDispatch,
    useSelector,
} from "react-redux";

import {
    ThemeProvider,
} from "../src/contexts/ThemeContext";
import {
    SocketContextProvider,
} from "../src/contexts/SocketContext";
import {
    ToastProvider,
} from "../src/components/ui/Toast";
import {
    store,
    type RootState,
} from "../src/store/store";
import {
    finishAuthInitialization,
    loadUser,
} from "../src/store/authSlice";
import {
    getAuthToken,
} from "../src/utils/authStorage";
import {
    setCurrentPath,
} from "../src/navigation/navigation";

function RouteTracker() {
    const pathname = usePathname();

    useEffect(() => {
        setCurrentPath(
            pathname || "/",
        );
    }, [pathname]);

    return null;
}

import { type AppDispatch } from "../src/store/store";

function AuthBootstrap() {
    const dispatch =
        useDispatch<AppDispatch>();

    useEffect(() => {
        let mounted = true;

        const initialize =
            async () => {
                try {
                    const token =
                        await getAuthToken();

                    if (!mounted) {
                        return;
                    }

                    if (token) {
                        await dispatch(
                            loadUser(),
                        );
                    } else {
                        dispatch(
                            finishAuthInitialization(),
                        );
                    }
                } catch (error) {
                    console.error(
                        "Authentication initialization failed:",
                        error,
                    );

                    if (mounted) {
                        dispatch(
                            finishAuthInitialization(),
                        );
                    }
                }
            };

        initialize();

        return () => {
            mounted = false;
        };
    }, [dispatch]);

    return null;
}

function AppProviders() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <SocketContextProvider>
                    <RouteTracker />
                    <AuthBootstrap />

                    <Stack
                        screenOptions={{
                            headerShown: false,
                        }}
                    />
                </SocketContextProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts(fontAssets);

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    // Don't render the app until fonts are ready — avoids system-font flash
    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <Provider store={store}>
            <AppProviders />
        </Provider>
    );
}