import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { Screen } from "../components/Screen";
import { quoteParlay } from "../api/client";
import { ParlayLeg, ParlayResponse } from "../api/types";
import { useAppContext } from "../context/AppContext";
import { palette, radii, spacing, typography } from "../theme/theme";

type LegType = "moneyline" | "totals" | "player_points";

const defaultLeg = {
  kind: "moneyline" as LegType,
  team_1: "LAL",
  team_2: "BOS",
  home_team: "1",
  line: "220.5",
  bet_type: "over" as "over" | "under",
  player_name: "LeBron James",
  player_id: "",
  odds_decimal: "1.91",
};

export const ParlayScreen: React.FC = () => {
  const { apiBaseUrl, useMockApi } = useAppContext();
  const [legs, setLegs] = useState<ParlayLeg[]>([]);
  const [draft, setDraft] = useState(defaultLeg);
  const [stake, setStake] = useState("100");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParlayResponse | null>(null);

  const canAddLeg = useMemo(() => {
    if (draft.kind === "moneyline") {
      return draft.team_1.trim() !== "" && draft.team_2.trim() !== "";
    }
    if (draft.kind === "totals") {
      return draft.team_1.trim() !== "" && draft.team_2.trim() !== "" && draft.line.trim() !== "";
    }
    return (draft.player_name.trim() !== "" || draft.player_id.trim() !== "") && draft.line.trim() !== "";
  }, [draft]);

  useEffect(() => {
    if (legs.length === 0) {
      setResult(null);
    }
  }, [legs]);

  const addLeg = () => {
    if (!canAddLeg) return;

    const baseLeg: ParlayLeg = {
      kind: draft.kind,
      odds_decimal: draft.odds_decimal ? Number(draft.odds_decimal) : undefined,
    };

    if (draft.kind === "moneyline") {
      baseLeg.team_1 = draft.team_1.toUpperCase();
      baseLeg.team_2 = draft.team_2.toUpperCase();
      baseLeg.home_team = Number(draft.home_team) > 0 ? 1 : 0;
    }

    if (draft.kind === "totals") {
      baseLeg.team_1 = draft.team_1.toUpperCase();
      baseLeg.team_2 = draft.team_2.toUpperCase();
      baseLeg.line = Number(draft.line);
      baseLeg.bet_type = draft.bet_type;
    }

    if (draft.kind === "player_points") {
      baseLeg.player_name = draft.player_name.trim();
      baseLeg.player_id = draft.player_id ? Number(draft.player_id) : undefined;
      baseLeg.line = Number(draft.line);
      baseLeg.bet_type = draft.bet_type;
    }

    setLegs((prev) => [...prev, baseLeg]);
  };

  const removeLeg = (index: number) => {
    setLegs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const quote = async () => {
    if (legs.length === 0) {
      Alert.alert("Add a leg", "Add at least one leg before quoting the parlay.");
      return;
    }

    const stakeValue = Number(stake) || 0;
    if (stakeValue <= 0) {
      Alert.alert("Invalid stake", "Stake must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const response = await quoteParlay(
        {
          legs,
          stake: stakeValue,
          use_penalty: true,
          penalty_per_extra_bet: 0.02,
        },
        { baseUrl: apiBaseUrl, useMock: useMockApi }
      );
      setResult(response);
    } catch (error) {
      console.error(error);
      Alert.alert("Parlay failed", "Check your inputs or API availability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.stack}>
        <Card>
          <Text style={styles.kicker}>Parlay builder</Text>
          <Text style={styles.title}>Combine multiple legs into one ticket</Text>
          <Text style={styles.subtitle}>Live mode: {useMockApi ? "Mock" : apiBaseUrl}</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Legs</Text>
              <Text style={styles.summaryPillValue}>{legs.length}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillLabel}>Stake</Text>
              <Text style={styles.summaryPillValue}>${stake}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Add a leg</Text>
          <View style={styles.legTypeRow}>
            {(["moneyline", "totals", "player_points"] as LegType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setDraft((prev) => ({ ...prev, kind: type }))}
                style={[styles.legTypeChip, draft.kind === type && styles.legTypeChipActive]}
              >
                <Text style={styles.legTypeText}>{type.replace("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {draft.kind !== "player_points" ? (
            <View style={styles.formRow}>
              <FormField label="Team 1" value={draft.team_1} onChangeText={(v) => setDraft((prev) => ({ ...prev, team_1: v }))} />
              <FormField label="Team 2" value={draft.team_2} onChangeText={(v) => setDraft((prev) => ({ ...prev, team_2: v }))} />
              {draft.kind === "moneyline" ? (
                <FormField
                  label="Team 1 Home? (1/0)"
                  keyboardType="numeric"
                  value={draft.home_team}
                  onChangeText={(v) => setDraft((prev) => ({ ...prev, home_team: v }))}
                />
              ) : (
                <>
                  <FormField
                    label="Line"
                    keyboardType="numeric"
                    value={draft.line}
                    onChangeText={(v) => setDraft((prev) => ({ ...prev, line: v }))}
                  />
                  <FormField
                    label="Bet type (over/under)"
                    value={draft.bet_type}
                    onChangeText={(v) => setDraft((prev) => ({ ...prev, bet_type: v === "under" ? "under" : "over" }))}
                  />
                </>
              )}
            </View>
          ) : (
            <View style={styles.formRow}>
              <FormField
                label="Player name"
                value={draft.player_name}
                onChangeText={(v) => setDraft((prev) => ({ ...prev, player_name: v }))}
                helperText="Use full name for best match"
              />
              <FormField
                label="Player ID (optional)"
                keyboardType="numeric"
                value={draft.player_id}
                onChangeText={(v) => setDraft((prev) => ({ ...prev, player_id: v }))}
              />
              <FormField
                label="Line"
                keyboardType="numeric"
                value={draft.line}
                onChangeText={(v) => setDraft((prev) => ({ ...prev, line: v }))}
              />
              <FormField
                label="Bet type (over/under)"
                value={draft.bet_type}
                onChangeText={(v) => setDraft((prev) => ({ ...prev, bet_type: v === "under" ? "under" : "over" }))}
              />
            </View>
          )}

          <FormField
            label="Decimal odds (optional)"
            keyboardType="numeric"
            value={draft.odds_decimal}
            onChangeText={(v) => setDraft((prev) => ({ ...prev, odds_decimal: v }))}
            helperText="Example: 1.91"
          />

          <AppButton title="Add leg" onPress={addLeg} disabled={!canAddLeg} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Current legs</Text>
          {legs.length === 0 ? (
            <Text style={styles.helper}>No legs yet. Add a leg to start building your parlay.</Text>
          ) : (
            <View style={styles.legs}>
              {legs.map((leg, idx) => (
                <View key={`${leg.kind}-${idx}`} style={styles.legRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.legTitle}>{leg.kind.replace("_", " ")}</Text>
                    <Text style={styles.legOdds}>Odds: {leg.odds_decimal ? leg.odds_decimal.toFixed(2) : "n/a"}</Text>
                  </View>
                  <AppButton title="Remove" variant="secondary" onPress={() => removeLeg(idx)} />
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Quote parlay</Text>
          <FormField
            label="Stake"
            keyboardType="numeric"
            value={stake}
            onChangeText={setStake}
            helperText="Used to estimate payout if odds are provided"
          />
          <AppButton title="Calculate parlay" onPress={quote} loading={loading} />

          {result ? (
            <View style={styles.resultBlock}>
              <Text style={styles.summaryText}>Parlay probability: {(result.parlay_probability * 100).toFixed(2)}%</Text>
              <Text style={styles.helper}>Recommendation: {result.bet_recommendation}</Text>
              {result.combined_odds_decimal ? (
                <Text style={styles.helper}>Combined odds: {result.combined_odds_decimal.toFixed(2)}</Text>
              ) : null}
              {result.potential_payout ? (
                <Text style={styles.helper}>Potential payout: ${result.potential_payout.toFixed(2)}</Text>
              ) : null}
              {result.potential_profit ? (
                <Text style={styles.helper}>Potential profit: ${result.potential_profit.toFixed(2)}</Text>
              ) : null}
            </View>
          ) : null}
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
  legTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  legTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  legTypeChipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  legTypeText: {
    ...typography.body,
    color: palette.text,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  formRow: {
    gap: spacing.sm,
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
  resultBlock: {
    marginTop: spacing.md,
  },
});
