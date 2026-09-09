import {
    Stack,
    usePathname,
} from "expo-router";
import {
    useEffect,
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
            <SocketContextProvider>
                <RouteTracker />
                <AuthBootstrap />

                <Stack
                    screenOptions={{
                        headerShown: false,
                    }}
                />
            </SocketContextProvider>
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <Provider store={store}>
            <AppProviders />
        </Provider>
    );
}