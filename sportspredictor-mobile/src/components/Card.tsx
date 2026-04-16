import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { palette, radii, spacing } from "../theme/theme";

type Props = ViewProps & { padded?: boolean };

export const Card: React.FC<Props> = ({ children, style, padded = true, ...rest }) => {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 5,
  },
  padded: {
    padding: spacing.lg,
  },
});
