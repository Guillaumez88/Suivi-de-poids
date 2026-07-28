import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerCheatmeal } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { Bouton } from "@/components/Button";
import { IconeNiveauExtra } from "@/components/icons";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius } from "@/theme/theme";
import { MomentRepas, NiveauCheatmeal } from "@/types/models";

const MOMENTS: { valeur: MomentRepas; label: string }[] = [
  { valeur: "petit_dejeuner", label: "Petit-déjeuner" },
  { valeur: "brunch", label: "Brunch" },
  { valeur: "dejeuner", label: "Déjeuner" },
  { valeur: "diner", label: "Dîner" },
];

const NIVEAUX: { valeur: NiveauCheatmeal; label: string; art: 1 | 2 | 3 }[] = [
  { valeur: "petit", label: "petit", art: 1 },
  { valeur: "moyen", label: "moyen", art: 2 },
  { valeur: "gros", label: "gros", art: 3 },
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
      <Text style={styles.titre}>Tu t'es autorisé{"\n"}un extra ?</Text>
      <Text style={styles.texte}>
        Très bien. On note juste quand et à peu près combien — jamais quoi, et surtout pas les
        calories.
      </Text>

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

      <Text style={styles.sousTitre}>Et à la louche</Text>
      <View style={styles.niveaux}>
        {NIVEAUX.map((n) => {
          const actif = niveau === n.valeur;
          return (
            <Pressable
              key={n.valeur}
              onPress={() => setNiveau(n.valeur)}
              style={[styles.carteNiveau, { backgroundColor: actif ? colors.accent200 : colors.accent100 }]}
            >
              <IconeNiveauExtra niveau={n.art} color={colors.accent800} />
              <Text style={styles.niveauLabel}>{n.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Carte tinted="accent2" style={{ marginTop: space[5] }}>
        <Text style={styles.texteReassurance}>
          Un extra ne se « rattrape » pas. Il se note, et la courbe s'en remet toute seule d'ici
          deux ou trois jours.
        </Text>
      </Carte>

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
  niveaux: { flexDirection: "row", gap: space[2], marginTop: space[3] },
  carteNiveau: { flex: 1, borderRadius: radius.lg, paddingVertical: space[5], alignItems: "center", gap: space[2] },
  niveauLabel: { fontFamily: fonts.heading, fontSize: 15, color: colors.accent800 },
  texteReassurance: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: colors.accent2_800 },
});
