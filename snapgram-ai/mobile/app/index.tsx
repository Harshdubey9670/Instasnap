import {
    Redirect,
} from "expo-router";
import {
    ActivityIndicator,
    View,
} from "react-native";
import {
    useSelector,
} from "react-redux";

import type { RootState } from "../src/store/store";

export default function Index() {
    const {
        loading,
        isAuthenticated,
    } = useSelector(
        (state: RootState) =>
            state.auth,
    );

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <ActivityIndicator
                    size="large"
                />
            </View>
        );
    }

    if (isAuthenticated) {
        return (
            <Redirect href="/app" />
        );
    }

    return (
        <Redirect href="/auth/login" />
    );
}