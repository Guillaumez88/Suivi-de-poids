import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { User, ArrowDown, ArrowUp, Clock } from "lucide-react-native";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { Carte } from "@/components/Card";
import { CourbeDePoids } from "@/components/WeightCurve";
import { IconeToilettes, IconeExtra, IconeGrignotage, IconeContexte } from "@/components/icons";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius, iconStrokeWidth } from "@/theme/theme";
import {
  tendance,
  calculerMarqueursCalendrier,
  calculerIMC,
  deltaDepuisPeseePrecedente,
  serieMoyenneMobile,
  ajouterJours,
} from "@/utils/businessRules";
import { RootStackParamList } from "@/navigation/types";

const FENETRES_TENDANCE = [7, 30, 90, 180, 365];
const PERIODES_COURBE = [
  { jours: 30, label: "30 j" },
  { jours: 90, label: "90 j" },
  { jours: 365, label: "1 an" },
] as const;

const JOURS_SEMAINE = ["L", "M", "M", "J", "V", "S", "D"];

function dateISOAujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

function formaterJour(date: Date): string {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function formaterDateCourte(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { utilisateur, pesees, cheatmeals, grignotages } = useAppData();
  const [periodeCourbe, setPeriodeCourbe] = useState<(typeof PERIODES_COURBE)[number]["jours"]>(30);

  const aujourdhui = dateISOAujourdhui();
  const peseesPourCalcul = useMemo(
    () => pesees.map((p) => ({ date: p.date, poidsKg: p.poidsKg })),
    [pesees]
  );

  const peseeDuJour = pesees.find((p) => p.date === aujourdhui) ?? null;
  const derniereMesure = pesees[pesees.length - 1] ?? null;
  const afficherPoidsAbsolu = utilisateur?.afficherPoidsAbsolu ?? true;

  const marqueurs = useMemo(() => calculerMarqueursCalendrier(peseesPourCalcul), [peseesPourCalcul]);

  const tendances = FENETRES_TENDANCE.map((n) => ({
    n,
    valeur: tendance(peseesPourCalcul, aujourdhui, n),
  }));

  const deltaG = derniereMesure
    ? Math.round(Math.abs(deltaDepuisPeseePrecedente(peseesPourCalcul, derniereMesure.date) ?? 0) * 1000)
    : 0;
  const deltaDirection = derniereMesure
    ? deltaDepuisPeseePrecedente(peseesPourCalcul, derniereMesure.date)
    : null;
  const imc = derniereMesure ? calculerIMC(derniereMesure.poidsKg, utilisateur?.tailleCm) : null;

  const serieCourbe = useMemo(
    () => serieMoyenneMobile(peseesPourCalcul, aujourdhui, periodeCourbe),
    [peseesPourCalcul, aujourdhui, periodeCourbe]
  );

  const semaine = useMemo(() => {
    const jourSemaineISO = new Date(`${aujourdhui}T00:00:00Z`).getUTCDay(); // 0=dimanche
    const decalageLundi = jourSemaineISO === 0 ? 6 : jourSemaineISO - 1;
    const lundi = ajouterJours(aujourdhui, -decalageLundi);
    return Array.from({ length: 7 }, (_, i) => {
      const date = ajouterJours(lundi, i);
      const aUnExtra = cheatmeals.some((c) => c.dateHeure.slice(0, 10) === date);
      const aUnGrignotage = grignotages.some((g) => g.dateHeure.slice(0, 10) === date);
      const marqueurJour = marqueurs.find((m) => m.date === date)?.marqueur ?? null;
      return {
        date,
        lettre: JOURS_SEMAINE[i],
        numero: Number(date.slice(8, 10)),
        estAujourdhui: date === aujourdhui,
        aUnExtra,
        aUnGrignotage,
        marqueurJour,
      };
    });
  }, [aujourdhui, cheatmeals, grignotages, marqueurs]);

  return (
    <EcranConteneur>
      <View style={styles.entete}>
        <View>
          <Text style={styles.dateDuJour}>{formaterJour(new Date())}</Text>
          <Text style={styles.titre}>Bien dormi ?</Text>
        </View>
        <View style={styles.avatar}>
          <User color={colors.text} size={21} strokeWidth={iconStrokeWidth} />
        </View>
      </View>

      {derniereMesure && (
        <View style={styles.blocPoids}>
          <Text style={styles.poidsGrand}>
            {afficherPoidsAbsolu ? derniereMesure.poidsKg.toFixed(1) : "•••"}
            <Text style={styles.poidsUnite}> {afficherPoidsAbsolu ? (utilisateur?.unitePoids ?? "kg") : ""}</Text>
          </Text>
          <View style={styles.badgesColonne}>
            {deltaDirection !== null && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: deltaDirection <= 0 ? colors.accent2_100 : colors.accent100 },
                ]}
              >
                {deltaDirection <= 0 ? (
                  <ArrowDown size={13} color={colors.accent2_800} strokeWidth={3} />
                ) : (
                  <ArrowUp size={13} color={colors.accent800} strokeWidth={3} />
                )}
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 12.5,
                    color: deltaDirection <= 0 ? colors.accent2_800 : colors.accent800,
                  }}
                >
                  {deltaG} g
                </Text>
              </View>
            )}
            {imc !== null && (
              <View style={[styles.badge, { backgroundColor: colors.accent100 }]}>
                <View style={styles.pucePleine} />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.accent800 }}>
                  IMC {imc.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <Carte style={{ marginTop: space[3] }}>
        <View style={styles.enteteCourbe}>
          <Text style={styles.sousTitreCarte}>Ces {periodeCourbe === 365 ? "365" : periodeCourbe} jours</Text>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {PERIODES_COURBE.map((p) => (
              <Text
                key={p.jours}
                onPress={() => setPeriodeCourbe(p.jours)}
                style={[styles.ongletPeriode, periodeCourbe === p.jours && styles.ongletPeriodeActif]}
              >
                {p.label}
              </Text>
            ))}
          </View>
        </View>
        <CourbeDePoids points={serieCourbe} />
        {serieCourbe.length > 0 && (
          <View style={styles.axeCourbe}>
            <Text style={styles.axeTexte}>{formaterDateCourte(serieCourbe[0].date)}</Text>
            <Text style={styles.axeTexte}>Moyenne 7 jours</Text>
            <Text style={styles.axeTexte}>aujourd'hui</Text>
          </View>
        )}
      </Carte>

      <Carte style={{ marginTop: space[3] }}>
        <Text style={styles.sousTitreCarte}>Tes tendances</Text>
        <View style={styles.rangeeTendances}>
          {tendances.map(({ n, valeur }) => (
            <View
              key={n}
              style={[styles.chipTendance, { backgroundColor: valeur ? colors.accent100 : colors.neutral200 }]}
            >
              <Text style={[styles.chipLabel, { color: valeur ? colors.accent700 : colors.neutral700 }]}>
                {n === 365 ? "1 AN" : `${n} J`}
              </Text>
              <Text style={styles.chipValeur}>
                {valeur ? `${valeur.deltaKg > 0 ? "+" : ""}${valeur.deltaKg}` : "—"}
              </Text>
            </View>
          ))}
        </View>
      </Carte>

      <View style={styles.enteteSemaine}>
        <Text style={styles.sousTitreCarte}>Ta semaine</Text>
        <View style={styles.legendeSemaine}>
          <View style={styles.legendeItem}>
            <View style={[styles.puceLegende, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendeTexte}>extra</Text>
          </View>
          <View style={styles.legendeItem}>
            <View style={[styles.anneauLegende, { borderColor: colors.accent400 }]} />
            <Text style={styles.legendeTexte}>grignotage</Text>
          </View>
          <View style={styles.legendeItem}>
            <View style={[styles.barreLegende, { backgroundColor: colors.accent2_500 }]} />
            <Text style={styles.legendeTexte}>kilo</Text>
          </View>
        </View>
      </View>
      <View style={styles.rangeeSemaine}>
        {semaine.map((j) => (
          <View
            key={j.date}
            style={[styles.jourSemaine, j.estAujourdhui && { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.jourLettre, j.estAujourdhui && { color: colors.bg }]}>{j.lettre}</Text>
            <Text style={[styles.jourNumero, j.estAujourdhui && { color: colors.bg }]}>{j.numero}</Text>
            <View style={styles.jourMarqueurs}>
              {j.aUnExtra && <View style={[styles.puceLegende, { backgroundColor: colors.accent }]} />}
              {j.aUnGrignotage && <View style={[styles.anneauLegende, { borderColor: colors.accent400 }]} />}
              {j.marqueurJour && (
                <View
                  style={[
                    styles.barreLegende,
                    { backgroundColor: j.marqueurJour === "perte" ? colors.accent2_500 : colors.accent400 },
                  ]}
                />
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Bouton
          label={peseeDuJour ? "Pesée déjà notée aujourd'hui" : "Pesée du matin"}
          onPress={() => navigation.navigate("PeseeMatinale")}
          bloc
          disabled={!!peseeDuJour}
          icone={<Clock size={20} color={colors.bg} strokeWidth={iconStrokeWidth} />}
          fin={utilisateur ? `jusqu'à ${utilisateur.fenetreMatinFin}` : undefined}
        />
        <View style={styles.actionsRangee}>
          <Bouton
            label="Toilettes"
            onPress={() => navigation.navigate("PassageToilette")}
            variante="secondary"
            style={styles.actionMoitie}
            icone={<IconeToilettes size={19} color={colors.accent700} />}
          />
          <Bouton
            label="Un extra"
            onPress={() => navigation.navigate("Cheatmeal")}
            variante="secondary"
            style={styles.actionMoitie}
            icone={<IconeExtra size={19} color={colors.accent700} />}
          />
        </View>
        <View style={styles.actionsRangee}>
          <Bouton
            label="Grignotage"
            onPress={() => navigation.navigate("Grignotage")}
            variante="secondary"
            style={styles.actionMoitie}
            icone={<IconeGrignotage size={19} color={colors.accent700} />}
          />
          <Bouton
            label="Contexte"
            onPress={() => navigation.navigate("ContextePeriode")}
            variante="secondary"
            style={styles.actionMoitie}
            icone={<IconeContexte size={19} color={colors.accent700} />}
          />
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
  badgesColonne: { gap: space[1] },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingVertical: space[1], paddingHorizontal: space[3] },
  pucePleine: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.accent500 },
  enteteCourbe: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space[2] },
  ongletPeriode: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.neutral700,
    paddingVertical: 4,
    paddingHorizontal: space[2],
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  ongletPeriodeActif: { backgroundColor: colors.accent, color: colors.bg },
  axeCourbe: { flexDirection: "row", justifyContent: "space-between", marginTop: space[1] },
  axeTexte: { fontFamily: fonts.body, fontSize: 11, color: colors.neutral600 },
  sousTitreCarte: { fontFamily: fonts.heading, fontSize: 15.5, color: colors.text },
  rangeeTendances: { flexDirection: "row", gap: space[2], marginTop: space[2] },
  chipTendance: { flex: 1, borderRadius: radius.md, padding: space[2], alignItems: "center" },
  chipLabel: { fontFamily: fonts.bodyBold, fontSize: 10 },
  chipValeur: { fontFamily: fonts.heading, fontSize: 15, color: colors.text, marginTop: space[1] },
  enteteSemaine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space[5] },
  legendeSemaine: { flexDirection: "row", gap: space[2] },
  legendeItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendeTexte: { fontFamily: fonts.body, fontSize: 10.5, color: colors.neutral600 },
  puceLegende: { width: 7, height: 7, borderRadius: radius.pill },
  anneauLegende: { width: 7, height: 7, borderRadius: radius.pill, borderWidth: 2 },
  barreLegende: { width: 12, height: 3, borderRadius: radius.pill },
  rangeeSemaine: { flexDirection: "row", gap: 5, marginTop: space[2] },
  jourSemaine: { flex: 1, alignItems: "center", gap: 5, paddingVertical: space[2], borderRadius: radius.md },
  jourLettre: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neutral700, opacity: 0.8 },
  jourNumero: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  jourMarqueurs: { height: 20, alignItems: "center", justifyContent: "center", gap: 3 },
  actions: { marginTop: space[6], gap: space[2] },
  actionsRangee: { flexDirection: "row", gap: space[2] },
  actionMoitie: { flex: 1 },
  pied: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral600, textAlign: "center", marginTop: space[5] },
});
