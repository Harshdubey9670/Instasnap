import React, {
    useState,
} from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    router,
} from "expo-router";
import {
    ArrowRight,
    KeyRound,
    Mail,
} from "lucide-react-native";

import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useToast } from "../../src/components/ui/Toast";
import api from "../../src/services/api";

export default function ForgotPasswordScreen() {
    const [
        email,
        setEmail,
    ] = useState("");

    const [
        error,
        setError,
    ] = useState("");

    const [
        isLoading,
        setIsLoading,
    ] = useState(false);

    const { showToast } =
        useToast();

    const handleSendCode =
        async () => {
            if (!email) {
                setError(
                    "Email is required",
                );
                return;
            }

            if (
                !/^\S+@\S+\.\S+$/.test(
                    email,
                )
            ) {
                setError(
                    "Please enter a valid email address",
                );
                return;
            }

            setIsLoading(true);

            try {
                await api.post(
                    "/api/auth/forgot-password",
                    {
                        email,
                    },
                );

                showToast(
                    "success",
                    "Code Sent",
                    "If the email exists, a reset code was sent.",
                );

                router.push({
                    pathname:
                        "/auth/reset-password",
                    params: {
                        email,
                    },
                });
            } catch (err: any) {
                const errorMessage =
                    err?.response
                        ?.data
                        ?.message ||
                    "Something went wrong. Please try again.";

                showToast(
                    "error",
                    "Error",
                    errorMessage,
                );
            } finally {
                setIsLoading(false);
            }
        };

    return (
        <ScrollView
            style={
                styles.screen
            }
            contentContainerStyle={
                styles.content
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
                false
            }
        >
            <View
                style={
                    styles.header
                }
            >
                <View
                    style={
                        styles.iconContainer
                    }
                >
                    <KeyRound
                        size={40}
                        color="#a855f7"
                    />
                </View>

                <Text
                    style={
                        styles.title
                    }
                >
                    Forgot Password?
                </Text>

                <Text
                    style={
                        styles.subtitle
                    }
                >
                    No worries! Enter your
                    email address and we'll
                    send you a 6-digit code
                    to reset it.
                </Text>
            </View>

            <View
                style={
                    styles.card
                }
            >
                <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={(
                        value,
                    ) => {
                        setEmail(
                            value,
                        );

                        if (error) {
                            setError("");
                        }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    error={error}
                    leftIcon={
                        <Mail
                            size={20}
                            color="#64748b"
                        />
                    }
                />

                <Button
                    variant="gradient"
                    size="lg"
                    isLoading={
                        isLoading
                    }
                    onPress={() =>
                        void handleSendCode()
                    }
                    rightIcon={
                        !isLoading ? (
                            <ArrowRight
                                size={20}
                                color="#ffffff"
                            />
                        ) : undefined
                    }
                    style={
                        styles.button
                    }
                >
                    Send Reset Code
                </Button>
            </View>

            <Pressable
                onPress={() =>
                    router.replace(
                        "/auth/login",
                    )
                }
                style={
                    styles.backLink
                }
            >
                <Text
                    style={
                        styles.secondaryText
                    }
                >
                    Remember your password?{" "}
                </Text>

                <Text
                    style={
                        styles.linkText
                    }
                >
                    Log in here
                </Text>
            </Pressable>
        </ScrollView>
    );
}

const styles =
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor:
                "#f8fafc",
        },

        content: {
            flexGrow: 1,
            justifyContent:
                "center",
            alignItems:
                "center",
            paddingHorizontal: 16,
            paddingVertical: 48,
        },

        header: {
            width: "100%",
            maxWidth: 420,
            alignItems:
                "center",
            marginBottom: 32,
        },

        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: 24,
            alignItems:
                "center",
            justifyContent:
                "center",
            backgroundColor:
                "rgba(168,85,247,0.14)",
            borderWidth: 1,
            borderColor:
                "rgba(168,85,247,0.30)",
            marginBottom: 24,
        },

        title: {
            fontSize: 30,
            lineHeight: 38,
            fontWeight: "700",
            color: "#a855f7",
            textAlign:
                "center",
        },

        subtitle: {
            marginTop: 8,
            paddingHorizontal: 16,
            fontSize: 14,
            lineHeight: 21,
            color: "#64748b",
            textAlign:
                "center",
        },

        card: {
            width: "100%",
            maxWidth: 420,
            gap: 16,
            backgroundColor:
                "rgba(255,255,255,0.82)",
            borderWidth: 1,
            borderColor:
                "rgba(255,255,255,0.40)",
            borderRadius: 24,
            padding: 20,
            shadowColor:
                "#000000",
            shadowOffset: {
                width: 0,
                height: 8,
            },
            shadowOpacity: 0.08,
            shadowRadius: 30,
            elevation: 4,
        },

        button: {
            width: "100%",
        },

        backLink: {
            marginTop: 32,
            flexDirection:
                "row",
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        secondaryText: {
            fontSize: 14,
            color: "#64748b",
        },

        linkText: {
            fontSize: 14,
            fontWeight: "600",
            color: "#a855f7",
        },
    });