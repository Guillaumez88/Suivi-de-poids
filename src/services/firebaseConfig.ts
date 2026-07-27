import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Configuration Firebase — section 7.2 du cahier des charges.
 *
 * Remplace ces valeurs par celles de TON projet Firebase :
 * Console Firebase > Paramètres du projet > Tes applications > SDK config.
 * Ne commite jamais ce fichier une fois rempli avec de vraies clés dans un
 * dépôt public (il ne contient pas de secret côté serveur, mais autant
 * garder l'habitude propre — voir .gitignore : firebaseConfig.local.ts).
 */
const firebaseConfig = {
  apiKey: "REMPLACE_MOI",
  authDomain: "REMPLACE_MOI.firebaseapp.com",
  projectId: "REMPLACE_MOI",
  storageBucket: "REMPLACE_MOI.appspot.com",
  messagingSenderId: "REMPLACE_MOI",
  appId: "REMPLACE_MOI",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Persistance de la session Auth entre lancements de l'app (AsyncStorage),
// nécessaire en React Native (pas de localStorage natif).
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth ne peut être appelé qu'une fois (Fast Refresh en dev) ;
  // on retombe sur l'instance déjà créée le cas échéant.
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
