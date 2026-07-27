import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { EcranConteneur } from "@/components/ScreenContainer";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius } from "@/theme/theme";
import { calculerMarqueursCalendrier } from "@/utils/businessRules";
import { RootStackParamList } from "@/navigation/types";

const JOURS_SEMAINE = ["L", "M", "M", "J", "V", "S", "D"];
const MOIS_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function MonthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { pesees, cheatmeals, grignotages, contextes } = useAppData();
  const [moisAffiche, setMoisAffiche] = useState(() => {
    const d = new Date();
    return { annee: d.getFullYear(), mois: d.getMonth() }; // mois : 0-11
  });

  const peseesPourCalcul = useMemo(
    () => pesees.map((p) => ({ date: p.date, poidsKg: p.poidsKg })),
    [pesees]
  );
  const marqueursParDate = useMemo(() => {
    const map = new Map<string, "perte" | "prise" | null>();
    for (const m of calculerMarqueursCalendrier(peseesPourCalcul)) map.set(m.date, m.marqueur);
    return map;
  }, [peseesPourCalcul]);

  const joursDuMois = useMemo(() => {
    const { annee, mois } = moisAffiche;
    const premierJour = new Date(annee, mois, 1);
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    // décalage pour un affichage Lundi -> Dimanche
    const decalage = (premierJour.getDay() + 6) % 7;

    const jours: Array<{
      date: string;
      numero: number;
      cheatmeal: boolean;
      grignotage: boolean;
      marqueur: "perte" | "prise" | null;
      contexte: boolean;
    } | null> = new Array(decalage).fill(null);

    for (let jour = 1; jour <= nbJours; jour++) {
      const date = `${annee}-${pad(mois + 1)}-${pad(jour)}`;
      const contexteCeJour = contextes.some(
        (c) => c.dateDebut <= date && (!c.dateFin || c.dateFin >= date)
      );
      jours.push({
        date,
        numero: jour,
        cheatmeal: cheatmeals.some((c) => c.dateHeure.startsWith(date)),
        grignotage: grignotages.some((g) => g.dateHeure.startsWith(date)),
        marqueur: marqueursParDate.get(date) ?? null,
        contexte: contexteCeJour,
      });
    }
    return jours;
  }, [moisAffiche, cheatmeals, grignotages, contextes, marqueursParDate]);

  function changerMois(delta: number) {
    setMoisAffiche(({ annee, mois }) => {
      const d = new Date(annee, mois + delta, 1);
      return { annee: d.getFullYear(), mois: d.getMonth() };
    });
  }

  return (
    <EcranConteneur>
      <View style={styles.enteteMois}>
        <Pressable onPress={() => changerMois(-1)}>
          <Text style={styles.fleche}>←</Text>
        </Pressable>
        <Text style={styles.titreMois}>
          {MOIS_LABELS[moisAffiche.mois]} {moisAffiche.annee}
        </Text>
        <Pressable onPress={() => changerMois(1)}>
          <Text style={styles.fleche}>→</Text>
        </Pressable>
      </View>

      <View style={styles.ligneEntetes}>
        {JOURS_SEMAINE.map((j, i) => (
          <Text key={`${j}-${i}`} style={styles.entetesJour}>
            {j}
          </Text>
        ))}
      </View>

      <View style={styles.grille}>
        {joursDuMois.map((jour, i) => {
          if (!jour) return <View key={`vide-${i}`} style={styles.case} />;
          const couleurFond =
            jour.marqueur === "perte"
              ? colors.accent2_100
              : jour.marqueur === "prise"
              ? colors.accent100
              : colors.surface;
          return (
            <Pressable
              key={jour.date}
              style={[styles.case, { backgroundColor: couleurFond }]}
              onPress={() => navigation.navigate("DetailJournee", { date: jour.date })}
            >
              <Text style={styles.caseNumero}>{jour.numero}</Text>
              <View style={styles.marques}>
                {jour.cheatmeal && <View style={[styles.point, { backgroundColor: colors.accent }]} />}
                {jour.grignotage && <View style={[styles.anneau, { borderColor: colors.accent400 }]} />}
                {jour.contexte && <View style={[styles.point, { backgroundColor: colors.neutral400 }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legende}>
        <LegendeItem couleur={colors.accent} label="un extra" />
        <LegendeItem couleur={colors.accent400} label="grignotage" anneau />
        <LegendeItem couleur={colors.accent2_500} label="kilo en moins" barre />
        <LegendeItem couleur={colors.accent400} label="kilo en plus" barre />
        <LegendeItem couleur={colors.neutral400} label="contexte" />
      </View>
    </EcranConteneur>
  );
}

function LegendeItem({
  couleur,
  label,
  anneau,
  barre,
}: {
  couleur: string;
  label: string;
  anneau?: boolean;
  barre?: boolean;
}) {
  return (
    <View style={styles.legendeItem}>
      {barre ? (
        <View style={[styles.legendeBarre, { backgroundColor: couleur }]} />
      ) : (
        <View
          style={[
            styles.point,
            { backgroundColor: anneau ? "transparent" : couleur },
            anneau && { borderWidth: 2, borderColor: couleur },
          ]}
        />
      )}
      <Text style={styles.legendeTexte}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  enteteMois: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space[3] },
  fleche: { fontSize: 20, color: colors.neutral700, paddingHorizontal: space[3] },
  titreMois: { fontFamily: fonts.heading, fontSize: 21, color: colors.text },
  ligneEntetes: { flexDirection: "row", marginTop: space[5] },
  entetesJour: { flex: 1, textAlign: "center", fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neutral600 },
  grille: { flexDirection: "row", flexWrap: "wrap", marginTop: space[2] },
  case: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  caseNumero: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  marques: { flexDirection: "row", gap: 3, marginTop: 3 },
  point: { width: 6, height: 6, borderRadius: 999 },
  anneau: { width: 8, height: 8, borderRadius: 999, borderWidth: 1.5 },
  legende: { flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[5] },
  legendeItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendeBarre: { width: 12, height: 3, borderRadius: 999 },
  legendeTexte: { fontFamily: fonts.body, fontSize: 11.5, color: colors.neutral700 },
});
