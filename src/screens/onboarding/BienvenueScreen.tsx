import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/services/firebaseConfig";
import { creerOuMettreAJourUtilisateur, utilisateurParDefaut } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { colors, fonts, space, radius } from "@/theme/theme";
import { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Bienvenue">;

export function BienvenueScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [dejaUnCompte, setDejaUnCompte] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function onCommencer() {
    if (!email || !motDePasse) {
      Alert.alert("Presque", "Il manque ton e-mail ou ton mot de passe.");
      return;
    }
    setEnCours(true);
    try {
      if (dejaUnCompte) {
        await signInWithEmailAndPassword(auth, email, motDePasse);
      } else {
        const credentials = await createUserWithEmailAndPassword(auth, email, motDePasse);
        await creerOuMettreAJourUtilisateur(
          credentials.user.uid,
          utilisateurParDefaut(credentials.user.uid, email)
        );
      }
      navigation.navigate("Profil");
    } catch (e) {
      Alert.alert("Ça n'a pas marché", (e as Error).message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranConteneur scroll={false}>
      <View style={styles.pastille}>
        <Text style={styles.pastilleEmoji}>〜</Text>
      </View>
      <Text style={styles.titre}>Juste toi{"\n"}et une courbe.</Text>
      <Text style={styles.paragraphe}>
        Pas de calories, pas d'objectif, pas de note. On enregistre ce qui se passe, et on
        regarde tranquillement ce que ça raconte.
      </Text>

      <View style={styles.champs}>
        <TextInput
          style={styles.champ}
          placeholder="Ton adresse e-mail"
          placeholderTextColor={colors.neutral600}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.champ}
          placeholder="Un mot de passe"
          placeholderTextColor={colors.neutral600}
          secureTextEntry
          value={motDePasse}
          onChangeText={setMotDePasse}
        />
      </View>

      <View style={styles.bas}>
        <Bouton label={enCours ? "..." : "On commence"} onPress={onCommencer} bloc disabled={enCours} />
        <Text style={styles.lien} onPress={() => setDejaUnCompte((v) => !v)}>
          {dejaUnCompte ? "Créer un compte à la place" : "J'ai déjà un compte"}
        </Text>
      </View>
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  pastille: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.accent2_100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space[8],
    marginBottom: space[6],
  },
  pastilleEmoji: { fontSize: 26, color: colors.accent2_800 },
  titre: { fontFamily: fonts.heading, fontSize: 31, lineHeight: 36, color: colors.text },
  paragraphe: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.neutral800,
    marginTop: space[4],
  },
  champs: { marginTop: space[7], gap: space[2] },
  champ: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: space[4],
    paddingHorizontal: space[6],
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: colors.text,
  },
  bas: { marginTop: "auto", gap: space[3], paddingBottom: space[4] },
  lien: {
    textAlign: "center",
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.neutral700,
  },
});
