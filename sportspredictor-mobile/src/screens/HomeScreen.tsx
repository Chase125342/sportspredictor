import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { AppSection } from "../components/TopNav";
import { palette, radii, spacing, typography } from "../theme/theme";

type Props = {
  onNavigate: (next: AppSection) => void;
};

export const HomeScreen: React.FC<Props> = ({ onNavigate }) => {
  return (
    <Screen>
      <View style={styles.grid}>
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Image source={require("../../assets/icon.png")} style={styles.logo} />
            <View style={styles.heroTextWrap}>
              <Text style={styles.kicker}>AI sports dashboard</Text>
              <Text style={styles.title}>Professional betting insights with a clean mobile-first UI</Text>
              <Text style={styles.subtitle}>
                Navigate the app from the top bar, check your account, and jump into predictions without clutter.
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <AppButton title="Open Predictions" onPress={() => onNavigate("predictions")} style={styles.button} />
            <AppButton title="Open Profile" variant="secondary" onPress={() => onNavigate("profile")} style={styles.button} />
          </View>
        </Card>

        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Session</Text>
            <Text style={styles.metricValue}>Live</Text>
            <Text style={styles.metricSub}>Users must authenticate first</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Navigation</Text>
            <Text style={styles.metricValue}>Top bar</Text>
            <Text style={styles.metricSub}>Better for web and mobile</Text>
          </Card>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>App highlights</Text>
          <View style={styles.featureList}>
            <Text style={styles.body}>• Auth-gated access with Supabase</Text>
            <Text style={styles.body}>• Prediction and parlay screens with polished spacing</Text>
            <Text style={styles.body}>• Profile page for account details and sign out</Text>
            <Text style={styles.body}>• Mock API toggle for local development</Text>
          </View>
        </Card>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  heroCard: {
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
  },
  heroTextWrap: {
    flex: 1,
  },
  kicker: {
    ...typography.body,
    color: palette.accentSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    fontWeight: "700",
  },
  title: {
    ...typography.heading,
    color: palette.text,
    lineHeight: 30,
  },
  subtitle: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
  },
  metricLabel: {
    ...typography.body,
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.subheading,
    color: palette.text,
    fontSize: 20,
  },
  metricSub: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.text,
    marginBottom: spacing.sm,
  },
  featureList: {
    gap: spacing.sm,
  },
  body: {
    ...typography.body,
    color: palette.muted,
    lineHeight: 20,
  },
});
