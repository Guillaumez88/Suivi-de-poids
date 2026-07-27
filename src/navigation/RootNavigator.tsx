import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppData } from "@/state/AppDataContext";
import { colors } from "@/theme/theme";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { TabNavigator } from "./TabNavigator";
import { MorningWeighInScreen } from "@/screens/MorningWeighInScreen";
import { ToiletEntryScreen } from "@/screens/ToiletEntryScreen";
import { CheatmealScreen } from "@/screens/CheatmealScreen";
import { SnackConfirmScreen } from "@/screens/SnackConfirmScreen";
import { ContextScreen } from "@/screens/ContextScreen";
import { DayDetailScreen } from "@/screens/DayDetailScreen";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { utilisateurFirebase, chargement } = useAppData();

  if (chargement) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!utilisateurFirebase ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <>
          <Stack.Screen name="Principal" component={TabNavigator} />
          <Stack.Group screenOptions={{ presentation: "modal", headerShown: true }}>
            <Stack.Screen name="PeseeMatinale" component={MorningWeighInScreen} options={{ title: "Pesée du matin" }} />
            <Stack.Screen name="PassageToilette" component={ToiletEntryScreen} options={{ title: "Passage aux toilettes" }} />
            <Stack.Screen name="Cheatmeal" component={CheatmealScreen} options={{ title: "Un extra" }} />
            <Stack.Screen name="Grignotage" component={SnackConfirmScreen} options={{ title: "Grignotage" }} />
            <Stack.Screen name="ContextePeriode" component={ContextScreen} options={{ title: "Contexte particulier" }} />
            <Stack.Screen name="DetailJournee" component={DayDetailScreen} options={{ title: "Détail du jour" }} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
}
