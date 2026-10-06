import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../../../theme/fonts";
import { heroGradient } from "../../../theme/colors";

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface SpatialTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const SpatialTabs: React.FC<SpatialTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={styles.tabWrap}>
            {isActive ? (
              <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.activeTab}>
                <Text style={styles.activeLabel}>{tab.label}</Text>
                {!!tab.badge && <View style={styles.badge}><Text style={styles.badgeText}>{tab.badge}</Text></View>}
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>
                <Text style={styles.inactiveLabel}>{tab.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
  },
  tabWrap: {
    marginHorizontal: 1,
  },
  activeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  inactiveTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  activeLabel: {
    color: "#FFF7F5",
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  inactiveLabel: {
    color: "rgba(255,247,245,0.7)",
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    paddingHorizontal: 5,
    minWidth: 16,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: fonts.bold,
  },
});

export default SpatialTabs;
