import { versCsv } from "./csvExport";

const VIDE = { pesees: [], passages: [], cheatmeals: [], grignotages: [], contextes: [], seancesSport: [] };

describe("versCsv (section 3.8)", () => {
  test("échappe les virgules, guillemets et retours à la ligne dans une note", () => {
    const csv = versCsv({
      ...VIDE,
      contextes: [
        {
          id: "1",
          utilisateurId: "u",
          dateDebut: "2026-07-01",
          type: "autre",
          note: 'Une virgule, des "guillemets" et\nune ligne en plus',
          creeLe: "2026-07-01T00:00:00.000Z",
          modifieLe: "2026-07-01T00:00:00.000Z",
        },
      ],
    });
    // Un champ contenant un retour à la ligne doit être entouré de guillemets
    // (sinon il fragmenterait le CSV sur plusieurs lignes de façon invalide) ;
    // on cherche dans le CSV complet, pas ligne par ligne, puisque le champ
    // entouré de guillemets contient lui-même un "\n".
    expect(csv).toContain('2026-07-01,,autre,"Une virgule, des ""guillemets"" et\nune ligne en plus"');
  });

  test("inclut l'heure de saisie (creeLe) des pesées, pas seulement la date", () => {
    const csv = versCsv({
      ...VIDE,
      pesees: [
        {
          id: "1",
          utilisateurId: "u",
          date: "2026-07-20",
          poidsKg: 82.5,
          mensurations: {},
          etatPsyScore: 3,
          creeLe: "2026-07-20T07:05:00.000Z",
          modifieLe: "2026-07-20T07:05:00.000Z",
        },
      ],
    });
    expect(csv).toContain("2026-07-20,2026-07-20T07:05:00.000Z,82.5");
  });

  test("les sections vides ne produisent que l'en-tête, sans ligne de données", () => {
    const csv = versCsv(VIDE);
    expect(csv).toContain("=== Pesées matinales ===");
    expect(csv).toContain("=== Séances de sport ===");
  });
});
