import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth } from "@/services/firebaseConfig";
import { creerOuMettreAJourUtilisateur } from "@/services/dataService";
import { demanderPermissionsNotifications, programmerRappelsDuJour } from "@/services/notifications";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { Carte } from "@/components/Card";
import { colors, fonts, space } from "@/theme/theme";
import { OnboardingStackParamList, RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Rituel">;

// Étape 3 : réglages par défaut validés au cahier des charges (section 5.1).
export function RituelScreen({ navigation }: Props) {
  const [fenetreMatinDebut, setFenetreMatinDebut] = useState("06:00");
  const [fenetreMatinFin, setFenetreMatinFin] = useState("11:00");
  const [heureRappel1, setHeureRappel1] = useState("09:00");
  const [heureRappel2, setHeureRappel2] = useState("10:00");

  async function onTerminer() {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await creerOuMettreAJourUtilisateur(uid, {
        fenetreMatinDebut,
        fenetreMatinFin,
        heureRappel1,
        heureRappel2,
      });
    }
    await demanderPermissionsNotifications();
    await programmerRappelsDuJour({ heureRappel1, heureRappel2 }, false);
    const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    parent?.navigate("Principal");
  }

  return (
    <EcranConteneur>
      <Text style={styles.etape}>← Étape 3 sur 3</Text>
      <Text style={styles.titre}>Le rituel du matin</Text>
      <Text style={styles.sousTitre}>
        Se peser toujours au même moment, c'est tout le secret d'une courbe qui veut dire
        quelque chose.
      </Text>

      <Carte style={{ marginTop: space[5] }}>
        <Text style={styles.label}>La fenêtre où tu peux saisir</Text>
        <View style={styles.ligneHeures}>
          <ChampHeure valeur={fenetreMatinDebut} onChange={setFenetreMatinDebut} />
          <View style={styles.trait} />
          <ChampHeure valeur={fenetreMatinFin} onChange={setFenetreMatinFin} />
        </View>
        <Text style={styles.aide}>
          En dehors, l'écran de pesée se met en veille. Un jour manqué n'est pas grave : la
          moyenne encaisse.
        </Text>
      </Carte>

      <Carte style={{ marginTop: space[3] }}>
        <Text style={styles.label}>Deux rappels, pas trois</Text>
        <Text style={styles.aide}>Le second seulement si tu n'as rien noté.</Text>
        <View style={styles.ligneHeures}>
          <ChampHeure valeur={heureRappel1} onChange={setHeureRappel1} tinted />
          <ChampHeure valeur={heureRappel2} onChange={setHeureRappel2} tinted />
        </View>
      </Carte>

      <Bouton label="C'est parti" onPress={onTerminer} bloc style={{ marginTop: space[7] }} />
    </EcranConteneur>
  );
}

function ChampHeure({
  valeur,
  onChange,
  tinted,
}: {
  valeur: string;
  onChange: (v: string) => void;
  tinted?: boolean;
}) {
  return (
    <TextInput
      style={[styles.champHeure, tinted && { backgroundColor: colors.accent100, color: colors.accent800 }]}
      value={valeur}
      onChangeText={onChange}
      placeholder="HH:mm"
      keyboardType="numbers-and-punctuation"
    />
  );
}

const styles = StyleSheet.create({
  etape: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.neutral700, marginTop: space[3] },
  titre: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 32, color: colors.text, marginTop: space[3] },
  sousTitre: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral700, marginTop: space[2] },
  label: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text, marginBottom: space[3] },
  aide: { fontFamily: fonts.body, fontSize: 12.5, color: colors.neutral700, marginTop: space[3] },
  ligneHeures: { flexDirection: "row", alignItems: "center", gap: space[2] },
  trait: { flex: 1, height: 3, borderRadius: 999, backgroundColor: colors.accent200 },
  champHeure: {
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingVertical: space[3],
    paddingHorizontal: space[5],
    fontFamily: fonts.heading,
    fontSize: 18,
    textAlign: "center",
    color: colors.text,
  },
});
