import React, { useState } from "react";
import { View, Text, Switch, TextInput, Alert, StyleSheet, Share, Pressable } from "react-native";
import { signOut, deleteUser } from "firebase/auth";
import { Download, User as IconeCompte, Trash2, Minus, Plus } from "lucide-react-native";
import { auth } from "@/services/firebaseConfig";
import { creerOuMettreAJourUtilisateur } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { Bouton } from "@/components/Button";
import { Etiquette } from "@/components/Tag";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, iconStrokeWidth } from "@/theme/theme";
import { calculerIMC } from "@/utils/businessRules";
import {
  MensurationZone,
  Sexe,
  UnitePoids,
  UniteLongueur,
  ZONES_MENSURATION_LABELS,
} from "@/types/models";
import { versCsv } from "@/utils/csvExport";

const OPTIONS_SEXE: { valeur: Sexe; label: string }[] = [
  { valeur: "homme", label: "Homme" },
  { valeur: "femme", label: "Femme" },
  { valeur: "non_precise", label: "Non précisé" },
];

const OPTIONS_UNITE_POIDS: { valeur: UnitePoids; label: string }[] = [
  { valeur: "kg", label: "kg" },
  { valeur: "lb", label: "lb" },
];

const OPTIONS_UNITE_LONGUEUR: { valeur: UniteLongueur; label: string }[] = [
  { valeur: "cm", label: "cm" },
  { valeur: "in", label: "in" },
];

const TOUTES_ZONES: MensurationZone[] = ["tour_de_taille", "hanches", "poitrine", "bras", "cuisses"];

export function SettingsScreen() {
  const { utilisateur, pesees, passages, cheatmeals, grignotages, contextes, seancesSport, rafraichir } = useAppData();
  const [enExport, setEnExport] = useState(false);

  if (!utilisateur) {
    return (
      <EcranConteneur>
        <Text>Chargement…</Text>
      </EcranConteneur>
    );
  }

  const imc = calculerIMC(pesees[pesees.length - 1]?.poidsKg ?? 0, utilisateur.tailleCm);
  // Compte existant créé avant l'ajout de ce champ (absent en base), ou
  // valeur invalide écrite par un bug précédent (NaN n'est pas rattrapé
  // par `??`, qui ne réagit qu'à null/undefined) : repli sur 3 dans les
  // deux cas.
  const objectifSeancesSemaine = Number.isFinite(utilisateur.objectifSeancesSemaine)
    ? utilisateur.objectifSeancesSemaine
    : 3;

  async function majChamp(champ: Record<string, unknown>) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await creerOuMettreAJourUtilisateur(uid, champ);
    await rafraichir();
  }

  async function onExporterCsv() {
    setEnExport(true);
    try {
      const csv = versCsv({ pesees, passages, cheatmeals, grignotages, contextes, seancesSport });
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
      <Text style={styles.titre}>Réglages</Text>

      <SectionKicker label="Le matin" />
      <Carte style={{ gap: space[3] }}>
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

      <SectionKicker label="Affichage" />
      <Carte style={{ gap: space[3] }}>
        <View style={styles.ligneSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.labelLigne}>Mon poids en grand</Text>
            <Text style={styles.aide}>Sinon, l'accueil n'affiche que les variations.</Text>
          </View>
          <Switch
            value={utilisateur.afficherPoidsAbsolu}
            onValueChange={(v) => majChamp({ afficherPoidsAbsolu: v })}
            trackColor={{ true: colors.accent, false: colors.neutral300 }}
          />
        </View>
        <View style={styles.diviseur} />
        <View style={styles.ligneSwitch}>
          <Text style={styles.labelLigne}>Sexe</Text>
          <View style={styles.segments}>
            {OPTIONS_SEXE.map((o) => (
              <Text
                key={o.valeur}
                onPress={() => majChamp({ sexe: o.valeur })}
                style={[styles.segment, utilisateur.sexe === o.valeur && styles.segmentActif]}
              >
                {o.label}
              </Text>
            ))}
          </View>
        </View>
        <Text style={styles.aide}>Sert uniquement au calcul de l'IMC{imc !== null ? ` — IMC ${imc.toFixed(1)}` : ""}.</Text>
        <View style={styles.diviseur} />
        <View style={styles.ligneSwitch}>
          <Text style={styles.labelLigne}>Ta taille ({utilisateur.uniteLongueur})</Text>
          <TextInput
            style={styles.champHeure}
            keyboardType="numeric"
            defaultValue={utilisateur.tailleCm?.toString() ?? ""}
            placeholder="—"
            onEndEditing={(e) => {
              const valeur = Number(e.nativeEvent.text.replace(",", "."));
              majChamp(valeur > 0 ? { tailleCm: valeur } : {});
            }}
          />
        </View>
        <View style={styles.diviseur} />
        <View style={styles.ligneSwitch}>
          <Text style={styles.labelLigne}>Unités</Text>
          <View style={styles.segments}>
            {OPTIONS_UNITE_POIDS.map((o) => (
              <Text
                key={o.valeur}
                onPress={() => majChamp({ unitePoids: o.valeur })}
                style={[styles.segment, utilisateur.unitePoids === o.valeur && styles.segmentActif]}
              >
                {o.label}
              </Text>
            ))}
            {OPTIONS_UNITE_LONGUEUR.map((o) => (
              <Text
                key={o.valeur}
                onPress={() => majChamp({ uniteLongueur: o.valeur })}
                style={[styles.segment, utilisateur.uniteLongueur === o.valeur && styles.segmentActif]}
              >
                {o.label}
              </Text>
            ))}
          </View>
        </View>
      </Carte>

      <SectionKicker label="Ce que je suis" />
      <Carte>
        <View style={styles.puces}>
          {TOUTES_ZONES.map((z) => {
            const actif = utilisateur.zonesMensurationActives.includes(z);
            return (
              <Pressable
                key={z}
                onPress={() =>
                  majChamp({
                    zonesMensurationActives: actif
                      ? utilisateur.zonesMensurationActives.filter((x) => x !== z)
                      : [...utilisateur.zonesMensurationActives, z],
                  })
                }
              >
                <Etiquette label={ZONES_MENSURATION_LABELS[z]} ton={actif ? "accent" : "neutral"} />
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.aide, { marginTop: space[3] }]}>Tu peux en ajouter ou en retirer quand tu veux, rien n'est perdu.</Text>
      </Carte>

      <SectionKicker label="Sport" />
      <Carte>
        <View style={styles.ligneSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.labelLigne}>Objectif hebdomadaire</Text>
            <Text style={styles.aide}>Nombre de séances visées chaque semaine.</Text>
          </View>
          <View style={styles.stepperCompact}>
            <Pressable
              style={styles.rondStepperCompact}
              onPress={() => majChamp({ objectifSeancesSemaine: Math.max(0, objectifSeancesSemaine - 1) })}
            >
              <Minus size={16} color={colors.accent700} strokeWidth={3} />
            </Pressable>
            <Text style={styles.valeurStepperCompact}>{objectifSeancesSemaine}</Text>
            <Pressable
              style={[styles.rondStepperCompact, { backgroundColor: colors.accent }]}
              onPress={() => majChamp({ objectifSeancesSemaine: Math.min(7, objectifSeancesSemaine + 1) })}
            >
              <Plus size={16} color={colors.bg} strokeWidth={3} />
            </Pressable>
          </View>
        </View>
      </Carte>

      <SectionKicker label="Tes données" />
      <Carte style={{ padding: 0, overflow: "hidden" }}>
        <LigneDonnee icone={<IconeCompte size={19} color={colors.accent700} strokeWidth={iconStrokeWidth} />} label={utilisateur.email} />
        <View style={styles.diviseurPleineLargeur} />
        <Pressable style={styles.ligneAction} onPress={() => signOut(auth)}>
          <Text style={styles.labelAction}>Se déconnecter</Text>
        </Pressable>
        <View style={styles.diviseurPleineLargeur} />
        <Pressable style={styles.ligneAction} onPress={onExporterCsv} disabled={enExport}>
          <Download size={19} color={colors.accent700} strokeWidth={iconStrokeWidth} />
          <Text style={styles.labelAction}>{enExport ? "Export en cours…" : "Exporter en CSV"}</Text>
          <Text style={styles.aideDroite}>tout, d'un coup</Text>
        </Pressable>
        <View style={styles.diviseurPleineLargeur} />
        <Pressable style={styles.ligneAction} onPress={onSupprimerCompte}>
          <Trash2 size={19} color={colors.neutral700} strokeWidth={iconStrokeWidth} />
          <Text style={[styles.labelAction, { color: colors.neutral700 }]}>Supprimer mon compte</Text>
        </Pressable>
      </Carte>

      <Text style={styles.piedDePage}>Tes données restent sur ton téléphone. Personne d'autre ne les lit.</Text>
    </EcranConteneur>
  );
}

function SectionKicker({ label }: { label: string }) {
  return <Text style={styles.kicker}>{label}</Text>;
}

function LigneDonnee({ icone, label }: { icone: React.ReactNode; label: string }) {
  return (
    <View style={styles.ligneAction}>
      {icone}
      <Text style={styles.labelAction}>{label}</Text>
    </View>
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
  titre: { fontFamily: fonts.heading, fontSize: 27, color: colors.text, marginTop: space[3], marginBottom: space[2] },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.neutral600,
    marginTop: space[4],
    marginBottom: space[2],
    paddingHorizontal: space[1],
  },
  labelLigne: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.text },
  aide: { fontFamily: fonts.body, fontSize: 12.5, color: colors.neutral700 },
  aideDroite: { fontFamily: fonts.body, fontSize: 12.5, fontWeight: "400", color: colors.neutral600, marginLeft: "auto" },
  diviseur: { height: 1, backgroundColor: colors.divider },
  diviseurPleineLargeur: { height: 1, backgroundColor: colors.divider },
  segments: { flexDirection: "row", gap: 5 },
  segment: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.neutral700,
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 999,
    overflow: "hidden",
  },
  segmentActif: { backgroundColor: colors.accent, color: colors.bg, fontWeight: "700" },
  ligneHeure: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
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
  ligneSwitch: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[3] },
  stepperCompact: { flexDirection: "row", alignItems: "center", gap: space[3] },
  rondStepperCompact: { width: 34, height: 34, borderRadius: 999, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  valeurStepperCompact: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, minWidth: 18, textAlign: "center" },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  ligneAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[4],
    paddingHorizontal: space[4],
  },
  labelAction: { fontFamily: fonts.body, fontSize: 14.5, fontWeight: "600", color: colors.text },
  piedDePage: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral600, marginTop: space[4], marginBottom: space[4] },
});
