import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BienvenueScreen } from "@/screens/onboarding/BienvenueScreen";
import { ProfilScreen } from "@/screens/onboarding/ProfilScreen";
import { RituelScreen } from "@/screens/onboarding/RituelScreen";
import { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Bienvenue" component={BienvenueScreen} />
      <Stack.Screen name="Profil" component={ProfilScreen} />
      <Stack.Screen name="Rituel" component={RituelScreen} />
    </Stack.Navigator>
  );
}
