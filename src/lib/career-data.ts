import { ColorKey } from './personality-data';
import { QuizResult } from './quiz-engine';

export interface CareerCategory {
  title: string;
  description: string;
  roles: string[];
  skills: string[];
}

export interface CareerInsight {
  workStyle: string;
  idealEnvironment: string;
  naturalStrengths: string[];
  developmentAreas: string[];
  categories: CareerCategory[];
}

const careerMap: Record<ColorKey, CareerInsight> = {
  red: {
    workStyle:
      'You are a natural leader who thrives on autonomy, challenges, and measurable outcomes. You prefer to take charge and deliver results.',
    idealEnvironment:
      'Fast-paced, competitive environments where initiative is rewarded and bureaucracy is minimal.',
    naturalStrengths: [
      'Strategic planning and execution',
      'Making tough decisions quickly',
      'Motivating teams toward ambitious goals',
      'Managing multiple priorities at once',
      'Identifying and solving critical problems',
    ],
    developmentAreas: [
      'Active listening and empathy skills',
      'Patience with collaborative processes',
      'Delegating without micromanaging',
      'Building emotional intelligence',
    ],
    categories: [
      {
        title: 'Leadership & Management',
        description: 'Roles that put you in charge of strategy, teams, or operations.',
        roles: ['CEO / Founder', 'Project Manager', 'Operations Director', 'Product Manager'],
        skills: ['Strategic thinking', 'Decision making', 'Team leadership', 'Resource management'],
      },
      {
        title: 'Business & Consulting',
        description: 'Roles that leverage your analytical mind and competitive drive.',
        roles: ['Management Consultant', 'Business Analyst', 'Financial Advisor', 'Sales Director'],
        skills: ['Problem solving', 'Client management', 'Market analysis', 'Negotiation'],
      },
      {
        title: 'Technology & Engineering',
        description: 'Roles that challenge you technically while allowing you to lead innovation.',
        roles: ['Software Architect', 'Engineering Manager', 'CTO', 'DevOps Lead'],
        skills: ['System design', 'Technical leadership', 'Architecture decisions', 'Performance optimization'],
      },
    ],
  },
  blue: {
    workStyle:
      'You bring depth, precision, and purpose to everything you do. You prefer roles where quality matters more than speed.',
    idealEnvironment:
      'Purpose-driven organizations with ethical standards, collaborative teams, and opportunities for deep work.',
    naturalStrengths: [
      'Attention to detail and quality',
      'Empathy and understanding others\' needs',
      'Creative problem-solving',
      'Building deep professional relationships',
      'Thorough research and analysis',
    ],
    developmentAreas: [
      'Making faster decisions when needed',
      'Being less self-critical',
      'Setting realistic expectations',
      'Letting go of perfectionism',
    ],
    categories: [
      {
        title: 'Research & Analysis',
        description: 'Roles that leverage your analytical depth and attention to detail.',
        roles: ['UX Researcher', 'Data Analyst', 'Market Researcher', 'Policy Analyst'],
        skills: ['Data analysis', 'Research methods', 'Critical thinking', 'Report writing'],
      },
      {
        title: 'Creative & Design',
        description: 'Roles that channel your creativity and desire for meaningful work.',
        roles: ['Content Strategist', 'UI/UX Designer', 'Brand Strategist', 'Technical Writer'],
        skills: ['Creative thinking', 'Visual design', 'Storytelling', 'User empathy'],
      },
      {
        title: 'People & Purpose',
        description: 'Roles where your empathy and commitment to others make a real difference.',
        roles: ['HR Specialist', 'Counselor', 'Training Manager', 'Non-profit Director'],
        skills: ['Emotional intelligence', 'Conflict resolution', 'Mentoring', 'Community building'],
      },
    ],
  },
  white: {
    workStyle:
      'You are a steady, reliable contributor who excels in calm, structured environments. You prefer deep work over office politics.',
    idealEnvironment:
      'Stable organizations with clear processes, respectful cultures, and minimal workplace drama.',
    naturalStrengths: [
      'Maintaining calm under pressure',
      'Mediating between conflicting parties',
      'Consistent, reliable work output',
      'Careful observation and pattern recognition',
      'Supporting team dynamics quietly',
    ],
    developmentAreas: [
      'Speaking up and advocating for yourself',
      'Taking initiative on new projects',
      'Setting and enforcing boundaries',
      'Embracing change more readily',
    ],
    categories: [
      {
        title: 'Technical & Analytical',
        description: 'Roles that leverage your careful, methodical approach.',
        roles: ['Backend Developer', 'Systems Administrator', 'Database Administrator', 'QA Engineer'],
        skills: ['Technical problem solving', 'System maintenance', 'Documentation', 'Testing'],
      },
      {
        title: 'Support & Coordination',
        description: 'Roles where your calm presence and reliability create value.',
        roles: ['Technical Writer', 'Librarian', 'Research Assistant', 'Administrative Coordinator'],
        skills: ['Organization', 'Documentation', 'Research', 'Coordination'],
      },
      {
        title: 'Mediation & Facilitation',
        description: 'Roles that use your natural diplomacy and fairness.',
        roles: ['Mediator', 'Facilitator', 'Compliance Officer', 'Quality Assurance Lead'],
        skills: ['Conflict resolution', 'Facilitation', 'Regulatory knowledge', 'Process improvement'],
      },
    ],
  },
  yellow: {
    workStyle:
      'You are an energizer who thrives on social interaction, creativity, and variety. You prefer dynamic roles over repetitive tasks.',
    idealEnvironment:
      'Creative, social environments with team collaboration, recognition systems, and room for self-expression.',
    naturalStrengths: [
      'Building instant rapport with anyone',
      'Creative brainstorming and ideation',
      'Energizing and motivating teams',
      'Adapting quickly to new situations',
      'Public speaking and presentations',
    ],
    developmentAreas: [
      'Following through on commitments',
      'Handling detailed, repetitive tasks',
      'Staying focused on one project at a time',
      'Building discipline and consistency',
    ],
    categories: [
      {
        title: 'Marketing & Communication',
        description: 'Roles that leverage your social skills and creative energy.',
        roles: ['Marketing Manager', 'Public Relations Specialist', 'Social Media Manager', 'Brand Ambassador'],
        skills: ['Communication', 'Creativity', 'Social media', 'Branding'],
      },
      {
        title: 'Sales & Business Development',
        description: 'Roles where your charisma and people skills directly drive results.',
        roles: ['Sales Representative', 'Business Development Manager', 'Account Executive', 'Recruiter'],
        skills: ['Persuasion', 'Relationship building', 'Negotiation', 'Networking'],
      },
      {
        title: 'Events & Entertainment',
        description: 'Roles that channel your energy and love for bringing people together.',
        roles: ['Event Coordinator', 'Community Manager', 'Content Creator', 'Workshop Facilitator'],
        skills: ['Event planning', 'Community management', 'Content creation', 'Public speaking'],
      },
    ],
  },
};

export const getCareerInsight = (color: ColorKey): CareerInsight => {
  return careerMap[color];
};

export const getCareerInsightFromResult = (result: QuizResult): CareerInsight => {
  return careerMap[result.dominant];
};
