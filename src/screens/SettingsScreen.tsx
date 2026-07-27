import React, { useState } from "react";
import { View, Text, Switch, TextInput, Alert, StyleSheet, Share } from "react-native";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "@/services/firebaseConfig";
import { creerOuMettreAJourUtilisateur } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { Bouton } from "@/components/Button";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space } from "@/theme/theme";
import { calculerIMC } from "@/utils/businessRules";
import {
  MensurationZone,
  Sexe,
  ZONES_MENSURATION_LABELS,
} from "@/types/models";
import { versCsv } from "@/utils/csvExport";

const OPTIONS_SEXE: { valeur: Sexe; label: string }[] = [
  { valeur: "homme", label: "Homme" },
  { valeur: "femme", label: "Femme" },
  { valeur: "non_precise", label: "Non précisé" },
];

const TOUTES_ZONES: MensurationZone[] = ["tour_de_taille", "hanches", "poitrine", "bras", "cuisses"];

export function SettingsScreen() {
  const { utilisateur, pesees, passages, cheatmeals, grignotages, contextes, rafraichir } = useAppData();
  const [enExport, setEnExport] = useState(false);

  if (!utilisateur) {
    return (
      <EcranConteneur>
        <Text>Chargement…</Text>
      </EcranConteneur>
    );
  }

  const imc = calculerIMC(pesees[pesees.length - 1]?.poidsKg ?? 0, utilisateur.tailleCm);

  async function majChamp(champ: Record<string, unknown>) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await creerOuMettreAJourUtilisateur(uid, champ);
    await rafraichir();
  }

  async function onExporterCsv() {
    setEnExport(true);
    try {
      const csv = versCsv({ pesees, passages, cheatmeals, grignotages, contextes });
      await Share.share({ message: csv, title: "Export suivi de poids (CSV)" });
    } finally {
      setEnExport(false);
    }
  }

  function onSupprimerCompte() {
    Alert.alert(
      "Supprimer le compte",
      "Toutes tes données seront définitivement supprimées. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const u = auth.currentUser;
            if (u) await deleteUser(u);
            // Note : pour supprimer aussi les sous-collections Firestore de
            // l'utilisateur, prévoir une Cloud Function déclenchée sur la
            // suppression du compte Auth (non incluse dans ce scaffold).
          },
        },
      ]
    );
  }

  return (
    <EcranConteneur>
      <Text style={styles.titre}>Paramètres</Text>

      <Carte style={{ marginTop: space[4] }}>
        <Text style={styles.label}>Compte</Text>
        <Text style={styles.valeurTexte}>{utilisateur.email}</Text>
        <Bouton label="Se déconnecter" variante="ghost" onPress={() => signOut(auth)} />
      </Carte>

      <Carte style={{ marginTop: space[3] }}>
        <Text style={styles.label}>Sexe</Text>
        <View style={styles.segments}>
          {OPTIONS_SEXE.map((o) => (
            <Bouton
              key={o.valeur}
              label={o.label}
              variante={utilisateur.sexe === o.valeur ? "primary" : "secondary"}
              onPress={() => majChamp({ sexe: o.valeur })}
              style={{ flex: 1 }}
            />
          ))}
        </View>

        <Text style={[styles.label, { marginTop: space[4] }]}>Taille (cm)</Text>
        <TextInput
          style={styles.champ}
          keyboardType="numeric"
          defaultValue={utilisateur.tailleCm?.toString() ?? ""}
          onEndEditing={(e) => majChamp({ tailleCm: Number(e.nativeEvent.text) || undefined })}
        />
        <Text style={styles.aide}>
          IMC {imc !== null ? imc.toFixed(1) : "— (renseigne ta taille pour le voir)"}
        </Text>
      </Carte>

      <Carte style={{ marginTop: space[3] }}>
        <Text style={styles.label}>Fenêtre matinale et rappels</Text>
        <ChampHeureLigne
          label="Début de la fenêtre"
          valeur={utilisateur.fenetreMatinDebut}
          onChange={(v) => majChamp({ fenetreMatinDebut: v })}
        />
        <ChampHeureLigne
          label="Fin de la fenêtre"
          valeur={utilisateur.fenetreMatinFin}
          onChange={(v) => majChamp({ fenetreMatinFin: v })}
        />
        <ChampHeureLigne
          label="Rappel 1"
          valeur={utilisateur.heureRappel1}
          onChange={(v) => majChamp({ heureRappel1: v })}
        />
        <ChampHeureLigne
          label="Rappel 2"
          valeur={utilisateur.heureRappel2}
          onChange={(v) => majChamp({ heureRappel2: v })}
        />
      </Carte>

      <Carte style={{ marginTop: space[3] }}>
        <View style={styles.ligneSwitch}>
          <Text style={styles.label}>Masquer le poids absolu</Text>
          <Switch
            value={utilisateur.afficherPoidsAbsolu === false}
            onValueChange={(v) => majChamp({ afficherPoidsAbsolu: !v })}
            trackColor={{ true: colors.accent, false: colors.neutral300 }}
          />
        </View>
        <Text style={styles.aide}>N'affiche que les variations, jamais le chiffre exact.</Text>
      </Carte>

      <Carte style={{ marginTop: space[3] }}>
        <Text style={styles.label}>Zones de mensuration suivies</Text>
        <View style={styles.puces}>
          {TOUTES_ZONES.map((z) => {
            const actif = utilisateur.zonesMensurationActives.includes(z);
            return (
              <Bouton
                key={z}
                label={ZONES_MENSURATION_LABELS[z]}
                variante={actif ? "primary" : "secondary"}
                onPress={() =>
                  majChamp({
                    zonesMensurationActives: actif
                      ? utilisateur.zonesMensurationActives.filter((x) => x !== z)
                      : [...utilisateur.zonesMensurationActives, z],
                  })
                }
              />
            );
          })}
        </View>
      </Carte>

      <Bouton
        label={enExport ? "Export en cours…" : "Exporter mes données (CSV)"}
        onPress={onExporterCsv}
        disabled={enExport}
        bloc
        style={{ marginTop: space[5] }}
      />
      <Bouton
        label="Supprimer mon compte"
        variante="ghost"
        onPress={onSupprimerCompte}
        style={{ marginTop: space[3], alignSelf: "center" }}
      />
    </EcranConteneur>
  );
}

function ChampHeureLigne({
  label,
  valeur,
  onChange,
}: {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.ligneHeure}>
      <Text style={styles.labelLigne}>{label}</Text>
      <TextInput
        style={styles.champHeure}
        defaultValue={valeur}
        onEndEditing={(e) => onChange(e.nativeEvent.text)}
        placeholder="HH:mm"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, marginTop: space[4] },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginBottom: space[2] },
  labelLigne: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  valeurTexte: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral700, marginBottom: space[2] },
  aide: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral700, marginTop: space[2] },
  segments: { flexDirection: "row", gap: space[2] },
  champ: {
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    fontFamily: fonts.body,
    color: colors.text,
  },
  ligneHeure: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space[2] },
  champHeure: {
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingVertical: space[1],
    paddingHorizontal: space[4],
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.text,
    minWidth: 72,
    textAlign: "center",
  },
  ligneSwitch: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
