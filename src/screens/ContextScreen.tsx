import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Plus, Droplet } from "lucide-react-native";
import { auth } from "@/services/firebaseConfig";
import { creerContexte } from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Bouton } from "@/components/Button";
import { IconeVoyage, IconeMaladie } from "@/components/icons";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space, radius, iconStrokeWidth } from "@/theme/theme";
import { TypeContexte } from "@/types/models";

const TYPES: { valeur: TypeContexte; label: string; icone: (couleur: string) => React.ReactNode }[] = [
  { valeur: "voyage", label: "Voyage", icone: (c) => <IconeVoyage size={26} color={c} /> },
  { valeur: "cycle_menstruel", label: "Cycle menstruel", icone: (c) => <Droplet size={26} color={c} strokeWidth={iconStrokeWidth} /> },
  { valeur: "maladie", label: "Maladie", icone: (c) => <IconeMaladie size={26} color={c} /> },
  { valeur: "autre", label: "Autre chose", icone: (c) => <Plus size={26} color={c} strokeWidth={iconStrokeWidth} /> },
];

function dateISOAujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ContextScreen() {
  const navigation = useNavigation();
  const { rafraichir } = useAppData();
  const [type, setType] = useState<TypeContexte>("voyage");
  const [dateDebut, setDateDebut] = useState(dateISOAujourdhui());
  const [dateFin, setDateFin] = useState("");
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function onAjouter() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setEnCours(true);
    try {
      await creerContexte(uid, {
        type,
        dateDebut,
        dateFin: dateFin || undefined,
        note: note || undefined,
      });
      await rafraichir();
      navigation.goBack();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranConteneur>
      <Text style={styles.titre}>Il se passe{"\n"}quelque chose ?</Text>
      <Text style={styles.texte}>
        La balance bouge pour mille raisons qui n'ont rien à voir avec toi. Autant que la courbe
        le sache.
      </Text>

      <View style={styles.grille}>
        {TYPES.map((t) => {
          const actif = type === t.valeur;
          return (
            <Pressable
              key={t.valeur}
              onPress={() => setType(t.valeur)}
              style={[styles.carte, actif && styles.carteActive]}
            >
              {t.icone(actif ? colors.accent2_900 : colors.neutral800)}
              <Text style={[styles.carteTexte, actif && styles.carteTexteActif]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.blocDates}>
        <View style={styles.ligneDate}>
          <Text style={styles.labelDate}>À partir du</Text>
          <TextInput style={styles.champDate} value={dateDebut} onChangeText={setDateDebut} placeholder="AAAA-MM-JJ" />
        </View>
        <View style={styles.separateur} />
        <View style={styles.ligneDate}>
          <Text style={styles.labelDate}>Jusqu'au (si tu sais)</Text>
          <TextInput style={styles.champDate} value={dateFin} onChangeText={setDateFin} placeholder="AAAA-MM-JJ" />
        </View>
      </View>

      <TextInput
        style={styles.champNote}
        placeholder="Une note (optionnel)"
        placeholderTextColor={colors.neutral600}
        value={note}
        onChangeText={setNote}
        multiline
      />

      <Bouton
        label={enCours ? "…" : "Ajouter le contexte"}
        onPress={onAjouter}
        disabled={enCours}
        bloc
        style={{ marginTop: space[6] }}
      />
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 32, color: colors.text, marginTop: space[4] },
  texte: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.neutral700, marginTop: space[2] },
  grille: { flexDirection: "row", flexWrap: "wrap", gap: space[2], marginTop: space[5] },
  carte: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
  },
  carteActive: { backgroundColor: colors.accent2_200 },
  carteTexte: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  carteTexteActif: { color: colors.accent2_900 },
  blocDates: { marginTop: space[5], backgroundColor: colors.surface, borderRadius: radius.lg, padding: space[4] },
  ligneDate: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labelDate: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  champDate: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.text,
  },
  separateur: { height: 1, backgroundColor: colors.divider, marginVertical: space[3] },
  champNote: {
    marginTop: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    minHeight: 60,
  },
});
