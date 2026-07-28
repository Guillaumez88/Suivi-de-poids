import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { IconeContexte } from "@/components/icons";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius, iconStrokeWidth } from "@/theme/theme";
import { calculerMarqueursCalendrier } from "@/utils/businessRules";
import { RootStackParamList } from "@/navigation/types";

function dateISOAujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

// Couleurs hors système accent/accent2 (jamais "bon/mauvais" par défaut),
// utilisées ici à la demande explicite de l'utilisateur pour ces deux
// marqueurs précis du calendrier.
const ROUGE_KILO_PLUS = "#c2483d";
const BLEU_SPORT = "#5c7f9c";

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
  const { pesees, cheatmeals, grignotages, contextes, seancesSport } = useAppData();
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
      sport: boolean;
      marqueur: "perte" | "prise" | null;
    } | null> = new Array(decalage).fill(null);

    for (let jour = 1; jour <= nbJours; jour++) {
      const date = `${annee}-${pad(mois + 1)}-${pad(jour)}`;
      jours.push({
        date,
        numero: jour,
        cheatmeal: cheatmeals.some((c) => c.dateHeure.startsWith(date)),
        grignotage: grignotages.some((g) => g.dateHeure.startsWith(date)),
        sport: seancesSport.some((s) => s.dateHeure.startsWith(date)),
        marqueur: marqueursParDate.get(date) ?? null,
      });
    }
    // Complète la dernière semaine à 7 cases : sans ça, la rangée finale
    // n'a que quelques cellules qui s'étirent (flex:1) pour combler la
    // largeur de la rangée et paraissent plus grandes que les autres.
    while (jours.length % 7 !== 0) jours.push(null);

    return jours;
  }, [moisAffiche, cheatmeals, grignotages, seancesSport, marqueursParDate]);

  const semaines = useMemo(() => {
    const resultat: (typeof joursDuMois)[] = [];
    for (let i = 0; i < joursDuMois.length; i += 7) {
      resultat.push(joursDuMois.slice(i, i + 7));
    }
    return resultat;
  }, [joursDuMois]);

  function changerMois(delta: number) {
    setMoisAffiche(({ annee, mois }) => {
      const d = new Date(annee, mois + delta, 1);
      return { annee: d.getFullYear(), mois: d.getMonth() };
    });
  }

  const prefixeMois = `${moisAffiche.annee}-${pad(moisAffiche.mois + 1)}`;
  const resume = useMemo(() => {
    const peseesDuMois = peseesPourCalcul.filter((p) => p.date.startsWith(prefixeMois));
    if (peseesDuMois.length < 2) return null;
    const delta = Math.round((peseesDuMois[peseesDuMois.length - 1].poidsKg - peseesDuMois[0].poidsKg) * 10) / 10;
    const nbExtras = cheatmeals.filter((c) => c.dateHeure.startsWith(prefixeMois)).length;
    const nbVoyages = contextes.filter((c) => c.type === "voyage" && c.dateDebut.startsWith(prefixeMois)).length;
    return { delta, nbExtras, nbVoyages };
  }, [peseesPourCalcul, cheatmeals, contextes, prefixeMois]);

  const aujourdhui = dateISOAujourdhui();
  const moisAfficheEstMoisCourant = prefixeMois === aujourdhui.slice(0, 7);
  const contexteEnCours = moisAfficheEstMoisCourant
    ? contextes.find((c) => c.dateDebut <= aujourdhui && (!c.dateFin || c.dateFin >= aujourdhui))
    : undefined;

  return (
    <EcranConteneur>
      <View style={styles.enteteMois}>
        <Pressable onPress={() => changerMois(-1)} hitSlop={8}>
          <ChevronLeft color={colors.neutral700} size={22} strokeWidth={iconStrokeWidth} />
        </Pressable>
        <Text style={styles.titreMois}>
          {MOIS_LABELS[moisAffiche.mois]} {moisAffiche.annee}
        </Text>
        <Pressable onPress={() => changerMois(1)} hitSlop={8}>
          <ChevronRight color={colors.neutral400} size={22} strokeWidth={iconStrokeWidth} />
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
        {semaines.map((semaine, indexSemaine) => (
          <View key={indexSemaine} style={styles.rangeeSemaine}>
            {semaine.map((jour, i) => {
              if (!jour) return <View key={`vide-${indexSemaine}-${i}`} style={styles.case} />;
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
                    {jour.sport && <View style={[styles.point, { backgroundColor: BLEU_SPORT }]} />}
                    {jour.marqueur === "perte" && <View style={[styles.marqueurBarre, { backgroundColor: colors.accent2_500 }]} />}
                    {jour.marqueur === "prise" && <Plus size={10} color={ROUGE_KILO_PLUS} strokeWidth={4} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.legende}>
        <LegendeItem couleur={colors.accent} label="un extra" />
        <LegendeItem couleur={colors.accent400} label="grignotage" anneau />
        <LegendeItem couleur={BLEU_SPORT} label="sport" />
        <LegendeItem couleur={colors.accent2_500} label="kilo en moins" barre />
        <LegendeItem couleur={ROUGE_KILO_PLUS} label="kilo en plus" plus />
      </View>

      {resume && (
        <Carte tinted="accent2" style={{ marginTop: space[4] }}>
          <Text style={styles.titreResume}>Ce mois-ci, en douceur</Text>
          <Text style={styles.texteResume}>
            {Math.abs(resume.delta)} kg de {resume.delta <= 0 ? "moins" : "plus"} qu'au 1er {MOIS_LABELS[moisAffiche.mois].toLowerCase()}
            {resume.nbExtras > 0 ? ` — ${resume.nbExtras} extra${resume.nbExtras > 1 ? "s" : ""}` : ""}
            {resume.nbVoyages > 0 ? `, ${resume.nbVoyages} période${resume.nbVoyages > 1 ? "s" : ""} de voyage` : ""}.
          </Text>
        </Carte>
      )}

      {contexteEnCours && (
        <Carte style={{ marginTop: space[3], flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <View style={styles.puceContexte}>
            <IconeContexte size={19} color={colors.accent700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contexteTitre}>
              {contexteEnCours.note ?? contexteEnCours.type} · {contexteEnCours.dateDebut}
              {contexteEnCours.dateFin ? ` → ${contexteEnCours.dateFin}` : ""}
            </Text>
            <Text style={styles.contexteSousTitre}>Contexte en cours</Text>
          </View>
        </Carte>
      )}
    </EcranConteneur>
  );
}

function LegendeItem({
  couleur,
  label,
  anneau,
  barre,
  plus,
}: {
  couleur: string;
  label: string;
  anneau?: boolean;
  barre?: boolean;
  plus?: boolean;
}) {
  return (
    <View style={styles.legendeItem}>
      {plus ? (
        <Plus size={11} color={couleur} strokeWidth={4} />
      ) : barre ? (
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
  titreMois: { fontFamily: fonts.heading, fontSize: 23, color: colors.text },
  ligneEntetes: { flexDirection: "row", marginTop: space[6], paddingHorizontal: 2 },
  entetesJour: { flex: 1, textAlign: "center", fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neutral600 },
  grille: { gap: space[2], marginTop: space[3] },
  rangeeSemaine: { flexDirection: "row", gap: space[2] },
  case: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  caseNumero: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  marques: { flexDirection: "row", gap: 3, marginTop: 5, height: 8, alignItems: "center" },
  point: { width: 6, height: 6, borderRadius: 999 },
  anneau: { width: 8, height: 8, borderRadius: 999, borderWidth: 1.5 },
  marqueurBarre: { width: 11, height: 3, borderRadius: 999 },
  legende: { flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[5] },
  legendeItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendeBarre: { width: 12, height: 3, borderRadius: 999 },
  legendeTexte: { fontFamily: fonts.body, fontSize: 11.5, color: colors.neutral700 },
  titreResume: { fontFamily: fonts.heading, fontSize: 16, color: colors.accent2_900 },
  texteResume: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: colors.accent2_800, marginTop: space[1] },
  puceContexte: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  contexteTitre: { fontFamily: fonts.body, fontSize: 14, fontWeight: "600", color: colors.text },
  contexteSousTitre: { fontFamily: fonts.body, fontSize: 12.5, color: colors.neutral700, marginTop: 2 },
});
