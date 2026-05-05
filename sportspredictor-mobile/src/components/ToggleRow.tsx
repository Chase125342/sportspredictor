import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { palette, spacing, typography } from "../theme/theme";

type Props = {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  helperText?: string;
};

export const ToggleRow: React.FC<Props> = ({ label, value, onValueChange, helperText }) => {
  return (
    <View style={styles.row}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: palette.border, true: palette.accentSoft }}
        thumbColor={value ? palette.accent : palette.text}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    ...typography.subheading,
    color: palette.text,
  },
  helper: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.xs,
  },
});
