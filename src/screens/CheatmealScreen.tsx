import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerCheatmeal } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius } from "@/theme/theme";
import { MomentRepas, NiveauCheatmeal } from "@/types/models";

const MOMENTS: { valeur: MomentRepas; label: string }[] = [
  { valeur: "petit_dejeuner", label: "Petit-déjeuner" },
  { valeur: "brunch", label: "Brunch" },
  { valeur: "dejeuner", label: "Déjeuner" },
  { valeur: "diner", label: "Dîner" },
];

const NIVEAUX: { valeur: NiveauCheatmeal; label: string }[] = [
  { valeur: "petit", label: "Petit extra" },
  { valeur: "moyen", label: "Extra moyen" },
  { valeur: "gros", label: "Gros extra" },
];

export function CheatmealScreen() {
  const navigation = useNavigation();
  const { rafraichir } = useAppData();
  const [moment, setMoment] = useState<MomentRepas>("dejeuner");
  const [niveau, setNiveau] = useState<NiveauCheatmeal>("moyen");
  const [enCours, setEnCours] = useState(false);

  async function onEnregistrer() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setEnCours(true);
    try {
      await creerCheatmeal(uid, { dateHeure: new Date().toISOString(), momentRepas: moment, niveau });
      await rafraichir();
      navigation.goBack();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranConteneur>
      <Text style={styles.titre}>Un petit extra ?</Text>
      <Text style={styles.texte}>Aucun détail à donner : juste le moment et l'ampleur, pour comprendre plus tard.</Text>

      <Text style={styles.sousTitre}>C'était à quel moment</Text>
      <View style={styles.grille}>
        {MOMENTS.map((m) => (
          <Pressable
            key={m.valeur}
            onPress={() => setMoment(m.valeur)}
            style={[styles.puce, moment === m.valeur && styles.puceActive]}
          >
            <Text style={[styles.puceTexte, moment === m.valeur && styles.puceTexteActif]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sousTitre}>Le niveau</Text>
      <View style={styles.segments}>
        {NIVEAUX.map((n) => (
          <Pressable
            key={n.valeur}
            onPress={() => setNiveau(n.valeur)}
            style={[styles.segment, niveau === n.valeur && styles.segmentActif]}
          >
            <Text style={[styles.segmentTexte, niveau === n.valeur && styles.segmentTexteActif]}>{n.label}</Text>
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
  grille: { flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] },
  puce: { borderRadius: radius.pill, paddingVertical: space[3], paddingHorizontal: space[4], backgroundColor: colors.surface },
  puceActive: { backgroundColor: colors.accent },
  puceTexte: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.neutral800 },
  puceTexteActif: { color: colors.bg },
  segments: { flexDirection: "row", gap: space[2], marginTop: space[3] },
  segment: { flex: 1, alignItems: "center", paddingVertical: space[4], borderRadius: radius.pill, backgroundColor: colors.surface },
  segmentActif: { backgroundColor: colors.accent },
  segmentTexte: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.neutral700, textAlign: "center" },
  segmentTexteActif: { fontFamily: fonts.heading, color: colors.bg },
});
