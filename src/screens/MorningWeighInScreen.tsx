import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronDown } from "lucide-react-native";
import { auth } from "@/services/firebaseConfig";
import { creerPeseeMatinale, getPeseeDuJour } from "@/services/dataService";
import { annulerRappelsDuJour } from "@/services/notifications";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { Bouton } from "@/components/Button";
import { Stepper } from "@/components/Stepper";
import { VisageHumeur } from "@/components/icons";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius, iconStrokeWidth } from "@/theme/theme";
import { estDansFenetreMatinale } from "@/utils/businessRules";
import { MensurationZone, ZONES_MENSURATION_LABELS } from "@/types/models";

const PAS_POIDS = 0.1;

function heureLocaleActuelle(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/** Temps restant avant la fin de la fenêtre matinale, formaté "3h48". */
function tempsRestant(fin: string): string {
  const maintenant = new Date();
  const [h, m] = fin.split(":").map(Number);
  const finDate = new Date(maintenant);
  finDate.setHours(h, m, 0, 0);
  const minutesRestantes = Math.max(0, Math.round((finDate.getTime() - maintenant.getTime()) / 60000));
  const heures = Math.floor(minutesRestantes / 60);
  const minutes = minutesRestantes % 60;
  return `${heures}h${minutes.toString().padStart(2, "0")}`;
}

export function MorningWeighInScreen() {
  const navigation = useNavigation();
  const { utilisateur, pesees, rafraichir } = useAppData();
  const dernierPoids = pesees[pesees.length - 1]?.poidsKg;
  const [poids, setPoids] = useState(dernierPoids ?? 70);
  const [zoneOuverte, setZoneOuverte] = useState<MensurationZone | null>(null);
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

  const derniereValeurZone = (zone: MensurationZone): string => {
    const derniere = [...pesees].reverse().find((p) => p.mensurations[zone] !== undefined);
    return derniere ? `${derniere.mensurations[zone]}` : "—";
  };

  async function onEnregistrer() {
    const uid = auth.currentUser?.uid;
    if (!uid || enCours) return;
    // Désactivé avant tout await : un double-tap ne doit pas pouvoir lancer
    // deux enregistrements concurrents (la vérification "déjà fait" qui suit
    // est asynchrone, donc insuffisante seule contre un appui rapide double).
    setEnCours(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const dejaFait = await getPeseeDuJour(uid, date);
      if (dejaFait) {
        Alert.alert("Déjà noté", "Tu as déjà enregistré ta pesée de ce matin.");
        return;
      }
      const mensurationsNombres: Partial<Record<MensurationZone, number>> = {};
      for (const [zone, valeur] of Object.entries(mensurations)) {
        if (valeur) mensurationsNombres[zone as MensurationZone] = Number(valeur.replace(",", "."));
      }
      await creerPeseeMatinale(uid, {
        date,
        poidsKg: Math.round(poids * 10) / 10,
        mensurations: mensurationsNombres,
        etatPsyScore: etatPsy,
        ...(note ? { etatPsyNote: note } : {}),
      });
      await annulerRappelsDuJour();
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
      <View style={styles.entete}>
        <Text style={styles.annuler} onPress={() => navigation.goBack()}>
          Annuler
        </Text>
        {utilisateur && (
          <View style={styles.badgeRestant}>
            <Text style={styles.badgeRestantTexte}>encore {tempsRestant(utilisateur.fenetreMatinFin)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.titre}>Bonjour toi.{"\n"}On note le chiffre ?</Text>
      <Text style={styles.texte}>Il ne veut rien dire tout seul — c'est la ligne des semaines qui parle.</Text>

      <View style={styles.stepper}>
        <Stepper
          valeur={poids}
          onChange={setPoids}
          pas={PAS_POIDS}
          formatValeur={(v) => v.toFixed(1)}
          unite={(utilisateur?.unitePoids ?? "kg").toUpperCase()}
        />
      </View>

      {(utilisateur?.zonesMensurationActives ?? []).length > 0 && (
        <View style={{ marginTop: space[4] }}>
          <Text style={styles.label}>Mensurations — optionnel</Text>
          <View style={{ gap: space[2], marginTop: space[2] }}>
            {(utilisateur?.zonesMensurationActives ?? []).map((zone) => (
              <Carte key={zone}>
                <Pressable
                  style={styles.ligneMensuration}
                  onPress={() => setZoneOuverte((z) => (z === zone ? null : zone))}
                >
                  <Text style={styles.labelLigne}>{ZONES_MENSURATION_LABELS[zone]}</Text>
                  <View style={styles.ligneMensurationDroite}>
                    <Text style={styles.valeurMensuration}>{derniereValeurZone(zone)}</Text>
                    <ChevronDown size={18} color={colors.neutral700} strokeWidth={iconStrokeWidth} />
                  </View>
                </Pressable>
                {zoneOuverte === zone && (
                  <TextInput
                    style={styles.champMensuration}
                    keyboardType="decimal-pad"
                    autoFocus
                    placeholder={utilisateur?.uniteLongueur ?? "cm"}
                    value={mensurations[zone] ?? ""}
                    onChangeText={(v) => setMensurations((m) => ({ ...m, [zone]: v }))}
                  />
                )}
              </Carte>
            ))}
          </View>
        </View>
      )}

      <Text style={[styles.label, { marginTop: space[5] }]}>Et dans la tête, ce matin ?</Text>
      <View style={styles.visages}>
        {([1, 2, 3, 4, 5] as const).map((niveau) => (
          <Pressable
            key={niveau}
            onPress={() => setEtatPsy(niveau)}
            style={[styles.visage, etatPsy === niveau && styles.visageActif]}
          >
            <VisageHumeur niveau={niveau} size={26} color={etatPsy === niveau ? colors.bg : colors.neutral700} />
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.champNote}
        placeholder="Un mot pour toi-même ? (facultatif)"
        placeholderTextColor={colors.neutral600}
        value={note}
        onChangeText={setNote}
      />

      <Bouton
        label={enCours ? "Enregistrement…" : "C'est noté"}
        onPress={onEnregistrer}
        disabled={enCours}
        bloc
        style={{ marginTop: space[6] }}
      />
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space[3] },
  annuler: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.neutral700 },
  badgeRestant: { backgroundColor: colors.accent2_100, borderRadius: radius.pill, paddingVertical: space[1], paddingHorizontal: space[3] },
  badgeRestantTexte: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.accent2_800 },
  titre: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 31, color: colors.text, marginTop: space[3] },
  texte: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral700, marginTop: space[2] },
  stepper: {
    marginTop: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.neutral600 },
  labelLigne: { fontFamily: fonts.body, fontSize: 15, fontWeight: "600", color: colors.text },
  ligneMensuration: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ligneMensurationDroite: { flexDirection: "row", alignItems: "center", gap: space[2] },
  valeurMensuration: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  champMensuration: {
    marginTop: space[2],
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: space[1],
    paddingHorizontal: space[4],
    fontFamily: fonts.body,
    color: colors.text,
  },
  visages: { flexDirection: "row", gap: space[2], marginTop: space[2] },
  visage: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  visageActif: { backgroundColor: colors.accent },
  champNote: {
    marginTop: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: space[3],
    paddingHorizontal: space[5],
    fontFamily: fonts.body,
    color: colors.text,
  },
});
