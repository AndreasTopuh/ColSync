import { ColorKey } from './personality-data';

const answerToColor: Record<string, ColorKey> = {
  A: 'red',
  B: 'blue',
  C: 'white',
  D: 'yellow',
};

export type PersonalityHealth = 'thriving' | 'growing' | 'at-risk';

export interface QuizResult {
  dominant: ColorKey;
  secondary: ColorKey;
  scores: Record<ColorKey, number>;
  percentages: Record<ColorKey, number>;
  health: PersonalityHealth;
}

/**
 * Determine personality "health" based on score distribution.
 * - Thriving: balanced mix (no single color dominates too heavily)
 * - Growing: moderate dominance (healthy but room to develop)
 * - At Risk: extreme dominance in one color (potentially rigid)
 */
function assessHealth(scores: Record<ColorKey, number>, total: number): PersonalityHealth {
  const max = Math.max(...Object.values(scores));
  const dominanceRatio = max / total;

  if (dominanceRatio >= 0.6) return 'at-risk';
  if (dominanceRatio >= 0.45) return 'growing';
  return 'thriving';
}

/**
 * Stable sort order for colors when scores are tied.
 * Alphabetical: blue < red < white < yellow.
 */
const COLOR_SORT_ORDER: Record<ColorKey, number> = {
  blue: 0,
  red: 1,
  white: 2,
  yellow: 3,
};

export const calculateResult = (answers: string[]): QuizResult => {
  const total = answers.length;
  const counts: Record<ColorKey, number> = { red: 0, blue: 0, white: 0, yellow: 0 };

  answers.forEach((a) => {
    const color = answerToColor[a];
    if (color) counts[color]++;
  });

  // Sort by score descending, then by color order ascending for tiebreaker
  const sorted = (Object.entries(counts) as [ColorKey, number][]).sort(
    ([colorA, scoreA], [colorB, scoreB]) => {
      if (scoreB !== scoreA) return scoreB - scoreA;
      return COLOR_SORT_ORDER[colorA] - COLOR_SORT_ORDER[colorB];
    },
  );

  return {
    dominant: sorted[0][0],
    secondary: sorted[1][0],
    scores: counts,
    percentages: Object.fromEntries(
      Object.entries(counts).map(([k, v]) => [k, Math.round((v / total) * 100)]),
    ) as Record<ColorKey, number>,
    health: assessHealth(counts, total),
  };
};
