import type {
  PeseeMatinale,
  PassageToilette,
  Cheatmeal,
  Grignotage,
  ContextePeriode,
  SeanceSport,
} from "@/types/models";

/** Section 3.8 du cahier des charges : export CSV de toutes les entrées. */

interface Donnees {
  pesees: PeseeMatinale[];
  passages: PassageToilette[];
  cheatmeals: Cheatmeal[];
  grignotages: Grignotage[];
  contextes: ContextePeriode[];
  seancesSport: SeanceSport[];
}

function ligne(valeurs: (string | number | boolean | undefined)[]): string {
  return valeurs
    .map((v) => {
      const s = v === undefined ? "" : String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

export function versCsv(d: Donnees): string {
  const lignes: string[] = [];

  lignes.push("=== Pesées matinales ===");
  lignes.push(ligne(["date", "poids_kg", "etat_psy_score", "etat_psy_note", "mensurations_json"]));
  for (const p of d.pesees) {
    lignes.push(
      ligne([p.date, p.poidsKg, p.etatPsyScore, p.etatPsyNote, JSON.stringify(p.mensurations)])
    );
  }

  lignes.push("");
  lignes.push("=== Passages aux toilettes ===");
  lignes.push(ligne(["date_heure", "type_bristol", "difficulte", "saignement"]));
  for (const t of d.passages) {
    lignes.push(ligne([t.dateHeure, t.typeBristol, t.difficulte, t.saignement]));
  }

  lignes.push("");
  lignes.push("=== Cheatmeals ===");
  lignes.push(ligne(["date_heure", "moment_repas", "niveau"]));
  for (const c of d.cheatmeals) {
    lignes.push(ligne([c.dateHeure, c.momentRepas, c.niveau]));
  }

  lignes.push("");
  lignes.push("=== Grignotages ===");
  lignes.push(ligne(["date_heure"]));
  for (const g of d.grignotages) {
    lignes.push(ligne([g.dateHeure]));
  }

  lignes.push("");
  lignes.push("=== Contextes particuliers ===");
  lignes.push(ligne(["date_debut", "date_fin", "type", "note"]));
  for (const c of d.contextes) {
    lignes.push(ligne([c.dateDebut, c.dateFin, c.type, c.note]));
  }

  lignes.push("");
  lignes.push("=== Séances de sport ===");
  lignes.push(ligne(["date_heure", "intensite", "duree_minutes"]));
  for (const s of d.seancesSport) {
    lignes.push(ligne([s.dateHeure, s.intensite, s.dureeMinutes]));
  }

  return lignes.join("\n");
}
