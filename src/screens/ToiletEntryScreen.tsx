import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerPassageToilette, getPassagesToilette } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { IconeBristol } from "@/components/icons";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius } from "@/theme/theme";
import { BRISTOL_DESCRIPTIONS, DifficulteSelles } from "@/types/models";
import { alerteSaignementRecurrent } from "@/utils/businessRules";

function dateISOAujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

function heureLocaleActuelle(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formaterJourCourt(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const DIFFICULTES: { valeur: DifficulteSelles; label: string }[] = [
  { valeur: "facile", label: "Facile" },
  { valeur: "normale", label: "Normale" },
  { valeur: "difficile", label: "Difficile" },
];

export function ToiletEntryScreen() {
  const navigation = useNavigation();
  const { rafraichir } = useAppData();
  const [typeBristol, setTypeBristol] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(4);
  const [difficulte, setDifficulte] = useState<DifficulteSelles>("normale");
  const [saignement, setSaignement] = useState(false); // décoché par défaut (section 3.2)
  const [enCours, setEnCours] = useState(false);
  const [plusTot, setPlusTot] = useState(false);
  const [dateSaisie, setDateSaisie] = useState(dateISOAujourdhui());
  const [heureSaisie, setHeureSaisie] = useState(heureLocaleActuelle());

  async function onEnregistrer() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setEnCours(true);
    try {
      const dateHeure = plusTot ? `${dateSaisie}T${heureSaisie}:00` : new Date().toISOString();
      await creerPassageToilette(uid, { dateHeure, typeBristol, difficulte, saignement });

      if (saignement) {
        const passages = await getPassagesToilette(uid);
        const declenche = alerteSaignementRecurrent(
          passages.map((p) => ({ dateHeure: p.dateHeure, saignement: p.saignement })),
          dateHeure.slice(0, 10)
        );
        if (declenche) {
          Alert.alert(
            "Bon à noter",
            "Ça fait plusieurs fois cette semaine que tu notes un saignement. Sans t'inquiéter, ce serait bien d'en parler à un professionnel de santé si ça continue.",
          );
        }
      }
      await rafraichir();
      navigation.goBack();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranConteneur>
      <Text style={styles.titre}>Ça s'est passé comment ?</Text>
      <Text style={styles.texte}>
        Personne ne lit ça à part toi. Choisis ce qui ressemble le plus, au pif c'est très bien.
      </Text>

      <View style={styles.carteMoment}>
        <View style={styles.segments}>
          <Pressable
            onPress={() => setPlusTot(false)}
            style={[styles.segmentMoment, !plusTot && styles.segmentMomentActif]}
          >
            <Text style={[styles.segmentTexte, !plusTot && styles.segmentTexteActif]}>À l'instant</Text>
          </Pressable>
          <Pressable
            onPress={() => setPlusTot(true)}
            style={[styles.segmentMoment, plusTot && styles.segmentMomentActif]}
          >
            <Text style={[styles.segmentTexte, plusTot && styles.segmentTexteActif]}>C'était plus tôt</Text>
          </Pressable>
        </View>
        {plusTot && (
          <View style={styles.ligneDateHeure}>
            <TextInput style={styles.champDateHeure} value={dateSaisie} onChangeText={setDateSaisie} placeholder="AAAA-MM-JJ" />
            <TextInput style={styles.champDateHeure} value={heureSaisie} onChangeText={setHeureSaisie} placeholder="HH:mm" />
          </View>
        )}
        <Text style={styles.aideMoment}>
          {plusTot ? "Rattraper un passage oublié, c'est très bien aussi." : `${formaterJourCourt(dateISOAujourdhui())}, maintenant.`}
        </Text>
      </View>

      <View style={styles.liste}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => {
          const actif = typeBristol === n;
          return (
            <Pressable
              key={n}
              onPress={() => setTypeBristol(n as 1 | 2 | 3 | 4 | 5 | 6 | 7)}
              style={[styles.ligneBristol, actif && styles.ligneBristolActive]}
            >
              <View style={styles.bristolArt}>
                <IconeBristol type={n as 1 | 2 | 3 | 4 | 5 | 6 | 7} color={actif ? colors.accent800 : colors.accent700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bristolNumero}>Type {n}</Text>
                <Text style={styles.bristolDesc}>{BRISTOL_DESCRIPTIONS[n]}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sousTitre}>C'était</Text>
      <View style={styles.segments}>
        {DIFFICULTES.map((d) => (
          <Pressable
            key={d.valeur}
            onPress={() => setDifficulte(d.valeur)}
            style={[styles.segment, difficulte === d.valeur && styles.segmentActif]}
          >
            <Text style={[styles.segmentTexte, difficulte === d.valeur && styles.segmentTexteActif]}>
              {d.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.ligneSaignement} onPress={() => setSaignement((v) => !v)}>
        <View style={[styles.case, saignement && styles.caseCochee]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.labelSaignement}>Un peu de sang</Text>
          <Text style={styles.aideSaignement}>
            Bon à noter, sans t'inquiéter — si ça revient souvent, tu auras la date exacte à
            donner.
          </Text>
        </View>
      </Pressable>

      <Bouton
        label={enCours ? "Enregistrement…" : "Enregistrer"}
        onPress={onEnregistrer}
        disabled={enCours}
        bloc
        style={{ marginTop: space[6] }}
      />
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, marginTop: space[4] },
  texte: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral700, marginTop: space[2] },
  liste: { marginTop: space[5], gap: space[2] },
  ligneBristol: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
  },
  ligneBristolActive: { backgroundColor: colors.accent100 },
  bristolArt: { width: 58, alignItems: "center", justifyContent: "center" },
  bristolNumero: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  bristolDesc: { fontFamily: fonts.body, fontSize: 12.5, color: colors.neutral700, marginTop: 1 },
  carteMoment: {
    marginTop: space[5],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
  },
  segmentMoment: { flex: 1, alignItems: "center", paddingVertical: space[3], borderRadius: radius.pill, backgroundColor: colors.bg },
  segmentMomentActif: { backgroundColor: colors.accent },
  ligneDateHeure: { flexDirection: "row", gap: space[2], marginTop: space[3] },
  champDateHeure: {
    flex: 1,
    textAlign: "center",
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: space[3],
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.text,
  },
  aideMoment: { fontFamily: fonts.body, fontSize: 12.5, color: colors.neutral700, marginTop: space[3] },
  sousTitre: {
    marginTop: space[6],
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.neutral600,
  },
  segments: { flexDirection: "row", gap: space[2], marginTop: space[2] },
  segment: { flex: 1, alignItems: "center", paddingVertical: space[3], borderRadius: radius.pill, backgroundColor: colors.surface },
  segmentActif: { backgroundColor: colors.accent },
  segmentTexte: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.neutral700 },
  segmentTexteActif: { fontFamily: fonts.heading, color: colors.bg },
  ligneSaignement: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    marginTop: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
  },
  case: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: colors.neutral400 },
  caseCochee: { backgroundColor: colors.accent, borderColor: colors.accent },
  labelSaignement: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  aideSaignement: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral700, marginTop: 2 },
});
