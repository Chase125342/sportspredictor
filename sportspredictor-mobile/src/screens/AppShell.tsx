import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { AppSection, TopNav } from "../components/TopNav";
import { palette } from "../theme/theme";
import { HomeScreen } from "./HomeScreen";
import { PredictionsScreen } from "./PredictionsScreen";
import { ParlayScreen } from "./ParlayScreen";
import { SettingsScreen } from "./SettingsScreen";

export const AppShell: React.FC = () => {
  const [active, setActive] = useState<AppSection>("home");

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav active={active} onChange={setActive} />
      <View style={styles.content}>
        {active === "home" ? <HomeScreen onNavigate={setActive} /> : null}
        {active === "predictions" ? <PredictionsScreen /> : null}
        {active === "parlays" ? <ParlayScreen /> : null}
        {active === "profile" ? <SettingsScreen /> : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
  },
});
