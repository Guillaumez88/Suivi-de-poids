import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import { colors, iconStrokeWidth } from "@/theme/theme";

/**
 * Icônes dessinées à la main pour les éléments spécifiques au design
 * "Organic" (maquette Claude Design) qui n'ont pas d'équivalent fidèle
 * dans lucide-react-native. Les tracés sont repris tels quels du fichier
 * de composants de la maquette (_ds_bundle.js), viewBox 0 0 24 24.
 */

interface IconeProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function icone(paths: string[], circles: [number, number, number][] = []) {
  return function Icone({ size = 22, color = colors.text, strokeWidth = iconStrokeWidth }: IconeProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {paths.map((d, i) => (
          <Path key={i} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {circles.map(([cx, cy, r], i) => (
          <Circle key={`c${i}`} cx={cx} cy={cy} r={r} fill={color} stroke="none" />
        ))}
      </Svg>
    );
  };
}

export const IconeToilettes = icone(["M6 4v7a6 6 0 0 0 12 0V4", "M4 11h16", "M9 21v-2.5M15 21v-2.5"]);

export const IconeExtra = icone(["M4 13a8 8 0 0 1 16 0z", "M3 17h18"]);

export const IconeGrignotage = icone([
  "M12 4.5c4 0 7 3 7 7s-3 7-7 7-7-3-7-7",
  "M12 4.5a3.5 3.5 0 0 1 0 7 3.5 3.5 0 0 0 0 7",
]);

export const IconeContexte = icone(
  ["M12 20s-6.5-5.2-6.5-9.5a6.5 6.5 0 0 1 13 0C18.5 14.8 12 20 12 20z"],
  [[12, 10.5, 2.4]]
);

/** Tracé ondulé bespoke — onglet "Tendances" de la barre du bas. */
export const IconeVague = icone(["M4 17c3-6 5 2 8-4s5 1 8-4"]);

export const IconeVoyage = icone(["M3 14l18-7-7 18-2.5-8.5z"]);

export const IconeMaladie = icone(["M12 20s-7-4.6-7-9.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 7 3.6C19 15.4 12 20 12 20z"]);

const BRISTOL_TRACES: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, { paths: string[]; circles?: [number, number, number][] }> = {
  1: { paths: [], circles: [[15, 17, 4], [26, 12, 4], [24, 23, 4], [36, 17, 4]] },
  2: { paths: ["M12 17c0-5 4-6 8-5s4 4 8 4 5-4 9-2 4 8 0 9-6-1-9-1-4 2-8 1-8-1-8-6z"] },
  3: {
    paths: [
      "M11 17c0-4 4-6 15-6s15 2 15 6-4 6-15 6-15-2-15-6z",
      "M20 12v10M27 12v10M34 12v10",
    ],
  },
  4: { paths: ["M10 20c6-10 12 8 18-2s10 4 14 0"] },
  5: {
    paths: [
      "M14 17c0-3 3-5 6-4s3 6 0 7-6-1-6-3z",
      "M28 19c0-4 4-6 7-4s2 7-2 7-5-1-5-3z",
    ],
  },
  6: { paths: ["M12 21c-3 0-4-4-1-5 0-4 5-6 8-3 3-4 9-3 10 1 4-1 6 4 3 6-2 2-18 2-20 1z"] },
  7: {
    paths: [
      "M8 13c4-3 8 3 12 0s8 3 12 0 8 3 12 0",
      "M8 22c4-3 8 3 12 0s8 3 12 0 8 3 12 0",
    ],
  },
};

/** Échelle de Bristol tracée à la main — reprise telle quelle de la maquette. */
export function IconeBristol({
  type,
  width = 46,
  height = 30,
  color = colors.accent700,
}: {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  width?: number;
  height?: number;
  color?: string;
}) {
  const trace = BRISTOL_TRACES[type];
  return (
    <Svg width={width} height={height} viewBox="0 0 52 34" fill="none">
      {trace.paths.map((d, i) => (
        <Path key={i} d={d} stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {(trace.circles ?? []).map(([cx, cy, r], i) => (
        <Circle key={`c${i}`} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={2.2} fill="none" />
      ))}
    </Svg>
  );
}

/** Icône de niveau d'extra (petit/moyen/gros) — plus d'arcs = plus copieux. */
export function IconeNiveauExtra({
  niveau,
  size = 30,
  color = colors.accent800,
}: {
  niveau: 1 | 2 | 3;
  size?: number;
  color?: string;
}) {
  const largeur = (size * 30) / 22;
  return (
    <Svg width={largeur} height={size} viewBox="0 0 30 22" fill="none">
      <Path d="M4 14a11 11 0 0 1 22 0z" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M2 18h26" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      {niveau > 1 && <Path d="M9 10.5h12" stroke={color} strokeWidth={2.4} strokeLinecap="round" />}
      {niveau > 2 && <Path d="M11 7h8" stroke={color} strokeWidth={2.4} strokeLinecap="round" />}
    </Svg>
  );
}

const BOUCHES_HUMEUR = [
  "M8.8 16.2c1.6-1.6 4.8-1.6 6.4 0", // rude
  "M9 15.6c1.4-.9 4.6-.9 6 0", // bof
  "M9 15h6", // ça va
  "M8.8 14.4c1.6 1.6 4.8 1.6 6.4 0", // bien
  "M8.4 14c1.8 2.6 5.4 2.6 7.2 0", // au top
] as const;

export const LABELS_HUMEUR = ["rude", "bof", "ça va", "bien", "au top"] as const;

/** Visage d'humeur — remplace les emojis du sélecteur de pesée matinale. */
export function VisageHumeur({
  niveau,
  size = 26,
  color = colors.neutral700,
}: {
  niveau: 1 | 2 | 3 | 4 | 5;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2.4} />
      <Circle cx={9} cy={10} r={1.1} fill={color} stroke="none" />
      <Circle cx={15} cy={10} r={1.1} fill={color} stroke="none" />
      <Path d={BOUCHES_HUMEUR[niveau - 1]} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
