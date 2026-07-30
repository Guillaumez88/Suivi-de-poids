import { Platform } from "react-native";
import { enregistrerTokenPush } from "@/services/dataService";

/**
 * Rappels du matin sur web (voir notifications.ts) : pas d'équivalent
 * fiable à une notification locale programmée à l'avance dans un
 * navigateur, donc les rappels web passent par un vrai push serveur
 * (Firebase Cloud Messaging), déclenché par une GitHub Action planifiée
 * (voir .github/workflows/rappels.yml) plutôt que programmé côté client.
 *
 * Ce module ne fait que la partie "abonnement" : demander la permission,
 * enregistrer le service worker, récupérer le jeton FCM de cet appareil et
 * le stocker dans Firestore pour que le script d'envoi puisse le cibler.
 *
 * Import dynamique de firebase/messaging (au lieu d'un import statique en
 * tête de fichier) : ce module est aussi bundlé côté natif (iOS), où
 * `firebase/messaging` s'appuie sur des API navigateur absentes ; le retour
 * anticipé sur `Platform.OS !== "web"` évite de charger ce sous-module là où
 * il ne peut de toute façon pas fonctionner.
 */

// Racine de déploiement (ex. "/Suivi-de-poids" sur GitHub Pages), injectée au
// build par `npm run build:web` (voir package.json) — vide en dev local, où
// l'app est servie à la racine.
const BASE_PATH = process.env.EXPO_PUBLIC_BASE_PATH || "";

// Générée dans la console Firebase : Paramètres du projet > Cloud Messaging >
// Configuration Web Push > "Générer une paire de clés". Valeur publique
// (comme le reste de firebaseConfig.ts), mais propre à ce projet Firebase :
// à remplacer avant la mise en production des rappels web.
const VAPID_KEY = "BJz9is4dZcXFbcmgQgmOR14bmlr58mthgWGs2-GxV8GaWQqAn_ZMOhbQqISBpcbOqIPVpMXHjJ1MkzGbIvEkvQQ";

// activerPushWeb est rappelée à chaque rafraîchissement des données (voir
// App.tsx), potentiellement des dizaines de fois par session — sans ce
// garde-fou, chaque appel rebrancherait un nouvel écouteur "onMessage" en
// plus des précédents, affichant une même notification en double, triple...
let ecouteForegroundActive = false;

export async function activerPushWeb(uid: string): Promise<void> {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || typeof Notification === "undefined" || !("serviceWorker" in navigator)) return;

  const { getMessaging, getToken, isSupported, onMessage } = await import("firebase/messaging");
  const { app } = await import("@/services/firebaseConfig");

  if (!(await isSupported())) return;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.register(`${BASE_PATH}/firebase-messaging-sw.js`);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (token) {
    await enregistrerTokenPush(uid, token);
  }

  // Circuit "app ouverte" : FCM ne passe alors PAS par le service worker
  // (onBackgroundMessage), qui ne reçoit que si l'app est fermée ou en
  // arrière-plan — sans cet écouteur, une notification arrivant pendant que
  // l'app est ouverte est confirmée côté serveur mais jamais affichée.
  if (!ecouteForegroundActive) {
    ecouteForegroundActive = true;
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification ?? {};
      if (title) {
        new Notification(title, { body, icon: `${BASE_PATH}/icon-192.png` });
      }
    });
  }
}
