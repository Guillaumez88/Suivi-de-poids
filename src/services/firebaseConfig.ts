import { initializeApp, getApps, getApp } from "firebase/app";
// @ts-expect-error — getReactNativePersistence existe à l'exécution (Metro résout la
// condition "react-native" du package @firebase/auth), mais le fichier de types que tsc
// consulte pour "firebase/auth" ne le déclare pas (limitation connue du SDK Firebase JS).
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
  apiKey: "AIzaSyBVEK44Ni477yXEPW8IHp0KN1eVTjGMrUA",
  authDomain: "suivi-de-poids.firebaseapp.com",
  projectId: "suivi-de-poids",
  storageBucket: "suivi-de-poids.firebasestorage.app",
  messagingSenderId: "357271601703",
  appId: "1:357271601703:web:f4c0d36ef176e55a530402",
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
