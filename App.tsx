import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts, Caprasimo_400Regular } from "@expo-google-fonts/caprasimo";
import {
  Figtree_400Regular,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import { View, ActivityIndicator } from "react-native";

import { AppDataProvider, useAppData } from "@/state/AppDataContext";
import { RootNavigator } from "@/navigation/RootNavigator";
import { programmerRappelsDuJour } from "@/services/notifications";
import { activerPushWeb } from "@/services/pushWeb";
import { dateISOAujourdhui, estLeJour } from "@/utils/businessRules";
import { colors } from "@/theme/theme";

function ContenuApp() {
  const { utilisateur, pesees } = useAppData();

  useEffect(() => {
    if (!utilisateur) return;
    const aujourdhui = dateISOAujourdhui();
    const dejaFait = pesees.some((p) => estLeJour(p.date, aujourdhui));
    programmerRappelsDuJour(
      { heureRappel1: utilisateur.heureRappel1, heureRappel2: utilisateur.heureRappel2 },
      dejaFait
    );
    activerPushWeb(utilisateur.id);
  }, [utilisateur, pesees]);

  return <RootNavigator />;
}

export default function App() {
  const [policesChargees] = useFonts({
    Caprasimo_400Regular,
    Figtree_400Regular,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  if (!policesChargees) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <ContenuApp />
        </NavigationContainer>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
