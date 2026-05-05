import React from "react";
import { ScrollView, StyleSheet, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, spacing } from "../theme/theme";

type Props = ViewProps & { scrollable?: boolean };

export const Screen: React.FC<React.PropsWithChildren<Props>> = ({ children, style, scrollable = true }) => {
  const Wrapper = scrollable ? ScrollView : React.Fragment;

  return (
    <SafeAreaView style={styles.safe}>
      {scrollable ? (
        <ScrollView contentContainerStyle={[styles.container, style]}>{children}</ScrollView>
      ) : (
        <>{children}</>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
