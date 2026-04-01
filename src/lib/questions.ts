export interface QuestionGroup {
  id: number;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
}

export const testInstructions = [
  'Answer each question based on how you naturally behave -not how you wish you were.',
  'Go with your first instinct. Don\'t overthink your response.',
  'Think about how you act most of the time, not just in specific situations.',
  'There are no right or wrong answers. Every trait has its own value.',
];

export const questions: QuestionGroup[] = [
  {
    id: 1,
    options: [
      { key: 'A', text: 'Ambitious' },
      { key: 'B', text: 'Thoughtful' },
      { key: 'C', text: 'Easygoing' },
      { key: 'D', text: 'Energetic' },
    ],
  },
  {
    id: 2,
    options: [
      { key: 'A', text: 'Results-focused' },
      { key: 'B', text: 'Detail-oriented' },
      { key: 'C', text: 'Flexible' },
      { key: 'D', text: 'Spontaneous' },
    ],
  },
  {
    id: 3,
    options: [
      { key: 'A', text: 'Takes charge easily' },
      { key: 'B', text: 'Cares deeply for others' },
      { key: 'C', text: 'Goes with the flow' },
      { key: 'D', text: 'Lights up the room' },
    ],
  },
  {
    id: 4,
    options: [
      { key: 'A', text: 'Can be too direct' },
      { key: 'B', text: 'Can be too cautious' },
      { key: 'C', text: 'Can be too passive' },
      { key: 'D', text: 'Can be too scattered' },
    ],
  },
  {
    id: 5,
    options: [
      { key: 'A', text: 'Makes quick decisions' },
      { key: 'B', text: 'Stays committed to promises' },
      { key: 'C', text: 'Remains calm under pressure' },
      { key: 'D', text: 'Finds fun in everything' },
    ],
  },
  {
    id: 6,
    options: [
      { key: 'A', text: 'Can seem intimidating' },
      { key: 'B', text: 'Worries about what could go wrong' },
      { key: 'C', text: 'Avoids difficult conversations' },
      { key: 'D', text: 'Gets bored with routine' },
    ],
  },
  {
    id: 7,
    options: [
      { key: 'A', text: 'Speaks up confidently' },
      { key: 'B', text: 'Listens before responding' },
      { key: 'C', text: 'Sees all sides of an issue' },
      { key: 'D', text: 'Connects with anyone instantly' },
    ],
  },
  {
    id: 8,
    options: [
      { key: 'A', text: 'Pushes others to perform' },
      { key: 'B', text: 'Holds themselves to high standards' },
      { key: 'C', text: 'Lets others take the lead' },
      { key: 'D', text: 'Uses humor to ease tension' },
    ],
  },
  {
    id: 9,
    options: [
      { key: 'A', text: 'Wants to win and achieve' },
      { key: 'B', text: 'Wants to understand and analyze' },
      { key: 'C', text: 'Wants peace and stability' },
      { key: 'D', text: 'Wants excitement and variety' },
    ],
  },
  {
    id: 10,
    options: [
      { key: 'A', text: 'Points out what\'s not working' },
      { key: 'B', text: 'Feels things more intensely than most' },
      { key: 'C', text: 'Holds back from sharing opinions' },
      { key: 'D', text: 'Talks more than they listen' },
    ],
  },
  {
    id: 11,
    options: [
      { key: 'A', text: 'Persistent until the goal is reached' },
      { key: 'B', text: 'Notices details others miss' },
      { key: 'C', text: 'Genuinely interested in others\' stories' },
      { key: 'D', text: 'The life of the gathering' },
    ],
  },
  {
    id: 12,
    options: [
      { key: 'A', text: 'Expects a lot from themselves and others' },
      { key: 'B', text: 'Struggles to let go of past mistakes' },
      { key: 'C', text: 'Needs a push to get started' },
      { key: 'D', text: 'Cares about how others see them' },
    ],
  },
  {
    id: 13,
    options: [
      { key: 'A', text: 'Takes ownership of outcomes' },
      { key: 'B', text: 'Driven by ideals and principles' },
      { key: 'C', text: 'Thinks of others before themselves' },
      { key: 'D', text: 'Naturally cheerful and upbeat' },
    ],
  },
  {
    id: 14,
    options: [
      { key: 'A', text: 'Frustrated by slow progress' },
      { key: 'B', text: 'Affected by the mood of others' },
      { key: 'C', text: 'Waits for things to sort themselves out' },
      { key: 'D', text: 'Acts first, plans later' },
    ],
  },
  {
    id: 15,
    options: [
      { key: 'A', text: 'Stands firm on their beliefs' },
      { key: 'B', text: 'Treats everyone with care and respect' },
      { key: 'C', text: 'Patient even in frustrating situations' },
      { key: 'D', text: 'Always looking for the next adventure' },
    ],
  },
  {
    id: 16,
    options: [
      { key: 'A', text: 'Debates to find the best answer' },
      { key: 'B', text: 'Sets expectations that may be unreachable' },
      { key: 'C', text: 'Unsure of what direction to take' },
      { key: 'D', text: 'Jumps into conversations eagerly' },
    ],
  },
  {
    id: 17,
    options: [
      { key: 'A', text: 'Thrives under competition' },
      { key: 'B', text: 'Values trust above all else' },
      { key: 'C', text: 'Prefers cooperation over competition' },
      { key: 'D', text: 'Brings people together effortlessly' },
    ],
  },
  {
    id: 18,
    options: [
      { key: 'A', text: 'Frustrated when others lack drive' },
      { key: 'B', text: 'Disappointed when others break trust' },
      { key: 'C', text: 'Uncomfortable when pushed too fast' },
      { key: 'D', text: 'Restless when forced to sit still' },
    ],
  },
  {
    id: 19,
    options: [
      { key: 'A', text: 'Values competence and skill' },
      { key: 'B', text: 'Values depth and meaning' },
      { key: 'C', text: 'Values kindness and gentleness' },
      { key: 'D', text: 'Values laughter and connection' },
    ],
  },
  {
    id: 20,
    options: [
      { key: 'A', text: 'Would rather lead than follow' },
      { key: 'B', text: 'Would rather perfect than rush' },
      { key: 'C', text: 'Would rather observe than participate' },
      { key: 'D', text: 'Would rather explore than settle' },
    ],
  },
];
