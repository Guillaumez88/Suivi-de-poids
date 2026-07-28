import React, { useEffect, useMemo, useRef } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { colors } from "@/theme/theme";
import type { PointSerieMoyenneMobile } from "@/utils/businessRules";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  points: PointSerieMoyenneMobile[];
  largeur?: number;
  hauteur?: number;
}

interface PointEcran {
  x: number;
  y: number;
}

/** Chemin lissé point à point (courbes quadratiques passant par les milieux),
 * technique standard sans dépendance de graphe. */
function construireCheminLisse(points: PointEcran[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prec = points[i - 1];
    const courant = points[i];
    const milieuX = (prec.x + courant.x) / 2;
    const milieuY = (prec.y + courant.y) / 2;
    d += ` Q ${prec.x} ${prec.y} ${milieuX} ${milieuY}`;
  }
  const dernier = points[points.length - 1];
  d += ` L ${dernier.x} ${dernier.y}`;
  return d;
}

/** react-native-svg n'expose pas getTotalLength() : on approxime la longueur
 * du tracé par la somme des distances euclidiennes entre points consécutifs. */
function longueurApprochee(points: PointEcran[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export function CourbeDePoids({ points, largeur = 318, hauteur = 94 }: Props) {
  const valides = useMemo(
    () => points.map((p, i) => ({ i, valeur: p.moyenne })).filter((p): p is { i: number; valeur: number } => p.valeur !== null),
    [points]
  );

  const { pointsEcran, dernierIndexValide } = useMemo(() => {
    if (valides.length === 0) return { pointsEcran: [] as PointEcran[], dernierIndexValide: -1 };
    const marge = 8;
    const min = Math.min(...valides.map((p) => p.valeur));
    const max = Math.max(...valides.map((p) => p.valeur));
    const etendue = max - min || 1;
    const largeurUtile = largeur - marge * 2;
    const denom = points.length > 1 ? points.length - 1 : 1;
    const ecran = valides.map((p) => ({
      x: marge + (p.i / denom) * largeurUtile,
      // inversé : une moyenne plus faible dessine plus bas
      y: marge + ((max - p.valeur) / etendue) * (hauteur - marge * 2),
    }));
    return { pointsEcran: ecran, dernierIndexValide: valides.length - 1 };
  }, [valides, points.length, largeur, hauteur]);

  const chemin = useMemo(() => construireCheminLisse(pointsEcran), [pointsEcran]);
  const longueur = useMemo(() => longueurApprochee(pointsEcran) || 1, [pointsEcran]);

  const progression = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progression.setValue(0);
    const animation = Animated.timing(progression, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false, // strokeDashoffset n'est pas animable par le driver natif
    });
    animation.start();
    return () => animation.stop();
  }, [chemin, progression]);

  const decalageTrait = progression.interpolate({
    inputRange: [0, 1],
    outputRange: [longueur, 0],
  });

  if (pointsEcran.length === 0) {
    return null;
  }

  const dernierPoint = pointsEcran[pointsEcran.length - 1];
  const ligneGrille = [0.25, 0.55, 0.85].map((ratio) => ratio * hauteur);

  return (
    <View>
      <Svg width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} fill="none">
        <G stroke={colors.neutral400} strokeWidth={1} strokeDasharray="3 6" opacity={0.7}>
          {ligneGrille.map((y, i) => (
            <Path key={i} d={`M0 ${y}H${largeur}`} />
          ))}
        </G>
        <G fill={colors.neutral500}>
          {pointsEcran.slice(0, -1).map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={2.6} />
          ))}
        </G>
        <AnimatedPath
          d={chemin}
          stroke={colors.accent}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeDasharray={`${longueur} ${longueur}`}
          strokeDashoffset={decalageTrait}
        />
        <Circle cx={dernierPoint.x} cy={dernierPoint.y} r={6.5} fill={colors.accent} stroke={colors.surface} strokeWidth={3} />
      </Svg>
    </View>
  );
}
