import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, space } from "@/theme/theme";

type Ton = "accent" | "accent2" | "neutral" | "outline";

interface Props {
  label: string;
  ton?: Ton;
}

export function Etiquette({ label, ton = "neutral" }: Props) {
  return (
    <View style={[styles.base, fondsParTon[ton]]}>
      <Text style={[styles.label, textesParTon[ton]]}>{label}</Text>
    </View>
  );
}

const fondsParTon: Record<Ton, object> = {
  accent: { backgroundColor: colors.accent100 },
  accent2: { backgroundColor: colors.accent2_100 },
  neutral: { backgroundColor: colors.neutral200 },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.neutral400 },
};

const textesParTon: Record<Ton, object> = {
  accent: { color: colors.accent800 },
  accent2: { color: colors.accent2_800 },
  neutral: { color: colors.neutral800 },
  outline: { color: colors.neutral700 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
  },
});
