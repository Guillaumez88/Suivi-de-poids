/**
 * Design tokens extraits du système "Organic" livré par Claude Design
 * (fichier _ds/organic.../styles.css et readme.md des maquettes).
 * Toute couleur, taille de police, espacement ou rayon utilisé dans l'app
 * doit venir d'ici plutôt que d'être codé en dur dans un écran.
 */

export const colors = {
  bg: "#f5ead8",
  surface: "#ebddc5",
  text: "#201e1d",
  accent: "#c67139",
  accent2: "#7a8a5e",
  divider: "rgba(32, 30, 29, 0.16)",

  neutral100: "#f9f4ed",
  neutral200: "#eee7db",
  neutral300: "#dcd3c4",
  neutral400: "#c0b6a5",
  neutral500: "#a19786",
  neutral600: "#82796a",
  neutral700: "#645c50",
  neutral800: "#474238",
  neutral900: "#2e2b25",

  accent100: "#fff2eb",
  accent200: "#ffe1d0",
  accent300: "#ffc6a5",
  accent400: "#f6a06b",
  accent500: "#d67f48",
  accent600: "#b2622d",
  accent700: "#8c491a",
  accent800: "#643312",
  accent900: "#402310",

  accent2_100: "#f0fae1",
  accent2_200: "#e1eecc",
  accent2_300: "#ccdbb2",
  accent2_400: "#aebf92",
  accent2_500: "#8fa073",
  accent2_600: "#728157",
  accent2_700: "#56633f",
  accent2_800: "#3d472b",
  accent2_900: "#272e1b",
} as const;

// Deux "voix" de couleur, jamais assimilées à un jugement (bon/mauvais) :
// accent = terracotta (actions, extras, kilo en plus), accent2 = sauge (contexte, kilo en moins).

export const fonts = {
  heading: "Caprasimo_400Regular",
  body: "Figtree_400Regular",
  bodyMedium: "Figtree_600SemiBold",
  bodyBold: "Figtree_700Bold",
} as const;

// Échelle d'espacement 1.10x, telle que définie dans le système Organic.
export const space = {
  1: 4.4,
  2: 8.8,
  3: 13.2,
  4: 17.6,
  5: 22,
  6: 26.4,
  7: 30.8,
  8: 35.2,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 28,
  pill: 999,
} as const;

// Ombres React Native (shadowColor/shadowOpacity/shadowRadius + elevation Android,
// même si la V1 est iOS-only) dérivées des --shadow-sm/md/lg CSS du système Organic.
export const shadow = {
  sm: {
    shadowColor: colors.neutral900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.neutral900,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.neutral900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const iconStrokeWidth = 2.75;

export const theme = { colors, fonts, space, radius, shadow, iconStrokeWidth };
export type Theme = typeof theme;
