import React from "react";
import {
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

export type NotificationTab =
  | "all"
  | "mentions"
  | "likes"
  | "comments"
  | "follows";

interface NotificationFilterTabsProps {
  activeTab: NotificationTab;
  setActiveTab: (
    tab: NotificationTab,
  ) => void;
}

const tabs: Array<{
  id: NotificationTab;
  label: string;
}> = [
  {
    id: "all",
    label: "All Activity",
  },
  {
    id: "mentions",
    label: "Mentions",
  },
  {
    id: "likes",
    label: "Likes",
  },
  {
    id: "comments",
    label: "Comments",
  },
  {
    id: "follows",
    label: "Follows",
  },
];

export const NotificationFilterTabs = ({
  activeTab,
  setActiveTab,
}: NotificationFilterTabsProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      contentContainerStyle={
        styles.container
      }
    >
      {tabs.map((tab) => {
        const active =
          activeTab ===
          tab.id;

        return (
          <Pressable
            key={tab.id}
            onPress={() =>
              setActiveTab(
                tab.id,
              )
            }
            style={({ pressed }) => [
              styles.tab,
              active &&
                styles.activeTab,
              pressed &&
                styles.pressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{
              selected:
                active,
            }}
          >
            <Text
              style={[
                styles.label,
                active &&
                  styles.activeLabel,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles =
  StyleSheet.create({
    container: {
      paddingHorizontal: 4,
      paddingVertical: 8,
      paddingBottom: 14,
      gap: 8,
    },

    tab: {
      minHeight: 36,
      paddingHorizontal: 16,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 999,

      backgroundColor:
        "rgba(255,255,255,0.05)",
    },

    activeTab: {
      backgroundColor:
        "#ffffff",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },

    label: {
      fontSize: 12,
      fontWeight: "700",
      color: "#94a3b8",
      includeFontPadding:
        false,
    },

    activeLabel: {
      color: "#000000",
    },

    pressed: {
      opacity: 0.80,
      transform: [
        {
          scale: 0.97,
        },
      ],
    },
  });