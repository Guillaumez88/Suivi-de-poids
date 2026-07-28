import React, { ReactNode, useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { colors, radius } from "@/theme/theme";

/** Pastille d'icône des écrans de confirmation (Grignotage, Verre d'eau...), avec une légère mise en scène à l'apparition. */
export function PastilleConfirmation({ children }: { children: ReactNode }) {
  const echelle = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(echelle, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
  }, [echelle]);

  return <Animated.View style={[styles.pastille, { transform: [{ scale: echelle }] }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  pastille: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.accent2_100,
    alignItems: "center",
    justifyContent: "center",
  },
});
