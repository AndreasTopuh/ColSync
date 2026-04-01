export type ColorKey = 'red' | 'blue' | 'white' | 'yellow';

export interface PersonalityProfile {
  name: string;
  color: string;
  hsl: string;
  motive: string;
  needs: string[];
  wants: string[];
  strengths: string[];
  limitations: string[];
  asParent: string[];
  asChild: string[];
  asSpouse: string[];
  summary: string;
  careerStyle: string;
  idealRoles: string[];
  workEnvironment: string;
}

export const colorHex: Record<ColorKey, string> = {
  red: '#e07070',
  blue: '#5b8def',
  white: '#a0b0c0',
  yellow: '#e8c84a',
};

export const personalityProfiles: Record<ColorKey, PersonalityProfile> = {
  red: {
    name: 'Red',
    color: '#e07070',
    hsl: 'hsl(0, 72%, 68%)',
    motive: 'Drive',
    needs: [
      'To achieve measurable results',
      'To lead and take charge of situations',
      'To be respected for competence',
      'Recognition from those they value',
    ],
    wants: [
      'Opportunities to solve hard problems',
      'High productivity and efficiency',
      'Leadership positions and authority',
      'Challenges that test their abilities',
    ],
    strengths: ['Strategic', 'Confident', 'Resourceful', 'Goal-oriented', 'Resilient', 'Accountable', 'Visionary'],
    limitations: ['Impatient with slower pace', 'Can overlook feelings', 'Overly competitive', 'Stubborn under pressure', 'Tends to micromanage', 'Blunt communication', 'Difficulty delegating'],
    asParent: ['Natural leader in the family', 'Sets high standards and expectations', 'Encourages independence early', 'Provides clear structure and direction', 'Teaches responsibility through action', 'Champions their children\'s achievements'],
    asChild: ['Takes initiative without being asked', 'Fiercely independent', 'Competitive in school and activities', 'Challenges authority respectfully', 'Quick to take charge in group settings', 'Confident in expressing opinions'],
    asSpouse: ['Deeply protective of family', 'Reliable provider and partner', 'Takes initiative in relationship', 'Loyal once committed', 'Pushes partner toward growth', 'Direct and honest communicator'],
    summary: 'You are naturally strategic, action-driven, and confident when leading others. Red personalities are fueled by the desire to achieve and make an impact.',
    careerStyle: 'You thrive in leadership roles where you can make decisions, drive results, and solve complex problems. You need autonomy and challenging goals.',
    idealRoles: ['Project Manager', 'Entrepreneur', 'Operations Director', 'Management Consultant', 'Software Architect', 'Sales Director'],
    workEnvironment: 'Fast-paced, results-driven environments with clear goals and opportunities for advancement.',
  },
  blue: {
    name: 'Blue',
    color: '#5b8def',
    hsl: 'hsl(217, 91%, 65%)',
    motive: 'Connection',
    needs: ['To build meaningful relationships', 'To be understood at a deeper level', 'To contribute to something purposeful', 'Genuine acceptance from others'],
    wants: ['Authentic and deep conversations', 'Quality over quantity in everything', 'Personal growth and self-improvement', 'A sense of security and stability'],
    strengths: ['Empathetic', 'Thoughtful', 'Dedicated', 'Creative', 'Perceptive', 'Dependable', 'Detail-oriented'],
    limitations: ['Overthinks decisions', 'Takes criticism personally', 'Sets unrealistic standards', 'Can be emotionally intense', 'Holds grudges when hurt', 'Prone to self-doubt', 'Difficulty letting go'],
    asParent: ['Deeply invested in children\'s education', 'Creates a nurturing home environment', 'Highly empathetic to children\'s emotions', 'Sets moral and ethical standards', 'Willing to sacrifice for family', 'Encourages creativity and self-expression'],
    asChild: ['Sensitive to the feelings of others', 'Values being seen as a good person', 'Deeply loyal to friends and family', 'Thoughtful and reflective by nature', 'Enjoys learning and reading', 'Takes rules and expectations seriously'],
    asSpouse: ['Prioritizes the relationship above all', 'Considers partner in every decision', 'Seeks deep emotional intimacy', 'Fiercely loyal and committed', 'Creates meaningful rituals and traditions', 'Remembers details that matter to partner'],
    summary: 'You are deeply thoughtful, empathetic, and driven by meaningful connections. Blue personalities seek purpose and authenticity in everything they do.',
    careerStyle: 'You excel in roles that allow you to make a meaningful difference, work with depth and precision, and build genuine relationships with colleagues.',
    idealRoles: ['UX Researcher', 'Counselor / Therapist', 'Content Strategist', 'Data Analyst', 'Quality Assurance Lead', 'HR Specialist'],
    workEnvironment: 'Purpose-driven workplaces with supportive teams, clear ethical standards, and opportunities for deep focus.',
  },
  white: {
    name: 'White',
    color: '#a0b0c0',
    hsl: 'hsl(210, 20%, 69%)',
    motive: 'Harmony',
    needs: ['To maintain inner peace and balance', 'To have personal space and autonomy', 'To be respected without confrontation', 'Patience and tolerance from others'],
    wants: ['A calm, low-conflict environment', 'Freedom to work at their own pace', 'Independence without pressure', 'Contentment and stability'],
    strengths: ['Diplomatic', 'Patient', 'Adaptable', 'Even-tempered', 'Observant', 'Genuine', 'Consistent'],
    limitations: ['Avoids conflict even when needed', 'Can seem indifferent externally', 'Slow to make decisions', 'Quietly resistant to change', 'Underestimates own abilities', 'Lacks urgency on deadlines', 'Keeps opinions to themselves'],
    asParent: ['Calm and steady presence', 'Takes quality time with children', 'Gentle and non-judgmental approach', 'Accepts children\'s differences', 'Rarely loses temper', 'Models patience and kindness'],
    asChild: ['Easy to get along with', 'Content playing independently', 'Accommodating and agreeable', 'Observes before participating', 'Patient with others', 'Rarely causes disruption'],
    asSpouse: ['Steadfast and committed partner', 'Tolerant of partner\'s flaws', 'Loyal through difficult times', 'Brings calm to heated situations', 'Supportive of partner\'s goals', 'Values shared comfortable routines'],
    summary: 'You are naturally calm, diplomatic, and balanced in your approach to life. White personalities are guided by a deep desire for harmony and inner peace.',
    careerStyle: 'You excel in collaborative roles where you can work steadily without excessive conflict, use your observational skills, and support team harmony.',
    idealRoles: ['Technical Writer', 'Backend Developer', 'Mediator / Facilitator', 'Research Scientist', 'Librarian / Archivist', 'Systems Administrator'],
    workEnvironment: 'Stable, collaborative workplaces with clear expectations, minimal politics, and room for quiet focused work.',
  },
  yellow: {
    name: 'Yellow',
    color: '#e8c84a',
    hsl: 'hsl(45, 93%, 65%)',
    motive: 'Energy',
    needs: ['To express themselves freely', 'To be appreciated and noticed', 'To connect with many people socially', 'Encouragement and positive feedback'],
    wants: ['Variety and new experiences', 'Joy and enthusiasm in daily life', 'Freedom from rigid structures', 'Spontaneous and fun interactions'],
    strengths: ['Charismatic', 'Optimistic', 'Inspiring', 'Playful', 'Socially gifted', 'Open-minded', 'Energizing'],
    limitations: ['Starts many things, finishes few', 'Avoids serious conversations', 'Can be unreliable with details', 'Seeks attention excessively', 'Struggles with routine tasks', 'Impulsive decision-making', 'Overcommits to too many things'],
    asParent: ['Makes everything fun and exciting', 'Physically affectionate and warm', 'Encouraging and non-judgmental', 'Creates memorable family experiences', 'Light-hearted and playful approach', 'Celebrates children\'s uniqueness'],
    asChild: ['Social butterfly from early age', 'Loves physical affection', 'Curious and explorative', 'Makes friends easily everywhere', 'Brings energy to any group', 'Learns best through interaction'],
    asSpouse: ['Keeps the relationship exciting', 'Creative and spontaneous with dates', 'Accepting of partner\'s individuality', 'Brings joy to everyday moments', 'Few rigid expectations of partner', 'Enthusiastic supporter of partner'],
    summary: 'You are naturally social, enthusiastic, and full of contagious energy. Yellow personalities are driven by the desire to inspire and be noticed.',
    careerStyle: 'You thrive in dynamic roles that involve people, creativity, and variety. You need social interaction, recognition, and the freedom to express yourself.',
    idealRoles: ['Marketing Manager', 'Public Relations Specialist', 'Event Coordinator', 'Sales Representative', 'Social Media Manager', 'Brand Strategist'],
    workEnvironment: 'Dynamic, social environments with creative freedom, team collaboration, and recognition for achievements.',
  },
};
