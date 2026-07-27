import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space } from "@/theme/theme";
import { tendance, moyenneMobile } from "@/utils/businessRules";

const FENETRES = [
  { n: 7, label: "7 derniers jours" },
  { n: 30, label: "30 derniers jours" },
  { n: 90, label: "90 derniers jours" },
  { n: 180, label: "180 derniers jours" },
  { n: 365, label: "365 derniers jours" },
];

function dateISOAujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TrendsScreen() {
  const { pesees } = useAppData();
  const aujourdhui = dateISOAujourdhui();
  const peseesPourCalcul = useMemo(
    () => pesees.map((p) => ({ date: p.date, poidsKg: p.poidsKg })),
    [pesees]
  );
  const moyenneActuelle = moyenneMobile(peseesPourCalcul, aujourdhui, 7);

  return (
    <EcranConteneur>
      <Text style={styles.titre}>Ce mois-ci, en douceur</Text>
      <Text style={styles.sousTitre}>
        La moyenne mobile 7 jours lisse le bruit quotidien : c'est elle qui compte, pas le
        chiffre du jour.
      </Text>

      <Carte style={{ marginTop: space[5] }}>
        <Text style={styles.label}>Moyenne mobile (7 jours)</Text>
        <Text style={styles.valeurMoyenne}>
          {moyenneActuelle !== null ? `${moyenneActuelle.toFixed(1)} kg` : "Pas encore assez de données"}
        </Text>
      </Carte>

      <View style={{ marginTop: space[5], gap: space[2] }}>
        {FENETRES.map(({ n, label }) => {
          const t = tendance(peseesPourCalcul, aujourdhui, n);
          return (
            <Carte key={n} style={styles.ligneTendance}>
              <Text style={styles.labelLigne}>{label}</Text>
              {t ? (
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.valeurLigne, t.deltaKg < 0 ? styles.negatif : styles.positif]}>
                    {t.deltaKg > 0 ? "+" : ""}
                    {t.deltaKg} kg
                  </Text>
                  <Text style={styles.couverture}>{t.joursCouverts} jour(s) de données couverts</Text>
                </View>
              ) : (
                <Text style={styles.valeurAbsente}>Pas assez d'historique</Text>
              )}
            </Carte>
          );
        })}
      </View>
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, marginTop: space[4] },
  sousTitre: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral700, marginTop: space[2] },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.neutral700 },
  valeurMoyenne: { fontFamily: fonts.heading, fontSize: 26, color: colors.text, marginTop: space[1] },
  ligneTendance: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  labelLigne: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  valeurLigne: { fontFamily: fonts.heading, fontSize: 17 },
  negatif: { color: colors.accent2_700 },
  positif: { color: colors.accent700 },
  couverture: { fontFamily: fonts.body, fontSize: 10.5, color: colors.neutral600, marginTop: 2 },
  valeurAbsente: { fontFamily: fonts.body, fontSize: 12.5, color: colors.neutral600 },
});
