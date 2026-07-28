import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerGrignotage, supprimerGrignotage } from "@/services/dataService";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius, shadow, iconStrokeWidth } from "@/theme/theme";

function formaterMoment(date: Date): string {
  const jour = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} à ${heure}`;
}

/**
 * Section 3.4 : un tap suffit, rien d'autre. Le grignotage est donc créé
 * dès l'ouverture de cet écran (déclenchée par l'action rapide de
 * l'accueil) — l'écran n'est qu'un accusé de réception, avec une
 * annulation possible, pas un formulaire de confirmation à valider.
 */
export function SnackConfirmScreen() {
  const navigation = useNavigation();
  const { rafraichir } = useAppData();
  const [idCree, setIdCree] = useState<string | null>(null);
  const momentCreation = useRef(new Date()).current;

  useEffect(() => {
    let annule = false;
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const entree = await creerGrignotage(uid);
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
      await supprimerGrignotage(uid, idCree);
      await rafraichir();
    }
    navigation.goBack();
  }

  return (
    <View style={styles.fond}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      <View style={styles.carte}>
        <View style={styles.pastille}>
          <Check size={44} color={colors.accent2_700} strokeWidth={iconStrokeWidth} />
        </View>
        <Text style={styles.titre}>Grignotage noté</Text>
        <Text style={styles.texte}>
          {formaterMoment(momentCreation)}. Voilà, c'est tout — pas de formulaire, pas de commentaire.
        </Text>
        <Pressable style={styles.boutonParfait} onPress={() => navigation.goBack()}>
          <Text style={styles.boutonParfaitTexte}>Parfait</Text>
        </Pressable>
        <Text style={styles.lienAnnuler} onPress={onAnnuler}>
          Annuler ce grignotage
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
