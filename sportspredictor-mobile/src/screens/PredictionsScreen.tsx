import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { Screen } from "../components/Screen";
import { predict } from "../api/client";
import { PredictResponse } from "../api/types";
import { useAppContext } from "../context/AppContext";
import { palette, spacing, typography } from "../theme/theme";

const initialForm = {
  points_diff: "0",
  team_reb_roll: "4",
  opponent_reb_roll: "5",
  team_ast_roll: "4",
  opponent_ast_roll: "5",
  home: "1",
};

export const PredictionsScreen: React.FC = () => {
  const { apiBaseUrl, useMockApi } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const isFormValid = useMemo(() => Object.values(form).every((val) => val !== ""), [form]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePredict = async () => {
    if (!isFormValid) return;

    const payload = {
      points_diff: Number(form.points_diff),
      team_reb_roll: Number(form.team_reb_roll),
      opponent_reb_roll: Number(form.opponent_reb_roll),
      team_ast_roll: Number(form.team_ast_roll),
      opponent_ast_roll: Number(form.opponent_ast_roll),
      home: Number(form.home) > 0 ? 1 : 0,
    };

    setLoading(true);
    try {
      const res = await predict(payload, { baseUrl: apiBaseUrl, useMock: useMockApi });
      setResult(res);
    } catch (error) {
      console.error(error);
      Alert.alert("Prediction failed", "Check API URL or try mock mode.");
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
            <Text style={styles.title}>Run a clean bet probability check</Text>
            <Text style={styles.subtitle}>Sends to {useMockApi ? "mock client" : apiBaseUrl}</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillLabel}>Mode</Text>
                <Text style={styles.summaryPillValue}>{useMockApi ? "Mock" : "Live API"}</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillLabel}>Input fields</Text>
                <Text style={styles.summaryPillValue}>6</Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Game inputs</Text>
            <View style={styles.grid}>
              <FormField label="Points Diff" keyboardType="numeric" value={form.points_diff} onChangeText={(v) => handleChange("points_diff", v)} />
              <FormField label="Team Reb Roll" keyboardType="numeric" value={form.team_reb_roll} onChangeText={(v) => handleChange("team_reb_roll", v)} />
              <FormField label="Opp Reb Roll" keyboardType="numeric" value={form.opponent_reb_roll} onChangeText={(v) => handleChange("opponent_reb_roll", v)} />
              <FormField label="Team Ast Roll" keyboardType="numeric" value={form.team_ast_roll} onChangeText={(v) => handleChange("team_ast_roll", v)} />
              <FormField label="Opp Ast Roll" keyboardType="numeric" value={form.opponent_ast_roll} onChangeText={(v) => handleChange("opponent_ast_roll", v)} />
              <FormField label="Home (1/0)" keyboardType="numeric" value={form.home} onChangeText={(v) => handleChange("home", v)} />
            </View>

            <AppButton title={useMockApi ? "Predict (mock)" : "Predict now"} onPress={handlePredict} disabled={!isFormValid} loading={loading} />
          </Card>

          {result ? (
            <Card>
              <Text style={styles.sectionTitle}>Prediction result</Text>
              <Text style={styles.resultText}>{(result.probability * 100).toFixed(1)}%</Text>
              <Text style={styles.label}>Label: {result.label}</Text>
              <Text style={styles.helper}>Source: {result.source}</Text>
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
  grid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
