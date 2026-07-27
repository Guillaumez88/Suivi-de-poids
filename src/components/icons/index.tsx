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
