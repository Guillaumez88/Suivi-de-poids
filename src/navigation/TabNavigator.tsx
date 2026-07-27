import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, CalendarDays, TrendingUp, Settings } from "lucide-react-native";
import { HomeScreen } from "@/screens/HomeScreen";
import { MonthScreen } from "@/screens/MonthScreen";
import { TrendsScreen } from "@/screens/TrendsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { colors, iconStrokeWidth } from "@/theme/theme";
import { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent700,
        tabBarInactiveTintColor: colors.neutral600,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.divider },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Home color={color} strokeWidth={iconStrokeWidth} /> }}
      />
      <Tab.Screen
        name="Mois"
        component={MonthScreen}
        options={{ tabBarIcon: ({ color }) => <CalendarDays color={color} strokeWidth={iconStrokeWidth} /> }}
      />
      <Tab.Screen
        name="Tendances"
        component={TrendsScreen}
        options={{ tabBarIcon: ({ color }) => <TrendingUp color={color} strokeWidth={iconStrokeWidth} /> }}
      />
      <Tab.Screen
        name="Reglages"
        component={SettingsScreen}
        options={{ tabBarLabel: "Réglages", tabBarIcon: ({ color }) => <Settings color={color} strokeWidth={iconStrokeWidth} /> }}
      />
    </Tab.Navigator>
  );
}
