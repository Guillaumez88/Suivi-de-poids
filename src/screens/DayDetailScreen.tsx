import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { ChevronLeft, Dumbbell } from "lucide-react-native";
import { auth } from "@/services/firebaseConfig";
import {
  supprimerPeseeMatinale,
  supprimerPassageToilette,
  supprimerCheatmeal,
  supprimerGrignotage,
  supprimerSeanceSport,
} from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { Etiquette } from "@/components/Tag";
import { SectionKicker } from "@/components/SectionKicker";
import { IconeBristol, IconeNiveauExtra, IconeGrignotage, VisageHumeur, LABELS_HUMEUR } from "@/components/icons";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius, iconStrokeWidth } from "@/theme/theme";
import { RootStackParamList } from "@/navigation/types";
import { BRISTOL_DESCRIPTIONS } from "@/types/models";
import { calculerMarqueursCalendrier, palierDeKilo } from "@/utils/businessRules";

type Route = RouteProp<RootStackParamList, "DetailJournee">;

const NIVEAU_VERS_ART: Record<string, 1 | 2 | 3> = { petit: 1, moyen: 2, gros: 3 };
const LABELS_INTENSITE: Record<string, string> = { leger: "peu intense", modere: "moyenne", intense: "intense" };

function heureCourte(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
}

function formaterDateEntete(date: string): { jour: string; moisAnnee: string } {
  const d = new Date(`${date}T00:00:00`);
  const jour = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" });
  const moisAnnee = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return { jour: `${jour.charAt(0).toUpperCase()}${jour.slice(1)}`, moisAnnee };
}

export function DayDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const { date } = params;
  const { pesees, passages, cheatmeals, grignotages, contextes, seancesSport, rafraichir } = useAppData();

  const uid = auth.currentUser?.uid;
  const pesee = pesees.find((p) => p.date === date);
  const passagesJour = passages.filter((p) => p.dateHeure.startsWith(date));
  const cheatmealsJour = cheatmeals.filter((c) => c.dateHeure.startsWith(date));
  const grignotagesJour = grignotages.filter((g) => g.dateHeure.startsWith(date));
  const contextesJour = contextes.filter((c) => c.dateDebut <= date && (!c.dateFin || c.dateFin >= date));
  const seancesJour = seancesSport.filter((s) => s.dateHeure.startsWith(date));

  const marqueurDuJour = useMemo(() => {
    if (!pesee) return null;
    const peseesPourCalcul = pesees.map((p) => ({ date: p.date, poidsKg: p.poidsKg }));
    return calculerMarqueursCalendrier(peseesPourCalcul).find((m) => m.date === date)?.marqueur ?? null;
  }, [pesees, date, pesee]);

  const { jour, moisAnnee } = formaterDateEntete(date);

  async function supprimer(action: () => Promise<void>) {
    await action();
    await rafraichir();
  }

  const aDesEntrees =
    pesee ||
    passagesJour.length > 0 ||
    cheatmealsJour.length > 0 ||
    grignotagesJour.length > 0 ||
    seancesJour.length > 0;

  return (
    <EcranConteneur>
      <View style={styles.enteteNav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft color={colors.neutral700} size={22} strokeWidth={iconStrokeWidth} />
        </Pressable>
      </View>

      <View style={styles.enteteTitre}>
        <View>
          <Text style={styles.titre}>{jour}</Text>
          <Text style={styles.sousTitreDate}>{moisAnnee}</Text>
        </View>
        {contextesJour[0] && (
          <Etiquette
            label={`${contextesJour[0].note ?? contextesJour[0].type}${contextesJour[0].note ? ` · ${contextesJour[0].type}` : ""}`}
            ton="accent2"
          />
        )}
      </View>

      {pesee && (
        <Carte style={{ marginTop: space[4] }}>
          <SectionKicker label={`Pesée · ${heureCourte(pesee.creeLe)}`} style={styles.kickerCarte} />
          <View style={styles.ligneValeurPoids}>
            <Text style={styles.valeurPoids}>
              {pesee.poidsKg}
              <Text style={styles.unitePoids}> kg</Text>
            </Text>
            {marqueurDuJour && (
              <Etiquette label={`${palierDeKilo(pesee.poidsKg)} kg franchis`} ton="accent2" />
            )}
          </View>
          {Object.keys(pesee.mensurations).length > 0 && (
            <View style={styles.rangeeTags}>
              {Object.entries(pesee.mensurations).map(([zone, valeur]) => (
                <View key={zone} style={styles.tagMensuration}>
                  <Text style={styles.tagMensurationTexte}>
                    {zone} {valeur}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {uid && (
            <Text style={styles.supprimer} onPress={() => supprimer(() => supprimerPeseeMatinale(uid, pesee.id))}>
              Supprimer
            </Text>
          )}
        </Carte>
      )}

      {pesee && (
        <Carte style={{ marginTop: space[3], flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <VisageHumeur niveau={pesee.etatPsyScore} size={28} color={colors.accent700} />
          <View style={{ flex: 1 }}>
            <Text style={styles.labelLigne}>{LABELS_HUMEUR[pesee.etatPsyScore - 1]}</Text>
            {pesee.etatPsyNote ? <Text style={styles.noteTexte}>« {pesee.etatPsyNote} »</Text> : null}
          </View>
        </Carte>
      )}

      {passagesJour.length > 0 && (
        <Carte style={{ marginTop: space[3] }}>
          <SectionKicker
            label={`Transit · ${passagesJour.length} passage${passagesJour.length > 1 ? "s" : ""}`}
            style={styles.kickerCarte}
          />
          <View style={{ gap: space[2], marginTop: space[2] }}>
            {passagesJour.map((p) => (
              <View key={p.id} style={styles.rangeeTransit}>
                <IconeBristol type={p.typeBristol} width={40} height={26} color={colors.accent700} />
                <Text style={styles.texteTransit}>
                  Type {p.typeBristol} · {p.difficulte}{" "}
                  <Text style={{ color: colors.neutral600 }}>— {heureCourte(p.dateHeure)}</Text>
                </Text>
                {uid && (
                  <Text style={styles.supprimerInline} onPress={() => supprimer(() => supprimerPassageToilette(uid, p.id))}>
                    Supprimer
                  </Text>
                )}
              </View>
            ))}
          </View>
        </Carte>
      )}

      {cheatmealsJour.map((c) => (
        <Carte key={c.id} style={{ marginTop: space[3], flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <View style={styles.puceExtra}>
            <IconeNiveauExtra niveau={NIVEAU_VERS_ART[c.niveau]} size={22} color={colors.accent800} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.labelLigne}>Un extra, {c.niveau}</Text>
            <Text style={styles.noteTexte}>
              {c.momentRepas} · {heureCourte(c.dateHeure)}
            </Text>
          </View>
          {uid && (
            <Text style={styles.supprimer} onPress={() => supprimer(() => supprimerCheatmeal(uid, c.id))}>
              Supprimer
            </Text>
          )}
        </Carte>
      ))}

      {grignotagesJour.map((g) => (
        <Carte key={g.id} style={{ marginTop: space[3], flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <View style={styles.puceNeutre}>
            <IconeGrignotage size={20} color={colors.accent700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.labelLigne}>Grignotage</Text>
            <Text style={styles.noteTexte}>{heureCourte(g.dateHeure)}</Text>
          </View>
          {uid && (
            <Text style={styles.supprimer} onPress={() => supprimer(() => supprimerGrignotage(uid, g.id))}>
              Supprimer
            </Text>
          )}
        </Carte>
      ))}

      {seancesJour.map((s) => (
        <Carte key={s.id} style={{ marginTop: space[3], flexDirection: "row", alignItems: "center", gap: space[3] }}>
          <View style={styles.puceNeutre}>
            <Dumbbell size={20} color={colors.accent700} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.labelLigne}>Sport, {LABELS_INTENSITE[s.intensite]}</Text>
            <Text style={styles.noteTexte}>
              {s.dureeMinutes} min · {heureCourte(s.dateHeure)}
            </Text>
          </View>
          {uid && (
            <Text style={styles.supprimer} onPress={() => supprimer(() => supprimerSeanceSport(uid, s.id))}>
              Supprimer
            </Text>
          )}
        </Carte>
      ))}

      {contextesJour.length > 0 && (
        <Carte style={{ marginTop: space[3] }} tinted="accent2">
          <Text style={styles.texteContexte}>
            Journée de {contextesJour[0].type} : la courbe ne compte pas ce chiffre dans la moyenne
            si tu ne veux pas.
          </Text>
        </Carte>
      )}

      {!aDesEntrees && <Text style={styles.vide}>Aucune entrée ce jour-là.</Text>}
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  enteteNav: { marginTop: space[3] },
  enteteTitre: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: space[3] },
  titre: { fontFamily: fonts.heading, fontSize: 27, color: colors.text },
  sousTitreDate: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral700, marginTop: 3 },
  kickerCarte: { marginTop: 0, marginBottom: 0 },
  ligneValeurPoids: { flexDirection: "row", alignItems: "baseline", gap: space[3], marginTop: space[2] },
  valeurPoids: { fontFamily: fonts.heading, fontSize: 38, color: colors.text },
  unitePoids: { fontFamily: fonts.body, fontSize: 17 },
  rangeeTags: { flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] },
  tagMensuration: { backgroundColor: colors.bg, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: space[3] },
  tagMensurationTexte: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.text, textTransform: "capitalize" },
  labelLigne: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.text, textTransform: "capitalize" },
  noteTexte: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral700, marginTop: 2 },
  rangeeTransit: { flexDirection: "row", alignItems: "center", gap: space[3] },
  texteTransit: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text },
  puceExtra: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.accent200, alignItems: "center", justifyContent: "center" },
  puceNeutre: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  texteContexte: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: colors.accent2_800 },
  supprimer: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.accent700, marginTop: space[2] },
  supprimerInline: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.neutral700 },
  vide: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral600, marginTop: space[8], textAlign: "center" },
});
