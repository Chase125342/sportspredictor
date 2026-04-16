import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { palette, radii, spacing, typography } from "../theme/theme";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
};

export const AppButton: React.FC<Props> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
}) => {
  const isDisabled = disabled || loading;
  const backgroundColor = variant === "primary" ? palette.accent : palette.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, { backgroundColor: isDisabled ? palette.border : backgroundColor }, style]}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color={palette.text} /> : <Text style={styles.label}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
  },
  label: {
    ...typography.subheading,
    color: palette.text,
  },
});
