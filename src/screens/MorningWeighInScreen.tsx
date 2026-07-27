import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import { creerPeseeMatinale, getPeseeDuJour } from "@/services/dataService";
import { annulerRappelsDuJour } from "@/services/notifications";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { Bouton } from "@/components/Button";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius } from "@/theme/theme";
import { estDansFenetreMatinale } from "@/utils/businessRules";
import { MensurationZone, ZONES_MENSURATION_LABELS } from "@/types/models";

const VISAGES = ["😞", "😕", "😐", "🙂", "😄"];

function heureLocaleActuelle(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function MorningWeighInScreen() {
  const navigation = useNavigation();
  const { utilisateur, rafraichir } = useAppData();
  const [poids, setPoids] = useState("");
  const [mensurations, setMensurations] = useState<Partial<Record<MensurationZone, string>>>({});
  const [etatPsy, setEtatPsy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState(false);

  const dansLaFenetre = utilisateur
    ? estDansFenetreMatinale(heureLocaleActuelle(), utilisateur.fenetreMatinDebut, utilisateur.fenetreMatinFin)
    : true;

  if (!dansLaFenetre) {
    return (
      <EcranConteneur>
        <Carte style={{ marginTop: space[8] }} tinted="accent2">
          <Text style={styles.titre}>C'est en dehors de ta fenêtre</Text>
          <Text style={styles.texte}>
            Ta fenêtre de pesée est {utilisateur?.fenetreMatinDebut}–{utilisateur?.fenetreMatinFin}.
            Reviens demain matin : un jour manqué n'est pas grave, la moyenne encaisse.
          </Text>
          <Bouton label="Retour" variante="secondary" onPress={() => navigation.goBack()} style={{ marginTop: space[4] }} />
        </Carte>
      </EcranConteneur>
    );
  }

  async function onEnregistrer() {
    const uid = auth.currentUser?.uid;
    const poidsKg = Number(poids.replace(",", "."));
    if (!uid || !poidsKg) {
      Alert.alert("Il manque le poids", "Indique ton poids du matin pour continuer.");
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const dejaFait = await getPeseeDuJour(uid, date);
    if (dejaFait) {
      Alert.alert("Déjà noté", "Tu as déjà enregistré ta pesée de ce matin.");
      return;
    }
    setEnCours(true);
    try {
      const mensurationsNombres: Partial<Record<MensurationZone, number>> = {};
      for (const [zone, valeur] of Object.entries(mensurations)) {
        if (valeur) mensurationsNombres[zone as MensurationZone] = Number(valeur.replace(",", "."));
      }
      await creerPeseeMatinale(uid, {
        date,
        poidsKg,
        mensurations: mensurationsNombres,
        etatPsyScore: etatPsy,
        etatPsyNote: note || undefined,
      });
      await annulerRappelsDuJour();
      await rafraichir();
      navigation.goBack();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranConteneur>
      <Text style={styles.titre}>Le poids du jour</Text>
      <Text style={styles.texte}>Toujours en chiffres exacts ici, même si tu masques le poids ailleurs.</Text>

      <TextInput
        style={styles.champPoids}
        placeholder="0,0"
        placeholderTextColor={colors.neutral500}
        keyboardType="decimal-pad"
        value={poids}
        onChangeText={setPoids}
      />
      <Text style={styles.unite}>{utilisateur?.unitePoids ?? "kg"}</Text>

      {(utilisateur?.zonesMensurationActives ?? []).length > 0 && (
        <Carte style={{ marginTop: space[5] }}>
          <Text style={styles.label}>Mensurations (optionnel)</Text>
          {(utilisateur?.zonesMensurationActives ?? []).map((zone) => (
            <View key={zone} style={styles.ligneMensuration}>
              <Text style={styles.labelLigne}>{ZONES_MENSURATION_LABELS[zone]}</Text>
              <TextInput
                style={styles.champMensuration}
                keyboardType="decimal-pad"
                placeholder={utilisateur?.uniteLongueur ?? "cm"}
                value={mensurations[zone] ?? ""}
                onChangeText={(v) => setMensurations((m) => ({ ...m, [zone]: v }))}
              />
            </View>
          ))}
        </Carte>
      )}

      <Carte style={{ marginTop: space[3] }}>
        <Text style={styles.label}>Comment tu te sens ?</Text>
        <View style={styles.visages}>
          {VISAGES.map((v, i) => {
            const valeur = (i + 1) as 1 | 2 | 3 | 4 | 5;
            return (
              <Pressable
                key={v}
                onPress={() => setEtatPsy(valeur)}
                style={[styles.visage, etatPsy === valeur && styles.visageActif]}
              >
                <Text style={{ fontSize: 22 }}>{v}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={styles.champNote}
          placeholder="Un mot pour toi-même ?"
          placeholderTextColor={colors.neutral600}
          value={note}
          onChangeText={setNote}
        />
      </Carte>

      <Bouton
        label={enCours ? "Enregistrement…" : "Enregistrer"}
        onPress={onEnregistrer}
        disabled={enCours}
        bloc
        style={{ marginTop: space[6] }}
      />
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: fonts.heading, fontSize: 26, color: colors.text, marginTop: space[4] },
  texte: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral700, marginTop: space[2] },
  champPoids: {
    fontFamily: fonts.heading,
    fontSize: 44,
    color: colors.text,
    marginTop: space[5],
    textAlign: "center",
  },
  unite: { textAlign: "center", fontFamily: fonts.body, color: colors.neutral600 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginBottom: space[2] },
  labelLigne: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
  ligneMensuration: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space[2] },
  champMensuration: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: space[1],
    paddingHorizontal: space[4],
    fontFamily: fonts.body,
    color: colors.text,
    minWidth: 80,
    textAlign: "center",
  },
  visages: { flexDirection: "row", justifyContent: "space-between" },
  visage: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  visageActif: { backgroundColor: colors.accent200 },
  champNote: {
    marginTop: space[4],
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: space[3],
    paddingHorizontal: space[5],
    fontFamily: fonts.body,
    color: colors.text,
  },
});
