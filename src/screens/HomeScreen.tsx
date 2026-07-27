import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { Carte } from "@/components/Card";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius } from "@/theme/theme";
import { tendance, calculerMarqueursCalendrier } from "@/utils/businessRules";
import { RootStackParamList } from "@/navigation/types";

const FENETRES_TENDANCE = [7, 30, 90, 180, 365];

function dateISOAujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

function formaterJour(date: Date): string {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { utilisateur, pesees, cheatmeals, grignotages } = useAppData();

  const aujourdhui = dateISOAujourdhui();
  const peseesPourCalcul = useMemo(
    () => pesees.map((p) => ({ date: p.date, poidsKg: p.poidsKg })),
    [pesees]
  );

  const peseeDuJour = pesees.find((p) => p.date === aujourdhui) ?? null;
  const derniereMesure = pesees[pesees.length - 1] ?? null;
  const afficherPoidsAbsolu = utilisateur?.afficherPoidsAbsolu ?? true;

  const marqueurs = useMemo(() => calculerMarqueursCalendrier(peseesPourCalcul), [peseesPourCalcul]);
  const dernierMarqueur = marqueurs[marqueurs.length - 1];

  const tendances = FENETRES_TENDANCE.map((n) => ({
    n,
    valeur: tendance(peseesPourCalcul, aujourdhui, n),
  }));

  return (
    <EcranConteneur>
      <View style={styles.entete}>
        <View>
          <Text style={styles.dateDuJour}>{formaterJour(new Date())}</Text>
          <Text style={styles.titre}>Bien dormi ?</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 18 }}>🙂</Text>
        </View>
      </View>

      {derniereMesure && (
        <View style={styles.blocPoids}>
          <Text style={styles.poidsGrand}>
            {afficherPoidsAbsolu ? derniereMesure.poidsKg.toFixed(1) : "•••"}
            <Text style={styles.poidsUnite}> {afficherPoidsAbsolu ? (utilisateur?.unitePoids ?? "kg") : ""}</Text>
          </Text>
          {dernierMarqueur?.marqueur && (
            <View
              style={[
                styles.badgeMarqueur,
                { backgroundColor: dernierMarqueur.marqueur === "perte" ? colors.accent2_100 : colors.accent100 },
              ]}
            >
              <Text
                style={{
                  fontFamily: fonts.bodyBold,
                  fontSize: 12.5,
                  color: dernierMarqueur.marqueur === "perte" ? colors.accent2_800 : colors.accent800,
                }}
              >
                {dernierMarqueur.marqueur === "perte" ? "Sous " : "Passé "}
                {dernierMarqueur.palier} kg
              </Text>
            </View>
          )}
        </View>
      )}

      <Carte style={{ marginTop: space[4] }}>
        <Text style={styles.sousTitreCarte}>Tes tendances</Text>
        <View style={styles.rangeeTendances}>
          {tendances.map(({ n, valeur }) => (
            <View key={n} style={styles.chipTendance}>
              <Text style={styles.chipLabel}>{n === 365 ? "1 AN" : `${n} J`}</Text>
              <Text style={styles.chipValeur}>
                {valeur ? `${valeur.deltaKg > 0 ? "+" : ""}${valeur.deltaKg}` : "—"}
              </Text>
            </View>
          ))}
        </View>
      </Carte>

      <View style={styles.actions}>
        <Bouton
          label={peseeDuJour ? "Pesée déjà notée aujourd'hui" : "Pesée du matin"}
          onPress={() => navigation.navigate("PeseeMatinale")}
          bloc
          disabled={!!peseeDuJour}
        />
        <View style={styles.actionsRangee}>
          <Bouton label="Toilettes" onPress={() => navigation.navigate("PassageToilette")} variante="secondary" style={styles.actionMoitie} />
          <Bouton label="Un extra" onPress={() => navigation.navigate("Cheatmeal")} variante="secondary" style={styles.actionMoitie} />
        </View>
        <View style={styles.actionsRangee}>
          <Bouton label="Grignotage" onPress={() => navigation.navigate("Grignotage")} variante="secondary" style={styles.actionMoitie} />
          <Bouton label="Contexte" onPress={() => navigation.navigate("ContextePeriode")} variante="secondary" style={styles.actionMoitie} />
        </View>
      </View>

      <Text style={styles.pied}>
        {cheatmeals.length} extra(s) et {grignotages.length} grignotage(s) enregistrés au total.
      </Text>
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: space[3] },
  dateDuJour: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.5, textTransform: "uppercase", color: colors.neutral600 },
  titre: { fontFamily: fonts.heading, fontSize: 23, color: colors.text, marginTop: space[1] },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  blocPoids: { flexDirection: "row", alignItems: "baseline", gap: space[3], marginTop: space[5] },
  poidsGrand: { fontFamily: fonts.heading, fontSize: 52, color: colors.text },
  poidsUnite: { fontFamily: fonts.body, fontSize: 20 },
  badgeMarqueur: { borderRadius: radius.pill, paddingVertical: space[2], paddingHorizontal: space[3] },
  sousTitreCarte: { fontFamily: fonts.heading, fontSize: 15.5, color: colors.text, marginBottom: space[2] },
  rangeeTendances: { flexDirection: "row", gap: space[2] },
  chipTendance: { flex: 1, backgroundColor: colors.accent100, borderRadius: radius.md, padding: space[2], alignItems: "center" },
  chipLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.accent700 },
  chipValeur: { fontFamily: fonts.heading, fontSize: 15, color: colors.text, marginTop: space[1] },
  actions: { marginTop: space[6], gap: space[2] },
  actionsRangee: { flexDirection: "row", gap: space[2] },
  actionMoitie: { flex: 1 },
  pied: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral600, textAlign: "center", marginTop: space[5] },
});
