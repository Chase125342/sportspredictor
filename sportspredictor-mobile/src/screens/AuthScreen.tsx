import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { palette, radii, spacing, typography } from "../theme/theme";

type Mode = "signIn" | "signUp";

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signUp";
  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (isSignUp && password !== confirmPassword) return false;
    return true;
  }, [email, password, confirmPassword, isSignUp]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("Missing info", "Enter a valid email and password.");
      return;
    }

    setLoading(true);
    try {
      const errorMessage = isSignUp ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
      if (errorMessage) {
        Alert.alert(isSignUp ? "Sign up failed" : "Sign in failed", errorMessage);
        return;
      }

      if (isSignUp) {
        Alert.alert("Account created", "If email confirmation is enabled, check your inbox before signing in.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Authentication error", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.stack}>
            <Card>
              <View style={styles.heroRow}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={palette.text} />
                </View>
                <View style={styles.heroTextWrap}>
                  <Text style={styles.kicker}>Secure access</Text>
                  <Text style={styles.title}>{isSignUp ? "Create your account" : "Welcome back"}</Text>
                  <Text style={styles.subtitle}>
                    {isSignUp
                      ? "Set up your account to access predictions, parlays, and profile settings."
                      : "Sign in to continue to your analytics dashboard."}
                  </Text>
                </View>
              </View>

              <View style={styles.modePills}>
                <AppButton
                  title="Sign in"
                  variant={isSignUp ? "secondary" : "primary"}
                  onPress={() => setMode("signIn")}
                  style={styles.modeButton}
                />
                <AppButton
                  title="Sign up"
                  variant={isSignUp ? "primary" : "secondary"}
                  onPress={() => setMode("signUp")}
                  style={styles.modeButton}
                />
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>{isSignUp ? "Account details" : "Sign in details"}</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={palette.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={palette.muted}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              {isSignUp ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm password</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={palette.muted}
                    secureTextEntry
                    style={styles.input}
                  />
                </View>
              ) : null}

              <AppButton
                title={isSignUp ? "Create account" : "Sign in"}
                onPress={handleSubmit}
                loading={loading}
                disabled={!canSubmit}
              />

              <Text style={styles.helper}>
                {isSignUp
                  ? "Email verification may be required based on your Supabase auth settings."
                  : "Use the credentials from your Supabase account."}
              </Text>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  stack: {
    gap: spacing.md,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
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
    lineHeight: 20,
  },
  modePills: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modeButton: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.text,
    marginBottom: spacing.md,
  },
  fieldGroup: {
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
    marginTop: spacing.md,
  },
});
