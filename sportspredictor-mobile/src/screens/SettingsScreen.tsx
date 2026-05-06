import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { ToggleRow } from "../components/ToggleRow";
import { getHealth } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";
import { palette, radii, spacing, typography } from "../theme/theme";

export const SettingsScreen: React.FC = () => {
  const { apiBaseUrl, setApiBaseUrl, useMockApi, setUseMockApi, oddsApiKey, setOddsApiKey, theme, toggleTheme } = useAppContext();
  const { userEmail, signOut } = useAuth();
  const [health, setHealth] = useState<string>("unknown");
  const [urlDraft, setUrlDraft] = useState(apiBaseUrl);
  const [oddsKeyDraft, setOddsKeyDraft] = useState(oddsApiKey);
  const [checking, setChecking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await getHealth({ baseUrl: urlDraft, useMock: useMockApi });
      setHealth(`${res.status}${res.mode ? ` (${res.mode})` : ""}`);
    } catch (error) {
      console.error(error);
      setHealth("error");
      Alert.alert("Health check failed", "Verify the API URL or enable mock mode.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    setUrlDraft(apiBaseUrl);
    setOddsKeyDraft(oddsApiKey);
  }, [apiBaseUrl, oddsApiKey]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error(error);
      Alert.alert("Sign out failed", "Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSaveOddsKey = () => {
    if (!oddsKeyDraft.trim()) {
      Alert.alert("Missing API key", "Paste your Odds API key into the field before saving.");
      return;
    }

    setOddsApiKey(oddsKeyDraft.trim());
    Alert.alert("Saved", "Odds API key saved.");
  };

  return (
    <Screen>
      <View style={styles.stack}>
        <Card>
          <Text style={styles.kicker}>Profile</Text>
          <Text style={styles.title}>Manage your account and app settings</Text>
          <Text style={styles.helper}>View your email, control API mode, and sign out safely.</Text>

          <View style={styles.profileBox}>
            <Text style={styles.profileLabel}>Signed in as</Text>
            <Text style={styles.profileValue}>{userEmail ?? "unknown"}</Text>
            <Text style={styles.profileSub}>Authenticated via Supabase</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Connection</Text>
          <ToggleRow label="Use mock API" value={useMockApi} onValueChange={setUseMockApi} helperText="Turn off when your backend is ready." />

          <View style={styles.fieldRow}>
            <Text style={styles.label}>API Base URL</Text>
            <TextInput
              value={urlDraft}
              onChangeText={setUrlDraft}
              placeholder="http://localhost:8000"
              placeholderTextColor={palette.muted}
              style={styles.input}
              autoCapitalize="none"
            />
            <AppButton title="Save URL" onPress={() => setApiBaseUrl(urlDraft)} style={styles.save} />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Odds API Key</Text>
            <TextInput
              value={oddsKeyDraft}
              onChangeText={setOddsKeyDraft}
              placeholder="Enter your Odds API key"
              placeholderTextColor={palette.muted}
              style={styles.input}
              autoCapitalize="none"
            />
            <AppButton title="Save Key" onPress={handleSaveOddsKey} style={styles.save} />
          </View>
          <Text style={styles.helper}>Paste your real Odds API key into the field above, then tap Save Key.</Text>

          <AppButton title="Check Health" onPress={checkHealth} loading={checking} />
          <Text style={styles.helper}>Current status: {health}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <ToggleRow
            label="Dark mode"
            helperText="Optimized for a premium dark-first experience."
            value={theme === "dark"}
            onValueChange={toggleTheme}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Session</Text>
          <AppButton title="Sign out" variant="secondary" onPress={handleSignOut} loading={loggingOut} />
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
  helper: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.text,
    marginBottom: spacing.md,
  },
  profileBox: {
    marginTop: spacing.lg,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  profileLabel: {
    ...typography.body,
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  profileValue: {
    ...typography.subheading,
    color: palette.text,
  },
  profileSub: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.xs,
  },
  fieldRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: palette.muted,
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
  save: {
    alignSelf: "flex-start",
  },
});
