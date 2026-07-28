import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerSeanceSport } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius } from "@/theme/theme";
import { IntensiteSport, DureeSeanceSport } from "@/types/models";

const INTENSITES: { valeur: IntensiteSport; label: string }[] = [
  { valeur: "leger", label: "Peu intense" },
  { valeur: "modere", label: "Moyenne" },
  { valeur: "intense", label: "Intense" },
];

const DUREES: { valeur: DureeSeanceSport; label: string }[] = [
  { valeur: 15, label: "15 min" },
  { valeur: 30, label: "30 min" },
  { valeur: 60, label: "1 h" },
];

export function SportScreen() {
  const navigation = useNavigation();
  const { rafraichir } = useAppData();
  const [intensite, setIntensite] = useState<IntensiteSport>("modere");
  const [duree, setDuree] = useState<DureeSeanceSport>(30);
  const [enCours, setEnCours] = useState(false);

  async function onEnregistrer() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setEnCours(true);
    try {
      await creerSeanceSport(uid, { dateHeure: new Date().toISOString(), intensite, dureeMinutes: duree });
      await rafraichir();
      navigation.goBack();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranConteneur>
      <Text style={styles.titre}>Une séance de sport ?</Text>
      <Text style={styles.texte}>Aucun détail à donner : juste l'intensité et la durée.</Text>

      <Text style={styles.sousTitre}>L'intensité</Text>
      <View style={styles.segments}>
        {INTENSITES.map((i) => (
          <Pressable
            key={i.valeur}
            onPress={() => setIntensite(i.valeur)}
            style={[styles.segment, intensite === i.valeur && styles.segmentActif]}
          >
            <Text style={[styles.segmentTexte, intensite === i.valeur && styles.segmentTexteActif]}>
              {i.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sousTitre}>La durée</Text>
      <View style={styles.segments}>
        {DUREES.map((d) => (
          <Pressable
            key={d.valeur}
            onPress={() => setDuree(d.valeur)}
            style={[styles.segment, duree === d.valeur && styles.segmentActif]}
          >
            <Text style={[styles.segmentTexte, duree === d.valeur && styles.segmentTexteActif]}>
              {d.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Bouton
        label={enCours ? "Enregistrement…" : "C'est noté"}
        onPress={onEnregistrer}
        disabled={enCours}
        bloc
        style={{ marginTop: space[7] }}
      />
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: fonts.heading, fontSize: 26, color: colors.text, marginTop: space[4] },
  texte: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral700, marginTop: space[2] },
  sousTitre: {
    marginTop: space[6],
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.neutral600,
  },
  segments: { flexDirection: "row", gap: space[2], marginTop: space[3] },
  segment: { flex: 1, alignItems: "center", paddingVertical: space[4], borderRadius: radius.pill, backgroundColor: colors.surface },
  segmentActif: { backgroundColor: colors.accent },
  segmentTexte: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.neutral700, textAlign: "center" },
  segmentTexteActif: { fontFamily: fonts.heading, color: colors.bg },
});
