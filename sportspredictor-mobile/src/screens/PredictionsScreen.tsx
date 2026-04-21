import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { Screen } from "../components/Screen";
import { getTeams, predictMatchup } from "../api/client";
import { MatchupPredictResponse } from "../api/types";
import { useAppContext } from "../context/AppContext";
import { palette, spacing, typography } from "../theme/theme";

const initialForm = {
  team_1: "LAL",
  team_2: "BOS",
  home_team: "1",
};

export const PredictionsScreen: React.FC = () => {
  const { apiBaseUrl, useMockApi } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<MatchupPredictResponse | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const isFormValid = useMemo(() => {
    if (!form.team_1.trim() || !form.team_2.trim()) return false;
    return form.team_1.trim().toUpperCase() !== form.team_2.trim().toUpperCase();
  }, [form]);

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const res = await getTeams({ baseUrl: apiBaseUrl, useMock: useMockApi });
      setTeams(res.teams);
    } catch (error) {
      console.error(error);
      Alert.alert("Could not load teams", "Check API connection or use mock mode.");
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [apiBaseUrl, useMockApi]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectTeam = (field: "team_1" | "team_2", team: string) => {
    setForm((prev) => ({ ...prev, [field]: team.toUpperCase() }));
  };

  const handlePredict = async () => {
    if (!isFormValid) return;

    const payload = {
      team_1: form.team_1.trim().toUpperCase(),
      team_2: form.team_2.trim().toUpperCase(),
      home_team: Number(form.home_team) > 0 ? 1 : 0,
    };

    setLoading(true);
    try {
      const res = await predictMatchup(payload, { baseUrl: apiBaseUrl, useMock: useMockApi });
      setResult(res);
    } catch (error) {
      console.error(error);
      Alert.alert("Prediction failed", "Check team abbreviations or API connectivity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.stack}>
          <Card>
            <Text style={styles.kicker}>Prediction model</Text>
            <Text style={styles.title}>Run a real matchup prediction</Text>
            <Text style={styles.subtitle}>Sends to {useMockApi ? "mock client" : apiBaseUrl}</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillLabel}>Mode</Text>
                <Text style={styles.summaryPillValue}>{useMockApi ? "Mock" : "Live API"}</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillLabel}>Teams loaded</Text>
                <Text style={styles.summaryPillValue}>{loadingTeams ? "..." : teams.length.toString()}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Matchup inputs</Text>
            <View style={styles.grid}>
              <FormField
                label="Team 1 (target team)"
                value={form.team_1}
                onChangeText={(v) => handleChange("team_1", v.toUpperCase())}
                helperText="Prediction will be Team 1 win probability"
              />
              <FormField label="Team 2" value={form.team_2} onChangeText={(v) => handleChange("team_2", v.toUpperCase())} />
              <FormField
                label="Is Team 1 Home? (1/0)"
                keyboardType="numeric"
                value={form.home_team}
                onChangeText={(v) => handleChange("home_team", v)}
              />

              <View style={styles.quickTeamsWrap}>
                <Text style={styles.quickTeamsTitle}>Quick pick teams</Text>
                <View style={styles.quickTeamsRow}>
                  {teams.slice(0, 12).map((team) => (
                    <TouchableOpacity key={`t1-${team}`} onPress={() => selectTeam("team_1", team)} style={styles.quickChip}>
                      <Text style={styles.quickChipText}>T1 {team}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.quickTeamsRow}>
                  {teams.slice(0, 12).map((team) => (
                    <TouchableOpacity key={`t2-${team}`} onPress={() => selectTeam("team_2", team)} style={styles.quickChipSecondary}>
                      <Text style={styles.quickChipText}>T2 {team}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <AppButton title="Refresh teams" variant="secondary" onPress={fetchTeams} loading={loadingTeams} style={styles.refreshButton} />
              </View>
            </View>

            <AppButton title={useMockApi ? "Predict matchup (mock)" : "Predict matchup"} onPress={handlePredict} disabled={!isFormValid} loading={loading} />
          </Card>

          {result ? (
            <Card>
              <Text style={styles.sectionTitle}>Prediction result</Text>
              <Text style={styles.matchupText}>{result.team_1} vs {result.team_2}</Text>
              <Text style={styles.resultText}>{(result.probability * 100).toFixed(1)}%</Text>
              <Text style={styles.label}>{result.team_1} edge: {result.label}</Text>
              <Text style={styles.helper}>Source: {result.source}</Text>
              <Text style={styles.helper}>Features used: points_diff {result.features.points_diff.toFixed(2)} | home {result.features.home}</Text>
            </Card>
          ) : null}
        </View>
      </KeyboardAvoidingView>
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
  matchupText: {
    ...typography.subheading,
    color: palette.text,
    marginBottom: spacing.xs,
  },
  grid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickTeamsWrap: {
    marginTop: spacing.sm,
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  quickTeamsTitle: {
    ...typography.body,
    color: palette.muted,
    fontWeight: "600",
  },
  quickTeamsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickChip: {
    backgroundColor: palette.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  quickChipSecondary: {
    backgroundColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  quickChipText: {
    ...typography.body,
    color: palette.text,
    fontWeight: "600",
  },
  refreshButton: {
    alignSelf: "flex-start",
  },
  resultText: {
    ...typography.heading,
    color: palette.accent,
    marginTop: spacing.xs,
  },
  label: {
    ...typography.subheading,
    color: palette.text,
    marginTop: spacing.sm,
  },
  helper: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.xs,
  },
});
