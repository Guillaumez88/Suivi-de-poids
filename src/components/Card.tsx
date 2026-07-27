import React, { ReactNode } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors, radius, space, shadow } from "@/theme/theme";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: "sm" | "md" | "lg" | "none";
  tinted?: "accent" | "accent2" | "surface";
}

export function Carte({ children, style, elevation = "none", tinted = "surface" }: Props) {
  return (
    <View
      style={[
        styles.base,
        tinted === "surface" && { backgroundColor: colors.surface },
        tinted === "accent" && { backgroundColor: colors.accent100 },
        tinted === "accent2" && { backgroundColor: colors.accent2_100 },
        elevation !== "none" && shadow[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    padding: space[6],
  },
});
