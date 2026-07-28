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
import { WaterConfirmScreen } from "@/screens/WaterConfirmScreen";
import { ContextScreen } from "@/screens/ContextScreen";
import { SportScreen } from "@/screens/SportScreen";
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
            <Stack.Screen name="ContextePeriode" component={ContextScreen} options={{ title: "Contexte particulier" }} />
            <Stack.Screen name="SeanceSport" component={SportScreen} options={{ title: "Séance de sport" }} />
          </Stack.Group>
          {/* En-tête personnalisé (date en grand + badge contexte), pas la
              barre native générique. */}
          <Stack.Screen
            name="DetailJournee"
            component={DayDetailScreen}
            options={{ presentation: "modal", headerShown: false }}
          />
          {/* Section 3.4 : un tap suffit, rien d'autre — pas de header ni de
              plein écran opaque, juste un accusé de réception par-dessus
              l'écran précédent. */}
          <Stack.Screen
            name="Grignotage"
            component={SnackConfirmScreen}
            options={{ presentation: "transparentModal", headerShown: false, animation: "fade" }}
          />
          <Stack.Screen
            name="VerreEau"
            component={WaterConfirmScreen}
            options={{ presentation: "transparentModal", headerShown: false, animation: "fade" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
