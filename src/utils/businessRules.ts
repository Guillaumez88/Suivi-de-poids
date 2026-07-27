/**
 * Règles métier — section 5 du cahier des charges (v1.4).
 * Fonctions pures, sans dépendance à React Native ni à Firebase,
 * pour rester testables indépendamment de l'app.
 */

export interface PeseeJour {
  date: string; // "YYYY-MM-DD"
  poidsKg: number;
}

export type MarqueurKilo = "perte" | "prise" | null;

export interface MarqueurCalendrier {
  date: string;
  palier: number;
  marqueur: MarqueurKilo;
}

/** Section 5.2 — le "palier" est la partie entière du poids. */
export function palierDeKilo(poidsKg: number): number {
  return Math.floor(poidsKg);
}

/**
 * Section 5.2 — un marqueur n'apparaît que lorsque le palier change par
 * rapport à la pesée précédente. Ne pas confondre avec une variation de
 * référence glissante : chaque jour est comparé au jour précédent, jamais
 * à un point de départ fixe. Les pesées doivent être triées par date
 * croissante avant l'appel.
 */
export function calculerMarqueursCalendrier(
  pesees: PeseeJour[]
): MarqueurCalendrier[] {
  const triees = [...pesees].sort((a, b) => a.date.localeCompare(b.date));
  const resultat: MarqueurCalendrier[] = [];
  let palierPrecedent: number | null = null;

  for (const p of triees) {
    const palier = palierDeKilo(p.poidsKg);
    let marqueur: MarqueurKilo = null;
    if (palierPrecedent !== null) {
      if (palier < palierPrecedent) marqueur = "perte";
      else if (palier > palierPrecedent) marqueur = "prise";
    }
    resultat.push({ date: p.date, palier, marqueur });
    palierPrecedent = palier;
  }
  return resultat;
}

export function ajouterJours(date: string, jours: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

/**
 * Section 5.4 — moyenne mobile sur `fenetreJours` jours glissants se
 * terminant à `date` incluse. Les jours sans pesée n'entrent pas dans le
 * calcul : la moyenne se fait sur les valeurs disponibles uniquement.
 * Retourne null si aucune pesée n'est disponible dans la fenêtre.
 */
export function moyenneMobile(
  pesees: PeseeJour[],
  date: string,
  fenetreJours = 7
): number | null {
  const debut = ajouterJours(date, -(fenetreJours - 1));
  const valeurs = pesees
    .filter((p) => p.date >= debut && p.date <= date)
    .map((p) => p.poidsKg);
  if (valeurs.length === 0) return null;
  const somme = valeurs.reduce((acc, v) => acc + v, 0);
  return somme / valeurs.length;
}

export interface Tendance {
  deltaKg: number;
  joursCouverts: number;
}

/**
 * Section 5.4 — tendance à N jours : différence entre la moyenne mobile
 * 7 jours d'aujourd'hui et celle d'il y a N jours. `joursCouverts`
 * indique combien de jours d'historique existent réellement dans la
 * fenêtre [date - N, date], pour ne pas donner une impression de
 * précision que les données ne permettent pas (section 5.4, point de
 * vigilance sur les fenêtres longues).
 */
export function tendance(
  pesees: PeseeJour[],
  date: string,
  nJours: number
): Tendance | null {
  const dateReference = ajouterJours(date, -nJours);
  const maAujourdhui = moyenneMobile(pesees, date, 7);
  const maReference = moyenneMobile(pesees, dateReference, 7);
  if (maAujourdhui === null || maReference === null) return null;

  const debutFenetre = ajouterJours(date, -nJours);
  const joursCouverts = pesees.filter(
    (p) => p.date >= debutFenetre && p.date <= date
  ).length;

  return {
    deltaKg: Math.round((maAujourdhui - maReference) * 10) / 10,
    joursCouverts,
  };
}

export interface PointSerieMoyenneMobile {
  date: string;
  moyenne: number | null;
}

/**
 * Section 5.4 / courbe d'accueil — série de moyennes mobiles jour par jour
 * sur les `nJours` se terminant à `dateFin` (incluse), pour alimenter le
 * tracé de la courbe. Réutilise `moyenneMobile` pour chaque jour plutôt que
 * de recalculer la fenêtre glissante à la main.
 */
export function serieMoyenneMobile(
  pesees: PeseeJour[],
  dateFin: string,
  nJours: number,
  fenetreMoyenne = 7
): PointSerieMoyenneMobile[] {
  const debut = ajouterJours(dateFin, -(nJours - 1));
  const resultat: PointSerieMoyenneMobile[] = [];
  let date = debut;
  while (date <= dateFin) {
    resultat.push({ date, moyenne: moyenneMobile(pesees, date, fenetreMoyenne) });
    date = ajouterJours(date, 1);
  }
  return resultat;
}

/**
 * Section 5.2 — écart avec la pesée valide la plus récente strictement
 * avant `date`. Alimente le badge de variation de l'accueil (jamais un
 * jugement "bon/mauvais", juste un chiffre et une direction). Retourne
 * null si la pesée du jour ou une pesée antérieure manque.
 */
export function deltaDepuisPeseePrecedente(
  pesees: PeseeJour[],
  date: string
): number | null {
  const triees = [...pesees].sort((a, b) => a.date.localeCompare(b.date));
  const peseeDuJour = triees.find((p) => p.date === date);
  if (!peseeDuJour) return null;
  const precedente = [...triees].reverse().find((p) => p.date < date);
  if (!precedente) return null;
  return Math.round((peseeDuJour.poidsKg - precedente.poidsKg) * 10) / 10;
}

/** Section 5.7 — IMC = poids / taille² (taille en mètres). Pas de catégorie affichée. */
export function calculerIMC(
  poidsKg: number,
  tailleCm: number | undefined
): number | null {
  if (!tailleCm || tailleCm <= 0) return null;
  const tailleM = tailleCm / 100;
  return Math.round((poidsKg / (tailleM * tailleM)) * 10) / 10;
}

export interface PassageAvecSaignement {
  dateHeure: string; // ISO 8601
  saignement: boolean;
}

/**
 * Section 5.3 — alerte douce si au moins `seuil` occurrences de
 * saignement sont signalées sur une fenêtre glissante de `fenetreJours`
 * jours se terminant à `date` (incluse). Seuil par défaut validé : 2/7.
 */
export function alerteSaignementRecurrent(
  passages: PassageAvecSaignement[],
  date: string,
  fenetreJours = 7,
  seuil = 2
): boolean {
  const debut = `${ajouterJours(date, -(fenetreJours - 1))}T00:00:00.000Z`;
  const fin = `${date}T23:59:59.999Z`;
  const occurrences = passages.filter(
    (p) => p.saignement && p.dateHeure >= debut && p.dateHeure <= fin
  ).length;
  return occurrences >= seuil;
}

/**
 * Section 5.1 — fenêtre de saisie matinale (défaut 6h-11h, "HH:mm").
 * `heureLocale` au format "HH:mm" (24h), déjà résolue dans le fuseau de
 * l'utilisateur.
 */
export function estDansFenetreMatinale(
  heureLocale: string,
  debut: string,
  fin: string
): boolean {
  return heureLocale >= debut && heureLocale <= fin;
}

/**
 * Section 3.5 / 5.1 — un rappel n'est pas envoyé si le formulaire du jour
 * est déjà rempli (règle validée, plus aucune ambiguïté).
 */
export function rappelDoitEtreEnvoye(formulaireDejaRempliAujourdhui: boolean): boolean {
  return !formulaireDejaRempliAujourdhui;
}
