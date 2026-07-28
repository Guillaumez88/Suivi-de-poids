import React, { useState } from "react";
import { Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerSeanceSport } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SectionKicker } from "@/components/SectionKicker";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space } from "@/theme/theme";
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
    } catch (e) {
      Alert.alert("Ça n'a pas marché", (e as Error).message ?? "Erreur inconnue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranConteneur>
      <Text style={styles.titre}>Une séance de sport ?</Text>
      <Text style={styles.texte}>Aucun détail à donner : juste l'intensité et la durée.</Text>

      <SectionKicker label="L'intensité" />
      <SegmentedControl options={INTENSITES} valeur={intensite} onChange={setIntensite} />

      <SectionKicker label="La durée" />
      <SegmentedControl options={DUREES} valeur={duree} onChange={setDuree} />

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
});
