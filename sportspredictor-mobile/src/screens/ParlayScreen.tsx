import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { palette, radii, spacing, typography } from "../theme/theme";

const mockLegs = [
  { id: 1, title: "Home team wins", odds: "+120" },
  { id: 2, title: "Total points over 220.5", odds: "-105" },
  { id: 3, title: "Star player 8+ assists", odds: "+150" },
];

export const ParlayScreen: React.FC = () => {
  return (
    <Screen>
      <View style={styles.stack}>
        <Card>
          <Text style={styles.kicker}>Parlay studio</Text>
          <Text style={styles.title}>Build a high-level slip before you send it</Text>
          <Text style={styles.subtitle}>Quick mock selection UI for future odds and payout calculations.</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Legs</Text>
              <Text style={styles.summaryPillValue}>3</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Est. payout</Text>
              <Text style={styles.summaryPillValue}>+340</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Suggested legs</Text>
          <View style={styles.legs}>
            {mockLegs.map((leg) => (
              <View key={leg.id} style={styles.legRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.legTitle}>{leg.title}</Text>
                  <Text style={styles.legOdds}>Odds: {leg.odds}</Text>
                </View>
                <Text style={styles.badge}>Add</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Slip summary</Text>
          <Text style={styles.summaryText}>Est. Payout (mock): +340</Text>
          <Text style={styles.helper}>This is a placeholder layout until odds and bet slip logic are connected.</Text>
        </Card>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
    paddingBottom: spacing.md,
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
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  summaryPillLabel: {
    ...typography.body,
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  summaryPillValue: {
    ...typography.subheading,
    color: palette.text,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.text,
    marginBottom: spacing.md,
  },
  legs: {
    gap: spacing.sm,
  },
  legRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.md,
  },
  legTitle: {
    ...typography.subheading,
    color: palette.text,
  },
  legOdds: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.xs,
  },
  badge: {
    ...typography.body,
    color: palette.text,
    backgroundColor: palette.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
  },
  summary: {
    marginTop: spacing.lg,
  },
  summaryText: {
    ...typography.subheading,
    color: palette.text,
    marginBottom: spacing.xs,
  },
  helper: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.xs,
  },
});
