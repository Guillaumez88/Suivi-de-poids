import React from "react";
import { Text, StyleSheet, StyleProp, TextStyle } from "react-native";
import { colors, fonts, space } from "@/theme/theme";

/** Petit intitulé de section, tout en majuscules, discret. */
export function SectionKicker({ label, style }: { label: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.kicker, style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.neutral600,
    marginTop: space[4],
    marginBottom: space[2],
    paddingHorizontal: space[1],
  },
});
