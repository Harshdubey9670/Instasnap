import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../src/components/ui/Card";

export default function ProfileSetupScreen() {
    return (
        <ScrollView
            style={
                styles.screen
            }
            contentContainerStyle={
                styles.content
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>
                        ProfileSetup
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <Text
                        style={
                            styles.description
                        }
                    >
                        This is the placeholder
                        for the ProfileSetup page.
                    </Text>
                </CardContent>
            </Card>
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
            padding: 16,
        },

        description: {
            fontSize: 14,
            lineHeight: 20,
            color: "#64748b",
        },
    });