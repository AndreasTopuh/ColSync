import { ColorKey } from './personality-data';

export interface CompatibilityResult {
  score: number;
  title: string;
  description: string;
  strengths: string[];
  challenges: string[];
  tips: string[];
}

const compatibilityMap: Record<string, CompatibilityResult> = {
  'red-red': {
    score: 6,
    title: 'Power Duo',
    description:
      'Two Reds together create an intense, high-energy partnership. Both of you are driven by results, but power struggles can arise when neither wants to back down.',
    strengths: [
      'Mutual respect for each other\'s abilities',
      'Extremely productive when aligned',
      'Both value direct and honest communication',
    ],
    challenges: [
      'Competition for dominance and control',
      'Neither wants to compromise first',
      'May prioritize winning over understanding',
    ],
    tips: [
      'Divide responsibilities into clear domains',
      'Celebrate each other\'s victories sincerely',
      'Practice vulnerability -it builds trust',
    ],
  },
  'red-blue': {
    score: 7,
    title: 'Balanced Force',
    description:
      'Red\'s action-driven approach pairs well with Blue\'s thoughtfulness. Together you combine strength with emotional intelligence.',
    strengths: [
      'Blue tempers Red\'s intensity with empathy',
      'Red motivates Blue to take action',
      'Complementary decision-making styles',
    ],
    challenges: [
      'Red may seem insensitive to Blue\'s feelings',
      'Blue\'s need for thorough process frustrates Red',
      'Different emotional processing speeds',
    ],
    tips: [
      'Red: pause and listen before responding',
      'Blue: express needs directly instead of hinting',
      'Schedule regular check-ins for alignment',
    ],
  },
  'red-white': {
    score: 7,
    title: 'Calm Authority',
    description:
      'Red provides direction while White brings peace and acceptance. A naturally complementary pairing that balances drive with calm.',
    strengths: [
      'White\'s calm balances Red\'s intensity',
      'Red gives structure that White appreciates',
      'Low conflict potential when respected',
    ],
    challenges: [
      'Red may steamroll White\'s quiet opinions',
      'White may become too deferential',
      'Different energy and urgency levels',
    ],
    tips: [
      'Red: actively ask for White\'s perspective',
      'White: share your thoughts before decisions are made',
      'Respect each other\'s natural pace',
    ],
  },
  'red-yellow': {
    score: 8,
    title: 'Dynamic Momentum',
    description:
      'An energetic combination where Red\'s drive meets Yellow\'s enthusiasm. Together you create unstoppable momentum.',
    strengths: [
      'Both thrive on action and results',
      'Yellow keeps things fun and light for Red',
      'Red gives Yellow focus and direction',
    ],
    challenges: [
      'Yellow may feel controlled or restricted',
      'Red may find Yellow too unfocused',
      'Both can be impatient with process',
    ],
    tips: [
      'Channel combined energy into shared goals',
      'Yellow: follow through on commitments',
      'Red: embrace spontaneity once in a while',
    ],
  },
  'blue-blue': {
    score: 8,
    title: 'Deep Understanding',
    description:
      'Two Blues form an incredibly deep and meaningful bond. You understand each other\'s emotional world on an intuitive level.',
    strengths: [
      'Profound emotional understanding',
      'Shared values of loyalty and quality',
      'Rich, meaningful conversations',
    ],
    challenges: [
      'Can spiral into negativity together',
      'Both may hold onto past hurts',
      'May avoid necessary confrontation',
    ],
    tips: [
      'Practice forgiveness as a regular habit',
      'Balance reflection with decisive action',
      'Assume the best about each other\'s intentions',
    ],
  },
  'blue-white': {
    score: 9,
    title: 'Gentle Harmony',
    description:
      'One of the most naturally harmonious pairings. Blue\'s depth combines beautifully with White\'s peaceful nature.',
    strengths: [
      'Both prioritize harmony in relationships',
      'White accepts Blue\'s emotional depth',
      'Blue values White\'s patience and calm',
    ],
    challenges: [
      'Both may avoid difficult conversations',
      'Can lack urgency when action is needed',
      'May become too comfortable and stagnant',
    ],
    tips: [
      'Set shared goals to maintain motivation',
      'Practice addressing issues early and gently',
      'Celebrate each other\'s unique contributions',
    ],
  },
  'blue-yellow': {
    score: 6,
    title: 'Opposite Energies',
    description:
      'A challenging but potentially rewarding pairing. Yellow\'s lightness can either balance or frustrate Blue\'s seriousness.',
    strengths: [
      'Yellow brings joy to Blue\'s intensity',
      'Blue gives Yellow emotional depth',
      'Both can grow tremendously from each other',
    ],
    challenges: [
      'Blue may see Yellow as superficial',
      'Yellow may find Blue too serious',
      'Very different social energy levels',
    ],
    tips: [
      'Appreciate the qualities you lack',
      'Blue: join Yellow\'s social world sometimes',
      'Yellow: create quiet, meaningful moments for Blue',
    ],
  },
  'white-white': {
    score: 7,
    title: 'Peaceful Coexistence',
    description:
      'Two Whites create a calm and stable environment. You both deeply value peace, tolerance, and personal space.',
    strengths: [
      'Very low conflict relationship',
      'Both respect personal boundaries and space',
      'Natural tolerance and acceptance of differences',
    ],
    challenges: [
      'May lack motivation to push forward',
      'Decision-making can stall indefinitely',
      'Can become too passive together',
    ],
    tips: [
      'Take turns being the decision-maker',
      'Set gentle deadlines for important choices',
      'Encourage each other to try new experiences',
    ],
  },
  'white-yellow': {
    score: 7,
    title: 'Sunshine & Serenity',
    description:
      'Yellow brings excitement while White provides grounding. A warm, easygoing combination with natural balance.',
    strengths: [
      'Yellow gently energizes White',
      'White grounds Yellow\'s chaos',
      'Both generally positive and accepting',
    ],
    challenges: [
      'Yellow may overwhelm White\'s need for quiet',
      'White may seem too laid-back for Yellow',
      'Different social energy requirements',
    ],
    tips: [
      'Respect each other\'s energy levels',
      'Find activities you both genuinely enjoy',
      'White: be open to spontaneous moments',
    ],
  },
  'yellow-yellow': {
    score: 8,
    title: 'Double Energy',
    description:
      'Two Yellows together equals maximum fun and enthusiasm. Life is never boring with this high-energy combination!',
    strengths: [
      'Endless enthusiasm and creativity together',
      'Both love social experiences and people',
      'High energy and relentless positivity',
    ],
    challenges: [
      'Who handles the practical responsibilities?',
      'Both may avoid serious or boring tasks',
      'Can lack depth in important conversations',
    ],
    tips: [
      'Assign practical tasks deliberately',
      'Make time for deeper, meaningful talks',
      'Support each other in finishing what you start',
    ],
  },
};

export const getCompatibility = (
  color1: ColorKey,
  color2: ColorKey,
): CompatibilityResult => {
  const key1 = `${color1}-${color2}`;
  const key2 = `${color2}-${color1}`;
  return compatibilityMap[key1] || compatibilityMap[key2];
};
