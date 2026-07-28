import {
  dateISOAujourdhui,
  estLeJour,
  palierDeKilo,
  calculerMarqueursCalendrier,
  moyenneMobile,
  tendance,
  serieMoyenneMobile,
  deltaDepuisPeseePrecedente,
  calculerIMC,
  alerteSaignementRecurrent,
  estDansFenetreMatinale,
  rappelDoitEtreEnvoye,
  construireJoursMois,
  decouperEnGroupes,
  construireSemaine,
} from "./businessRules";

describe("dateISOAujourdhui", () => {
  test("retourne une date au format YYYY-MM-DD", () => {
    expect(dateISOAujourdhui()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("estLeJour", () => {
  test("compare la partie date d'un horodatage ISO à un jour donné", () => {
    expect(estLeJour("2026-07-20T14:32:00.000Z", "2026-07-20")).toBe(true);
    expect(estLeJour("2026-07-21T00:00:00.000Z", "2026-07-20")).toBe(false);
  });
});

describe("palierDeKilo (section 5.2)", () => {
  test("prend la partie entière du poids", () => {
    expect(palierDeKilo(82.5)).toBe(82);
    expect(palierDeKilo(81.9)).toBe(81);
    expect(palierDeKilo(82.0)).toBe(82);
  });
});

describe("calculerMarqueursCalendrier (section 5.2)", () => {
  test("reproduit l'exemple validé du cahier des charges (lundi à vendredi)", () => {
    const pesees = [
      { date: "2026-07-20", poidsKg: 82.5 }, // lundi
      { date: "2026-07-21", poidsKg: 82.2 }, // mardi
      { date: "2026-07-22", poidsKg: 82.1 }, // mercredi
      { date: "2026-07-23", poidsKg: 82.3 }, // jeudi
      { date: "2026-07-24", poidsKg: 81.9 }, // vendredi
    ];
    const marqueurs = calculerMarqueursCalendrier(pesees);
    expect(marqueurs.map((m) => m.marqueur)).toEqual([
      null, // premier jour : rien à comparer
      null,
      null,
      null,
      "perte", // 82 -> 81
    ]);
  });

  test("marque une prise quand le palier remonte", () => {
    const pesees = [
      { date: "2026-08-01", poidsKg: 81.4 },
      { date: "2026-08-02", poidsKg: 82.1 },
    ];
    const marqueurs = calculerMarqueursCalendrier(pesees);
    expect(marqueurs[1].marqueur).toBe("prise");
  });

  test("oscillation autour d'une frontière : un marqueur à chaque traversée (comportement validé)", () => {
    const pesees = [
      { date: "2026-08-01", poidsKg: 81.95 },
      { date: "2026-08-02", poidsKg: 82.05 },
      { date: "2026-08-03", poidsKg: 81.98 },
    ];
    const marqueurs = calculerMarqueursCalendrier(pesees);
    expect(marqueurs.map((m) => m.marqueur)).toEqual([null, "prise", "perte"]);
  });
});

describe("moyenneMobile et tendance (section 5.4)", () => {
  const peseesEparses = [
    { date: "2026-06-28", poidsKg: 83.5 },
    { date: "2026-07-05", poidsKg: 82.9 },
    { date: "2026-07-20", poidsKg: 82.5 },
    { date: "2026-07-21", poidsKg: 82.2 },
    { date: "2026-07-22", poidsKg: 82.1 },
    { date: "2026-07-23", poidsKg: 82.3 },
    { date: "2026-07-24", poidsKg: 81.9 },
  ];

  test("moyenne mobile 7 jours ignore les jours sans pesée", () => {
    const ma = moyenneMobile(peseesEparses, "2026-07-24", 7);
    // seules les 5 pesées du 20 au 24 juillet tombent dans la fenêtre de 7 jours
    expect(ma).toBeCloseTo((82.5 + 82.2 + 82.1 + 82.3 + 81.9) / 5, 5);
  });

  test("tendance retourne null si aucune pesée ne tombe dans la fenêtre de comparaison", () => {
    // il n'y a aucune pesée autour du 17 juillet (J-7) ni du 24 juin (J-30)
    // dans ce jeu de données volontairement épars.
    expect(tendance(peseesEparses, "2026-07-24", 7)).toBeNull();
    expect(tendance(peseesEparses, "2026-07-24", 30)).toBeNull();
  });

  // Jeu de données dense (une pesée par jour sur 40 jours, poids en baisse
  // régulière) pour tester une tendance réellement calculable.
  const peseesQuotidiennes: { date: string; poidsKg: number }[] = [];
  {
    const debut = new Date("2026-06-15T00:00:00Z");
    for (let i = 0; i < 40; i++) {
      const d = new Date(debut);
      d.setUTCDate(d.getUTCDate() + i);
      peseesQuotidiennes.push({
        date: d.toISOString().slice(0, 10),
        poidsKg: Math.round((84.0 - i * 0.05) * 10) / 10,
      });
    }
  }

  test("tendance 7 et 30 jours calculables avec un historique quotidien dense", () => {
    const t7 = tendance(peseesQuotidiennes, "2026-07-24", 7);
    const t30 = tendance(peseesQuotidiennes, "2026-07-24", 30);
    expect(t7).not.toBeNull();
    expect(t30).not.toBeNull();
    // Poids en baisse régulière : la perte cumulée sur 30 jours est plus
    // importante (delta plus négatif) que sur 7 jours.
    expect(t30!.deltaKg).toBeLessThan(t7!.deltaKg);
    expect(t30!.joursCouverts).toBeGreaterThan(t7!.joursCouverts);
  });
});

describe("serieMoyenneMobile (courbe d'accueil)", () => {
  const peseesEparses = [
    { date: "2026-07-20", poidsKg: 82.5 },
    { date: "2026-07-21", poidsKg: 82.2 },
    { date: "2026-07-22", poidsKg: 82.1 },
    { date: "2026-07-23", poidsKg: 82.3 },
    { date: "2026-07-24", poidsKg: 81.9 },
  ];

  test("retourne un point par jour sur la plage demandée", () => {
    const serie = serieMoyenneMobile(peseesEparses, "2026-07-24", 5);
    expect(serie.map((p) => p.date)).toEqual([
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
    ]);
  });

  test("les jours sans historique dans la fenêtre glissante ont une moyenne nulle", () => {
    const serie = serieMoyenneMobile(peseesEparses, "2026-07-24", 10);
    expect(serie[0].moyenne).toBeNull(); // 2026-07-15, aucune pesée dans les 7 jours précédents
    expect(serie[serie.length - 1].moyenne).not.toBeNull();
  });
});

describe("deltaDepuisPeseePrecedente (section 5.2)", () => {
  const pesees = [
    { date: "2026-07-23", poidsKg: 82.3 },
    { date: "2026-07-24", poidsKg: 81.9 },
  ];

  test("calcule l'écart avec la pesée valide précédente", () => {
    expect(deltaDepuisPeseePrecedente(pesees, "2026-07-24")).toBeCloseTo(-0.4, 5);
  });

  test("retourne null s'il n'y a pas de pesée antérieure", () => {
    expect(deltaDepuisPeseePrecedente(pesees, "2026-07-23")).toBeNull();
  });

  test("retourne null si aucune pesée n'existe à la date demandée", () => {
    expect(deltaDepuisPeseePrecedente(pesees, "2026-07-25")).toBeNull();
  });
});

describe("calculerIMC (section 5.7)", () => {
  test("calcule l'IMC avec une décimale", () => {
    expect(calculerIMC(82.5, 180)).toBeCloseTo(25.5, 1);
  });

  test("retourne null sans taille renseignée", () => {
    expect(calculerIMC(82.5, undefined)).toBeNull();
  });
});

describe("alerteSaignementRecurrent (section 5.3)", () => {
  test("se déclenche à partir de 2 occurrences sur 7 jours (seuil validé)", () => {
    const passages = [
      { dateHeure: "2026-07-20T08:00:00.000Z", saignement: true },
      { dateHeure: "2026-07-23T19:00:00.000Z", saignement: true },
      { dateHeure: "2026-07-24T07:00:00.000Z", saignement: false },
    ];
    expect(alerteSaignementRecurrent(passages, "2026-07-24")).toBe(true);
  });

  test("ne se déclenche pas en dessous du seuil", () => {
    const passages = [
      { dateHeure: "2026-07-24T07:00:00.000Z", saignement: true },
    ];
    expect(alerteSaignementRecurrent(passages, "2026-07-24")).toBe(false);
  });
});

describe("estDansFenetreMatinale et rappelDoitEtreEnvoye (sections 3.5 / 5.1)", () => {
  test("6h-11h par défaut", () => {
    expect(estDansFenetreMatinale("07:12", "06:00", "11:00")).toBe(true);
    expect(estDansFenetreMatinale("11:01", "06:00", "11:00")).toBe(false);
    expect(estDansFenetreMatinale("05:59", "06:00", "11:00")).toBe(false);
  });

  test("un rappel n'est pas envoyé si le formulaire est déjà rempli", () => {
    expect(rappelDoitEtreEnvoye(true)).toBe(false);
    expect(rappelDoitEtreEnvoye(false)).toBe(true);
  });
});

describe("construireJoursMois (vue Mois)", () => {
  test("aligne le 1er du mois sur son jour de semaine et complète la dernière rangée à 7", () => {
    // Juillet 2026 commence un mercredi : 2 cases vides avant le 1er.
    const jours = construireJoursMois(2026, 6, new Set(), new Set(), new Set(), new Map());
    expect(jours[0]).toBeNull();
    expect(jours[1]).toBeNull();
    expect(jours[2]).toEqual({
      date: "2026-07-01",
      numero: 1,
      cheatmeal: false,
      grignotage: false,
      sport: false,
      marqueur: null,
    });
    expect(jours.length % 7).toBe(0);
    // Le dernier jour réel (31) doit être suivi uniquement de cases vides.
    const dernierJourReel = jours.filter((j) => j !== null).at(-1);
    expect(dernierJourReel?.numero).toBe(31);
  });

  test("marque un jour avec extra, grignotage, sport et le marqueur de poids", () => {
    const jours = construireJoursMois(
      2026,
      6,
      new Set(["2026-07-05"]),
      new Set(["2026-07-05"]),
      new Set(["2026-07-05"]),
      new Map([["2026-07-05", "perte"]])
    );
    const jour5 = jours.find((j) => j?.date === "2026-07-05");
    expect(jour5).toEqual({
      date: "2026-07-05",
      numero: 5,
      cheatmeal: true,
      grignotage: true,
      sport: true,
      marqueur: "perte",
    });
  });
});

describe("decouperEnGroupes", () => {
  test("découpe en groupes de la taille demandée, dernier groupe partiel inclus", () => {
    expect(decouperEnGroupes([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(decouperEnGroupes([1, 2, 3, 4], 7).length).toBe(1);
  });
});

describe("construireSemaine (accueil)", () => {
  test("retourne les 7 jours à partir du lundi donné, avec les marqueurs du jour", () => {
    const cheatmeals = [{ dateHeure: "2026-07-22T20:00:00.000Z" }]; // mercredi
    const grignotages = [{ dateHeure: "2026-07-25T16:00:00.000Z" }]; // samedi
    const marqueurs = [{ date: "2026-07-24", palier: 81, marqueur: "perte" as const }];

    const semaine = construireSemaine("2026-07-20", cheatmeals, grignotages, marqueurs);

    expect(semaine).toHaveLength(7);
    expect(semaine[0].date).toBe("2026-07-20");
    expect(semaine[6].date).toBe("2026-07-26");
    expect(semaine[2]).toEqual({ date: "2026-07-22", aUnExtra: true, aUnGrignotage: false, marqueurJour: null });
    expect(semaine[5]).toEqual({ date: "2026-07-25", aUnExtra: false, aUnGrignotage: true, marqueurJour: null });
    expect(semaine[4].marqueurJour).toBe("perte"); // 2026-07-24
  });
});
