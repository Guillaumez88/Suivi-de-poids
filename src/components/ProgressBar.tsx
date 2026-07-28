import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { colors, radius, space } from "@/theme/theme";

interface Props {
  pourcentage: number; // 0-100
  couleur?: string;
}

/** Barre de progression dont le remplissage s'anime en douceur vers la nouvelle valeur, au lieu de sauter instantanément. */
export function BarreProgression({ pourcentage, couleur = colors.accent2_500 }: Props) {
  const valeur = useRef(new Animated.Value(pourcentage)).current;

  useEffect(() => {
    Animated.timing(valeur, { toValue: pourcentage, duration: 450, useNativeDriver: false }).start();
  }, [pourcentage, valeur]);

  const largeur = valeur.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });

  return (
    <View style={styles.piste}>
      <Animated.View style={[styles.remplissage, { width: largeur, backgroundColor: couleur }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  piste: { height: 8, borderRadius: radius.pill, backgroundColor: colors.neutral200, marginTop: space[3], overflow: "hidden" },
  remplissage: { height: "100%", borderRadius: radius.pill },
});
