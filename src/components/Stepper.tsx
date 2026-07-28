import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { colors, fonts, radius } from "@/theme/theme";

const DELAI_AVANT_REPETITION_MS = 400;
const INTERVALLE_REPETITION_MS = 80;

/** Incrémente au tap, puis répète en accéléré tant que l'appui est maintenu. */
function useAppuiRepete(action: () => void, actif: boolean) {
  const delai = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalle = useRef<ReturnType<typeof setInterval> | null>(null);

  function arreter() {
    if (delai.current) clearTimeout(delai.current);
    if (intervalle.current) clearInterval(intervalle.current);
    delai.current = null;
    intervalle.current = null;
  }

  useEffect(() => arreter, []);

  if (!actif) {
    return { onPress: action };
  }
  return {
    onPressIn: () => {
      action();
      delai.current = setTimeout(() => {
        intervalle.current = setInterval(action, INTERVALLE_REPETITION_MS);
      }, DELAI_AVANT_REPETITION_MS);
    },
    onPressOut: arreter,
  };
}

interface Props {
  valeur: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  pas?: number;
  /** "normal" : gros cercles (52px), pensé pour un réglage central d'écran.
   * "compact" : petits cercles (34px), pensé pour une ligne de réglage. */
  taille?: "normal" | "compact";
  /** Maintenir l'appui répète l'incrément en accéléré. À désactiver pour une
   * plage courte (ex. 0-7) où un seul tap à la fois suffit amplement. */
  repeter?: boolean;
  formatValeur?: (v: number) => string;
  /** Légende sous la valeur (ex. "KG"), variante "normal" uniquement. */
  unite?: string;
}

export function Stepper({
  valeur,
  onChange,
  min = -Infinity,
  max = Infinity,
  pas = 1,
  taille = "normal",
  repeter = true,
  formatValeur,
  unite,
}: Props) {
  const compact = taille === "compact";
  const appuiMoins = useAppuiRepete(() => onChange(Math.max(min, arrondir(valeur - pas))), repeter);
  const appuiPlus = useAppuiRepete(() => onChange(Math.min(max, arrondir(valeur + pas))), repeter);
  const tailleCercle = compact ? 34 : 52;
  const tailleIcone = compact ? 16 : 24;

  return (
    <View style={compact ? styles.rangeeCompacte : styles.rangeeNormale}>
      <Pressable
        style={[styles.rond, { width: tailleCercle, height: tailleCercle, backgroundColor: colors.bg }]}
        {...appuiMoins}
      >
        <Minus size={tailleIcone} color={colors.accent700} strokeWidth={3} />
      </Pressable>
      <View style={compact ? undefined : styles.blocValeur}>
        <Text style={compact ? styles.valeurCompacte : styles.valeurNormale}>
          {formatValeur ? formatValeur(valeur) : valeur}
        </Text>
        {!compact && unite && <Text style={styles.unite}>{unite}</Text>}
      </View>
      <Pressable
        style={[styles.rond, { width: tailleCercle, height: tailleCercle, backgroundColor: colors.accent }]}
        {...appuiPlus}
      >
        <Plus size={tailleIcone} color={compact ? colors.bg : colors.bg} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

function arrondir(n: number): number {
  return Math.round(n * 10) / 10;
}

const styles = StyleSheet.create({
  rangeeNormale: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rangeeCompacte: { flexDirection: "row", alignItems: "center", gap: 12 },
  rond: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  blocValeur: { alignItems: "center" },
  valeurNormale: { fontFamily: fonts.heading, fontSize: 52, color: colors.text, letterSpacing: -0.5 },
  valeurCompacte: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, minWidth: 18, textAlign: "center" },
  unite: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.5, color: colors.neutral600, marginTop: 2 },
});
