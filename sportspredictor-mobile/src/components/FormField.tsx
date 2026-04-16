import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { palette, radii, spacing, typography } from "../theme/theme";

type Props = TextInputProps & {
  label: string;
  helperText?: string;
};

export const FormField: React.FC<Props> = ({ label, helperText, style, ...rest }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={palette.muted}
        style={[styles.input, style]}
        {...rest}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: palette.text,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  helper: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.xs,
  },
});
