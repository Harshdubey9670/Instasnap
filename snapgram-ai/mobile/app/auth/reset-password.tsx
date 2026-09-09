import React, {
    useEffect,
    useMemo,
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
    Redirect,
    router,
    useLocalSearchParams,
} from "expo-router";
import {
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Save,
} from "lucide-react-native";
import {
    useDispatch,
} from "react-redux";

import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { useToast } from "../../src/components/ui/Toast";
import api from "../../src/services/api";
import {
    loginSuccess,
} from "../../src/store/authSlice";
import {
    setAuthToken,
} from "../../src/utils/authStorage";

type Errors = {
    otp?: string;
    password?: string;
    confirmPassword?: string;
};

export default function ResetPasswordScreen() {
    const params =
        useLocalSearchParams<{
            email?: string;
        }>();

    const email =
        typeof params.email ===
            "string"
            ? params.email
            : "";

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
        password,
        setPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        errors,
        setErrors,
    ] = useState<Errors>({});

    const [
        isLoading,
        setIsLoading,
    ] = useState(false);

    const inputRefs =
        useRef<
            Array<
                TextInput | null
            >
        >([]);

    const strength =
        useMemo(() => {
            if (!password) {
                return 0;
            }

            let result =
                0;

            if (
                password.length >=
                6
            ) {
                result += 25;
            }

            if (
                password.length >=
                10
            ) {
                result += 25;
            }

            if (
                /[A-Z]/.test(
                    password,
                )
            ) {
                result += 25;
            }

            if (
                /[0-9]/.test(
                    password,
                ) &&
                /[^A-Za-z0-9]/.test(
                    password,
                )
            ) {
                result += 25;
            }

            return result;
        }, [password]);

    const strengthLabel =
        strength < 50
            ? "Weak"
            : strength < 75
                ? "Good"
                : "Strong";

    const strengthColor =
        strength < 50
            ? "#ef4444"
            : strength < 75
                ? "#eab308"
                : "#22c55e";

    useEffect(() => {
        if (!email) {
            return;
        }
    }, [email]);

    if (!email) {
        return (
            <Redirect
                href="/auth/forgot-password"
            />
        );
    }

    const updateOtp =
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

    const handleVerifyReset =
        async () => {
            const otpString =
                otp.join("");

            const nextErrors: Errors =
                {};

            if (
                otpString.length !==
                6
            ) {
                nextErrors.otp =
                    "Please enter all 6 digits of the OTP";
            }

            if (!password) {
                nextErrors.password =
                    "Password is required";
            } else if (
                password.length < 6
            ) {
                nextErrors.password =
                    "Password must be at least 6 characters";
            }

            if (
                password !==
                confirmPassword
            ) {
                nextErrors.confirmPassword =
                    "Passwords do not match";
            }

            if (
                Object.keys(
                    nextErrors,
                ).length
            ) {
                setErrors(
                    nextErrors,
                );
                return;
            }

            setIsLoading(
                true,
            );

            try {
                const response =
                    await api.post(
                        "/api/auth/reset-password",
                        {
                            email,
                            otp:
                                otpString,
                            newPassword:
                                password,
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
                    "Password Reset Successful!",
                    "You have been automatically logged in.",
                );

                router.replace(
                    "/app",
                );
            } catch (error: any) {
                const errorMessage =
                    error?.response
                        ?.data
                        ?.message ||
                    "Failed to reset password. Please try again.";

                showToast(
                    "error",
                    "Error",
                    errorMessage,
                );

                if (
                    errorMessage.includes(
                        "OTP",
                    )
                ) {
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
                }
            } finally {
                setIsLoading(
                    false,
                );
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
                        color="#ec4899"
                    />
                </View>

                <Text
                    style={
                        styles.title
                    }
                >
                    Create New Password
                </Text>

                <Text
                    style={
                        styles.subtitle
                    }
                >
                    Enter the 6-digit code
                    sent to{" "}
                    <Text
                        style={
                            styles.email
                        }
                    >
                        {email}
                    </Text>{" "}
                    and create a new
                    secure password.
                </Text>
            </View>

            <View
                style={
                    styles.card
                }
            >
                <Text
                    style={
                        styles.sectionLabel
                    }
                >
                    Verification Code
                </Text>

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
                                ) =>
                                    updateOtp(
                                        index,
                                        value,
                                    )
                                }
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
                                maxLength={1}
                                style={
                                    styles.otpInput
                                }
                            />
                        ),
                    )}
                </View>

                {errors.otp ? (
                    <Text
                        style={
                            styles.errorText
                        }
                    >
                        {errors.otp}
                    </Text>
                ) : null}

                <View
                    style={
                        styles.divider
                    }
                />

                <View
                    style={
                        styles.passwordContainer
                    }
                >
                    <Input
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        placeholder="••••••••"
                        value={password}
                        onChangeText={(
                            value,
                        ) => {
                            setPassword(
                                value,
                            );

                            if (
                                errors.password
                            ) {
                                setErrors(
                                    (previous) => ({
                                        ...previous,
                                        password:
                                            "",
                                    }),
                                );
                            }
                        }}
                        error={
                            errors.password
                        }
                        leftIcon={
                            <Lock
                                size={20}
                                color="#64748b"
                            />
                        }
                    />

                    <Pressable
                        onPress={() =>
                            setShowPassword(
                                (value) =>
                                    !value,
                            )
                        }
                        style={
                            styles.passwordToggle
                        }
                    >
                        {showPassword ? (
                            <EyeOff
                                size={20}
                                color="#64748b"
                            />
                        ) : (
                            <Eye
                                size={20}
                                color="#64748b"
                            />
                        )}
                    </Pressable>
                </View>

                {password ? (
                    <View
                        style={
                            styles.strengthContainer
                        }
                    >
                        <View
                            style={
                                styles.strengthHeader
                            }
                        >
                            <Text
                                style={
                                    styles.secondaryText
                                }
                            >
                                Password Strength
                            </Text>

                            <Text
                                style={[
                                    styles.strengthLabel,
                                    {
                                        color:
                                            strengthColor,
                                    },
                                ]}
                            >
                                {
                                    strengthLabel
                                }
                            </Text>
                        </View>

                        <View
                            style={
                                styles.strengthTrack
                            }
                        >
                            <View
                                style={[
                                    styles.strengthFill,
                                    {
                                        width: `${strength}%`,
                                        backgroundColor:
                                            strengthColor,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                ) : null}

                <Input
                    type={
                        showPassword
                            ? "text"
                            : "password"
                    }
                    placeholder="••••••••"
                    value={
                        confirmPassword
                    }
                    onChangeText={(
                        value,
                    ) => {
                        setConfirmPassword(
                            value,
                        );

                        if (
                            errors.confirmPassword
                        ) {
                            setErrors(
                                (previous) => ({
                                    ...previous,
                                    confirmPassword:
                                        "",
                                }),
                            );
                        }
                    }}
                    error={
                        errors.confirmPassword
                    }
                    leftIcon={
                        <Lock
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
                        void handleVerifyReset()
                    }
                    leftIcon={
                        !isLoading ? (
                            <Save
                                size={20}
                                color="#ffffff"
                            />
                        ) : undefined
                    }
                    style={
                        styles.fullButton
                    }
                >
                    Reset Password
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
                    Cancel and return to{" "}
                </Text>

                <Text
                    style={
                        styles.linkText
                    }
                >
                    Login
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
                "rgba(236,72,153,0.12)",
            borderWidth: 1,
            borderColor:
                "rgba(236,72,153,0.30)",
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
            fontWeight:
                "600",
            color: "#0f172a",
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
            gap: 16,
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

        sectionLabel: {
            fontSize: 14,
            lineHeight: 20,
            fontWeight: "500",
            color: "#0f172a",
            textAlign:
                "center",
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
            height: 56,
            borderRadius: 16,
            borderWidth: 1,
            borderColor:
                "#e2e8f0",
            backgroundColor:
                "#f1f5f9",
            color: "#0f172a",
            fontSize: 20,
            fontWeight: "700",
            textAlign:
                "center",
        },

        errorText: {
            fontSize: 12,
            color: "#ef4444",
            textAlign:
                "center",
        },

        divider: {
            height: 1,
            backgroundColor:
                "#e2e8f0",
            marginVertical: 4,
        },

        passwordContainer: {
            position:
                "relative",
        },

        passwordToggle: {
            position:
                "absolute",
            right: 12,
            top: 7,
            width: 40,
            height: 40,
            alignItems:
                "center",
            justifyContent:
                "center",
        },

        strengthContainer: {
            paddingHorizontal: 4,
        },

        strengthHeader: {
            flexDirection:
                "row",
            justifyContent:
                "space-between",
            marginBottom: 6,
        },

        secondaryText: {
            fontSize: 14,
            color: "#64748b",
        },

        strengthLabel: {
            fontSize: 12,
            fontWeight:
                "600",
        },

        strengthTrack: {
            height: 6,
            borderRadius: 999,
            overflow:
                "hidden",
            backgroundColor:
                "#f1f5f9",
        },

        strengthFill: {
            height: "100%",
            borderRadius: 999,
        },

        fullButton: {
            width: "100%",
            marginTop: 4,
        },

        backLink: {
            marginTop: 32,
            flexDirection:
                "row",
        },

        linkText: {
            color: "#a855f7",
            fontSize: 14,
            fontWeight: "600",
        },
    });