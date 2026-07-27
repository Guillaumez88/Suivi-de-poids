import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerGrignotage } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space } from "@/theme/theme";

/**
 * Section 3.4 : un bouton unique à appui simple, aucune saisie
 * complémentaire, horodatage automatique.
 */
export function SnackConfirmScreen() {
  const navigation = useNavigation();
  const { rafraichir } = useAppData();
  const [enCours, setEnCours] = useState(false);

  async function onConfirmer() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setEnCours(true);
    try {
      await creerGrignotage(uid);
      await rafraichir();
      navigation.goBack();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranConteneur scroll={false}>
      <View style={styles.centre}>
        <Text style={styles.titre}>Un petit creux ?</Text>
        <Text style={styles.texte}>
          Un tap suffit. Pas de détail à donner, juste pour garder trace.
        </Text>
        <Bouton
          label={enCours ? "…" : "J'ai grignoté"}
          onPress={onConfirmer}
          disabled={enCours}
          bloc
          style={{ marginTop: space[7] }}
        />
        <Bouton label="Annuler" variante="ghost" onPress={() => navigation.goBack()} style={{ marginTop: space[3] }} />
      </View>
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, justifyContent: "center", alignItems: "stretch" },
  titre: { fontFamily: fonts.heading, fontSize: 26, color: colors.text, textAlign: "center" },
  texte: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.neutral700,
    textAlign: "center",
    marginTop: space[3],
  },
});
