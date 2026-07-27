import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { auth } from "@/services/firebaseConfig";
import {
  supprimerPeseeMatinale,
  supprimerPassageToilette,
  supprimerCheatmeal,
  supprimerGrignotage,
} from "@/services/dataService";
import { EcranConteneur } from "@/components/ScreenContainer";
import { Carte } from "@/components/Card";
import { Etiquette } from "@/components/Tag";
import { useAppData } from "@/state/AppDataContext";
import { colors, fonts, space } from "@/theme/theme";
import { RootStackParamList } from "@/navigation/types";
import { BRISTOL_DESCRIPTIONS } from "@/types/models";

type Route = RouteProp<RootStackParamList, "DetailJournee">;

export function DayDetailScreen() {
  const { params } = useRoute<Route>();
  const { date } = params;
  const { pesees, passages, cheatmeals, grignotages, contextes, rafraichir } = useAppData();

  const uid = auth.currentUser?.uid;
  const pesee = pesees.find((p) => p.date === date);
  const passagesJour = passages.filter((p) => p.dateHeure.startsWith(date));
  const cheatmealsJour = cheatmeals.filter((c) => c.dateHeure.startsWith(date));
  const grignotagesJour = grignotages.filter((g) => g.dateHeure.startsWith(date));
  const contextesJour = contextes.filter((c) => c.dateDebut <= date && (!c.dateFin || c.dateFin >= date));

  async function supprimer(action: () => Promise<void>) {
    await action();
    await rafraichir();
  }

  return (
    <EcranConteneur>
      <Text style={styles.titre}>{date}</Text>

      {pesee && (
        <Carte style={{ marginTop: space[4] }}>
          <View style={styles.ligneEntete}>
            <Text style={styles.sousTitre}>Pesée matinale</Text>
            {uid && (
              <Pressable onPress={() => supprimer(() => supprimerPeseeMatinale(uid, pesee.id))}>
                <Text style={styles.supprimer}>Supprimer</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.valeur}>{pesee.poidsKg} kg</Text>
          <Text style={styles.detailTexte}>État du jour : {pesee.etatPsyScore}/5</Text>
          {pesee.etatPsyNote ? <Text style={styles.detailTexte}>« {pesee.etatPsyNote} »</Text> : null}
        </Carte>
      )}

      {passagesJour.map((p) => (
        <Carte key={p.id} style={{ marginTop: space[3] }}>
          <View style={styles.ligneEntete}>
            <Text style={styles.sousTitre}>Passage aux toilettes</Text>
            {uid && (
              <Pressable onPress={() => supprimer(() => supprimerPassageToilette(uid, p.id))}>
                <Text style={styles.supprimer}>Supprimer</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.detailTexte}>
            Type {p.typeBristol} — {BRISTOL_DESCRIPTIONS[p.typeBristol]}
          </Text>
          <Text style={styles.detailTexte}>Difficulté : {p.difficulte}</Text>
          {p.saignement && <Etiquette label="Saignement signalé" ton="accent2" />}
        </Carte>
      ))}

      {cheatmealsJour.map((c) => (
        <Carte key={c.id} style={{ marginTop: space[3] }}>
          <View style={styles.ligneEntete}>
            <Text style={styles.sousTitre}>Un extra</Text>
            {uid && (
              <Pressable onPress={() => supprimer(() => supprimerCheatmeal(uid, c.id))}>
                <Text style={styles.supprimer}>Supprimer</Text>
              </Pressable>
            )}
          </View>
          <Etiquette label={`${c.momentRepas} · ${c.niveau}`} ton="accent" />
        </Carte>
      ))}

      {grignotagesJour.map((g) => (
        <Carte key={g.id} style={{ marginTop: space[3] }}>
          <View style={styles.ligneEntete}>
            <Text style={styles.sousTitre}>Grignotage</Text>
            {uid && (
              <Pressable onPress={() => supprimer(() => supprimerGrignotage(uid, g.id))}>
                <Text style={styles.supprimer}>Supprimer</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.detailTexte}>{new Date(g.dateHeure).toLocaleTimeString("fr-FR")}</Text>
        </Carte>
      ))}

      {contextesJour.map((c) => (
        <Carte key={c.id} style={{ marginTop: space[3] }} tinted="accent2">
          <Text style={styles.sousTitre}>Contexte particulier</Text>
          <Text style={styles.detailTexte}>
            {c.type} · {c.dateDebut} → {c.dateFin ?? "en cours"}
          </Text>
          {c.note ? <Text style={styles.detailTexte}>{c.note}</Text> : null}
        </Carte>
      ))}

      {!pesee &&
        passagesJour.length === 0 &&
        cheatmealsJour.length === 0 &&
        grignotagesJour.length === 0 &&
        contextesJour.length === 0 && <Text style={styles.vide}>Aucune entrée ce jour-là.</Text>}
    </EcranConteneur>
  );
}

const styles = StyleSheet.create({
  titre: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, marginTop: space[4] },
  ligneEntete: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space[2] },
  sousTitre: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.neutral700 },
  supprimer: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.accent700 },
  valeur: { fontFamily: fonts.heading, fontSize: 28, color: colors.text },
  detailTexte: { fontFamily: fonts.body, fontSize: 13.5, color: colors.neutral800, marginTop: 2 },
  vide: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral600, marginTop: space[8], textAlign: "center" },
});
