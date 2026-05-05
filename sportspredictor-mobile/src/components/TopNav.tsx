import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette, radii, spacing, typography } from "../theme/theme";

export type AppSection = "home" | "predictions" | "parlays" | "profile";

type NavItem = {
  key: AppSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Props = {
  active: AppSection;
  onChange: (next: AppSection) => void;
};

const items: NavItem[] = [
  { key: "home", label: "Home", icon: "home-outline" },
  { key: "predictions", label: "Predict", icon: "analytics-outline" },
  { key: "parlays", label: "Parlays", icon: "podium-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

export const TopNav: React.FC<Props> = ({ active, onChange }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Ionicons name="pulse-outline" size={22} color={palette.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Sports Predictor</Text>
          <Text style={styles.brandSubtitle}>Professional sports analytics</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onChange(item.key)}
              activeOpacity={0.85}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              <Ionicons name={item.icon} size={18} color={isActive ? palette.text : palette.muted} />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  brandTitle: {
    ...typography.subheading,
    color: palette.text,
  },
  brandSubtitle: {
    ...typography.body,
    color: palette.muted,
    marginTop: 2,
  },
  navRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  navItemActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  navLabel: {
    ...typography.body,
    color: palette.muted,
    fontWeight: "600",
  },
  navLabelActive: {
    color: palette.text,
  },
});
