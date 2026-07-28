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
const admin = require("firebase-admin");

const TOLERANCE_MINUTES = 15; // couvre le délai possible d'un cron GitHub Actions
const FUSEAU = "Europe/Paris";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

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
  for (const doc of tokensSnap.docs) {
    try {
      await admin.messaging().send({
        token: doc.data().token,
        notification: { title: titre, body: corps },
      });
    } catch (err) {
      if (err.code === "messaging/registration-token-not-registered") {
        await doc.ref.delete();
      } else {
        console.error(`  échec d'envoi à ${uid}/${doc.id} :`, err.message);
      }
    }
  }
}

async function main() {
  const maintenant = new Date();
  const aujourdhui = dateLocale(maintenant);
  const minutesMaintenant = versMinutes(heureLocale(maintenant));

  const usersSnap = await db.collection("users").get();
  console.log(`${usersSnap.size} compte(s) à vérifier, ${aujourdhui} ${heureLocale(maintenant)} (${FUSEAU})`);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const u = userDoc.data();
    if (!u.heureRappel1 || !u.heureRappel2) continue;

    const peseeDuJour = await db.collection("users").doc(uid).collection("pesees").doc(aujourdhui).get();
    if (peseeDuJour.exists) continue; // déjà notée : aucun rappel (section 3.5)

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
      if (etat[r.cle]) continue;
      const minutesCible = versMinutes(r.heure);
      const dansLaFenetre = minutesMaintenant >= minutesCible && minutesMaintenant < minutesCible + TOLERANCE_MINUTES;
      if (!dansLaFenetre) continue;

      console.log(`  ${uid} : envoi ${r.cle} (${r.heure})`);
      await envoyerAuxTokens(uid, r.titre, r.corps);
      etat[r.cle] = true;
      modifie = true;
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
