import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowDown, ArrowUp, Clock, Dumbbell, GlassWater } from "lucide-react-native";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { Carte } from "@/components/Card";
import { SegmentedControl } from "@/components/SegmentedControl";
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
  dateISOAujourdhui,
  estLeJour,
  construireSemaine,
} from "@/utils/businessRules";
import { RootStackParamList } from "@/navigation/types";

const FENETRES_TENDANCE = [7, 30, 90, 180, 365];
const PERIODES_COURBE = [
  { valeur: 30, label: "30 j" },
  { valeur: 90, label: "90 j" },
  { valeur: 365, label: "1 an" },
] as const;

const JOURS_SEMAINE = ["L", "M", "M", "J", "V", "S", "D"];

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

/** Temps écoulé depuis un horodatage ISO, formaté "il y a 3h20" / "il y a 12 min". */
function depuisTexte(dateHeureISO: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(dateHeureISO).getTime()) / 60000));
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return heures === 0 ? `il y a ${reste} min` : `il y a ${heures}h${reste.toString().padStart(2, "0")}`;
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { utilisateur, pesees, passages, cheatmeals, grignotages, seancesSport, consommationsEau } = useAppData();
  const [periodeCourbe, setPeriodeCourbe] = useState<(typeof PERIODES_COURBE)[number]["valeur"]>(30);

  const aujourdhui = dateISOAujourdhui();
  const peseesPourCalcul = useMemo(
    () => pesees.map((p) => ({ date: p.date, poidsKg: p.poidsKg })),
    [pesees]
  );

  const peseeDuJour = pesees.find((p) => p.date === aujourdhui) ?? null;
  const aUnPassageAujourdhui = passages.some((p) => estLeJour(p.dateHeure, aujourdhui));
  const dernierPassage = passages[passages.length - 1] ?? null;
  const derniereMesure = pesees[pesees.length - 1] ?? null;
  const afficherPoidsAbsolu = utilisateur?.afficherPoidsAbsolu ?? true;

  const marqueurs = useMemo(() => calculerMarqueursCalendrier(peseesPourCalcul), [peseesPourCalcul]);

  const tendances = useMemo(
    () => FENETRES_TENDANCE.map((n) => ({ n, valeur: tendance(peseesPourCalcul, aujourdhui, n) })),
    [peseesPourCalcul, aujourdhui]
  );

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

  const lundiSemaine = useMemo(() => {
    const jourSemaineISO = new Date(`${aujourdhui}T00:00:00Z`).getUTCDay(); // 0=dimanche
    const decalageLundi = jourSemaineISO === 0 ? 6 : jourSemaineISO - 1;
    return ajouterJours(aujourdhui, -decalageLundi);
  }, [aujourdhui]);

  const objectifSportBrut = utilisateur?.objectifSeancesSemaine;
  const objectifSport = Number.isFinite(objectifSportBrut) ? (objectifSportBrut as number) : 3;
  const seancesCetteSemaine = useMemo(() => {
    const dimancheSemaine = ajouterJours(lundiSemaine, 6);
    return seancesSport.filter((s) => {
      const date = s.dateHeure.slice(0, 10);
      return date >= lundiSemaine && date <= dimancheSemaine;
    }).length;
  }, [seancesSport, lundiSemaine]);

  const objectifEauBrut = utilisateur?.objectifEauLitres;
  const objectifEau = Number.isFinite(objectifEauBrut) ? (objectifEauBrut as number) : 2;
  const eauMlAujourdhui = useMemo(
    () =>
      consommationsEau
        .filter((c) => estLeJour(c.dateHeure, aujourdhui))
        .reduce((somme, c) => somme + c.volumeMl, 0),
    [consommationsEau, aujourdhui]
  );
  const eauLitresAujourdhui = eauMlAujourdhui / 1000;

  const semaine = useMemo(() => {
    return construireSemaine(lundiSemaine, cheatmeals, grignotages, marqueurs).map((j, i) => ({
      ...j,
      lettre: JOURS_SEMAINE[i],
      numero: Number(j.date.slice(8, 10)),
      estAujourdhui: j.date === aujourdhui,
    }));
  }, [aujourdhui, lundiSemaine, cheatmeals, grignotages, marqueurs]);

  return (
    <EcranConteneur>
      <View style={styles.entete}>
        <Text style={styles.dateDuJour}>{formaterJour(new Date())}</Text>
        <Text style={styles.titre}>Bien dormi ?</Text>
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
          <SegmentedControl variante="compact" options={PERIODES_COURBE} valeur={periodeCourbe} onChange={setPeriodeCourbe} />
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

      <Carte style={{ marginTop: space[3] }}>
        <View style={styles.enteteSport}>
          <Text style={styles.sousTitreCarte}>Sport cette semaine</Text>
          <Text style={styles.sportValeur}>
            {seancesCetteSemaine} / {objectifSport}
          </Text>
        </View>
        <View style={styles.pisteProgression}>
          <View
            style={[
              styles.progression,
              { width: `${objectifSport > 0 ? Math.min(100, (seancesCetteSemaine / objectifSport) * 100) : 100}%` },
            ]}
          />
        </View>
      </Carte>

      <Carte style={{ marginTop: space[3] }}>
        <View style={styles.enteteSport}>
          <Text style={styles.sousTitreCarte}>Eau aujourd'hui</Text>
          <Text style={styles.sportValeur}>
            {eauLitresAujourdhui.toFixed(2).replace(".", ",")} / {objectifEau.toFixed(2).replace(".", ",")} L
          </Text>
        </View>
        <View style={styles.pisteProgression}>
          <View
            style={[
              styles.progression,
              { width: `${objectifEau > 0 ? Math.min(100, (eauLitresAujourdhui / objectifEau) * 100) : 100}%` },
            ]}
          />
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
          fin={!peseeDuJour && utilisateur ? `jusqu'à ${utilisateur.fenetreMatinFin}` : undefined}
        />

        {!aUnPassageAujourdhui && (
          <Bouton
            label="Popo du jour"
            onPress={() => navigation.navigate("PassageToilette")}
            variante="secondary"
            bloc
            icone={<IconeToilettes size={19} color={colors.accent700} />}
            fin={dernierPassage ? depuisTexte(dernierPassage.dateHeure) : undefined}
          />
        )}

        <View style={styles.grilleActions}>
          {aUnPassageAujourdhui && (
            <Bouton
              label="Toilettes"
              onPress={() => navigation.navigate("PassageToilette")}
              variante="secondary"
              style={styles.actionTuile}
              icone={<IconeToilettes size={19} color={colors.accent700} />}
            />
          )}
          <Bouton
            label="Un extra"
            onPress={() => navigation.navigate("Cheatmeal")}
            variante="secondary"
            style={styles.actionTuile}
            icone={<IconeExtra size={19} color={colors.accent700} />}
          />
          <Bouton
            label="Grignotage"
            onPress={() => navigation.navigate("Grignotage")}
            variante="secondary"
            style={styles.actionTuile}
            icone={<IconeGrignotage size={19} color={colors.accent700} />}
          />
          <Bouton
            label="Contexte"
            onPress={() => navigation.navigate("ContextePeriode")}
            variante="secondary"
            style={styles.actionTuile}
            icone={<IconeContexte size={19} color={colors.accent700} />}
          />
          <Bouton
            label="Sport"
            onPress={() => navigation.navigate("SeanceSport")}
            variante="secondary"
            style={styles.actionTuile}
            icone={<Dumbbell size={19} color={colors.accent700} strokeWidth={iconStrokeWidth} />}
          />
          <Bouton
            label="Verre d'eau"
            onPress={() => navigation.navigate("VerreEau")}
            variante="secondary"
            style={styles.actionTuile}
            icone={<GlassWater size={19} color={colors.accent700} strokeWidth={iconStrokeWidth} />}
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
  entete: { marginTop: space[3] },
  dateDuJour: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.5, textTransform: "uppercase", color: colors.neutral600 },
  titre: { fontFamily: fonts.heading, fontSize: 23, color: colors.text, marginTop: space[1] },
  blocPoids: { flexDirection: "row", alignItems: "baseline", gap: space[3], marginTop: space[5] },
  poidsGrand: { fontFamily: fonts.heading, fontSize: 52, color: colors.text },
  poidsUnite: { fontFamily: fonts.body, fontSize: 20 },
  badgesColonne: { gap: space[1] },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingVertical: space[1], paddingHorizontal: space[3] },
  pucePleine: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.accent500 },
  enteteCourbe: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space[2] },
  axeCourbe: { flexDirection: "row", justifyContent: "space-between", marginTop: space[1] },
  axeTexte: { fontFamily: fonts.body, fontSize: 11, color: colors.neutral600 },
  sousTitreCarte: { fontFamily: fonts.heading, fontSize: 15.5, color: colors.text },
  rangeeTendances: { flexDirection: "row", gap: space[2], marginTop: space[2] },
  chipTendance: { flex: 1, borderRadius: radius.md, padding: space[2], alignItems: "center" },
  chipLabel: { fontFamily: fonts.bodyBold, fontSize: 10 },
  chipValeur: { fontFamily: fonts.heading, fontSize: 15, color: colors.text, marginTop: space[1] },
  enteteSport: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sportValeur: { fontFamily: fonts.heading, fontSize: 15.5, color: colors.text },
  pisteProgression: { height: 8, borderRadius: radius.pill, backgroundColor: colors.neutral200, marginTop: space[3], overflow: "hidden" },
  progression: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.accent2_500 },
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
  grilleActions: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  actionTuile: { width: "48%" },
  pied: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral600, textAlign: "center", marginTop: space[5] },
});
