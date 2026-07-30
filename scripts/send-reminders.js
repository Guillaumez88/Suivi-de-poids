// Envoie les rappels du matin ("Pesée du matin") aux utilisateurs web via
// Firebase Cloud Messaging. Remplace, uniquement pour la plateforme web, la
// programmation locale de notifications utilisée côté natif
// (src/services/notifications.ts) — un navigateur n'a pas d'équivalent
// fiable à "notification programmée qui se déclenche même app fermée".
//
// Exécuté périodiquement par .github/workflows/rappels.yml (cron), pas en
// continu : chaque exécution vérifie, pour chaque utilisateur, si l'heure
// configurée (heureRappel1/heureRappel2, fuseau Europe/Paris) vient de
// passer et si le rappel correspondant n'a pas déjà été envoyé aujourd'hui.
// firebase-admin v13+ : l'ancienne API "namespace" (admin.credential.cert,
// admin.firestore(), admin.messaging()) n'existe plus sur l'export par
// défaut — il faut les sous-modules dédiés ci-dessous.
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

const FUSEAU = "Europe/Paris";
// Déclenché manuellement (workflow_dispatch, entrée "forcer") pour tester
// sans attendre l'heure configurée : ignore la fenêtre horaire et le
// "déjà envoyé aujourd'hui", mais respecte toujours "pesée déjà notée".
const FORCER = process.env.FORCER_ENVOI === "true";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const messaging = getMessaging(app);

function heureLocale(date) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour").value;
  const m = parts.find((p) => p.type === "minute").value;
  return `${h}:${m}`;
}

function dateLocale(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU }).formatToParts(date);
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

// "HH:mm" -> minutes depuis minuit, pour comparer avec tolérance.
function versMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

async function envoyerAuxTokens(uid, titre, corps) {
  const tokensSnap = await db.collection("users").doc(uid).collection("tokensPush").get();
  if (tokensSnap.empty) {
    console.log(`    ${uid} : aucun token push enregistré, rien à envoyer`);
    return;
  }
  console.log(`    ${uid} : ${tokensSnap.size} token(s) push à contacter`);
  for (const doc of tokensSnap.docs) {
    try {
      const messageId = await messaging.send({
        token: doc.data().token,
        notification: { title: titre, body: corps },
      });
      console.log(`      -> envoyé à ${doc.id.slice(0, 12)}… (messageId ${messageId})`);
    } catch (err) {
      if (err.code === "messaging/registration-token-not-registered") {
        console.log(`      -> token ${doc.id.slice(0, 12)}… périmé, supprimé`);
        await doc.ref.delete();
      } else {
        console.error(`      -> échec d'envoi à ${doc.id.slice(0, 12)}… :`, err.code || err.message);
      }
    }
  }
}

async function main() {
  const maintenant = new Date();
  const aujourdhui = dateLocale(maintenant);
  const minutesMaintenant = versMinutes(heureLocale(maintenant));

  const usersSnap = await db.collection("users").get();
  console.log(
    `${usersSnap.size} compte(s) à vérifier, ${aujourdhui} ${heureLocale(maintenant)} (${FUSEAU})${FORCER ? " — mode forcé" : ""}`
  );

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const u = userDoc.data();
    if (!u.heureRappel1 || !u.heureRappel2) continue;

    const peseeDuJour = await db.collection("users").doc(uid).collection("pesees").doc(aujourdhui).get();
    if (peseeDuJour.exists) {
      if (FORCER) console.log(`  ${uid} : pesée déjà notée aujourd'hui, aucun rappel envoyé`);
      continue; // déjà notée : aucun rappel (section 3.5)
    }

    let etat = u.rappelsEnvoyes;
    if (!etat || etat.date !== aujourdhui) {
      etat = { date: aujourdhui, rappel1: false, rappel2: false };
    }

    const rappels = [
      { cle: "rappel1", heure: u.heureRappel1, titre: "Pesée du matin", corps: "À jeun, tenue légère : deux minutes suffisent." },
      { cle: "rappel2", heure: u.heureRappel2, titre: "Toujours partant pour la pesée ?", corps: "Un dernier rappel avant la fin de la fenêtre du matin." },
    ];

    let modifie = false;
    for (const r of rappels) {
      if (etat[r.cle] && !FORCER) continue;
      // Pas de borne haute : les runs planifiés GitHub Actions peuvent être
      // retardés de façon très irrégulière (observé : plusieurs heures de
      // décalage), donc on ne rate plus le rappel faute d'un run tombé
      // exactement dans une fenêtre étroite après l'heure cible.
      // "etat[r.cle]" empêche un envoi en double une fois fait, et la remise
      // à zéro quotidienne (plus haut) évite qu'un rappel non envoyé un jour
      // ne traîne sur le jour suivant.
      const minutesCible = versMinutes(r.heure);
      const heureDepassee = minutesMaintenant >= minutesCible;
      if (!heureDepassee && !FORCER) continue;

      console.log(`  ${uid} : envoi ${r.cle} (${r.heure})`);
      await envoyerAuxTokens(uid, r.titre, r.corps);
      if (!FORCER) {
        etat[r.cle] = true;
        modifie = true;
      }
    }

    if (modifie) {
      await db.collection("users").doc(uid).update({ rappelsEnvoyes: etat });
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
