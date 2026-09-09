import React, {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    router,
} from "expo-router";
import {
    useDispatch,
    useSelector,
} from "react-redux";
import {
    CheckCircle2,
    RefreshCw,
    ShieldCheck,
} from "lucide-react-native";

import type { RootState } from "../../src/store/store";
import {
    loginSuccess,
} from "../../src/store/authSlice";
import { Button } from "../../src/components/ui/Button";
import { useToast } from "../../src/components/ui/Toast";
import api from "../../src/services/api";
import {
    setAuthToken,
} from "../../src/utils/authStorage";

export default function OtpScreen() {
    const {
        user,
    } = useSelector(
        (state: RootState) =>
            state.auth,
    );

    const dispatch =
        useDispatch();

    const { showToast } =
        useToast();

    const [
        otp,
        setOtp,
    ] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const [
        timer,
        setTimer,
    ] = useState(60);

    const [
        isLoading,
        setIsLoading,
    ] = useState(false);

    const [
        isResending,
        setIsResending,
    ] = useState(false);

    const inputRefs =
        useRef<
            Array<
                TextInput | null
            >
        >([]);

    useEffect(() => {
        if (!user?.email) {
            router.replace(
                "/auth/login",
            );
        }
    }, [user]);

    useEffect(() => {
        if (timer <= 0) {
            return;
        }

        const interval =
            setInterval(
                () =>
                    setTimer(
                        (value) =>
                            value - 1,
                    ),
                1000,
            );

        return () =>
            clearInterval(
                interval,
            );
    }, [timer]);

    const updateDigit =
        (
            index: number,
            value: string,
        ) => {
            const digits =
                value.replace(
                    /\D/g,
                    "",
                );

            if (!digits) {
                const next =
                    [...otp];

                next[index] =
                    "";

                setOtp(next);
                return;
            }

            const next =
                [...otp];

            next[index] =
                digits.charAt(
                    digits.length - 1,
                );

            setOtp(next);

            if (
                index < 5
            ) {
                inputRefs.current[
                    index + 1
                ]?.focus();
            }
        };

    const handleBackspace =
        (
            index: number,
        ) => {
            if (
                !otp[index] &&
                index > 0
            ) {
                inputRefs.current[
                    index - 1
                ]?.focus();
            }
        };

    const handlePaste =
        (
            value: string,
        ) => {
            const digits =
                value
                    .replace(
                        /\D/g,
                        "",
                    )
                    .slice(0, 6);

            if (!digits) {
                return;
            }

            const next =
                [
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                ];

            digits
                .split("")
                .forEach(
                    (
                        digit,
                        index,
                    ) => {
                        next[index] =
                            digit;
                    },
                );

            setOtp(next);

            const nextEmpty =
                next.findIndex(
                    (
                        value,
                    ) =>
                        value === "",
                );

            if (
                nextEmpty !==
                -1
            ) {
                inputRefs.current[
                    nextEmpty
                ]?.focus();
            } else {
                inputRefs.current[
                    5
                ]?.focus();
            }
        };

    const handleVerify =
        async () => {
            const otpString =
                otp.join("");

            if (
                otpString.length !==
                6
            ) {
                showToast(
                    "error",
                    "Incomplete OTP",
                    "Please enter all 6 digits.",
                );
                return;
            }

            if (!user?.email) {
                return;
            }

            setIsLoading(
                true,
            );

            try {
                const response =
                    await api.post(
                        "/api/auth/verify-otp",
                        {
                            email:
                                user.email,
                            otp:
                                otpString,
                        },
                    );

                await setAuthToken(
                    response.data
                        .token,
                );

                dispatch(
                    loginSuccess(
                        response.data
                            .user,
                    ),
                );

                showToast(
                    "success",
                    "Verification Successful!",
                    "Your account is now active.",
                );

                router.replace(
                    "/auth/profile-setup",
                );
            } catch (error: any) {
                const errorMessage =
                    error?.response
                        ?.data
                        ?.message ||
                    "Invalid OTP. Please try again.";

                showToast(
                    "error",
                    "Verification Failed",
                    errorMessage,
                );

                setOtp([
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]);

                requestAnimationFrame(
                    () =>
                        inputRefs.current[
                            0
                        ]?.focus(),
                );
            } finally {
                setIsLoading(
                    false,
                );
            }
        };

    const handleResend =
        async () => {
            if (
                timer > 0 ||
                !user?.email
            ) {
                return;
            }

            setIsResending(
                true,
            );

            try {
                await api.post(
                    "/api/auth/resend-otp",
                    {
                        email:
                            user.email,
                    },
                );

                setTimer(60);

                showToast(
                    "success",
                    "OTP Sent",
                    "A new verification code has been sent to your email.",
                );

                setOtp([
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]);

                requestAnimationFrame(
                    () =>
                        inputRefs.current[
                            0
                        ]?.focus(),
                );
            } catch (error: any) {
                const errorMessage =
                    error?.response
                        ?.data
                        ?.message ||
                    "Failed to resend OTP.";

                showToast(
                    "error",
                    "Failed",
                    errorMessage,
                );
            } finally {
                setIsResending(
                    false,
                );
            }
        };

    if (!user?.email) {
        return null;
    }

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
                    <ShieldCheck
                        size={40}
                        color="#a855f7"
                    />
                </View>

                <Text
                    style={
                        styles.title
                    }
                >
                    Verify Account
                </Text>

                <Text
                    style={
                        styles.subtitle
                    }
                >
                    We've sent a 6-digit
                    code to{" "}
                    <Text
                        style={
                            styles.email
                        }
                    >
                        {user.email}
                    </Text>
                </Text>
            </View>

            <View
                style={
                    styles.card
                }
            >
                <View
                    style={
                        styles.otpRow
                    }
                >
                    {otp.map(
                        (
                            digit,
                            index,
                        ) => (
                            <TextInput
                                key={index}
                                ref={(ref) =>
                                (inputRefs.current[
                                    index
                                ] = ref)
                                }
                                value={digit}
                                onChangeText={(
                                    value,
                                ) => {
                                    /*
                                     * Native TextInput handles normal typing.
                                     * Multi-character paste is handled by consuming
                                     * the supplied string and distributing the digits.
                                     */
                                    if (
                                        value.length >
                                        1
                                    ) {
                                        handlePaste(
                                            value,
                                        );
                                        return;
                                    }

                                    updateDigit(
                                        index,
                                        value,
                                    );
                                }}
                                onKeyPress={(
                                    event,
                                ) => {
                                    if (
                                        event.nativeEvent
                                            .key ===
                                        "Backspace"
                                    ) {
                                        handleBackspace(
                                            index,
                                        );
                                    }
                                }}
                                keyboardType="number-pad"
                                textContentType={
                                    index ===
                                        0
                                        ? "oneTimeCode"
                                        : "none"
                                }
                                maxLength={1}
                                style={
                                    styles.otpInput
                                }
                                selectTextOnFocus
                            />
                        ),
                    )}
                </View>

                <Button
                    variant="gradient"
                    size="lg"
                    isLoading={
                        isLoading
                    }
                    disabled={
                        otp.join("")
                            .length !== 6
                    }
                    onPress={() =>
                        void handleVerify()
                    }
                    leftIcon={
                        !isLoading ? (
                            <CheckCircle2
                                size={20}
                                color="#ffffff"
                            />
                        ) : undefined
                    }
                    style={
                        styles.fullButton
                    }
                >
                    Verify Code
                </Button>

                <View
                    style={
                        styles.resendSection
                    }
                >
                    <Text
                        style={
                            styles.secondaryText
                        }
                    >
                        Didn't receive the
                        code?
                    </Text>

                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                            timer > 0 ||
                            isResending
                        }
                        isLoading={
                            isResending
                        }
                        onPress={() =>
                            void handleResend()
                        }
                        leftIcon={
                            timer === 0 &&
                                !isResending ? (
                                <RefreshCw
                                    size={16}
                                    color="#a855f7"
                                />
                            ) : undefined
                        }
                    >
                        {timer > 0
                            ? `Resend code in ${timer}s`
                            : "Resend OTP"}
                    </Button>
                </View>
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
                        styles.linkText
                    }
                >
                    Back to Login
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
            fontSize: 14,
            lineHeight: 21,
            color: "#64748b",
            textAlign:
                "center",
        },

        email: {
            color: "#0f172a",
            fontWeight:
                "600",
        },

        card: {
            width: "100%",
            maxWidth: 420,
            backgroundColor:
                "rgba(255,255,255,0.82)",
            borderWidth: 1,
            borderColor:
                "rgba(255,255,255,0.40)",
            borderRadius: 24,
            padding: 20,
            gap: 24,
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

        otpRow: {
            flexDirection:
                "row",
            justifyContent:
                "space-between",
            gap: 8,
        },

        otpInput: {
            flex: 1,
            maxWidth: 52,
            minWidth: 40,
            height: 58,
            borderRadius: 16,
            borderWidth: 1,
            borderColor:
                "#e2e8f0",
            backgroundColor:
                "#f1f5f9",
            color: "#0f172a",
            fontSize: 24,
            fontWeight: "700",
            textAlign:
                "center",
        },

        fullButton: {
            width: "100%",
        },

        resendSection: {
            alignItems:
                "center",
            gap: 8,
        },

        secondaryText: {
            fontSize: 14,
            color: "#64748b",
            textAlign:
                "center",
        },

        backLink: {
            marginTop: 32,
        },

        linkText: {
            color: "#a855f7",
            fontSize: 14,
            fontWeight: "600",
        },
    });