import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import type {
  Utilisateur,
  PeseeMatinale,
  PassageToilette,
  Cheatmeal,
  Grignotage,
  ContextePeriode,
  SeanceSport,
  ConsommationEau,
  TokenPush,
} from "@/types/models";

/**
 * Couche d'accès aux données — Firestore, structuré en sous-collections
 * de `users/{uid}` pour que les règles de sécurité (firestore.rules)
 * puissent restreindre chaque utilisateur à ses propres documents
 * (section 8.2 du cahier des charges).
 */

function nowIso(): string {
  return new Date().toISOString();
}

function genId(): string {
  return doc(collection(db, "_ids")).id;
}

// ---------- Utilisateur / profil ----------

export async function getUtilisateur(uid: string): Promise<Utilisateur | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as Utilisateur) : null;
}

export async function creerOuMettreAJourUtilisateur(
  uid: string,
  data: Partial<Utilisateur>
): Promise<void> {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

export function utilisateurParDefaut(uid: string, email: string): Utilisateur {
  return {
    id: uid,
    email,
    fenetreMatinDebut: "06:00",
    fenetreMatinFin: "11:00",
    heureRappel1: "09:00",
    heureRappel2: "10:00",
    unitePoids: "kg",
    uniteLongueur: "cm",
    zonesMensurationActives: ["tour_de_taille"],
    sexe: "non_precise",
    afficherPoidsAbsolu: true,
    objectifSeancesSemaine: 3,
    objectifEauLitres: 2,
    creeLe: nowIso(),
  };
}

// ---------- Générique par sous-collection ----------

function sousCollection(uid: string, nom: string) {
  return collection(db, "users", uid, nom);
}

async function creer<T extends { id: string }>(
  uid: string,
  nomCollection: string,
  donnees: Omit<T, "id" | "creeLe" | "modifieLe">,
  idPersonnalise?: string
): Promise<T> {
  const id = idPersonnalise ?? genId();
  const horodatage = nowIso();
  const entree = { ...donnees, id, creeLe: horodatage, modifieLe: horodatage } as unknown as T;
  await setDoc(doc(sousCollection(uid, nomCollection), id), entree);
  return entree;
}

// Section 5.6 : édition et suppression autorisées à tout moment, mise à
// jour du champ modifié_le, sans historique versionné des valeurs
// précédentes.
async function modifier(
  uid: string,
  nomCollection: string,
  id: string,
  donnees: Record<string, unknown>
): Promise<void> {
  await updateDoc(doc(sousCollection(uid, nomCollection), id), {
    ...donnees,
    modifieLe: nowIso(),
  });
}

async function supprimer(uid: string, nomCollection: string, id: string): Promise<void> {
  await deleteDoc(doc(sousCollection(uid, nomCollection), id));
}

// Sous-collections existantes de users/{uid} — à tenir à jour si une
// nouvelle est ajoutée (utilisée par supprimerToutesLesDonnees ci-dessous).
const TOUTES_LES_SOUS_COLLECTIONS = [
  "pesees",
  "passagesToilette",
  "cheatmeals",
  "grignotages",
  "contextes",
  "seancesSport",
  "consommationsEau",
  "tokensPush",
];

const TAILLE_LOT_MAX = 450; // marge sous la limite de 500 opérations par batch Firestore

// Suppression de compte (section 3.10) : Firebase Auth ne supprime pas les
// données Firestore associées. À appeler avant `deleteUser`, tant que
// l'utilisateur est encore authentifié (les règles Firestore exigent
// request.auth.uid == uid, qui ne serait plus vrai une fois le compte Auth
// supprimé). Pas de Cloud Function ici : ça imposerait de passer le projet
// au forfait payant Blaze, écarté pour ce projet (cf. les rappels, qui
// utilisent une GitHub Action plutôt que Cloud Scheduler pour la même
// raison) — la suppression se fait donc entièrement côté client.
export async function supprimerToutesLesDonnees(uid: string): Promise<void> {
  const refs: DocumentReference[] = [];
  for (const nomCollection of TOUTES_LES_SOUS_COLLECTIONS) {
    const snap = await getDocs(sousCollection(uid, nomCollection));
    snap.forEach((d) => refs.push(d.ref));
  }
  refs.push(doc(db, "users", uid));

  for (let i = 0; i < refs.length; i += TAILLE_LOT_MAX) {
    const lot = writeBatch(db);
    for (const ref of refs.slice(i, i + TAILLE_LOT_MAX)) {
      lot.delete(ref);
    }
    await lot.commit();
  }
}

// ---------- Pesée matinale (section 3.1 : une par jour) ----------

export async function getPeseeDuJour(
  uid: string,
  date: string
): Promise<PeseeMatinale | null> {
  const q = query(sousCollection(uid, "pesees"), where("date", "==", date));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as PeseeMatinale);
}

export async function getPesees(uid: string): Promise<PeseeMatinale[]> {
  const q = query(sousCollection(uid, "pesees"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PeseeMatinale);
}

export function creerPeseeMatinale(
  uid: string,
  donnees: Omit<PeseeMatinale, "id" | "creeLe" | "modifieLe" | "utilisateurId">
) {
  // Id du document = date : garantit "une pesée par jour" au niveau base de
  // données (un double envoi accidentel écrase le même document au lieu de
  // créer un doublon qui fausserait la moyenne mobile).
  return creer<PeseeMatinale>(uid, "pesees", { ...donnees, utilisateurId: uid }, donnees.date);
}

export const modifierPeseeMatinale = (uid: string, id: string, d: Record<string, unknown>) =>
  modifier(uid, "pesees", id, d);
export const supprimerPeseeMatinale = (uid: string, id: string) =>
  supprimer(uid, "pesees", id);

// ---------- Passage aux toilettes ----------

export async function getPassagesToilette(uid: string): Promise<PassageToilette[]> {
  const q = query(sousCollection(uid, "passagesToilette"), orderBy("dateHeure", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PassageToilette);
}

export function creerPassageToilette(
  uid: string,
  donnees: Omit<PassageToilette, "id" | "creeLe" | "modifieLe" | "utilisateurId">
) {
  return creer<PassageToilette>(uid, "passagesToilette", { ...donnees, utilisateurId: uid });
}

export const modifierPassageToilette = (uid: string, id: string, d: Record<string, unknown>) =>
  modifier(uid, "passagesToilette", id, d);
export const supprimerPassageToilette = (uid: string, id: string) =>
  supprimer(uid, "passagesToilette", id);

// ---------- Cheatmeal ----------

export async function getCheatmeals(uid: string): Promise<Cheatmeal[]> {
  const q = query(sousCollection(uid, "cheatmeals"), orderBy("dateHeure", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Cheatmeal);
}

export function creerCheatmeal(
  uid: string,
  donnees: Omit<Cheatmeal, "id" | "creeLe" | "modifieLe" | "utilisateurId">
) {
  return creer<Cheatmeal>(uid, "cheatmeals", { ...donnees, utilisateurId: uid });
}

export const modifierCheatmeal = (uid: string, id: string, d: Record<string, unknown>) =>
  modifier(uid, "cheatmeals", id, d);
export const supprimerCheatmeal = (uid: string, id: string) => supprimer(uid, "cheatmeals", id);

// ---------- Grignotage ----------

export async function getGrignotages(uid: string): Promise<Grignotage[]> {
  const q = query(sousCollection(uid, "grignotages"), orderBy("dateHeure", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Grignotage);
}

export function creerGrignotage(uid: string) {
  const horodatage = nowIso();
  return creer<Grignotage>(uid, "grignotages", {
    utilisateurId: uid,
    dateHeure: horodatage,
  });
}

export const supprimerGrignotage = (uid: string, id: string) => supprimer(uid, "grignotages", id);

// ---------- Contexte particulier ----------

export async function getContextes(uid: string): Promise<ContextePeriode[]> {
  const q = query(sousCollection(uid, "contextes"), orderBy("dateDebut", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ContextePeriode);
}

export function creerContexte(
  uid: string,
  donnees: Omit<ContextePeriode, "id" | "creeLe" | "modifieLe" | "utilisateurId">
) {
  return creer<ContextePeriode>(uid, "contextes", { ...donnees, utilisateurId: uid });
}

export const modifierContexte = (uid: string, id: string, d: Record<string, unknown>) =>
  modifier(uid, "contextes", id, d);
export const supprimerContexte = (uid: string, id: string) => supprimer(uid, "contextes", id);

// ---------- Séance de sport ----------

export async function getSeancesSport(uid: string): Promise<SeanceSport[]> {
  const q = query(sousCollection(uid, "seancesSport"), orderBy("dateHeure", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SeanceSport);
}

export function creerSeanceSport(
  uid: string,
  donnees: Omit<SeanceSport, "id" | "creeLe" | "modifieLe" | "utilisateurId">
) {
  return creer<SeanceSport>(uid, "seancesSport", { ...donnees, utilisateurId: uid });
}

export const supprimerSeanceSport = (uid: string, id: string) => supprimer(uid, "seancesSport", id);

// ---------- Consommation d'eau ----------

export async function getConsommationsEau(uid: string): Promise<ConsommationEau[]> {
  const q = query(sousCollection(uid, "consommationsEau"), orderBy("dateHeure", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ConsommationEau);
}

export function creerConsommationEau(uid: string, volumeMl = 250) {
  return creer<ConsommationEau>(uid, "consommationsEau", {
    utilisateurId: uid,
    dateHeure: nowIso(),
    volumeMl,
  });
}

export const supprimerConsommationEau = (uid: string, id: string) =>
  supprimer(uid, "consommationsEau", id);

// ---------- Token push (rappels web, section notifications) ----------

// Id du document = le token lui-même : un ré-enregistrement du même appareil
// écrase simplement l'entrée existante au lieu de créer un doublon.
export function enregistrerTokenPush(uid: string, token: string) {
  return creer<TokenPush>(uid, "tokensPush", { utilisateurId: uid, token }, token);
}

// Note : `Timestamp` est ré-exporté au cas où un écran préfère stocker les
// horodatages en Timestamp Firestore natif plutôt qu'en chaîne ISO ; ce
// projet utilise des chaînes ISO partout pour rester simple à tester
// (cf. businessRules.ts, qui ne dépend pas de Firestore).
export { Timestamp };
