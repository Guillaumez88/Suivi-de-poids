/**
 * Modèles de données — section 4 du cahier des charges (v1.4).
 * Six entités, plus le profil (sexe, taille, réglages) rattaché à Utilisateur.
 */

export type UnitePoids = "kg" | "lb";
export type UniteLongueur = "cm" | "in";
export type Sexe = "homme" | "femme" | "non_precise";

export type MensurationZone =
  | "tour_de_taille"
  | "hanches"
  | "poitrine"
  | "bras"
  | "cuisses";

export interface Utilisateur {
  id: string;
  email: string;

  // Fenêtre de saisie matinale et rappels (section 5.1) — "HH:mm", 24h.
  fenetreMatinDebut: string; // défaut "06:00"
  fenetreMatinFin: string; // défaut "11:00"
  heureRappel1: string; // défaut "09:00"
  heureRappel2: string; // défaut "10:00"

  unitePoids: UnitePoids; // défaut "kg"
  uniteLongueur: UniteLongueur; // défaut "cm"
  zonesMensurationActives: MensurationZone[];

  // Ajouts v1.3 / v1.4 (section 3.9, 3.10)
  sexe: Sexe; // défaut "non_precise" — jamais un choix forcé binaire
  tailleCm?: number; // stature, distincte du tour de taille ; requise pour l'IMC
  afficherPoidsAbsolu: boolean; // défaut true

  objectifSeancesSemaine: number; // 0-7, défaut 3
  objectifEauLitres: number; // défaut 2 (recommandation usuelle)

  creeLe: string; // ISO 8601
}

export interface PeseeMatinale {
  id: string;
  utilisateurId: string;
  date: string; // "YYYY-MM-DD", une seule entrée par jour
  poidsKg: number;
  mensurations: Partial<Record<MensurationZone, number>>;
  etatPsyScore: 1 | 2 | 3 | 4 | 5;
  etatPsyNote?: string;
  creeLe: string;
  modifieLe: string;
}

export type DifficulteSelles = "facile" | "normale" | "difficile";

export interface PassageToilette {
  id: string;
  utilisateurId: string;
  dateHeure: string; // ISO 8601, plusieurs par jour possibles
  typeBristol: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  difficulte: DifficulteSelles;
  saignement: boolean; // défaut false
  creeLe: string;
  modifieLe: string;
}

export type MomentRepas = "petit_dejeuner" | "brunch" | "dejeuner" | "diner";
export type NiveauCheatmeal = "petit" | "moyen" | "gros";

export interface Cheatmeal {
  id: string;
  utilisateurId: string;
  dateHeure: string;
  momentRepas: MomentRepas;
  niveau: NiveauCheatmeal;
  creeLe: string;
  modifieLe: string;
}

export interface Grignotage {
  id: string;
  utilisateurId: string;
  dateHeure: string;
  creeLe: string;
  modifieLe: string;
}

export type IntensiteSport = "leger" | "modere" | "intense";
export type DureeSeanceSport = 15 | 30 | 60; // minutes

export interface SeanceSport {
  id: string;
  utilisateurId: string;
  dateHeure: string; // ISO 8601
  intensite: IntensiteSport;
  dureeMinutes: DureeSeanceSport;
  creeLe: string;
  modifieLe: string;
}

export interface ConsommationEau {
  id: string;
  utilisateurId: string;
  dateHeure: string; // ISO 8601, plusieurs par jour
  volumeMl: number; // 250 par défaut (un verre), gardé au cas où
  creeLe: string;
  modifieLe: string;
}

export type TypeContexte = "voyage" | "cycle_menstruel" | "maladie" | "autre";

export interface ContextePeriode {
  id: string;
  utilisateurId: string;
  dateDebut: string; // "YYYY-MM-DD"
  dateFin?: string; // "YYYY-MM-DD", absente si en cours
  type: TypeContexte;
  note?: string;
  creeLe: string;
  modifieLe: string;
}

export const ZONES_MENSURATION_LABELS: Record<MensurationZone, string> = {
  tour_de_taille: "Tour de taille",
  hanches: "Hanches",
  poitrine: "Poitrine",
  bras: "Bras",
  cuisses: "Cuisses",
};

export const BRISTOL_DESCRIPTIONS: Record<number, string> = {
  1: "Morceaux durs séparés, comme des noix",
  2: "En forme de saucisse mais grumeleux",
  3: "Comme une saucisse avec des fissures en surface",
  4: "Comme une saucisse ou un serpent, lisse et souple",
  5: "Morceaux mous avec des bords nets",
  6: "Morceaux mous et pâteux, bords irréguliers",
  7: "Liquide, sans morceaux solides",
};
