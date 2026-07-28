import React from "react";
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { colors, fonts, space, radius } from "@/theme/theme";

interface Option<T extends string | number> {
  valeur: T;
  label: string;
}

interface Props<T extends string | number> {
  options: readonly Option<T>[];
  valeur: T;
  onChange: (v: T) => void;
  /** "bloc" : options à largeur égale, pensé pour occuper toute la largeur
   * (dans une Carte). "compact" : pilules à largeur naturelle, pensé pour
   * une ligne réglage/en-tête. */
  variante?: "bloc" | "compact";
  /** Fond des options inactives en variante "bloc" — `colors.bg` si le
   * contrôle est déjà posé sur une Carte (fond `colors.surface`), sinon
   * `colors.surface` (défaut) si posé directement sur le fond d'écran. */
  fondInactif?: string;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string | number>({
  options,
  valeur,
  onChange,
  variante = "bloc",
  fondInactif = colors.surface,
  style,
}: Props<T>) {
  const compact = variante === "compact";
  return (
    <View style={[compact ? styles.rangeeCompacte : styles.rangeeBloc, style]}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable
            key={o.valeur}
            onPress={() => onChange(o.valeur)}
            style={[
              compact ? styles.optionCompacte : styles.optionBloc,
              !compact && { backgroundColor: actif ? colors.accent : fondInactif },
              compact && actif && styles.optionCompacteActive,
            ]}
            hitSlop={compact ? 6 : undefined}
          >
            <Text
              style={[
                compact ? styles.texteCompact : styles.texteBloc,
                actif && (compact ? styles.texteCompactActif : styles.texteBlocActif),
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rangeeBloc: { flexDirection: "row", gap: space[2] },
  optionBloc: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space[3],
    borderRadius: radius.pill,
  },
  texteBloc: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.neutral700, textAlign: "center" },
  texteBlocActif: { fontFamily: fonts.heading, color: colors.bg },

  rangeeCompacte: { flexDirection: "row", gap: 5 },
  optionCompacte: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
  },
  optionCompacteActive: { backgroundColor: colors.accent },
  texteCompact: { fontFamily: fonts.body, fontSize: 13, fontWeight: "600", color: colors.neutral700 },
  texteCompactActif: { color: colors.bg, fontWeight: "700" },
});
