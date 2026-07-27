import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Utilisateur } from "@/types/models";

/**
 * Rappels quotidiens — sections 3.5 et 5.1 du cahier des charges.
 *
 * Contrainte technique importante : une notification locale programmée à
 * l'avance (ex. "tous les jours à 9h") s'affiche par le système iOS sans
 * relancer le code JS de l'app si celle-ci n'est pas ouverte. Il est donc
 * impossible de vérifier "le formulaire est-il déjà rempli ?" au moment
 * exact où iOS déclenche une notification répétée.
 *
 * Solution retenue : on ne programme jamais de notification "répétée à
 * vie". Chaque jour, l'app programme deux notifications ponctuelles (une
 * pour l'heure de rappel 1, une pour l'heure de rappel 2) et mémorise
 * leurs identifiants. Dès que la pesée du jour est enregistrée, l'app
 * annule immédiatement les rappels du jour encore en attente. Il faut
 * donc appeler `programmerRappelsDuJour` à chaque ouverture de l'app (et
 * idéalement via une tâche de fond quotidienne) pour que le lendemain
 * soit toujours couvert.
 */

const CLE_STOCKAGE = "rappels_programmes_par_date";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function demanderPermissionsNotifications(): Promise<boolean> {
  const { status: statutActuel } = await Notifications.getPermissionsAsync();
  if (statutActuel === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function dateAujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

function prochaineOccurrence(heureHHmm: string): Date {
  const [h, m] = heureHHmm.split(":").map(Number);
  const maintenant = new Date();
  const cible = new Date();
  cible.setHours(h, m, 0, 0);
  if (cible.getTime() <= maintenant.getTime()) {
    cible.setDate(cible.getDate() + 1);
  }
  return cible;
}

interface RappelsStockes {
  date: string;
  idRappel1?: string;
  idRappel2?: string;
}

async function lireRappelsStockes(): Promise<RappelsStockes | null> {
  const brut = await AsyncStorage.getItem(CLE_STOCKAGE);
  return brut ? (JSON.parse(brut) as RappelsStockes) : null;
}

async function ecrireRappelsStockes(valeur: RappelsStockes): Promise<void> {
  await AsyncStorage.setItem(CLE_STOCKAGE, JSON.stringify(valeur));
}

/**
 * À appeler à chaque ouverture de l'app (et idéalement une fois par jour
 * en tâche de fond). Programme les deux rappels du jour s'ils ne le sont
 * pas déjà, sauf si la pesée du jour est déjà enregistrée (section 3.5 :
 * "un rappel n'est pas envoyé si le formulaire du jour est déjà rempli").
 */
export async function programmerRappelsDuJour(
  utilisateur: Pick<Utilisateur, "heureRappel1" | "heureRappel2">,
  formulaireDejaRempliAujourdhui: boolean
): Promise<void> {
  const aujourdhui = dateAujourdhui();
  const existant = await lireRappelsStockes();

  // Déjà programmés pour aujourd'hui : rien à refaire.
  if (existant?.date === aujourdhui) return;

  // Nouveau jour : on nettoie les identifiants de la veille au cas où.
  if (existant) {
    await annulerRappel(existant.idRappel1);
    await annulerRappel(existant.idRappel2);
  }

  if (formulaireDejaRempliAujourdhui) {
    await ecrireRappelsStockes({ date: aujourdhui });
    return;
  }

  const idRappel1 = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pesée du matin",
      body: "À jeun, tenue légère, si possible à la même heure : deux minutes suffisent.",
      data: { date: aujourdhui, type: "rappel_pesee" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: prochaineOccurrence(utilisateur.heureRappel1),
    },
  });

  const idRappel2 = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Toujours partant pour la pesée ?",
      body: "Un dernier rappel avant la fin de la fenêtre du matin.",
      data: { date: aujourdhui, type: "rappel_pesee" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: prochaineOccurrence(utilisateur.heureRappel2),
    },
  });

  await ecrireRappelsStockes({ date: aujourdhui, idRappel1, idRappel2 });
}

async function annulerRappel(id?: string): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // déjà déclenché ou déjà annulé : rien à faire.
  }
}

/**
 * À appeler juste après l'enregistrement réussi de la pesée matinale, pour
 * annuler tout rappel du jour encore en attente.
 */
export async function annulerRappelsDuJour(): Promise<void> {
  const existant = await lireRappelsStockes();
  if (!existant || existant.date !== dateAujourdhui()) return;
  await annulerRappel(existant.idRappel1);
  await annulerRappel(existant.idRappel2);
  await ecrireRappelsStockes({ date: existant.date });
}
