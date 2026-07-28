import React, { ReactNode, useRef } from "react";
import { Animated, Pressable, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { colors, fonts, space, radius } from "@/theme/theme";

type Variante = "primary" | "secondary" | "ghost";

interface Props {
  label: string;
  onPress: () => void;
  variante?: Variante;
  bloc?: boolean; // pleine largeur, comme .btn-block
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  icone?: ReactNode;
  fin?: string; // libellé secondaire aligné à droite (ex. "jusqu'à 11h")
}

export function Bouton({ label, onPress, variante = "primary", bloc, style, disabled, icone, fin }: Props) {
  // Léger retrait au tap (au lieu d'un simple changement d'opacité instantané) :
  // un des rares endroits où l'app doit "réagir" physiquement au toucher.
  const echelle = useRef(new Animated.Value(1)).current;

  function auContact() {
    Animated.spring(echelle, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }
  function auRelachement() {
    Animated.spring(echelle, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={disabled ? undefined : auContact}
      onPressOut={disabled ? undefined : auRelachement}
      disabled={disabled}
      style={[bloc && styles.bloc, style]}
    >
      <Animated.View
        style={[
          styles.base,
          variante === "primary" && styles.primary,
          variante === "secondary" && styles.secondary,
          variante === "ghost" && styles.ghost,
          bloc && styles.bloc,
          !!(icone || fin) && styles.rangee,
          disabled && styles.disabled,
          { transform: [{ scale: echelle }] },
        ]}
      >
        {icone}
        <Text
          style={[
            styles.label,
            variante === "primary" && styles.labelPrimary,
            variante === "ghost" && styles.labelGhost,
          ]}
        >
          {label}
        </Text>
        {fin && (
          <Text
            style={[
              styles.fin,
              variante === "primary" && styles.labelPrimary,
              variante === "ghost" && styles.labelGhost,
            ]}
          >
            {fin}
          </Text>
        )}
      </Animated.View>
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
  rangee: { flexDirection: "row", alignItems: "center", gap: space[2] },
  disabled: { opacity: 0.45 },
  label: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.text,
  },
  labelPrimary: { color: colors.bg },
  labelGhost: { fontFamily: fonts.bodyBold, color: colors.accent700, fontSize: 14 },
  fin: { fontFamily: fonts.bodyBold, fontSize: 12.5, marginLeft: "auto", opacity: 0.85 },
});
