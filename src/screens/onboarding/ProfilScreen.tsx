import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { auth } from "@/services/firebaseConfig";
import { creerOuMettreAJourUtilisateur } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { Carte } from "@/components/Card";
import { SegmentedControl } from "@/components/SegmentedControl";
import { colors, fonts, space, radius } from "@/theme/theme";
import { OnboardingStackParamList } from "@/navigation/types";
import {
  MensurationZone,
  Sexe,
  UnitePoids,
  UniteLongueur,
  ZONES_MENSURATION_LABELS,
} from "@/types/models";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Profil">;

const ZONES: MensurationZone[] = ["tour_de_taille", "hanches", "poitrine", "bras", "cuisses"];

// Section 10 (clôture) : trois choix, jamais un choix binaire forcé.
const OPTIONS_SEXE: { valeur: Sexe; label: string }[] = [
  { valeur: "homme", label: "Homme" },
  { valeur: "femme", label: "Femme" },
  { valeur: "non_precise", label: "Non précisé" },
];

export function ProfilScreen({ navigation }: Props) {
  const [unitePoids, setUnitePoids] = useState<UnitePoids>("kg");
  const [uniteLongueur, setUniteLongueur] = useState<UniteLongueur>("cm");
  const [sexe, setSexe] = useState<Sexe>("non_precise");
  const [tailleCm, setTailleCm] = useState("");
  const [zones, setZones] = useState<MensurationZone[]>(["tour_de_taille"]);

  function basculerZone(zone: MensurationZone) {
    setZones((z) => (z.includes(zone) ? z.filter((x) => x !== zone) : [...z, zone]));
  }

  async function onContinuer() {
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await creerOuMettreAJourUtilisateur(uid, {
          unitePoids,
          uniteLongueur,
          sexe,
          ...(tailleCm ? { tailleCm: Number(tailleCm) } : {}),
          zonesMensurationActives: zones,
        });
      } catch (e) {
        Alert.alert("Ça n'a pas marché", (e as Error).message ?? "Erreur inconnue.");
        return;
      }
    }
    navigation.navigate("Rituel");
  }

  return (
    <EcranConteneur>
      <Text style={styles.etape}>← Étape 2 sur 3</Text>
      <Text style={styles.titre}>Tu comptes en quoi ?</Text>
      <Text style={styles.sousTitre}>Modifiable à tout moment, sans rien perdre.</Text>

      <Carte style={{ marginTop: space[5] }}>
        <Text style={styles.label}>Le poids</Text>
        <SegmentedControl
          options={[
            { valeur: "kg", label: "kilos" },
            { valeur: "lb", label: "livres" },
          ]}
          valeur={unitePoids}
          onChange={setUnitePoids}
          fondInactif={colors.bg}
        />

        <Text style={[styles.label, { marginTop: space[4] }]}>Ton sexe</Text>
        <Text style={styles.aide}>
          Uniquement pour situer l'IMC — « Non précisé » ne change rien au reste de l'app.
        </Text>
        <SegmentedControl options={OPTIONS_SEXE} valeur={sexe} onChange={setSexe} fondInactif={colors.bg} />

        <Text style={[styles.label, { marginTop: space[4] }]}>Ta taille</Text>
        <TextInput
          style={styles.champTaille}
          placeholder={uniteLongueur === "cm" ? "en cm" : "en pouces"}
          placeholderTextColor={colors.neutral600}
          keyboardType="numeric"
          value={tailleCm}
          onChangeText={setTailleCm}
        />

        <Text style={[styles.label, { marginTop: space[4] }]}>Les mensurations</Text>
        <SegmentedControl
          options={[
            { valeur: "cm", label: "cm" },
            { valeur: "in", label: "pouces" },
          ]}
          valeur={uniteLongueur}
          onChange={setUniteLongueur}
          fondInactif={colors.bg}
        />
      </Carte>

      <Text style={[styles.titre, { fontSize: 22, marginTop: space[6] }]}>
        Et tu suis quelles zones ?
      </Text>
      <Text style={styles.sousTitre}>
        Zéro obligation — le tour de taille suffit largement pour commencer.
      </Text>
      <View style={styles.puces}>
        {ZONES.map((z) => {
          const actif = zones.includes(z);
          return (
            <Pressable
              key={z}
              onPress={() => basculerZone(z)}
              style={[styles.puce, actif && styles.puceActive]}
            >
              <Text style={[styles.puceTexte, actif && styles.puceTexteActif]}>
                {ZONES_MENSURATION_LABELS[z]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Bouton label="Continuer" onPress={onContinuer} bloc style={{ marginTop: space[7] }} />
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  etape: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.neutral700, marginTop: space[3] },
  titre: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 32, color: colors.text, marginTop: space[3] },
  sousTitre: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral700, marginTop: space[2] },
  label: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text, marginBottom: space[2] },
  aide: { fontFamily: fonts.body, fontSize: 12.5, color: colors.neutral700, marginBottom: space[2] },
  champTaille: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: space[3],
    paddingHorizontal: space[5],
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[3] },
  puce: {
    borderRadius: radius.pill,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.neutral200,
  },
  puceActive: { backgroundColor: colors.accent },
  puceTexte: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.neutral800 },
  puceTexteActif: { color: colors.bg },
});
