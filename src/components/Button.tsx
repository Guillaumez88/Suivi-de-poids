import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors, fonts, space, radius } from "@/theme/theme";

type Variante = "primary" | "secondary" | "ghost";

interface Props {
  label: string;
  onPress: () => void;
  variante?: Variante;
  bloc?: boolean; // pleine largeur, comme .btn-block
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Bouton({ label, onPress, variante = "primary", bloc, style, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variante === "primary" && styles.primary,
        variante === "secondary" && styles.secondary,
        variante === "ghost" && styles.ghost,
        bloc && styles.bloc,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variante === "primary" && styles.labelPrimary,
          variante === "ghost" && styles.labelGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: space[4],
    paddingHorizontal: space[6],
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surface },
  ghost: { backgroundColor: "transparent", paddingHorizontal: space[2] },
  bloc: { alignSelf: "stretch" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  label: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.text,
  },
  labelPrimary: { color: colors.bg },
  labelGhost: { fontFamily: fonts.bodyBold, color: colors.accent700, fontSize: 14 },
});
