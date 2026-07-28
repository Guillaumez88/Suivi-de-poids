import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { GlassWater } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerConsommationEau, supprimerConsommationEau } from "@/services/dataService";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius, shadow, iconStrokeWidth } from "@/theme/theme";
import { dateISOAujourdhui, estLeJour } from "@/utils/businessRules";

const VOLUME_VERRE_ML = 250;

/**
 * Même logique que SnackConfirmScreen (section 3.4) : un tap suffit, le
 * verre est donc créé dès l'ouverture de cet écran, qui n'est qu'un accusé
 * de réception avec une annulation possible.
 */
export function WaterConfirmScreen() {
  const navigation = useNavigation();
  const { utilisateur, consommationsEau, rafraichir } = useAppData();
  const [idCree, setIdCree] = useState<string | null>(null);
  const momentCreation = useRef(new Date()).current;

  useEffect(() => {
    let annule = false;
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const entree = await creerConsommationEau(uid, VOLUME_VERRE_ML);
      if (!annule) setIdCree(entree.id);
      await rafraichir();
    })();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAnnuler() {
    const uid = auth.currentUser?.uid;
    if (uid && idCree) {
      await supprimerConsommationEau(uid, idCree);
      await rafraichir();
    }
    navigation.goBack();
  }

  const aujourdhui = dateISOAujourdhui();
  const totalMlAujourdhui = consommationsEau
    .filter((c) => estLeJour(c.dateHeure, aujourdhui))
    .reduce((somme, c) => somme + c.volumeMl, 0);
  const objectifLitres = Number.isFinite(utilisateur?.objectifEauLitres) ? utilisateur!.objectifEauLitres : 2;

  return (
    <View style={styles.fond}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      <View style={styles.carte}>
        <View style={styles.pastille}>
          <GlassWater size={44} color={colors.accent2_700} strokeWidth={iconStrokeWidth} />
        </View>
        <Text style={styles.titre}>Verre d'eau noté</Text>
        <Text style={styles.texte}>
          {(totalMlAujourdhui / 1000).toFixed(2).replace(".", ",")} L sur {objectifLitres.toFixed(2).replace(".", ",")} L
          aujourd'hui.
        </Text>
        <Pressable style={styles.boutonParfait} onPress={() => navigation.goBack()}>
          <Text style={styles.boutonParfaitTexte}>Parfait</Text>
        </Pressable>
        <Text style={styles.lienAnnuler} onPress={onAnnuler}>
          Annuler ce verre
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(46, 43, 37, 0.34)",
  },
  carte: {
    margin: space[3],
    backgroundColor: colors.bg,
    borderRadius: radius.lg * 1.3,
    paddingVertical: space[7],
    paddingHorizontal: space[6],
    alignItems: "center",
    gap: space[3],
    ...shadow.lg,
  },
  pastille: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.accent2_100,
    alignItems: "center",
    justifyContent: "center",
  },
  titre: { fontFamily: fonts.heading, fontSize: 26, color: colors.text, textAlign: "center" },
  texte: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 22, color: colors.neutral800, textAlign: "center" },
  boutonParfait: {
    alignSelf: "stretch",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space[4],
    alignItems: "center",
    marginTop: space[1],
  },
  boutonParfaitTexte: { fontFamily: fonts.heading, fontSize: 17, color: colors.bg },
  lienAnnuler: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.neutral700 },
});
